import { getFingerprint, jitterDelay, randomId } from "../lib/fingerprint.js";
import { LANGUAGE_MAP } from "../lib/languages.js";

interface ExecutionResult {
  output: string;
  error?: string;
  timedOut?: boolean;
}

/**
 * Executes code against Programiz via WebSocket.
 * Returns a collected result with all output text.
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

  // Anti-ban: jitter before request
  await jitterDelay(50, 300);

  const fp = getFingerprint();
  const sessionId = randomId(10);
  const subdomain = langConfig.programizSubdomain;
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
    // Non-fatal
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

/**
 * Executes code and streams output as SSE via a ReadableStream.
 */
export function executeCodeStream(code: string, languageKey: string): ReadableStream | null {
  const langConfig = LANGUAGE_MAP[languageKey];
  if (!langConfig || !langConfig.programizSubdomain) return null;

  const fp = getFingerprint();
  const sessionId = randomId(10);
  const subdomain = langConfig.programizSubdomain;
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

  const encoder = new TextEncoder();
  function sseData(payload: object): Uint8Array {
    return encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);
  }

  return new ReadableStream({
    async start(controller) {
      let closed = false;

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

      const socketioModule = await import("socket.io-client");
      const socketio = (socketioModule.default ?? socketioModule) as any;

      const sio = socketio(socketUrl, {
        transports: ["websocket"],
        extraHeaders: {
          "User-Agent": fp.userAgent,
          "Accept-Language": fp.acceptLanguage,
        },
        reconnection: false,
        timeout: 25000,
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

        controller.enqueue(sseData({ output: text }));

        if (
          text.includes("=== Code Execution Successful ===") ||
          text.includes("=== Code Execution Failed ===")
        ) {
          sio.disconnect();
          close();
        }
      });

      sio.on("disconnect", () => close());

      sio.on("connect_error", (err: Error) => {
        if (!closed) {
          controller.enqueue(sseData({ error: `Connection failed: ${err.message}` }));
        }
        close();
      });

      setTimeout(() => {
        if (!closed) {
          controller.enqueue(sseData({ error: "Execution timed out" }));
          sio.disconnect();
          close();
        }
      }, 28000);
    },
  });
}
