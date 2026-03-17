import { JUDGE0_LANGUAGES } from './judge0Service';
import api from './apiClient';
import { tokenStore } from './apiClient';

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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

export const executeService = {
  async runCode(code: string, language: string, stdin?: string): Promise<ExecuteResult> {
    try {
      const token = tokenStore.getAccessToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/execute`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ code, language, stdin }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => null);
        throw new Error(errBody?.error || errBody?.message || `Execution failed with status ${res.status}`);
      }

      // Parse SSE stream
      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let stdout = '';
      let stderr = '';
      let exitCode: number | null = null;
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        // Keep the last (possibly incomplete) line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;
          try {
            const event = JSON.parse(jsonStr);
            if (event.type === 'stdout') stdout += event.data;
            else if (event.type === 'stderr') stderr += event.data;
            else if (event.type === 'exit') exitCode = event.code ?? null;
          } catch {
            // skip malformed JSON
          }
        }
      }

      return {
        stdout,
        stderr,
        compileOutput: '',
        message: '',
        status: { id: exitCode === 0 ? 3 : 11, description: exitCode === 0 ? 'Accepted' : 'Runtime Error' },
        token: '',
        exitCode,
        executionTime: 0,
        memoryUsed: 0,
      };
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
