import { decodeBase64, encodeBase64 } from "@std/encoding/base64";
import type { KvEntry, KvKey } from "@deno/kv";
import serializeJs from "serialize-javascript";

export type SerializedKvKey = (string | number | boolean | {
    type: string;
    value: string;
})[]

export type SerializedKvValue = {
    type: string;
    data: string | number | boolean | Array<unknown> | Record<string, unknown> | null;
}

export type SerializedKvEntry = {
    key: SerializedKvKey;
    value: SerializedKvValue;
    versionstamp: string;
}

const errorCause = { cause: "SerializationError" }

export function serializeKvKey(key: KvKey): SerializedKvKey {
    return key.map((part) => {
        if (part instanceof Uint8Array) {
            return { type: "Uint8Array", value: encodeBase64(part) }
        }

        if (typeof part === "bigint") {
            return { type: "Bigint", value: part.toString() }
        }

        return part
    })
}

export function deserializeKvKey(key: string, options?: { allowEmptyKey?: boolean }): KvKey {
    let parsed: unknown;
    try {
        parsed = JSON.parse(key);
    } catch {
        throw new Error("Invalid JSON format for KvKey.", errorCause);
    }

    if (!Array.isArray(parsed)) {
        throw new Error("KvKey must be an array.", errorCause);
    }

    if (!options?.allowEmptyKey && !parsed.length) {
        throw new Error("KvKey must not be empty.", errorCause);
    }

    return parsed.map((part): string | number | bigint | boolean | Uint8Array => {
        if (
            typeof part === "string" ||
            typeof part === "number" ||
            typeof part === "boolean"
        ) {
            return part;
        }

        // Handle custom representation of Uint8Array and Bigint
        if (typeof part === "object" && part !== null && typeof part.value === "string") {
            if (part.type === "Uint8Array") {
                try {
                    return decodeBase64(part.value);
                } catch {
                    throw new Error("Invalid base64 encoding for Uint8Array: " + part.value, errorCause);
                }
            }

            if (part.type === "Bigint") {
                try {
                    return BigInt(part.value)
                } catch {
                    throw new Error("Invalid Bigint value: " + part.value, errorCause);
                }
            }
        }

        throw new Error(
            "Invalid KvKey part. " +
            "Must be String, Number, Boolean, " +
            'Bigint wrapped as ({ type: "Bigint", value: "..." }), ' +
            'or Uint8Array wrapped as ({ type: "Uint8Array", value: "..." }).',
            errorCause
        );
    });
}

export function serializeKvValue(value: unknown): SerializedKvValue {
    switch (typeof value) {
        case "string": return { type: "String", data: value };
        case "number": return { type: "Number", data: value };
        case "boolean": return { type: "Boolean", data: value };
        case "bigint": return { type: "Bigint", data: value.toString() };
        case "undefined": return { type: "Undefined", data: "" };
    }

    if (value instanceof Array) return { type: "Array", data: serializeJs(value) }

    if (value instanceof Date) return { type: "Date", data: value.toISOString() }

    if (value instanceof Map) return { type: "Map", data: serializeJs(value) }

    if (value instanceof Set) return { type: "Set", data: serializeJs(value) }

    if (value instanceof RegExp) return { type: "RegExp", data: value.toString() }

    if (value instanceof Uint8Array) return { type: "Uint8Array", data: encodeBase64(value) }

    if (value === null) return { type: "Null", data: "" }

    return { type: "Object", data: serializeJs(value) };
}

// deno-lint-ignore no-explicit-any
export function deserializeKvValue(body: any): unknown {
    if (!Object.hasOwn(body, "type")) {
        throw new Error("No data type provide for the value", errorCause);
    }

    if (!Object.hasOwn(body, "data")) {
        throw new Error("No data provide for the value", errorCause);
    }

    switch (body.type) {
        case "Bigint": return BigInt(body.data);
        case "Uint8Array": return new Uint8Array(decodeBase64(body.data));
        case "RegExp": return new RegExp(body.data);
        case "Date": return new Date(body.data);
        case "Set": return eval(`new Set(${body.data})`);
        case "Map": return eval(`new Map(${body.data})`);
        case "Undefined": return undefined;
        case "Null": return null;
        default:
            if (["String", "Number", "Boolean"].includes(body.type)) {
                return body.data
            }

            if (["Array", "Object"].includes(body.type)) {
                return eval(`(${body.data})`)
            }

            throw new Error("Unsupported data type", errorCause);
    }
}

export function serializeEntries(entries: KvEntry<unknown>[]): SerializedKvEntry[] {
    return entries.map<SerializedKvEntry>((entry) => {
        return {
            key: serializeKvKey(entry.key),
            value: serializeKvValue(entry.value),
            versionstamp: entry.versionstamp
        }
    })
}
