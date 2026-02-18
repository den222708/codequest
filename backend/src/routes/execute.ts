import { Router } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import { z } from 'zod';
import axios from 'axios';

const router = Router();

type ExecutorProvider = 'rapidapi' | 'self-host' | 'auto';
type ResolvedProvider = Exclude<ExecutorProvider, 'auto'>;

interface JudgeStatus {
    id: number;
    description: string;
}

interface ExecuteResult {
    stdout: string;
    stderr: string;
    compileOutput: string;
    message: string;
    status: JudgeStatus;
    token: string;
    exitCode: number | null;
    exitSignal: number | null;
    executionTime: number;
    wallTime: number;
    memoryUsed: number;
}

const LANGUAGE_IDS: Record<string, number> = {
    python: 71,
    javascript: 63,
    java: 62,
    cpp: 54,
    c: 50,
    typescript: 74,
    ruby: 72,
    go: 60,
    rust: 73,
    csharp: 51,
};

const rawProvider = (process.env.EXECUTOR_PROVIDER || 'auto').toLowerCase();
const EXECUTOR_PROVIDER: ExecutorProvider =
    rawProvider === 'rapidapi' || rawProvider === 'self-host' || rawProvider === 'auto'
        ? (rawProvider as ExecutorProvider)
        : 'auto';

const SELF_HOST_BASE = process.env.JUDGE0_BASE_URL || '';
const RAPIDAPI_BASE = 'https://judge0-ce.p.rapidapi.com';
const RAPIDAPI_KEY = process.env.JUDGE0_RAPIDAPI_KEY || process.env.JUDGE0_API_KEY || '';
const RAPIDAPI_HOST = process.env.JUDGE0_RAPIDAPI_HOST || 'judge0-ce.p.rapidapi.com';
const SELF_HOST_AUTH_TOKEN = process.env.JUDGE0_AUTH_TOKEN || '';

function hasProviderConfig(provider: ResolvedProvider): boolean {
    if (provider === 'self-host') {
        return !!SELF_HOST_BASE;
    }
    return !!RAPIDAPI_KEY;
}

function getProviderCandidates(): ResolvedProvider[] {
    if (EXECUTOR_PROVIDER === 'self-host' || EXECUTOR_PROVIDER === 'rapidapi') {
        if (!hasProviderConfig(EXECUTOR_PROVIDER)) {
            const missing = EXECUTOR_PROVIDER === 'self-host' ? 'JUDGE0_BASE_URL' : 'JUDGE0_RAPIDAPI_KEY';
            throw new Error(`Execution provider misconfigured: missing ${missing}.`);
        }
        return [EXECUTOR_PROVIDER];
    }

    const providers: ResolvedProvider[] = [];
    if (hasProviderConfig('self-host')) providers.push('self-host');
    if (hasProviderConfig('rapidapi')) providers.push('rapidapi');

    if (!providers.length) {
        throw new Error('No execution provider configured. Set EXECUTOR_PROVIDER plus Judge0 credentials.');
    }

    return providers;
}

function providerBase(provider: ResolvedProvider): string {
    return provider === 'rapidapi' ? RAPIDAPI_BASE : SELF_HOST_BASE;
}

function providerHeaders(provider: ResolvedProvider) {
    if (provider === 'rapidapi') {
        return {
            'Content-Type': 'application/json',
            'X-RapidAPI-Key': RAPIDAPI_KEY,
            'X-RapidAPI-Host': RAPIDAPI_HOST,
        };
    }

    return {
        'Content-Type': 'application/json',
        ...(SELF_HOST_AUTH_TOKEN ? { 'X-Auth-Token': SELF_HOST_AUTH_TOKEN } : {}),
    };
}

function toBase64(str: string): string {
    return Buffer.from(str, 'utf-8').toString('base64');
}

function fromBase64(str: string | null | undefined): string {
    if (!str) return '';

    try {
        return Buffer.from(str, 'base64').toString('utf-8');
    } catch {
        return str;
    }
}

function normalizeComparableOutput(value: string): string {
    return (value || '').replace(/\r\n/g, '\n').trimEnd();
}

function outputsMatch(actual: string, expected: string): boolean {
    return normalizeComparableOutput(actual) === normalizeComparableOutput(expected);
}

async function fetchSubmissionResult(provider: ResolvedProvider, token: string): Promise<any> {
    const base = providerBase(provider);
    const headers = providerHeaders(provider);

    const { data } = await axios.get(
        `${base}/submissions/${token}?base64_encoded=true&fields=*`,
        { headers, timeout: 15000 },
    );

    return data;
}

