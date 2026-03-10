import { JUDGE0_LANGUAGES } from './judge0Service';
import api from './apiClient';

export interface ExecuteResult {
  stdout: string;
  stderr: string;
  compileOutput: string;
  message: string;
  status: {
    id: number;
    description: string;
  };
  token: string;
  exitCode: number | null;
  exitSignal?: number | null;
  executionTime: number;
  wallTime?: number;
  memoryUsed: number;
}

export interface TestRunResult {
  testCase: number;
  passed: boolean;
  executionTime: number;
  wallTime?: number;
  memoryUsed: number;
  stdout?: string;
  stderr?: string;
  compileOutput?: string;
  message?: string;
  status?: {
    id: number;
    description: string;
  };
  exitCode?: number;
  token?: string;
  expectedOutput?: string;
  error?: string;
}

export interface TestRunSummary {
  results: TestRunResult[];
  summary: {
    passed: number;
    total: number;
    score: number;
    status?: 'accepted' | 'wrong_answer';
    averageTime: number;
    maxMemory?: number;
  };
}

export const executeService = {
  async runCode(code: string, language: string, stdin?: string): Promise<ExecuteResult> {
    try {
      return await api.post<ExecuteResult>(
        '/execute',
        { code, language, stdin },
      );
    } catch (error: any) {
      if (error?.message) {
        throw new Error(error.message);
      }
      throw new Error('Code execution request failed.');
    }
  },

  async runTests(
    code: string,
    language: string,
    testCases: { input: string; expectedOutput: string }[],
  ): Promise<TestRunSummary> {
    if (!testCases.length) {
      return {
        results: [],
        summary: { passed: 0, total: 0, score: 0, averageTime: 0, maxMemory: 0 },
      };
    }

    try {
      const raw = await api.post<any>(
        '/execute/run-tests',
        { code, language, testCases },
      );
      // Backend returns {totalTests, passed, failed, results} — adapt to frontend shape
      if (raw.summary) return raw as TestRunSummary;
      return {
        results: raw.results || [],
        summary: {
          passed: raw.passed ?? 0,
          total: raw.totalTests ?? testCases.length,
          score: raw.totalTests ? Math.round((raw.passed / raw.totalTests) * 100) : 0,
          averageTime: raw.results?.length
            ? raw.results.reduce((s: number, r: any) => s + (r.executionTime || 0), 0) / raw.results.length
            : 0,
          maxMemory: raw.results?.length
            ? Math.max(...raw.results.map((r: any) => r.memoryUsed || 0))
            : 0,
        },
      } as TestRunSummary;
    } catch (error: any) {
      if (error?.message) {
        throw new Error(error.message);
      }
      throw new Error('Test execution request failed.');
    }
  },

  async getLanguages(): Promise<{ id: string; name: string; extension: string }[]> {
    try {
      const data = await api.get<any[]>(
        '/execute/languages',
      );
      // Backend returns {key, label, extension} — map to frontend shape
      return data.map((item: any) => ({
        id: item.key || item.id,
        name: item.label || item.name,
        extension: item.extension,
      }));
    } catch {
      return Object.entries(JUDGE0_LANGUAGES).map(([key, val]) => ({
        id: key,
        name: val.name,
        extension: key,
      }));
    }
  },
};

export default executeService;
