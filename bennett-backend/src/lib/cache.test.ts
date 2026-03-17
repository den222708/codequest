import { describe, it, expect, beforeEach } from "vitest";
import { cacheGet, cacheSet, cacheDel, cacheFlushPattern, cacheStats } from "./cache.js";

describe("cache", () => {
  // Note: cache is a module-level singleton, so tests share state.
  // We use unique keys per test to avoid interference.

  describe("cacheSet / cacheGet", () => {
    it("stores and retrieves a value", () => {
      cacheSet("test:sg:1", "hello");
      expect(cacheGet("test:sg:1")).toBe("hello");
    });

    it("stores objects", () => {
      const obj = { foo: "bar", n: 42 };
      cacheSet("test:sg:2", obj);
      expect(cacheGet("test:sg:2")).toBe(obj); // useClones=false
    });

    it("returns undefined for missing key", () => {
      expect(cacheGet("test:nonexistent:xyz")).toBeUndefined();
    });

    it("respects custom TTL", async () => {
      cacheSet("test:ttl:1", "ephemeral", 1); // 1 second TTL
      expect(cacheGet("test:ttl:1")).toBe("ephemeral");

      await new Promise((r) => setTimeout(r, 1200));
      expect(cacheGet("test:ttl:1")).toBeUndefined();
    });
  });

  describe("cacheDel", () => {
    it("deletes a key", () => {
      cacheSet("test:del:1", "toDelete");
      expect(cacheGet("test:del:1")).toBe("toDelete");
      cacheDel("test:del:1");
      expect(cacheGet("test:del:1")).toBeUndefined();
    });

    it("does not throw for missing key", () => {
      expect(() => cacheDel("test:missing:key")).not.toThrow();
    });
  });

  describe("cacheFlushPattern", () => {
    it("deletes all keys matching prefix", () => {
      cacheSet("test:flush:a", 1);
      cacheSet("test:flush:b", 2);
      cacheSet("test:flush:c", 3);
      cacheSet("test:other:d", 4);

      cacheFlushPattern("test:flush:");

      expect(cacheGet("test:flush:a")).toBeUndefined();
      expect(cacheGet("test:flush:b")).toBeUndefined();
      expect(cacheGet("test:flush:c")).toBeUndefined();
      expect(cacheGet("test:other:d")).toBe(4);
    });
  });

  describe("cacheStats", () => {
    it("returns stats object with expected fields", () => {
      const stats = cacheStats();
      expect(stats).toHaveProperty("hits");
      expect(stats).toHaveProperty("misses");
      expect(stats).toHaveProperty("keys");
    });
  });
});
