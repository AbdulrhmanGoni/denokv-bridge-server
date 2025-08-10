import type { SerializedKvEntry, SerializedKvKey, SerializedKvValue } from "../serialization/main.ts";

type CallBridgeServerOptions = Record<string, SerializedKvKey | number | string>

type CallBridgeServerParams = {
    url: string,
    body?: SerializedKvValue,
    method?: "GET" | "PUT" | "DELETE",
    options?: CallBridgeServerOptions,
}

type CallBridgeServerReturn<ResultT> = Promise<{
    result: ResultT | null;
    cursor?: string;
    error: string | null;
}>

function optionsToUrlSearchParams(options: CallBridgeServerOptions): URLSearchParams {
    return new URLSearchParams(
        Object.entries(options)
            .map(([option, value]) => (
                [option, `${value instanceof Array ? JSON.stringify(value) : value}`]
            ))
    )
}

async function callBridgeServerRequest<ResultT = unknown>(
    { url, method, body, options }: CallBridgeServerParams
): CallBridgeServerReturn<ResultT> {
    const res = await fetch(
        url + (options ? "?" + optionsToUrlSearchParams(options).toString() : ""),
        {
            method: method ?? "GET",
            body: JSON.stringify(body),
        }
    );

    try {
        const json = await res.json()
        if (res.ok) {
            return {
                result: json?.result,
                cursor: res.headers.get("cursor") ?? "",
                error: null,
            }
        }

        return {
            error: json?.error || "Unexpected Error",
            result: null,
        }
    } catch {
        return { error: "Invalid JSON response received", result: null }
    }
};

export type BrowsingOptions = {
    limit?: number;
    cursor?: string;
    prefix?: SerializedKvKey;
    start?: SerializedKvKey;
    end?: SerializedKvKey;
}

export type SetKeyOptions = {
    expires?: number;
}

export class BridgeServerClient {
    constructor(private baseUrl: string) { }

    browse(options?: BrowsingOptions): CallBridgeServerReturn<SerializedKvEntry[]> {
        return callBridgeServerRequest<SerializedKvEntry[]>({
            url: `${this.baseUrl}/browse`,
            options,
            method: "GET"
        })
    }

    set(key: SerializedKvKey, value: SerializedKvValue, options?: SetKeyOptions): CallBridgeServerReturn<{ result: true }> {
        return callBridgeServerRequest<{ result: true }>({
            url: `${this.baseUrl}/set`,
            options: {
                key,
                ...options,
            },
            method: "PUT",
            body: value,
        })
    }

    get(key: SerializedKvKey): CallBridgeServerReturn<SerializedKvEntry> {
        return callBridgeServerRequest<SerializedKvEntry>({
            url: `${this.baseUrl}/get/${JSON.stringify(key)}`,
            method: "GET"
        })
    }

    delete(key: SerializedKvKey): CallBridgeServerReturn<{ result: true }> {
        return callBridgeServerRequest<{ result: true }>({
            url: `${this.baseUrl}/delete`,
            options: { key },
            method: "DELETE"
        })
    }
}