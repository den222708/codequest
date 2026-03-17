import { describe, it, expect } from "vitest";
import { getFingerprint, jitterDelay, randomId, randomUserId } from "./fingerprint.js";

describe("fingerprint", () => {
  describe("randomId", () => {
    it("generates string of specified length", () => {
      expect(randomId(10)).toHaveLength(10);
      expect(randomId(5)).toHaveLength(5);
      expect(randomId(20)).toHaveLength(20);
    });

    it("uses default length of 10", () => {
      expect(randomId()).toHaveLength(10);
    });

    it("only contains alphanumeric characters", () => {
      const id = randomId(100);
      expect(id).toMatch(/^[A-Za-z0-9]+$/);
    });

    it("generates unique values", () => {
      const ids = new Set(Array.from({ length: 50 }, () => randomId(10)));
      expect(ids.size).toBe(50);
    });
  });

  describe("randomUserId", () => {
    it("returns a valid UUID", () => {
      const uuid = randomUserId();
      expect(uuid).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
    });

    it("generates unique UUIDs", () => {
      const a = randomUserId();
      const b = randomUserId();
      expect(a).not.toBe(b);
    });
  });

  describe("getFingerprint", () => {
    it("returns all required fields", () => {
      const fp = getFingerprint();
      expect(fp).toHaveProperty("userAgent");
      expect(fp).toHaveProperty("userId");
      expect(fp).toHaveProperty("sessionId");
      expect(fp).toHaveProperty("acceptLanguage");
      expect(fp).toHaveProperty("referrer");
    });

    it("userAgent is a non-empty string", () => {
      const fp = getFingerprint();
      expect(typeof fp.userAgent).toBe("string");
      expect(fp.userAgent.length).toBeGreaterThan(0);
    });

    it("userId is a valid UUID", () => {
      const fp = getFingerprint();
      expect(fp.userId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
    });

    it("sessionId has length 10", () => {
      const fp = getFingerprint();
      expect(fp.sessionId).toHaveLength(10);
    });

    it("generates different fingerprints each call", () => {
      const fp1 = getFingerprint();
      const fp2 = getFingerprint();
      // userId should always differ (random UUID)
      expect(fp1.userId).not.toBe(fp2.userId);
    });
  });

  describe("jitterDelay", () => {
    it("resolves within expected time range", async () => {
      const start = Date.now();
      await jitterDelay(10, 50);
      const elapsed = Date.now() - start;
      // Allow some margin for timer precision
      expect(elapsed).toBeGreaterThanOrEqual(8);
      expect(elapsed).toBeLessThan(200);
    });

    it("uses defaults when no args", async () => {
      const start = Date.now();
      await jitterDelay();
      const elapsed = Date.now() - start;
      // Default is 50-500ms
      expect(elapsed).toBeGreaterThanOrEqual(40);
      expect(elapsed).toBeLessThan(700);
    });
  });
});
