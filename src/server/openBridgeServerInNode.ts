import { openKv, type Kv } from "@deno/kv";
import { createBridgeApp } from "./createBridgeApp.ts";
import { serve, type ServerType } from '@hono/node-server'

export async function openBridgeServerInNode(kv?: Kv, port: number = 47168): Promise<ServerType> {
    kv = kv ? kv : await openKv()
    const app = createBridgeApp(kv)
    return serve({ fetch: app.fetch, port })
}