async function pollJudge0(provider: ResolvedProvider, token: string, maxAttempts = 22): Promise<any> {
    for (let i = 0; i < maxAttempts; i++) {
        await new Promise(r => setTimeout(r, 700));
        const data = await fetchSubmissionResult(provider, token);
        if (data.status?.id > 2) return data;
    }

    throw new Error('Code execution timed out');
}

function normalizeJudgeResult(raw: any): ExecuteResult {
    const status: JudgeStatus = {
        id: raw?.status?.id || 13,
        description: raw?.status?.description || 'Internal Error',
    };

    const exitCode = typeof raw?.exit_code === 'number'
        ? raw.exit_code
        : (status.id === 3 ? 0 : 1);

    return {
        stdout: fromBase64(raw?.stdout),
        stderr: fromBase64(raw?.stderr),
        compileOutput: fromBase64(raw?.compile_output),
        message: fromBase64(raw?.message),
        status,
        token: raw?.token || '',
        exitCode,
        exitSignal: typeof raw?.exit_signal === 'number' ? raw.exit_signal : null,
        executionTime: Math.round(parseFloat(raw?.time || '0') * 1000),
        wallTime: Math.round(parseFloat(raw?.wall_time || '0') * 1000),
        memoryUsed: raw?.memory || 0,
    };
}

async function executeViaJudge0(
    provider: ResolvedProvider,
    code: string,
    language: string,
    stdin?: string,
    expectedOutput?: string,
): Promise<ExecuteResult> {
    const languageId = LANGUAGE_IDS[language.toLowerCase()];
    if (!languageId) throw new Error(`Unsupported language: ${language}`);

    const base = providerBase(provider);
    const headers = providerHeaders(provider);

    const payload = {
        source_code: toBase64(code),
        language_id: languageId,
        stdin: stdin !== undefined ? toBase64(stdin) : undefined,
        expected_output: expectedOutput !== undefined ? toBase64(expectedOutput) : undefined,
        cpu_time_limit: 5,
        memory_limit: 128000,
    };

    let result: any;

    try {
        const { data } = await axios.post(
            `${base}/submissions?base64_encoded=true&wait=true`,
            payload,
            { headers, timeout: 30000 },
        );
        result = data;
    } catch (error: any) {
        const message = String(error?.response?.data?.error || error?.message || '').toLowerCase();
        if (!message.includes('wait not allowed')) throw error;

        const { data } = await axios.post(
            `${base}/submissions?base64_encoded=true&wait=false`,
            payload,
            { headers, timeout: 30000 },
        );
        result = data;
    }

    if (result?.token) {
        if (!result?.status || result.status.id <= 2) {
            result = await pollJudge0(provider, result.token);
        } else {
            result = await fetchSubmissionResult(provider, result.token);
        }
    }

    if (result?.status?.id <= 2 && result?.token) {
        result = await pollJudge0(provider, result.token);
    }

    return normalizeJudgeResult(result || {});
}

function formatProviderError(error: any): string {
    if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const body = error.response?.data;
        const providerMessage = typeof body === 'string'
            ? body
            : body?.error || body?.message || error.message;

        if (status) {
            return `${providerMessage} (HTTP ${status})`;
        }

        return providerMessage || 'Execution provider request failed.';
    }

    if (error instanceof Error) {
        return error.message;
    }

    return 'Unknown execution error.';
}

async function execute(code: string, language: string, stdin?: string, expectedOutput?: string): Promise<ExecuteResult> {
    const candidates = getProviderCandidates();
    let lastError: any = null;

    for (const provider of candidates) {
        try {
            return await executeViaJudge0(provider, code, language, stdin, expectedOutput);
        } catch (err: any) {
            lastError = err;
            const shouldTryNext = EXECUTOR_PROVIDER === 'auto' && provider !== candidates[candidates.length - 1];
            if (!shouldTryNext) break;
            console.warn(`[execute] Provider ${provider} failed, trying next provider:`, formatProviderError(err));
        }
    }

    throw new Error(`Execution failed: ${formatProviderError(lastError)}`);
}

const runSchema = z.object({
    code: z.string().min(1),
    language: z.string().min(1),
    stdin: z.string().optional(),
});

