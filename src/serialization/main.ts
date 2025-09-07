import type { KvEntry, KvKey } from "@deno/kv";
import sJs from "serialize-javascript";

// deno-lint-ignore no-explicit-any
function serializeJs(jsValue: any) {
    return sJs(jsValue, { ignoreFunction: true })
}

export type SerializedKvKey = (string | number | boolean | {
    type: string;
    value: string;
})[]

export type SerializedKvValue = {
    type: string;
    data: string | number | boolean;
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
            return { type: "Uint8Array", value: serializeUint8Array(part) }
        }

        if (typeof part === "bigint") {
            return { type: "BigInt", value: part.toString() }
        }

        if (typeof part === "number") {
            if ([NaN, Infinity, -Infinity].includes(part)) {
                return { type: "Number", value: part.toString() }
            }
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

        // Handle custom representation of Uint8Array, Infinity, NaN and BigInt
        if (typeof part === "object" && part !== null && typeof part.value === "string") {
            if (part.type === "Number") {
                switch (part.value) {
                    case "Infinity": return Infinity;
                    case "-Infinity": return -Infinity;
                    case "NaN": return NaN;
                    default: throw new Error("Invalid Number value: " + part.value, errorCause);
                }
            }

            if (part.type === "Uint8Array") {
                const error = new Error("Invalid Uint8Array value: " + part.value, errorCause)
                try {
                    const uint8Array = eval(`(${part.value})`);
                    if (uint8Array instanceof Uint8Array) {
                        return uint8Array
                    } else {
                        throw error
                    }
                } catch {
                    throw error
                }
            }

            if (part.type === "BigInt") {
                try {
                    return BigInt(part.value)
                } catch {
                    throw new Error("Invalid BigInt value: " + part.value, errorCause);
                }
            }
        }

        throw new Error(
            "Invalid JSON representation for a KvKey part.\n" +
            "KvKey part must be String, Number, Boolean, " +
            'Custom number wrapped as { type: "Number", value: ("NaN", "Infinity" or "-Infinity") }, ' +
            'BigInt wrapped as { type: "BigInt", value: "..." }, ' +
            'or Uint8Array wrapped as { type: "Uint8Array", value: "new Uint8Array(...)" }.',
            errorCause
        );
    });
}

export function serializeKvValue(value: unknown): SerializedKvValue {
    switch (typeof value) {
        case "string": return { type: "String", data: value };
        case "number": return { type: "Number", data: value };
        case "boolean": return { type: "Boolean", data: value };
        case "bigint": return { type: "BigInt", data: value.toString() };
        case "undefined": return { type: "Undefined", data: "" };
    }

    if (value instanceof Array) return { type: "Array", data: serializeJs(value) }

    if (value instanceof Date) return { type: "Date", data: value.toISOString() }

    if (value instanceof Map) return { type: "Map", data: serializeJs(value) }

    if (value instanceof Set) return { type: "Set", data: serializeJs(value) }

    if (value instanceof RegExp) return { type: "RegExp", data: value.toString() }

    if (value instanceof Uint8Array) return { type: "Uint8Array", data: serializeUint8Array(value) }

    if (value === null) return { type: "Null", data: "" }

    return { type: "Object", data: serializeJs(value) };
}

// deno-lint-ignore no-explicit-any
export function deserializeKvValue(body: any): unknown {
    if (!body?.type) {
        throw new Error("No data type provided for the value", errorCause);
    }

    if (!body?.data) {
        throw new Error("No data provided for the value", errorCause);
    }

    const evaluatedData = eval(`(${body.data})`)

    switch (body.type) {
        case "Number": {
            if (typeof evaluatedData === "number") { return evaluatedData }
            throw new Error("Invalid Number received", errorCause);
        }

        case "String": {
            if (typeof evaluatedData === "string") { return evaluatedData }
            throw new Error("Invalid string received", errorCause);
        }

        case "BigInt": {
            if (typeof evaluatedData === "bigint") { return evaluatedData }
            throw new Error("Invalid BigInt received", errorCause);
        }

        case "Boolean": {
            if (typeof evaluatedData === "boolean") { return evaluatedData }
            throw new Error("Invalid boolean value received", errorCause);
        }

        case "Object": {
            if (evaluatedData instanceof Object) { return evaluatedData }
            throw new Error("Invalid Object received", errorCause);
        }

        case "Array": {
            if (evaluatedData instanceof Array) { return evaluatedData }
            throw new Error("Invalid Array received", errorCause);
        }

        case "Date": {
            if (evaluatedData instanceof Date) { return evaluatedData }
            throw new Error("Invalid Date received", errorCause);
        }

        case "Set": {
            if (evaluatedData instanceof Set) { return evaluatedData }
            throw new Error("Invalid Set received", errorCause);
        }

        case "Map": {
            if (evaluatedData instanceof Map) { return evaluatedData }
            throw new Error("Invalid Map received", errorCause);
        }

        case "RegExp": {
            if (evaluatedData instanceof RegExp) { return evaluatedData }
            throw new Error("Invalid RegExp received", errorCause);
        }

        case "Uint8Array": {
            if (evaluatedData instanceof Uint8Array) { return evaluatedData }
            throw new Error("Invalid Uint8Array received", errorCause);
        }

        case "Undefined": return undefined;

        case "Null": return null;

        default:
            throw new Error("Unsupported Data Type", errorCause);
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

function serializeUint8Array(uint8Array: Uint8Array) {
    return `new Uint8Array(${JSON.stringify(Array.from(uint8Array))})`
}