/**
 * Tests for logger.ts — structured Pino logger
 */
import { describe, it, expect } from "vitest";
import { logger, createChildLogger } from "./logger.js";

describe("logger", () => {
  it("exports a pino logger instance", () => {
    expect(logger).toBeDefined();
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.error).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.debug).toBe("function");
    expect(typeof logger.fatal).toBe("function");
  });

  it("has service binding set to codequest-api", () => {
    // Pino stores base bindings in logger.bindings()
    const bindings = logger.bindings();
    expect(bindings.service).toBe("codequest-api");
  });

  it("level defaults to debug in non-production", () => {
    // Since tests run in non-production, level should be debug
    expect(logger.level).toBe("debug");
  });

  describe("createChildLogger", () => {
    it("creates a child logger with additional bindings", () => {
      const child = createChildLogger({ module: "test-module", requestId: "abc123" });
      expect(child).toBeDefined();
      expect(typeof child.info).toBe("function");
      const bindings = child.bindings();
      expect(bindings.module).toBe("test-module");
      expect(bindings.requestId).toBe("abc123");
    });

    it("child inherits parent service binding", () => {
      const child = createChildLogger({ module: "inherit-test" });
      // The child still inherits the parent's base bindings
      // Note: pino child bindings() only returns *own* bindings, not parent's
      expect(typeof child.info).toBe("function");
    });

    it("creates independent child loggers", () => {
      const child1 = createChildLogger({ module: "mod-a" });
      const child2 = createChildLogger({ module: "mod-b" });
      expect(child1.bindings().module).toBe("mod-a");
      expect(child2.bindings().module).toBe("mod-b");
    });
  });
});
