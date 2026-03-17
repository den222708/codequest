import { describe, it, expect, vi, beforeEach } from "vitest";

// We need to test judge0Executor without a real Judge0 instance.
// Test the language ID mapping and edge cases.

describe("judge0Executor", () => {
  describe("executeCodeJudge0 — no Docker running", () => {
    it("returns connection error when Judge0 is not available", async () => {
      // Dynamic import to allow module-level env to be set
      const { executeCodeJudge0 } = await import("./judge0Executor.js");

      const result = await executeCodeJudge0(
        'print("hello")',
        "python",
        "",
        3000
      );

      // Should fail with connection error since Judge0 is not running
      expect(result.error).toBeTruthy();
      expect(result.output).toBe("");
    });

    it("returns error for language without Judge0 ID", async () => {
      const { executeCodeJudge0 } = await import("./judge0Executor.js");

      // "rust" isn't in LANGUAGE_MAP, so it'll get "Unsupported language"
      const result = await executeCodeJudge0("code", "rust");
      expect(result.error).toContain("Unsupported language");
    });

    it("returns error for unknown language key", async () => {
      const { executeCodeJudge0 } = await import("./judge0Executor.js");

      const result = await executeCodeJudge0("code", "nonexistent");
      expect(result.error).toContain("Unsupported language");
    });
  });

  describe("isJudge0Available", () => {
    it("returns false when Judge0 is not running", async () => {
      const { isJudge0Available } = await import("./judge0Executor.js");
      const available = await isJudge0Available();
      expect(available).toBe(false);
    });
  });

  describe("executeCodeJudge0Stream", () => {
    it("returns null for unsupported language", async () => {
      const { executeCodeJudge0Stream } = await import("./judge0Executor.js");
      const stream = executeCodeJudge0Stream("code", "rust");
      expect(stream).toBeNull();
    });

    it("returns a ReadableStream for supported language", async () => {
      const { executeCodeJudge0Stream } = await import("./judge0Executor.js");
      const stream = executeCodeJudge0Stream('print("hi")', "python");
      expect(stream).toBeInstanceOf(ReadableStream);

      // Consume the stream (will contain error since Judge0 isn't running)
      const reader = stream!.getReader();
      const chunks: string[] = [];
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(decoder.decode(value));
      }

      // Should have at least one SSE data event with an error
      const combined = chunks.join("");
      expect(combined).toContain("data:");
    });
  });
});
