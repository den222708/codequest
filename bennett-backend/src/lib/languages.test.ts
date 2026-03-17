import { describe, it, expect } from "vitest";
import { LANGUAGES, LANGUAGE_MAP, DEFAULT_LANGUAGE } from "./languages.js";

describe("languages", () => {
  describe("LANGUAGES array", () => {
    it("has at least 5 languages", () => {
      expect(LANGUAGES.length).toBeGreaterThanOrEqual(5);
    });

    it("each language has required fields", () => {
      for (const lang of LANGUAGES) {
        expect(lang.id).toBeTruthy();
        expect(lang.label).toBeTruthy();
        expect(lang.extension).toMatch(/^\./);
        expect(lang.programizSubdomain).toBeTruthy();
        expect(Array.isArray(lang.programizEndpointPool)).toBe(true);
        expect(lang.programizEndpointPool.length).toBeGreaterThanOrEqual(1);
        expect(lang.monacoLang).toBeTruthy();
        expect(lang.defaultCode).toBeTruthy();
      }
    });

    it("has unique IDs", () => {
      const ids = LANGUAGES.map((l) => l.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("includes expected languages", () => {
      const ids = LANGUAGES.map((l) => l.id);
      expect(ids).toContain("cpp");
      expect(ids).toContain("c");
      expect(ids).toContain("python");
      expect(ids).toContain("java");
      expect(ids).toContain("javascript");
    });
  });

  describe("LANGUAGE_MAP", () => {
    it("maps all language IDs", () => {
      for (const lang of LANGUAGES) {
        expect(LANGUAGE_MAP[lang.id]).toBe(lang);
      }
    });

    it("returns undefined for unknown language", () => {
      expect(LANGUAGE_MAP["rust"]).toBeUndefined();
      expect(LANGUAGE_MAP[""]).toBeUndefined();
    });
  });

  describe("DEFAULT_LANGUAGE", () => {
    it("is the first language in LANGUAGES", () => {
      expect(DEFAULT_LANGUAGE).toBe(LANGUAGES[0]);
    });

    it("is C++", () => {
      expect(DEFAULT_LANGUAGE.id).toBe("cpp");
    });
  });

  describe("endpoint pool configuration", () => {
    it("primary subdomain is in the endpoint pool", () => {
      for (const lang of LANGUAGES) {
        expect(lang.programizEndpointPool).toContain(lang.programizSubdomain);
      }
    });
  });
});
