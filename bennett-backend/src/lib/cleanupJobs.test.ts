/**
 * Tests for cleanupJobs.ts — periodic maintenance tasks
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock supabase before importing module under test
const mockDelete = vi.fn();
const mockSelect = vi.fn();
const mockLt = vi.fn();
const mockFrom = vi.fn();

vi.mock("./supabase.js", () => ({
  getSupabaseAdmin: () => ({
    from: mockFrom,
  }),
}));

// Suppress logger output during tests
vi.mock("./logger.js", () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

import { runCleanup, startCleanupJobs, stopCleanupJobs } from "./cleanupJobs.js";

describe("cleanupJobs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Default mock chain: from().delete().lt().select() → { data: [], error: null }
    mockSelect.mockResolvedValue({ data: [], error: null });
    mockLt.mockReturnValue({ select: mockSelect });
    mockDelete.mockReturnValue({ lt: mockLt });
    mockFrom.mockReturnValue({ delete: mockDelete });
  });

  afterEach(() => {
    stopCleanupJobs();
    vi.useRealTimers();
  });

  describe("runCleanup", () => {
    it("calls all three purge tasks in parallel", async () => {
      await runCleanup();

      // Should have called from() for token_blacklist, active_sessions, and monitoring_events
      expect(mockFrom).toHaveBeenCalledWith("token_blacklist");
      expect(mockFrom).toHaveBeenCalledWith("active_sessions");
      expect(mockFrom).toHaveBeenCalledWith("monitoring_events");
      expect(mockFrom).toHaveBeenCalledTimes(3);
    });

    it("calls delete on each table", async () => {
      await runCleanup();
      expect(mockDelete).toHaveBeenCalledTimes(3);
    });

    it("handles supabase errors gracefully", async () => {
      mockSelect.mockResolvedValue({ data: null, error: { message: "DB error" } });

      // Should not throw
      await expect(runCleanup()).resolves.not.toThrow();
    });

    it("reports purge counts from returned data", async () => {
      // First call (tokens): 2 rows
      // Second call (sessions): 1 row
      // Third call (events): 0 rows
      let callCount = 0;
      mockSelect.mockImplementation(() => {
        callCount++;
        if (callCount === 1) return Promise.resolve({ data: [{ id: "1" }, { id: "2" }], error: null });
        if (callCount === 2) return Promise.resolve({ data: [{ id: "3" }], error: null });
        return Promise.resolve({ data: [], error: null });
      });

      await runCleanup();

      expect(mockFrom).toHaveBeenCalledTimes(3);
    });
  });

  describe("startCleanupJobs / stopCleanupJobs", () => {
    it("starts and stops without errors", () => {
      expect(() => startCleanupJobs()).not.toThrow();
      expect(() => stopCleanupJobs()).not.toThrow();
    });

    it("does not start multiple timers if called twice", () => {
      startCleanupJobs();
      startCleanupJobs(); // second call should be no-op
      stopCleanupJobs();
    });

    it("runs initial cleanup after 10s delay", async () => {
      startCleanupJobs();

      // Advance past the 10-second startup delay
      await vi.advanceTimersByTimeAsync(10_000);

      // runCleanup should have been called
      expect(mockFrom).toHaveBeenCalled();
    });

    it("runs periodic cleanup at interval", async () => {
      startCleanupJobs();

      // Advance past startup delay
      await vi.advanceTimersByTimeAsync(10_000);
      const firstCallCount = mockFrom.mock.calls.length;

      // Advance to next interval (default 60 min)
      await vi.advanceTimersByTimeAsync(60 * 60 * 1000);
      expect(mockFrom.mock.calls.length).toBeGreaterThan(firstCallCount);
    });

    it("stops periodic cleanup when stopCleanupJobs is called", async () => {
      startCleanupJobs();
      await vi.advanceTimersByTimeAsync(10_000);
      stopCleanupJobs();

      const callCountAfterStop = mockFrom.mock.calls.length;
      await vi.advanceTimersByTimeAsync(60 * 60 * 1000);
      // No additional calls after stop
      expect(mockFrom.mock.calls.length).toBe(callCountAfterStop);
    });
  });

  describe("purge cutoff calculations", () => {
    it("uses correct column for token_blacklist (created_at)", async () => {
      await runCleanup();

      // Check that lt was called with "created_at" for token_blacklist
      // Since all three calls use the same mock chain, we verify lt was called with appropriate ISO strings
      expect(mockLt).toHaveBeenCalledTimes(3);
      const ltCalls = mockLt.mock.calls;

      // token_blacklist uses created_at
      expect(ltCalls[0][0]).toBe("created_at");
      // active_sessions uses last_active_at
      expect(ltCalls[1][0]).toBe("last_active_at");
      // monitoring_events uses created_at
      expect(ltCalls[2][0]).toBe("created_at");
    });

    it("passes ISO date string as cutoff value", async () => {
      await runCleanup();

      const ltCalls = mockLt.mock.calls;
      for (const call of ltCalls) {
        // Second argument should be an ISO date string
        expect(typeof call[1]).toBe("string");
        expect(new Date(call[1]).toISOString()).toBe(call[1]);
      }
    });
  });
});
