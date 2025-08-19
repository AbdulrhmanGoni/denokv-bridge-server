import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect";
import { serializeKvKey } from "../../src/index.ts";

describe("serializeKvKey", () => {
  it("should serialize a key with all expected primitive values", () => {
    const key = ["posts", 123, true];
    const expected = ["posts", 123, true];
    expect(serializeKvKey(key)).toEqual(expected);
  });

  it("should serialize a key with BigInt", () => {
    const key = ["transactions", 12345678901234567890n];
    const expected = ["transactions", { type: "BigInt", value: "12345678901234567890" }];
    expect(serializeKvKey(key)).toEqual(expected);
  });

  it("should serialize a key with Uint8Array", () => {
    const key = ["blobs", new Uint8Array([1, 2, 3])];
    const expected = ["blobs", { type: "Uint8Array", value: "new Uint8Array([1,2,3])" }];
    expect(serializeKvKey(key)).toEqual(expected);
  });

  it("should serialize a key with special number values (NaN and Infinity)", () => {
    const key = ["special", NaN, Infinity, -Infinity];
    const expected = [
      "special",
      { type: "Number", value: "NaN" },
      { type: "Number", value: "Infinity" },
      { type: "Number", value: "-Infinity" }
    ];
    expect(serializeKvKey(key)).toEqual(expected);
  });

  it("should serialize a key with all expected values", () => {
    const key = ["users", 123n, new Uint8Array([4, 5, 6]), Infinity, NaN, false, 555];
    const expected = [
      "users",
      { type: "BigInt", value: "123" },
      { type: "Uint8Array", value: "new Uint8Array([4,5,6])" },
      { type: "Number", value: "Infinity" },
      { type: "Number", value: "NaN" },
      false,
      555,
    ];
    expect(serializeKvKey(key)).toEqual(expected);
  });
});
