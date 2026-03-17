/**
 * Judge0 Docker Executor — secondary/fallback code execution backend.
 *
 * Connects to a local Judge0 CE instance running on Docker.
 * Default URL: http://localhost:2358 (configurable via JUDGE0_BASE_URL)
 *
 * Judge0 API flow:
 *   1. POST /submissions?base64_encoded=false&wait=true  (synchronous)
 *   2. Response includes stdout, stderr, compile_output, status
 */

import { LANGUAGE_MAP } from "../lib/languages.js";

// ── Judge0 language ID mapping ────────────────────────────────────────
const JUDGE0_LANGUAGE_IDS: Record<string, number> = {
  c: 50,          // C (GCC 9.2.0)
  cpp: 54,        // C++ (GCC 9.2.0)
  java: 62,       // Java (OpenJDK 13.0.1)
  python: 71,     // Python (3.8.1)
  javascript: 63, // JavaScript (Node.js 12.14.0)
};

interface ExecutionResult {
  output: string;
  error?: string;
  timedOut?: boolean;
}

function getBaseUrl(): string {
  return process.env.JUDGE0_BASE_URL ?? "http://localhost:2358";
}

function getAuthHeaders(): Record<string, string> {
  const token = process.env.JUDGE0_AUTH_TOKEN;
  if (token) {
    return { "X-Auth-Token": token };
  }
  return {};
}

/**
 * Check if Judge0 Docker is reachable.
 */
export async function isJudge0Available(): Promise<boolean> {
  try {
    const res = await fetch(`${getBaseUrl()}/about`, {
      signal: AbortSignal.timeout(3000),
      headers: getAuthHeaders(),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Execute code via Judge0 synchronous submission.
 */
export async function executeCodeJudge0(
  code: string,
  languageKey: string,
  stdin = "",
  timeoutMs = 28000
): Promise<ExecutionResult> {
  const langConfig = LANGUAGE_MAP[languageKey];
  if (!langConfig) {
    return { output: "", error: `Unsupported language: ${languageKey}` };
  }

  const judge0LangId = JUDGE0_LANGUAGE_IDS[languageKey];
  if (!judge0LangId) {
    return { output: "", error: `No Judge0 language ID for: ${languageKey}` };
  }

  const cpuTimeLimit = Math.min(Math.floor(timeoutMs / 1000), 30);
  const wallTimeLimit = cpuTimeLimit + 5;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs + 5000);

    const res = await fetch(
      `${getBaseUrl()}/submissions?base64_encoded=false&wait=true`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          source_code: code,
          language_id: judge0LangId,
          stdin: stdin || "",
          cpu_time_limit: cpuTimeLimit,
          wall_time_limit: wallTimeLimit,
          memory_limit: 256000, // 256MB
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timer);

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { output: "", error: `Judge0 API error (${res.status}): ${text}` };
    }

    const data = (await res.json()) as {
      stdout: string | null;
      stderr: string | null;
      compile_output: string | null;
      status: { id: number; description: string };
      time: string | null;
      memory: number | null;
    };

    // Judge0 status IDs:
    // 1=InQueue, 2=Processing, 3=Accepted, 4=WrongAnswer, 5=TimeLimitExceeded
    // 6=CompilationError, 7-12=RuntimeErrors, 13=InternalError, 14=ExecFormatError
    const statusId = data.status?.id ?? 0;

    if (statusId === 5) {
      return {
        output: data.stdout ?? "",
        error: "Execution timed out",
        timedOut: true,
      };
    }

    if (statusId === 6) {
      // Compilation error
      return {
        output: "",
        error: data.compile_output ?? "Compilation error",
      };
    }

    if (statusId >= 7 && statusId <= 12) {
      // Runtime error
      const stderr = data.stderr ?? "";
      const stdout = data.stdout ?? "";
      return {
        output: stdout,
        error: `Runtime error: ${stderr || data.status.description}`,
      };
    }

    // Success (3=Accepted) or other
    const output = data.stdout ?? "";
    const stderr = data.stderr ?? "";

    if (stderr && !output) {
      return { output: "", error: stderr };
    }

    return { output: output + (stderr ? `\n${stderr}` : "") };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return { output: "", error: "Judge0 request timed out", timedOut: true };
    }
    return {
      output: "",
      error: `Judge0 connection failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/**
 * Execute code via Judge0 and return as SSE ReadableStream.
 * Judge0 is synchronous (wait=true), so we just emit a single output event.
 */
export function executeCodeJudge0Stream(
  code: string,
  languageKey: string
): ReadableStream | null {
  const judge0LangId = JUDGE0_LANGUAGE_IDS[languageKey];
  if (!judge0LangId) return null;

  const encoder = new TextEncoder();
  function sseData(payload: object): Uint8Array {
    return encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);
  }

  return new ReadableStream({
    async start(controller) {
      try {
        const result = await executeCodeJudge0(code, languageKey);

        if (result.error && !result.output) {
          controller.enqueue(sseData({ error: result.error }));
        } else {
          if (result.output) {
            controller.enqueue(sseData({ output: result.output }));
          }
          if (result.error) {
            controller.enqueue(sseData({ error: result.error }));
          }
        }
      } catch (err) {
        controller.enqueue(
          sseData({
            error: `Judge0 error: ${err instanceof Error ? err.message : String(err)}`,
          })
        );
      } finally {
        try {
          controller.close();
        } catch {
          // already closed
        }
      }
    },
  });
}
