import {
    serializeKvValue,
    deserializeKvKey,
    deserializeKvValue,
    serializeEntries,
} from "../serialization/main.ts";
import {
    validateBrowseRequestParams,
    validateSetRequestParams,
} from "../validation/main.ts";
import type { Kv, KvEntry } from "@deno/kv";
import { Hono } from 'hono/tiny';
import type { BlankEnv, BlankSchema } from "hono/types";

export function createBridgeApp(kv: Kv | Deno.Kv): Hono<BlankEnv, BlankSchema, "/"> {
    const app = new Hono()

    app.use(async (c, next) => {
        c.res.headers.set("Access-Control-Allow-Origin", "*")
        await next()
    })

    app.get("/browse", async (c) => {
        const { limit, prefix = [], start, end, cursor } = validateBrowseRequestParams(new URL(c.req.url))
        const defaultLimit = 40;

        const listOptions = start && end ? { start, end } : { prefix }
        const iterator = kv.list(listOptions, { cursor, limit: limit ?? defaultLimit });

        const records: KvEntry<unknown>[] = []
        for await (const record of iterator) {
            records.push(record as KvEntry<unknown>)
        }

        return c.json(
            { result: serializeEntries(records) },
            200,
            { cursor: records.length ? iterator.cursor : "" }
        )
    });

    app.get("/get/:key", async (c) => {
        const targetKey = c.req.param("key")
        const key = deserializeKvKey(targetKey)

        const entry = await kv.get(key)

        if (entry.value === null && entry.versionstamp === null) {
            return c.json({ result: null }, 404)
        } else {
            return c.json({
                result: {
                    key: JSON.parse(targetKey),
                    value: serializeKvValue(entry.value),
                    versionstamp: entry.versionstamp,
                }
            })
        }
    });

    app.put("/set", async (c) => {
        const { key, expires } = validateSetRequestParams(new URL(c.req.url))

        const validValue = await deserializeKvValue(await c.req.json())

        await kv.set(key, validValue, { expireIn: expires })

        return c.json({ result: true })
    });

    app.delete("/delete", async (c) => {
        const targetKey = c.req.query("key")
        if (!targetKey) {
            return c.json({ error: "No target key to delete." }, 400)
        }

        const key = deserializeKvKey(targetKey)

        await kv.delete(key)

        return c.json({ result: true })
    });

    app.get("/check", async (c) => {
        // Trying to get a random entry to make sure the database is existant
        await kv.get([crypto.randomUUID()]);
        // If `kv.get` resolves, The database is reachable
        return c.json({ result: true })
    });

    app.onError((err, c) => {
        return c.json({ error: (err.cause ? err.cause + ": " : "") + err.message }, err.cause ? 400 : 500)
    })

    return app
}
