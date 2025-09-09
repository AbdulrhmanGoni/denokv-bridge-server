import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import type { TestDependencies } from "./index.test.ts";
import { fakeData } from "../fakeTestData.ts";
import { serializeKvKey } from "../../src/serialization/main.ts";

export function getEndpointSpec({ bridgeServerClient }: TestDependencies) {
    describe("'GET /get/:key' endpoint's specifications", () => {
        it("should retrieve an existing kv entry successfully", async () => {
            const existingKey = serializeKvKey(fakeData[0].key);
            const getRes = await bridgeServerClient.get(existingKey);
            expect(getRes.result).toMatchObject({
                key: existingKey,
                value: expect.anything(),
                versionstamp: expect.any(String),
            });
        });

        it("should retrieve null for unexisting kv entry", async () => {
            const arbitraryKey = [34, true, false]
            const getRes = await bridgeServerClient.get(arbitraryKey);
            expect(getRes.result).toBe(null);
        });
    });
}
