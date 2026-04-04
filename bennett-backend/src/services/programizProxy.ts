import { getFingerprint, jitterDelay, randomId } from "../lib/fingerprint.js";
import { LANGUAGE_MAP, type Language } from "../lib/languages.js";
import { CircuitBreaker, ConcurrencyLimiter, type HealthState } from "../lib/circuitBreaker.js";

// ── Singleton instances ───────────────────────────────────────────────
const circuitBreaker = new CircuitBreaker({
  windowSize: 20,
  degradedThreshold: 0.4,
  consecutiveFailLimit: 5,
  cooldownMs: 30_000,
  recoveryThreshold: 0.8,
});

const concurrencyLimiter = new ConcurrencyLimiter(
  parseInt(process.env.PROGRAMIZ_MAX_CONCURRENT ?? "6", 10)
);

// ── Endpoint pool rotation (round-robin per language) ─────────────────
const endpointIndices = new Map<string, number>();

function getNextSubdomain(langConfig: Language): string {
  const pool = langConfig.programizEndpointPool;
  if (pool.length === 0) return langConfig.programizSubdomain;
  if (pool.length === 1) return pool[0];

  const idx = endpointIndices.get(langConfig.id) ?? 0;
  const subdomain = pool[idx % pool.length];
  endpointIndices.set(langConfig.id, idx + 1);
  return subdomain;
}

// ── Retry & jitter config ─────────────────────────────────────────────
const MAX_RETRIES = parseInt(process.env.PROGRAMIZ_MAX_RETRIES ?? "2", 10);

/** Jitter ranges scaled by circuit breaker health */
const JITTER_CONFIG: Record<HealthState, { min: number; max: number }> = {
  GOOD:     { min: 50, max: 300 },
  DEGRADED: { min: 300, max: 1500 },
  BAD:      { min: 1000, max: 3000 },
};

function getJitterRange(): { min: number; max: number } {
  return JITTER_CONFIG[circuitBreaker.getState()];
}

/** Exponential backoff with jitter for retry attempts */
function retryDelay(attempt: number): Promise<void> {
  const { min, max } = getJitterRange();
  const baseMs = Math.min(min * Math.pow(2, attempt), max * 2);
  const jitter = Math.floor(Math.random() * (max - min + 1)) + min;
  const delayMs = baseMs + jitter;
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

/** Returns true if the error is transient and worth retrying */
function isTransientError(error: string | undefined): boolean {
  if (!error) return false;
  const transient = [
    "ECONNRESET",
    "ETIMEDOUT",
    "ECONNREFUSED",
    "ENOTFOUND",
    "socket hang up",
    "Connection failed",
    "timeout",
    "503",
    "502",
    "429",
  ];
  return transient.some((t) => error.includes(t));
}

// ── Types ─────────────────────────────────────────────────────────────
interface ExecutionResult {
  output: string;
  error?: string;
  timedOut?: boolean;
}

// ── Core single-attempt execution (no retry) ──────────────────────────
async function executeCodeOnce(
  code: string,
  subdomain: string,
  timeoutMs: number
): Promise<ExecutionResult> {
  const fp = getFingerprint();
  const sessionId = randomId(10);
  const socketUrl = `https://${subdomain}.repl-web.programiz.com/?sessionId=${sessionId}&lang=${subdomain}`;

  // Register session with Programiz REST API (fire-and-forget)
  try {
    await fetch("https://compiler-api.programiz.com/api/v1/code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": fp.userAgent,
        "Accept-Language": fp.acceptLanguage,
        Referer: fp.referrer,
      },
      body: JSON.stringify({
        user_id: fp.userId,
        session_id: sessionId,
        code,
        user_agent: fp.userAgent,
        language: subdomain,
      }),
    });
  } catch {
    // Non-fatal — session registration is best-effort
  }

  const socketioModule = await import("socket.io-client");
  const socketio = (socketioModule.default ?? socketioModule) as any;

  return new Promise<ExecutionResult>((resolve) => {
    let output = "";
    let resolved = false;

    function finish(result: ExecutionResult) {
      if (!resolved) {
        resolved = true;
        resolve(result);
      }
    }

    const sio = socketio(socketUrl, {
      transports: ["websocket"],
      extraHeaders: {
        "User-Agent": fp.userAgent,
        "Accept-Language": fp.acceptLanguage,
      },
      reconnection: false,
      timeout: timeoutMs,
    });

    sio.on("connect", () => {
      sio.emit("run", { code });
    });

    sio.on("output", (data: unknown) => {
      if (resolved) return;
      const text =
        data && typeof data === "object" && "output" in data
          ? String((data as { output: unknown }).output)
          : String(data);

      output += text;

      if (
        text.includes("=== Code Execution Successful ===") ||
        text.includes("=== Code Execution Failed ===")
      ) {
        sio.disconnect();
        finish({ output });
      }
    });

    sio.on("disconnect", () => {
      finish({ output });
    });

    sio.on("connect_error", (err: Error) => {
      finish({ output, error: `Connection failed: ${err.message}` });
    });

    setTimeout(() => {
      if (!resolved) {
        sio.disconnect();
        finish({ output, error: "Execution timed out", timedOut: true });
      }
    }, timeoutMs);
  });
}

