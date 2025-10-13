import { createBridgeApp } from "./createBridgeApp.ts";

/**
 * Starts the bridge server in Deno runtime
 *
 * @param kv Optional Deno.Kv instance. Defaults to `await Deno.openKv()`
 * @param port Server port. Defaults to 47168
 * @returns Promise resolving to Deno.HttpServer<Deno.NetAddr>
 *
 * @example
 * ```typescript
 * const kv = await Deno.openKv();
 * await openBridgeServerInDeno(kv, 4634);
 * // now the bridge server is listening on port 4634
 * ```
 */
export async function openBridgeServerInDeno(kv?: Deno.Kv, port: number = 47168): Promise<Deno.HttpServer<Deno.NetAddr>> {
    kv = kv ? kv : await Deno.openKv()
    const app = createBridgeApp(kv)
    return Deno.serve({ port }, app.fetch)
}