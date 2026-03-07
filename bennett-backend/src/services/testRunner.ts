import { executeCode } from "./programizProxy.js";

interface TestCase {
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  points: number;
  timeLimit: number;
}

interface TestResult {
  index: number;
  passed: boolean;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  isHidden: boolean;
  points: number;
  error?: string;
}

interface TestRunSummary {
  totalTests: number;
  passed: number;
  failed: number;
  totalPoints: number;
  earnedPoints: number;
  results: TestResult[];
}

/**
 * Wraps user code with stdin injection so Programiz can handle input.
 * Programiz doesn't support interactive stdin piping,
 * so we prepend code that overrides stdin with the provided input string.
 */
function injectStdin(code: string, language: string, input: string): string {
  if (!input) return code;

  // Escape for embedding in source
  const escaped = input.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n");

  switch (language) {
    case "python":
      return `import sys, io\nsys.stdin = io.StringIO("${escaped}")\n${code}`;

    case "cpp":
      // Redirect cin to a stringstream with the input
      return `#include <sstream>\n#include <iostream>\nstatic std::istringstream __cq_in("${escaped}");\n#define cin __cq_in\n${code}`;

    case "c":
      // Use GCC constructor attribute to redirect stdin before main()
      return `#include <stdio.h>\n#include <stdlib.h>\n#include <string.h>\n__attribute__((constructor)) static void __cq_init_stdin(void) {\n  FILE *f = fopen("/tmp/__cq_in.txt", "w");\n  if(f){ fprintf(f, "${escaped}"); fclose(f); freopen("/tmp/__cq_in.txt", "r", stdin); }\n}\n${code}`;

    case "java":
      // Inject System.setIn at the start of the main method
      return `import java.io.*;\n${code.replace(
        /(public\s+static\s+void\s+main\s*\([^)]*\)\s*\{)/,
        `$1\n    System.setIn(new ByteArrayInputStream("${escaped}".getBytes()));`
      )}`;

    case "javascript":
      // Override readline in Node.js context
      return `const __cq_lines = "${escaped}".split("\\n"); let __cq_idx = 0;\nconst readline = () => __cq_lines[__cq_idx++] || "";\nconst prompt = readline;\n${code}`;

    default:
      return code;
  }
}

/**
 * Cleans output by removing Programiz sentinel lines and trailing whitespace.
 */
function cleanOutput(raw: string): string {
  return raw
    .replace(/=== Code Execution Successful ===/g, "")
    .replace(/=== Code Execution Failed ===/g, "")
    .trim();
}

/**
 * Runs all test cases against user code sequentially.
 */
export async function runTests(
  code: string,
  language: string,
  testCases: TestCase[]
): Promise<TestRunSummary> {
  const results: TestResult[] = [];
  let passed = 0;
  let totalPoints = 0;
  let earnedPoints = 0;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    totalPoints += tc.points;

    const injectedCode = injectStdin(code, language, tc.input);
    const result = await executeCode(injectedCode, language, tc.timeLimit || 28000);

    const actualOutput = cleanOutput(result.output);
    const expectedTrimmed = tc.expectedOutput.trim();
    const testPassed = actualOutput === expectedTrimmed;

    if (testPassed) {
      passed++;
      earnedPoints += tc.points;
    }

    results.push({
      index: i,
      passed: testPassed,
      input: tc.isHidden ? "[hidden]" : tc.input,
      expectedOutput: tc.isHidden ? "[hidden]" : tc.expectedOutput,
      actualOutput: tc.isHidden ? (testPassed ? "[correct]" : "[incorrect]") : actualOutput,
      isHidden: tc.isHidden,
      points: tc.points,
      error: tc.isHidden ? (result.error ? "Execution error" : undefined) : result.error,
    });
  }

  return {
    totalTests: testCases.length,
    passed,
    failed: testCases.length - passed,
    totalPoints,
    earnedPoints,
    results,
  };
}
