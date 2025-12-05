import { describe } from "@std/testing/bdd";
import { openBridgeServerInDeno } from "../../src/server/main.ts";
import { fakeData } from "../fakeTestData.ts";
import { BridgeServerClient } from "../../src/server/bridgeServerClient.ts";
import { browseEndpointSpec } from "./browse.spec.ts";
import { setEndpointSpec } from "./set.spec.ts";
import { getEndpointSpec } from "./get.spec.ts";
import { deleteEndpointSpec } from "./delete.spec.ts";
import { randomBytes } from "node:crypto";

export type TestDependencies = {
  kv: Deno.Kv;
  bridgeServerClient: BridgeServerClient
};

const kv = await Deno.openKv(":memory:");
for (const element of fakeData) {
  await kv.set(element.key, element.value);
}

const authToken = randomBytes(30).toString("base64")

const server = await openBridgeServerInDeno(kv, { port: 7963, authToken });

const testsDependencies = {
  kv,
  bridgeServerClient: new BridgeServerClient(
    `http://${server.addr.hostname}:${server.addr.port}`,
    { authToken }
  ),
};

describe("End-to-End tests for Deno server", () => {
  browseEndpointSpec(testsDependencies);
  setEndpointSpec(testsDependencies);
  getEndpointSpec(testsDependencies);
  deleteEndpointSpec(testsDependencies);
});
