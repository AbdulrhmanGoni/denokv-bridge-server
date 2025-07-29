import type { KvKey } from "@deno/kv";
import { deserializeKvKey } from "../serialization/main.ts";

const errorCause = { cause: "ValidationError" }

type ValidateBrowseRequestParams = {
    limit?: number;
    prefix?: KvKey;
    start?: KvKey;
    end?: KvKey;
    cursor?: string;
}
export function validateBrowseRequestParams(url: URL): ValidateBrowseRequestParams {
    const limitOption = url.searchParams.get("limit")?.toString();
    let limit: number | undefined = undefined;
    if (limitOption) {
        limit = Number(limitOption);
        if (isNaN(limit) || limit <= 0) {
            throw new Error(`Invalid limit option: must be positive integer. Got: ${limitOption}`);
        }
    }

    const cursor = url.searchParams.get("cursor") ?? undefined;

    const prefixOption = url.searchParams.get("prefix")
    const prefix = prefixOption ? deserializeKvKey(prefixOption, { allowEmptyKey: true }) : undefined;

    const startOption = url.searchParams.get("start")
    const start = startOption ? deserializeKvKey(startOption) : undefined;

    const endOption = url.searchParams.get("end")
    const end = endOption ? deserializeKvKey(endOption) : undefined;

    return { limit, prefix, start, end, cursor };
}

type ValidateSetRequestParams = {
    key: KvKey;
    expires?: number;
}
export function validateSetRequestParams(url: URL): ValidateSetRequestParams {
    const targetKey = url.searchParams.get("key")
    const key = targetKey ? deserializeKvKey(targetKey) : undefined;

    if (!key) {
        throw new Error("No target key to set.", errorCause);
    }

    const expiresOption = url.searchParams.get("expires");

    const expires = expiresOption ? Number(expiresOption) : undefined;
    if (expiresOption && isNaN(expires!)) {
        throw new Error(
            `Invalid expiration time option: It must be a timestamp number. Got: ${expiresOption}`,
            errorCause
        );
    }

    if (expires && expires < new Date().getTime()) {
        throw new Error(
            `Invalid expiration time option: It must be a timestamp number in the future. Got: ${expires}`,
            errorCause
        );
    }

    return { key, expires };
}
