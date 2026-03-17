/**
 * Circuit Breaker — SEB TransmissionSpooler-inspired health state machine
 *
 * States:
 *   GOOD      → All requests pass through normally
 *   DEGRADED  → Requests pass but with extended timeouts and jitter
 *   BAD       → Requests are rejected immediately (fail-fast) until recovery probe succeeds
 *
 * Transitions:
 *   GOOD → DEGRADED:  when failure rate exceeds threshold in window
 *   DEGRADED → BAD:   when consecutive failures exceed limit
 *   BAD → DEGRADED:   after cooldown, a single probe request succeeds
 *   DEGRADED → GOOD:  when success rate recovers above threshold in window
 */

import { createChildLogger } from "./logger.js";

const log = createChildLogger({ module: "circuitBreaker" });

export type HealthState = "GOOD" | "DEGRADED" | "BAD";

export interface CircuitBreakerOptions {
  /** Window size for tracking results (default: 20) */
  windowSize?: number;
  /** Failure rate threshold (0-1) to transition GOOD → DEGRADED (default: 0.4) */
  degradedThreshold?: number;
  /** Consecutive failures to transition DEGRADED → BAD (default: 5) */
  consecutiveFailLimit?: number;
  /** Cooldown in ms before a probe request is allowed in BAD state (default: 30_000) */
  cooldownMs?: number;
  /** Success rate threshold (0-1) to transition DEGRADED → GOOD (default: 0.8) */
  recoveryThreshold?: number;
}

interface CircuitResult {
  success: boolean;
  timestamp: number;
}

export class CircuitBreaker {
  private state: HealthState = "GOOD";
  private results: CircuitResult[] = [];
  private consecutiveFailures = 0;
  private lastFailureTime = 0;
  private lastStateChange = Date.now();

  private readonly windowSize: number;
  private readonly degradedThreshold: number;
  private readonly consecutiveFailLimit: number;
  private readonly cooldownMs: number;
  private readonly recoveryThreshold: number;

  constructor(opts: CircuitBreakerOptions = {}) {
    this.windowSize = opts.windowSize ?? 20;
    this.degradedThreshold = opts.degradedThreshold ?? 0.4;
    this.consecutiveFailLimit = opts.consecutiveFailLimit ?? 5;
    this.cooldownMs = opts.cooldownMs ?? 30_000;
    this.recoveryThreshold = opts.recoveryThreshold ?? 0.8;
  }

  getState(): HealthState {
    return this.state;
  }

  getStats() {
    const recent = this.recentResults();
    const successes = recent.filter(r => r.success).length;
    const total = recent.length;
    return {
      state: this.state,
      successRate: total > 0 ? successes / total : 1,
      totalInWindow: total,
      consecutiveFailures: this.consecutiveFailures,
      lastStateChange: this.lastStateChange,
    };
  }

  /** Returns true if the request should be allowed through */
  canExecute(): boolean {
    if (this.state === "GOOD" || this.state === "DEGRADED") return true;
    // BAD state: allow probe after cooldown
    return Date.now() - this.lastFailureTime >= this.cooldownMs;
  }

  /** Record a successful execution */
  recordSuccess(): void {
    this.consecutiveFailures = 0;
    this.pushResult(true);
    this.evaluate();
  }

  /** Record a failed execution */
  recordFailure(): void {
    this.consecutiveFailures++;
    this.lastFailureTime = Date.now();
    this.pushResult(false);
    this.evaluate();
  }

  private pushResult(success: boolean): void {
    this.results.push({ success, timestamp: Date.now() });
    if (this.results.length > this.windowSize * 2) {
      this.results = this.results.slice(-this.windowSize);
    }
  }

  private recentResults(): CircuitResult[] {
    return this.results.slice(-this.windowSize);
  }

  private evaluate(): void {
    const recent = this.recentResults();
    const total = recent.length;
    if (total === 0) return;

    const failureRate = recent.filter(r => !r.success).length / total;
    const successRate = 1 - failureRate;

    const prev = this.state;

    switch (this.state) {
      case "GOOD":
        if (total >= 3 && failureRate >= this.degradedThreshold) {
          this.state = "DEGRADED";
        }
        break;

      case "DEGRADED":
        if (this.consecutiveFailures >= this.consecutiveFailLimit) {
          this.state = "BAD";
        } else if (total >= 5 && successRate >= this.recoveryThreshold) {
          this.state = "GOOD";
        }
        break;

      case "BAD":
        // Recovery: if last result was a success (probe succeeded)
        if (recent[recent.length - 1]?.success) {
          this.state = "DEGRADED";
          this.consecutiveFailures = 0;
        }
        break;
    }

    if (prev !== this.state) {
      this.lastStateChange = Date.now();
      log.warn({ from: prev, to: this.state, failureRate: failureRate.toFixed(2), consecutiveFailures: this.consecutiveFailures }, "Circuit breaker state transition");
    }
  }
}

/**
 * Semaphore-based concurrency limiter.
 * Limits the number of concurrent async operations.
 */
export class ConcurrencyLimiter {
  private running = 0;
  private queue: (() => void)[] = [];

  constructor(private readonly maxConcurrent: number) {}

  async acquire(): Promise<void> {
    if (this.running < this.maxConcurrent) {
      this.running++;
      return;
    }
    return new Promise<void>((resolve) => {
      this.queue.push(() => {
        this.running++;
        resolve();
      });
    });
  }

  release(): void {
    this.running--;
    const next = this.queue.shift();
    if (next) next();
  }

  /** Run an async function with concurrency limiting */
  async run<T>(fn: () => Promise<T>): Promise<T> {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }

  getStats() {
    return { running: this.running, queued: this.queue.length, max: this.maxConcurrent };
  }
}
