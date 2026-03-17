import { describe, it, expect, beforeEach } from "vitest";
import { getActiveBackend, setActiveBackend } from "./executionDispatcher.js";

describe("executionDispatcher", () => {
  beforeEach(() => {
    // Reset to default
    setActiveBackend("programiz");
  });

  describe("getActiveBackend / setActiveBackend", () => {
    it("defaults to programiz", () => {
      expect(getActiveBackend()).toBe("programiz");
    });

    it("can switch to judge0", () => {
      setActiveBackend("judge0");
      expect(getActiveBackend()).toBe("judge0");
    });

    it("can switch back to programiz", () => {
      setActiveBackend("judge0");
      setActiveBackend("programiz");
      expect(getActiveBackend()).toBe("programiz");
    });

    it("throws on invalid backend", () => {
      expect(() => setActiveBackend("invalid" as any)).toThrow("Invalid backend");
    });
  });
});
