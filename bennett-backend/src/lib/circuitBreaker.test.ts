import { describe, it, expect, beforeEach } from "vitest";
import { CircuitBreaker, ConcurrencyLimiter } from "./circuitBreaker.js";

// ── CircuitBreaker ────────────────────────────────────────────────────
describe("CircuitBreaker", () => {
  let cb: CircuitBreaker;

  beforeEach(() => {
    cb = new CircuitBreaker({
      windowSize: 10,
      degradedThreshold: 0.4,
      consecutiveFailLimit: 3,
      cooldownMs: 100, // short for tests
      recoveryThreshold: 0.8,
    });
  });

  describe("initial state", () => {
    it("starts in GOOD state", () => {
      expect(cb.getState()).toBe("GOOD");
    });

    it("allows execution in initial state", () => {
      expect(cb.canExecute()).toBe(true);
    });

    it("reports stats with 100% success rate when empty", () => {
      const stats = cb.getStats();
      expect(stats.state).toBe("GOOD");
      expect(stats.successRate).toBe(1);
      expect(stats.totalInWindow).toBe(0);
      expect(stats.consecutiveFailures).toBe(0);
    });
  });

  describe("GOOD → DEGRADED transition", () => {
    it("stays GOOD with all successes", () => {
      for (let i = 0; i < 10; i++) cb.recordSuccess();
      expect(cb.getState()).toBe("GOOD");
    });

    it("transitions to DEGRADED when failure rate exceeds threshold", () => {
      // Need at least 3 results with ≥40% failure
      cb.recordFailure();
      cb.recordFailure();
      expect(cb.getState()).toBe("GOOD"); // Only 2 results
      cb.recordSuccess();
      // 3 results, 2/3 ≈ 67% failure — exceeds 40%
      expect(cb.getState()).toBe("DEGRADED");
    });

    it("stays GOOD below threshold", () => {
      cb.recordSuccess();
      cb.recordSuccess();
      cb.recordSuccess();
      cb.recordFailure();
      // 4 results, 25% failure — below 40%
      expect(cb.getState()).toBe("GOOD");
    });
  });

  describe("DEGRADED → BAD transition", () => {
    it("transitions to BAD on consecutive failures", () => {
      // First get to DEGRADED
      cb.recordFailure();
      cb.recordFailure();
      cb.recordSuccess(); // now DEGRADED
      expect(cb.getState()).toBe("DEGRADED");

      // Then hit consecutive fail limit (3)
      cb.recordFailure();
      cb.recordFailure();
      cb.recordFailure();
      expect(cb.getState()).toBe("BAD");
    });
  });

  describe("DEGRADED → GOOD recovery", () => {
    it("recovers to GOOD when success rate exceeds recovery threshold", () => {
      // Get to DEGRADED
      cb.recordFailure();
      cb.recordFailure();
      cb.recordSuccess();
      expect(cb.getState()).toBe("DEGRADED");

      // Record enough successes (need ≥5 results with ≥80% success)
      cb.recordSuccess();
      cb.recordSuccess();
      cb.recordSuccess();
      cb.recordSuccess();
      cb.recordSuccess();
      // Window has: 2F, 6S = 75% success — not enough
      // Need more successes
      cb.recordSuccess();
      cb.recordSuccess();
      // Window: 2F, 8S = 80% success → GOOD
      expect(cb.getState()).toBe("GOOD");
    });
  });

  describe("BAD state behavior", () => {
    it("rejects execution in BAD state before cooldown", () => {
      // Drive to BAD
      cb.recordFailure();
      cb.recordFailure();
      cb.recordSuccess();
      cb.recordFailure();
      cb.recordFailure();
      cb.recordFailure();
      expect(cb.getState()).toBe("BAD");
      expect(cb.canExecute()).toBe(false);
    });

    it("allows probe after cooldown", async () => {
      cb.recordFailure();
      cb.recordFailure();
      cb.recordSuccess();
      cb.recordFailure();
      cb.recordFailure();
      cb.recordFailure();
      expect(cb.getState()).toBe("BAD");

      // Wait for cooldown (100ms)
      await new Promise((r) => setTimeout(r, 120));
      expect(cb.canExecute()).toBe(true);
    });

    it("recovers to DEGRADED on successful probe", async () => {
      cb.recordFailure();
      cb.recordFailure();
      cb.recordSuccess();
      cb.recordFailure();
      cb.recordFailure();
      cb.recordFailure();
      expect(cb.getState()).toBe("BAD");

      await new Promise((r) => setTimeout(r, 120));
      cb.recordSuccess();
      expect(cb.getState()).toBe("DEGRADED");
    });
  });

  describe("recordSuccess resets consecutive failures", () => {
    it("resets consecutiveFailures on success", () => {
      cb.recordFailure();
      cb.recordFailure();
      expect(cb.getStats().consecutiveFailures).toBe(2);
      cb.recordSuccess();
      expect(cb.getStats().consecutiveFailures).toBe(0);
    });
  });

  describe("window trimming", () => {
    it("trims results beyond 2x window size", () => {
      const bigCb = new CircuitBreaker({ windowSize: 5 });
      for (let i = 0; i < 15; i++) bigCb.recordSuccess();
      // After 15 pushes (> 5*2=10), array is trimmed to last 5
      expect(bigCb.getStats().totalInWindow).toBe(5);
    });
  });
});

// ── ConcurrencyLimiter ────────────────────────────────────────────────
describe("ConcurrencyLimiter", () => {
  it("allows up to maxConcurrent simultaneous tasks", async () => {
    const limiter = new ConcurrencyLimiter(2);
    let running = 0;
    let maxRunning = 0;

    const task = async () => {
      running++;
      maxRunning = Math.max(maxRunning, running);
      await new Promise((r) => setTimeout(r, 50));
      running--;
    };

    await Promise.all([limiter.run(task), limiter.run(task), limiter.run(task)]);

    expect(maxRunning).toBe(2);
  });

  it("reports stats correctly", async () => {
    const limiter = new ConcurrencyLimiter(3);
    expect(limiter.getStats()).toEqual({ running: 0, queued: 0, max: 3 });

    const release = new Promise<void>((resolve) => {
      limiter.run(async () => {
        expect(limiter.getStats().running).toBe(1);
        resolve();
      });
    });

    await release;
  });

  it("queues tasks beyond limit", async () => {
    const limiter = new ConcurrencyLimiter(1);
    const order: number[] = [];

    const task = (id: number) => async () => {
      order.push(id);
      await new Promise((r) => setTimeout(r, 20));
    };

    await Promise.all([
      limiter.run(task(1)),
      limiter.run(task(2)),
      limiter.run(task(3)),
    ]);

    expect(order).toEqual([1, 2, 3]);
  });

  it("releases slot even if task throws", async () => {
    const limiter = new ConcurrencyLimiter(1);

    await limiter
      .run(async () => {
        throw new Error("boom");
      })
      .catch(() => {});

    expect(limiter.getStats().running).toBe(0);

    // Should still be able to run another task
    const result = await limiter.run(async () => "ok");
    expect(result).toBe("ok");
  });
});
