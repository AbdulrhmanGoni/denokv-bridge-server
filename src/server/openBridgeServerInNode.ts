import { openKv, type Kv } from "@deno/kv";
import { createBridgeApp } from "./createBridgeApp.ts";
import { serve } from '@hono/node-server'

export async function openBridgeServerInNode(kv?: Kv, port: number = 47168): Promise<void> {
    kv = kv ? kv : await openKv()
    const app = createBridgeApp(kv)
    serve({ fetch: app.fetch, port })
}