import { createBridgeApp } from "./createBridgeApp.ts";

export async function openBridgeServerInDeno(kv?: Deno.Kv, port: number = 47168): Promise<void> {
    kv = kv ? kv : await Deno.openKv()
    const app = createBridgeApp(kv)
    Deno.serve({ port }, app.fetch)
}