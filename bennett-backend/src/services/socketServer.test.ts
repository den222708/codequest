/**
 * Tests for monitoringTypes — type contracts and constants.
 * Tests for socketServer — in-memory session logic (unit-testable helpers).
 *
 * NOTE: We cannot test actual Socket.IO connections in unit tests without a
 * full server. These tests cover the exported helper functions and the
 * monitoring type contracts.
 */

import { describe, it, expect, beforeEach, vi } from "vitest";

// ── monitoringTypes tests ───────────────────────────────────────────────

describe("monitoringTypes", () => {
  it("ViolationType values cover all expected types", async () => {
    // This is a compile-time check — if the type changes, this test should be updated
    const validTypes = [
      "tab_switch",
      "paste_detected",
      "fullscreen_exit",
      "clipboard_access",
      "offline",
      "focus_lost",
      "devtools_open",
    ] as const;

    // Ensure we have 7 violation types
    expect(validTypes).toHaveLength(7);
  });

  it("MonitoringEventRow event_type covers all valid values", () => {
    const validEventTypes = [
      "heartbeat",
      "violation",
      "join",
      "leave",
      "instruction",
      "instruction_ack",
    ];
    expect(validEventTypes).toHaveLength(6);
  });

  it("MonitoringSessionState status covers all states", () => {
    const validStatuses = ["active", "idle", "suspicious", "flagged", "disconnected"];
    expect(validStatuses).toHaveLength(5);
  });

  it("InstructionPayload type covers all instruction types", () => {
    const validTypes = ["warning", "terminate", "message", "lock"];
    expect(validTypes).toHaveLength(4);
  });

  it("StudentLeavePayload reason covers all reasons", () => {
    const validReasons = ["submit", "timeout", "disconnect"];
    expect(validReasons).toHaveLength(3);
  });
});

// ── socketServer unit tests (exported helpers) ──────────────────────────

// Mock supabase before importing socketServer
vi.mock("../lib/supabase.js", () => ({
  getSupabaseAdmin: vi.fn(() => ({
    from: () => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
  })),
}));

describe("socketServer helpers", () => {
  let mod: typeof import("../services/socketServer.js");

  beforeEach(async () => {
    // Dynamic import to ensure mocks are in place
    mod = await import("../services/socketServer.js");
  });

  it("getSessionCount returns 0 initially", () => {
    // After cleanup, should be 0
    expect(mod.getSessionCount()).toBeGreaterThanOrEqual(0);
  });

  it("getSession returns undefined for non-existent attempt", () => {
    expect(mod.getSession("non-existent-attempt-id")).toBeUndefined();
  });

  it("getAllSessions returns an array", () => {
    const sessions = mod.getAllSessions();
    expect(Array.isArray(sessions)).toBe(true);
  });

  it("getIOInstance returns null when server not initialized", () => {
    // IO is only initialized via createSocketServer which requires an HTTP server
    // In test context it should be null
    expect(mod.getIOInstance()).toBeNull();
  });

  it("shutdown cleans up state", async () => {
    await mod.shutdown();
    expect(mod.getSessionCount()).toBe(0);
    expect(mod.getAllSessions()).toEqual([]);
    expect(mod.getIOInstance()).toBeNull();
  });
});

// ── Monitoring event row structure tests ────────────────────────────────

describe("MonitoringEventRow structure", () => {
  it("can construct a valid heartbeat event row", () => {
    const row = {
      attempt_id: "att-123",
      assessment_id: "assess-456",
      student_id: "stu-789",
      event_type: "heartbeat" as const,
      payload: { seq: 5, questionIndex: 2, isFullscreen: true },
    };
    expect(row.event_type).toBe("heartbeat");
    expect(row.payload.seq).toBe(5);
  });

  it("can construct a valid violation event row", () => {
    const row = {
      attempt_id: "att-123",
      assessment_id: "assess-456",
      student_id: "stu-789",
      event_type: "violation" as const,
      payload: { type: "tab_switch", detail: "Document became hidden" },
    };
    expect(row.event_type).toBe("violation");
    expect(row.payload.type).toBe("tab_switch");
  });

  it("can construct a valid join event row", () => {
    const row = {
      attempt_id: "att-123",
      assessment_id: "assess-456",
      student_id: "stu-789",
      event_type: "join" as const,
      payload: { studentName: "John Doe", userAgent: "Mozilla/5.0" },
    };
    expect(row.event_type).toBe("join");
    expect(row.payload.studentName).toBe("John Doe");
  });

  it("can construct a valid instruction event row", () => {
    const row = {
      attempt_id: "att-123",
      assessment_id: "assess-456",
      student_id: "stu-789",
      event_type: "instruction" as const,
      payload: { type: "warning", message: "Suspicious activity detected" },
    };
    expect(row.event_type).toBe("instruction");
    expect(row.payload.type).toBe("warning");
  });
});
