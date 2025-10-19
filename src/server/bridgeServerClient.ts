import type { SerializedKvEntry, SerializedKvKey, SerializedKvValue } from "../serialization/main.ts";

type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

type CallBridgeServerOptions = Record<string, SerializedKvKey | number | string>

type CallBridgeServerParams = {
    url: string,
    body?: SerializedKvValue,
    method?: "GET" | "PUT" | "DELETE",
    options?: CallBridgeServerOptions,
}

type CallBridgeServerReturn<ResultT> = Promise<{
    result: ResultT | null;
    cursor: string;
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

    const returnValue: UnwrapPromise<CallBridgeServerReturn<ResultT>> = {
        result: null,
        error: null,
        cursor: res.headers.get("cursor") ?? "",
    }

    try {
        const json = await res.json()
        if (res.ok) {
            returnValue.result = json?.result
        } else {
            returnValue.error = json?.error || "Unexpected error from the server"
        }
    } catch {
        returnValue.error = "Invalid JSON response received"
    }

    return returnValue
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

    async watch(key: SerializedKvKey, onChange: (updatedEntry: SerializedKvEntry) => void) {
        try {
            const response = await fetch(`${this.baseUrl}/watch?key=${JSON.stringify(key)}`)
            if (!response.body) {
                throw "No response body (stream) found."
            }
            const decoder = new TextDecoder();
            for await (const chunk of response.body) {
                onChange(JSON.parse(decoder.decode(chunk)));
            }
        } catch (err) {
            throw "Error fetching or reading stream:" + err
        }
    }
}
