import { openKv, type Kv } from "@deno/kv";
import { createBridgeApp } from "./createBridgeApp.ts";
import { serve, type ServerType } from '@hono/node-server'

/**
 * Starts the bridge server in Node.js runtime
 *
 * @param kv Optional Kv instance created by `openKv()` from `@deno/kv`. Defaults to `await openKv()`
 * @param port Server port. Defaults to 47168
 * @returns Promise resolving to ServerType from '@hono/node-server'
 *
 * @example
 * ```typescript
 * import { openKv } from "@deno/kv";
 * const kv = await openKv()
 * await openBridgeServerInNode(kv, 3626);
 * // Now the bridge server is listening on port 3626
 * ```
 */
export async function openBridgeServerInNode(kv?: Kv, port: number = 47168): Promise<ServerType> {
    kv = kv ? kv : await openKv()
    const app = createBridgeApp(kv)
    return serve({ fetch: app.fetch, port })
}