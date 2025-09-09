import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import type { TestDependencies } from "./index.test.ts";
import { serializeKvValue } from "../../src/serialization/main.ts";

export function setEndpointSpec({ bridgeServerClient }: TestDependencies) {
    describe("'PUT /set' endpoint's specifications", () => {
        it("should set a kv entry and then retrieve it successfully", async () => {
            const key = ["e2e", "set", `${Date.now()}-${Math.random()}`];
            const value = { foo: "bar", n: 42 };

            const putRes = await bridgeServerClient.set(key, serializeKvValue(value));
            expect(putRes.result).toEqual(true);

            const getRes = await bridgeServerClient.get(key);
            expect(getRes.result).toMatchObject({
                key: expect.any(Array),
                value: expect.anything(),
                versionstamp: expect.any(String),
            });
        });
    });
}