// ── Public API: executeCode (with circuit breaker + retry) ────────────
/**
 * Executes code against Programiz via WebSocket.
 * Integrates circuit breaker, concurrency limiter, endpoint pool rotation,
 * and retry with exponential backoff + health-scaled jitter.
 */
export async function executeCode(
  code: string,
  languageKey: string,
  timeoutMs = 28000
): Promise<ExecutionResult> {
  const langConfig = LANGUAGE_MAP[languageKey];
  if (!langConfig) {
    return { output: "", error: `Unsupported language: ${languageKey}` };
  }
  if (!langConfig.programizSubdomain) {
    return { output: "", error: `No Programiz subdomain configured for: ${languageKey}` };
  }

  // Circuit breaker: fail fast if BAD and cooldown hasn't elapsed
  if (!circuitBreaker.canExecute()) {
    return {
      output: "",
      error: "Code execution service is temporarily unavailable. Please try again in a moment.",
    };
  }

  // Concurrency limiter: queue if at capacity
  return concurrencyLimiter.run(async () => {
    let lastResult: ExecutionResult = { output: "", error: "No attempts made" };

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      // Anti-ban: health-scaled jitter before each attempt
      const { min, max } = getJitterRange();
      await jitterDelay(min, max);

      // Re-check circuit breaker on retries (state may have changed)
      if (attempt > 0 && !circuitBreaker.canExecute()) {
        return {
          output: "",
          error: "Code execution service is temporarily unavailable. Please try again in a moment.",
        };
      }

      // Pick subdomain from pool (rotates on retry for failover)
      const subdomain = getNextSubdomain(langConfig);

      // Adjust timeout: extend slightly in DEGRADED state
      const effectiveTimeout =
        circuitBreaker.getState() === "DEGRADED"
          ? Math.min(timeoutMs * 1.3, 45000)
          : timeoutMs;

      try {
        lastResult = await executeCodeOnce(code, subdomain, effectiveTimeout);

        // Determine success: no error, or a code-level error (which is a successful execution)
        const isInfraError = !!lastResult.error && !lastResult.output;
        const isTimeout = !!lastResult.timedOut;

        if (!isInfraError && !isTimeout) {
          // Successful execution (even if code failed — that's a valid result)
          circuitBreaker.recordSuccess();
          return lastResult;
        }

        // Infrastructure failure
        circuitBreaker.recordFailure();

        // Only retry on transient errors
        if (!isTransientError(lastResult.error) && !isTimeout) {
          return lastResult;
        }

        // If we have more retries, wait with exponential backoff
        if (attempt < MAX_RETRIES) {
          await retryDelay(attempt);
        }
      } catch (err) {
        // Unexpected crash
        circuitBreaker.recordFailure();
        lastResult = {
          output: "",
          error: `Unexpected error: ${err instanceof Error ? err.message : String(err)}`,
        };

        if (attempt < MAX_RETRIES) {
          await retryDelay(attempt);
        }
      }
    }

    return lastResult;
  });
}

// ── Public API: executeCodeStream (with circuit breaker) ──────────────
/**
 * Executes code and streams output as SSE via a ReadableStream.
 * Uses circuit breaker gating and concurrency limiter but does NOT retry
 * (streaming responses can't be replayed).
 */
