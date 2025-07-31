import { createBridgeApp } from "./createBridgeApp.ts";

export async function openBridgeServerInDeno(kv?: Deno.Kv, port: number = 47168): Promise<Deno.HttpServer<Deno.NetAddr>> {
    kv = kv ? kv : await Deno.openKv()
    const app = createBridgeApp(kv)
    return Deno.serve({ port }, app.fetch)
}