const runTestsSchema = z.object({
    code: z.string().min(1),
    language: z.string().min(1),
    testCases: z.array(z.object({ input: z.string(), expectedOutput: z.string() })),
});

router.get('/provider', (req, res) => {
    let candidates: ResolvedProvider[] = [];
    let providerError = '';

    try {
        candidates = getProviderCandidates();
    } catch (error: any) {
        providerError = error?.message || 'Provider not configured';
    }

    return sendSuccess(res, {
        configuredProvider: EXECUTOR_PROVIDER,
        activeProvider: candidates[0] || null,
        fallbackChain: candidates,
        baseUrl: candidates[0] === 'rapidapi' ? RAPIDAPI_BASE : candidates[0] === 'self-host' ? SELF_HOST_BASE : null,
        selfHostConfigured: !!SELF_HOST_BASE,
        rapidApiConfigured: !!RAPIDAPI_KEY,
        ...(providerError ? { providerError } : {}),
    });
});

router.post('/', async (req, res, next) => {
    try {
        const { code, language, stdin } = runSchema.parse(req.body);
        const result = await execute(code, language, stdin);
        return sendSuccess(res, result);
    } catch (error: any) {
        if (error?.response?.status === 429) {
            return sendError(res, 429, 'Execution provider rate limit exceeded.');
        }
        next(error);
    }
});

router.post('/run-tests', async (req, res, next) => {
    try {
        const { code, language, testCases } = runTestsSchema.parse(req.body);
        const results = [];

        for (const [index, tc] of testCases.entries()) {
            try {
                const execResult = await execute(code, language, tc.input, tc.expectedOutput);
                const actualOutput = execResult.stdout || '';
                const passed = execResult.status.id === 3 && outputsMatch(actualOutput, tc.expectedOutput);

                const primaryError = execResult.compileOutput || execResult.stderr || execResult.message;

                results.push({
                    testCase: index + 1,
                    passed,
                    executionTime: execResult.executionTime,
                    wallTime: execResult.wallTime,
                    memoryUsed: execResult.memoryUsed,
                    stdout: actualOutput,
                    stderr: execResult.stderr,
                    compileOutput: execResult.compileOutput,
                    message: execResult.message,
                    expectedOutput: tc.expectedOutput,
                    status: execResult.status,
                    exitCode: execResult.exitCode,
                    token: execResult.token,
                    ...(primaryError ? { error: primaryError } : {}),
                });
            } catch (err: any) {
                results.push({
                    testCase: index + 1,
                    passed: false,
                    executionTime: 0,
                    wallTime: 0,
                    memoryUsed: 0,
                    stdout: '',
                    stderr: '',
                    compileOutput: '',
                    message: '',
                    expectedOutput: tc.expectedOutput,
                    status: { id: 13, description: 'Internal Error' },
                    exitCode: 1,
                    token: '',
                    error: err?.message || 'Execution failed',
                });
            }
        }

        const totalPassed = results.filter(r => r.passed).length;
        const totalTests = testCases.length;
        const score = totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0;

        return sendSuccess(res, {
            results,
            summary: {
                passed: totalPassed,
                total: totalTests,
                score,
                status: totalPassed === totalTests ? 'accepted' : 'wrong_answer',
                averageTime: results.length
                    ? Math.round(results.reduce((a, r) => a + (r.executionTime || 0), 0) / results.length)
                    : 0,
                maxMemory: results.length
                    ? results.reduce((max, r) => Math.max(max, r.memoryUsed || 0), 0)
                    : 0,
            },
        });
    } catch (error: any) {
        if (error?.response?.status === 429) {
            return sendError(res, 429, 'Execution provider rate limit exceeded.');
        }
        next(error);
    }
});

router.get('/languages', (req, res) => {
    return sendSuccess(res, [
        { id: 'python', name: 'Python 3.11', extension: 'py' },
        { id: 'javascript', name: 'JavaScript (Node 20)', extension: 'js' },
        { id: 'java', name: 'Java 17', extension: 'java' },
        { id: 'cpp', name: 'C++ 17', extension: 'cpp' },
        { id: 'c', name: 'C 17', extension: 'c' },
        { id: 'typescript', name: 'TypeScript 5.0', extension: 'ts' },
        { id: 'ruby', name: 'Ruby 3.2', extension: 'rb' },
        { id: 'go', name: 'Go 1.21', extension: 'go' },
        { id: 'rust', name: 'Rust 1.75', extension: 'rs' },
    ]);
});

export default router;
