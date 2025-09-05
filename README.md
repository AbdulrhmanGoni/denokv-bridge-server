# @denokv-gui-client/bridge-server

This package is a tiny web server provides a JSON-based API to access the Deno KV Database
from places like frontend web or mobile apps where using the Deno KV client directly (`Deno.openKv()` or `openKv()` in node) is not possible.

## Usage

You just need to add `@denokv-gui-client/bridge-server` package to your project, import and
call the function that starts up the bridge server with an instance of the Deno KV Client.

### Deno

Add the package:

```shell
deno add @denokv-gui-client/bridge-server
```

Then import `openBridgeServerInDeno` function and call it with an instance of `Deno.Kv`

```ts
import { openBridgeServerInDeno } from "@denokv-gui-client/bridge-server";

const kvInstance: Deno.Kv = await Deno.openKv(); // or you can use an already created `Deno.Kv` instance

openBridgeServerInDeno(kvInstance); // optionally a second parameter to set bridge server's port number
```

The `openBridgeServerInDeno` function starts a Deno HTTP server and returns an instance of the server as promise.

```ts
const server: Deno.HttpServer<Deno.NetAddr> = await openBridgeServerInDeno(
  kvInstance
);

server.shutdown(); // Later at some point if you want
```

### Node

Add the package:

```shell
npx jsr add @denokv-gui-client/bridge-server
# or
pnpm dlx jsr add @denokv-gui-client/bridge-server
# or
yarn dlx jsr add @denokv-gui-client/bridge-server
# or
vlt install jsr:@denokv-gui-client/bridge-server
```

Then import `openBridgeServerInNode` function and call it with an instance of Node's `Kv` client

```ts
import { openKv, type Kv } from "@deno/kv";
import { openBridgeServerInNode } from "@denokv-gui-client/bridge-server";

const kvInstance: Kv = await openKv(); // or you can use an already created `Kv` instance

openBridgeServerInNode(kvInstance); // optionally a second parameter to set bridge server's port number
```

The `openBridgeServerInNode` function starts a Node HTTP server using `@hono/node-server` and returns
an instance of the Hono node server as promise.

```ts
const server = await openBridgeServerInNode(kvInstance);

server.close(); // Later if you want
```

> [!NOTE]
> By default, The bridge server will listen to `47168` port unless you passed a port number as
> second parameter to the "open bridge server" function.

Now try to test if the bridge server is working or not by opening `http://localhost:47168/check` on your machine.
You should see a JSON response like this:

```json
{ "result": true }
```
