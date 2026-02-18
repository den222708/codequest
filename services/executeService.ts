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

const getDemoExecuteHeaders = (): HeadersInit | undefined => {
  if (typeof window === 'undefined') return undefined;
  const isDemoMode = localStorage.getItem('codequest_demo_mode') === 'true';
  return isDemoMode ? { 'X-CodeQuest-Demo': 'true' } : undefined;
};

export const executeService = {
  async runCode(code: string, language: string, stdin?: string): Promise<ExecuteResult> {
    try {
      return await api.post<ExecuteResult>(
        '/execute',
        { code, language, stdin },
        { headers: getDemoExecuteHeaders() },
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
      return await api.post<TestRunSummary>(
        '/execute/run-tests',
        { code, language, testCases },
        { headers: getDemoExecuteHeaders() },
      );
    } catch (error: any) {
      if (error?.message) {
        throw new Error(error.message);
      }
      throw new Error('Test execution request failed.');
    }
  },

  async getLanguages(): Promise<{ id: string; name: string; extension: string }[]> {
    try {
      return await api.get<{ id: string; name: string; extension: string }[]>(
        '/execute/languages',
        { headers: getDemoExecuteHeaders() },
      );
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
