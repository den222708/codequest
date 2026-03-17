/**
 * Execution Dispatcher — routes code execution to the active backend.
 *
 * Backends:
 *   - "programiz" (default): Programiz WebSocket proxy with circuit breaker
 *   - "judge0": Local Judge0 Docker instance
 *
 * Admin can toggle the active backend at runtime via:
 *   GET  /system/execution-backend
 *   PUT  /system/execution-backend  { "backend": "programiz" | "judge0" }
 */

import { executeCode as programizExecute, executeCodeStream as programizStream, getProxyStats } from "./programizProxy.js";
import { executeCodeJudge0, executeCodeJudge0Stream, isJudge0Available } from "./judge0Executor.js";
import { createChildLogger } from "../lib/logger.js";

const log = createChildLogger({ module: "executionDispatcher" });

export type ExecutionBackend = "programiz" | "judge0";

// ── In-memory toggle (no DB needed — operational concern) ─────────────
let activeBackend: ExecutionBackend =
  (process.env.EXECUTION_BACKEND as ExecutionBackend) ?? "programiz";

export function getActiveBackend(): ExecutionBackend {
  return activeBackend;
}

export function setActiveBackend(backend: ExecutionBackend): void {
  if (backend !== "programiz" && backend !== "judge0") {
    throw new Error(`Invalid backend: ${backend}. Must be "programiz" or "judge0".`);
  }
  activeBackend = backend;
  log.info({ backend }, "Active execution backend switched");
}

// ── Dispatched execution (used by testRunner) ─────────────────────────
interface ExecutionResult {
  output: string;
  error?: string;
  timedOut?: boolean;
}

export async function executeCode(
  code: string,
  languageKey: string,
  timeoutMs = 28000
): Promise<ExecutionResult> {
  if (activeBackend === "judge0") {
    return executeCodeJudge0(code, languageKey, "", timeoutMs);
  }
  return programizExecute(code, languageKey, timeoutMs);
}

// ── Dispatched streaming (used by execute route) ──────────────────────
export function executeCodeStream(
  code: string,
  languageKey: string
): ReadableStream | null {
  if (activeBackend === "judge0") {
    return executeCodeJudge0Stream(code, languageKey);
  }
  return programizStream(code, languageKey);
}

// ── Stats for health endpoint ─────────────────────────────────────────
export async function getExecutionStats() {
  const proxyStats = getProxyStats();
  const judge0Available = activeBackend === "judge0" ? await isJudge0Available() : null;

  return {
    activeBackend,
    programiz: proxyStats,
    judge0: {
      configured: !!process.env.JUDGE0_BASE_URL,
      available: judge0Available,
      baseUrl: process.env.JUDGE0_BASE_URL ?? "http://localhost:2358",
    },
  };
}
