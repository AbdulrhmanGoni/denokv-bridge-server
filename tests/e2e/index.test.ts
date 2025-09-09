import { describe } from "@std/testing/bdd";
import { openBridgeServerInDeno } from "../../src/server/main.ts";
import { fakeData } from "../fakeTestData.ts";
import { BridgeServerClient } from "../../src/server/bridgeServerClient.ts";
import { browseEndpointSpec } from "./browse.spec.ts";
import { setEndpointSpec } from "./set.spec.ts";
import { getEndpointSpec } from "./get.spec.ts";

export type TestDependencies = {
  kv: Deno.Kv;
  bridgeServerClient: BridgeServerClient
};

const kv = await Deno.openKv(":memory:");
for (const element of fakeData) {
  await kv.set(element.key, element.value);
}

const server = await openBridgeServerInDeno(kv, 7963);

const testsDependencies = {
  kv,
  bridgeServerClient: new BridgeServerClient(`http://${server?.addr.hostname}:${server.addr.port}`),
};

describe("End-to-End tests for Deno server", () => {
  browseEndpointSpec(testsDependencies);
  setEndpointSpec(testsDependencies);
  getEndpointSpec(testsDependencies);
});