export function executeCodeStream(
  code: string,
  languageKey: string
): ReadableStream | null {
  const langConfig = LANGUAGE_MAP[languageKey];
  if (!langConfig || !langConfig.programizSubdomain) return null;

  // Circuit breaker: fail fast
  if (!circuitBreaker.canExecute()) return null;

  const encoder = new TextEncoder();
  function sseData(payload: object): Uint8Array {
    return encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);
  }

  return new ReadableStream({
    async start(controller) {
      let closed = false;
      let executionSucceeded = false;
      let exitSent = false;

      function close() {
        if (!closed) {
          closed = true;
          try {
            controller.close();
          } catch {
            // already closed
          }
        }
      }

      function emitExit(code: number): void {
        if (closed || exitSent) return;
        exitSent = true;
        controller.enqueue(sseData({ type: "exit", code }));
      }

      // Acquire concurrency slot
      await concurrencyLimiter.acquire();
      let released = false;

      function releaseOnce() {
        if (!released) {
          released = true;
          concurrencyLimiter.release();
        }
      }

      try {
        // Anti-ban: health-scaled jitter
        const { min, max } = getJitterRange();
        await jitterDelay(min, max);

        const subdomain = getNextSubdomain(langConfig);
        const fp = getFingerprint();
        const sessionId = randomId(10);
        const socketUrl = `https://${subdomain}.repl-web.programiz.com/?sessionId=${sessionId}&lang=${subdomain}`;

        // Fire-and-forget REST registration
        fetch("https://compiler-api.programiz.com/api/v1/code", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent": fp.userAgent,
            "Accept-Language": fp.acceptLanguage,
            Referer: fp.referrer,
          },
          body: JSON.stringify({
            user_id: fp.userId,
            session_id: sessionId,
            code,
            user_agent: fp.userAgent,
            language: subdomain,
          }),
        }).catch(() => {});

        const socketioModule = await import("socket.io-client");
        const socketio = (socketioModule.default ?? socketioModule) as any;

        const effectiveTimeout =
          circuitBreaker.getState() === "DEGRADED" ? 35000 : 28000;

        const sio = socketio(socketUrl, {
          transports: ["websocket"],
          extraHeaders: {
            "User-Agent": fp.userAgent,
            "Accept-Language": fp.acceptLanguage,
          },
          reconnection: false,
          timeout: effectiveTimeout,
        });

        sio.on("connect", () => {
          sio.emit("run", { code });
        });

        sio.on("output", (data: unknown) => {
          if (closed) return;
          const text =
            data && typeof data === "object" && "output" in data
              ? String((data as { output: unknown }).output)
              : String(data);

          controller.enqueue(sseData({ type: "stdout", data: text }));

          if (
            text.includes("=== Code Execution Successful ===") ||
            text.includes("=== Code Execution Failed ===")
          ) {
            executionSucceeded = true;
            emitExit(text.includes("Successful") ? 0 : 1);
            sio.disconnect();
          }
        });

        sio.on("disconnect", () => {
          if (executionSucceeded) {
            circuitBreaker.recordSuccess();
            emitExit(0);
          } else if (!closed) {
            // Disconnected without completing — treat as infra failure
            circuitBreaker.recordFailure();
            emitExit(1);
          }
          releaseOnce();
          close();
        });

        sio.on("connect_error", (err: Error) => {
          circuitBreaker.recordFailure();
          if (!closed) {
            controller.enqueue(
              sseData({ type: "stderr", data: `Connection failed: ${err.message}` })
            );
            emitExit(1);
          }
          releaseOnce();
          close();
        });

        setTimeout(() => {
          if (!closed) {
            circuitBreaker.recordFailure();
            controller.enqueue(sseData({ type: "stderr", data: "Execution timed out" }));
            emitExit(1);
            sio.disconnect();
            releaseOnce();
            close();
          }
        }, effectiveTimeout);
      } catch (err) {
        circuitBreaker.recordFailure();
        releaseOnce();
        if (!closed) {
          controller.enqueue(
            sseData({
              type: "stderr",
              data: `Unexpected error: ${err instanceof Error ? err.message : String(err)}`,
            })
          );
          emitExit(1);
        }
        close();
      }
    },
  });
}

// ── Stats export (for /system/health) ─────────────────────────────────
export function getProxyStats() {
  return {
    circuitBreaker: circuitBreaker.getStats(),
    concurrency: concurrencyLimiter.getStats(),
  };
}
