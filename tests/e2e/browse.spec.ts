import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { fakeData } from "../fakeTestData.ts";
import type { TestDependencies } from "./index.test.ts";

export function browseEndpointSpec({ bridgeServerClient }: TestDependencies) {
  describe("'GET /browse' endpoint's specifications", () => {
    it("should return available all entries", async () => {
      const res = await bridgeServerClient.browse();
      expect(res.result).toBeInstanceOf(Array);
      expect(res.result?.length).toBe(fakeData.length);
      expect(res.result?.[0]).toMatchObject({
        key: expect.any(Array),
        value: expect.anything(),
        versionstamp: expect.any(String),
      });
    });

    it("should return 5 entries because of 'limit=5' option", async () => {
      const options = {
        limit: 5,
      };

      const res = await bridgeServerClient.browse(options);
      expect(res.result).toBeInstanceOf(Array);
      expect(res.result?.length).toBe(options.limit);
      expect(res.result?.[0]).toMatchObject({
        key: expect.any(Array),
        value: expect.anything(),
        versionstamp: expect.any(String),
      });
    });

    it("should return the entries with a specific 'users' prefix", async () => {
      const options = {
        prefix: ["users"]
      };

      const res = await bridgeServerClient.browse(options);
      expect(res.result).toBeInstanceOf(Array);
      res.result?.forEach((entry) => {
        expect(entry.key[0]).toBe(options.prefix[0]);
      })
    });
  });
}
