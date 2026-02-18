/**
 * Judge0 Code Execution Service
 * 
 * This service integrates with Judge0 (https://github.com/judge0/judge0)
 * for secure, sandboxed code execution.
 * 
 * Supports both:
 * - Self-hosted Judge0 instance
 * - RapidAPI hosted Judge0 (https://rapidapi.com/judge0-official/api/judge0-ce)
 */

// Judge0 Language IDs
export const JUDGE0_LANGUAGES = {
  python: { id: 71, name: 'Python (3.8.1)', monacoId: 'python' },
  javascript: { id: 63, name: 'JavaScript (Node.js 12.14.0)', monacoId: 'javascript' },
  java: { id: 62, name: 'Java (OpenJDK 13.0.1)', monacoId: 'java' },
  cpp: { id: 54, name: 'C++ (GCC 9.2.0)', monacoId: 'cpp' },
  c: { id: 50, name: 'C (GCC 9.2.0)', monacoId: 'c' },
  typescript: { id: 74, name: 'TypeScript (3.7.4)', monacoId: 'typescript' },
  ruby: { id: 72, name: 'Ruby (2.7.0)', monacoId: 'ruby' },
  go: { id: 60, name: 'Go (1.13.5)', monacoId: 'go' },
  rust: { id: 73, name: 'Rust (1.40.0)', monacoId: 'rust' },
  csharp: { id: 51, name: 'C# (Mono 6.6.0.161)', monacoId: 'csharp' },
} as const;

export type SupportedLanguage = keyof typeof JUDGE0_LANGUAGES;

// Judge0 submission status codes
export const JUDGE0_STATUS = {
  1: { id: 1, description: 'In Queue' },
  2: { id: 2, description: 'Processing' },
  3: { id: 3, description: 'Accepted' },
  4: { id: 4, description: 'Wrong Answer' },
  5: { id: 5, description: 'Time Limit Exceeded' },
  6: { id: 6, description: 'Compilation Error' },
  7: { id: 7, description: 'Runtime Error (SIGSEGV)' },
  8: { id: 8, description: 'Runtime Error (SIGXFSZ)' },
  9: { id: 9, description: 'Runtime Error (SIGFPE)' },
  10: { id: 10, description: 'Runtime Error (SIGABRT)' },
  11: { id: 11, description: 'Runtime Error (NZEC)' },
  12: { id: 12, description: 'Runtime Error (Other)' },
  13: { id: 13, description: 'Internal Error' },
  14: { id: 14, description: 'Exec Format Error' },
} as const;

// Configuration for Judge0 API
interface Judge0Config {
  baseUrl: string;
  apiKey?: string; // Required for RapidAPI
  apiHost?: string; // Required for RapidAPI
  useRapidAPI: boolean;
}

// Default configuration - you can use RapidAPI or self-hosted
const defaultConfig: Judge0Config = {
  // Option 1: Self-hosted Judge0 (uncomment and modify URL)
  // baseUrl: 'http://localhost:2358',
  // useRapidAPI: false,
  
  // Option 2: RapidAPI (free tier available)
  baseUrl: 'https://judge0-ce.p.rapidapi.com',
  useRapidAPI: true,
  apiKey: '', // Add your RapidAPI key here or use environment variable
  apiHost: 'judge0-ce.p.rapidapi.com',
};

// Store config - can be updated at runtime
let currentConfig: Judge0Config = { ...defaultConfig };

// Update Judge0 configuration
export const configureJudge0 = (config: Partial<Judge0Config>) => {
  currentConfig = { ...currentConfig, ...config };
};

// Get current configuration
export const getJudge0Config = () => ({ ...currentConfig });

// Submission request structure
interface SubmissionRequest {
  source_code: string;
  language_id: number;
  stdin?: string;
  expected_output?: string;
  cpu_time_limit?: number; // in seconds
  memory_limit?: number; // in KB
}

// Submission response structure
interface SubmissionResponse {
  token: string;
}

// Submission result structure
export interface Judge0Result {
  token: string;
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  status: {
    id: number;
    description: string;
  };
  time: string | null; // in seconds
  memory: number | null; // in KB
  exit_code: number | null;
}

// Build headers for API requests
const buildHeaders = (): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (currentConfig.useRapidAPI && currentConfig.apiKey) {
    headers['X-RapidAPI-Key'] = currentConfig.apiKey;
    headers['X-RapidAPI-Host'] = currentConfig.apiHost || 'judge0-ce.p.rapidapi.com';
  }

  return headers;
};

// Submit code for execution
export const submitCode = async (
  sourceCode: string,
  language: SupportedLanguage,
  stdin: string = '',
  expectedOutput?: string,
  cpuTimeLimit: number = 5,
  memoryLimit: number = 128000
): Promise<string> => {
  const languageConfig = JUDGE0_LANGUAGES[language];
  if (!languageConfig) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const submission: SubmissionRequest = {
    source_code: btoa(unescape(encodeURIComponent(sourceCode))), // Base64 encode
    language_id: languageConfig.id,
    stdin: stdin ? btoa(unescape(encodeURIComponent(stdin))) : undefined,
    expected_output: expectedOutput ? btoa(unescape(encodeURIComponent(expectedOutput))) : undefined,
    cpu_time_limit: cpuTimeLimit,
    memory_limit: memoryLimit,
  };

  const response = await fetch(`${currentConfig.baseUrl}/submissions?base64_encoded=true&wait=false`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(submission),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to submit code: ${response.status} - ${errorText}`);
  }

  const result: SubmissionResponse = await response.json();
  return result.token;
};

// Get submission result
export const getSubmissionResult = async (token: string): Promise<Judge0Result> => {
  const response = await fetch(
    `${currentConfig.baseUrl}/submissions/${token}?base64_encoded=true&fields=*`,
    {
      method: 'GET',
      headers: buildHeaders(),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get submission result: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  
  // Decode base64 fields
  return {
    ...result,
    stdout: result.stdout ? decodeURIComponent(escape(atob(result.stdout))) : null,
    stderr: result.stderr ? decodeURIComponent(escape(atob(result.stderr))) : null,
    compile_output: result.compile_output ? decodeURIComponent(escape(atob(result.compile_output))) : null,
    message: result.message ? decodeURIComponent(escape(atob(result.message))) : null,
  };
};

// Poll for submission result (with retry logic)
export const pollSubmissionResult = async (
  token: string,
  maxAttempts: number = 20,
  delayMs: number = 1000
): Promise<Judge0Result> => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await getSubmissionResult(token);
    
    // Status 1 = In Queue, Status 2 = Processing
    if (result.status.id > 2) {
      return result;
    }
    
    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  
  throw new Error('Submission timed out - max polling attempts reached');
};

// Execute code and wait for result (convenience function)
export const executeCode = async (
  sourceCode: string,
  language: SupportedLanguage,
  stdin: string = '',
  expectedOutput?: string,
  cpuTimeLimit: number = 5,
  memoryLimit: number = 128000
): Promise<Judge0Result> => {
  const token = await submitCode(sourceCode, language, stdin, expectedOutput, cpuTimeLimit, memoryLimit);
  return pollSubmissionResult(token);
};

// Execute code with multiple test cases
export interface TestCaseInput {
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
  points?: number;
}

export interface TestCaseResult {
  input: string;
  expectedOutput: string;
  actualOutput: string | null;
  passed: boolean;
  error: string | null;
  executionTime: string | null;
  memoryUsed: number | null;
  status: string;
  isHidden?: boolean;
  points?: number;
}

export interface ExecutionSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalTime: number; // in seconds
  maxMemory: number; // in KB
  status: 'accepted' | 'wrong_answer' | 'runtime_error' | 'compilation_error' | 'time_limit' | 'memory_limit';
  results: TestCaseResult[];
}

export const executeWithTestCases = async (
  sourceCode: string,
  language: SupportedLanguage,
  testCases: TestCaseInput[],
  cpuTimeLimit: number = 5,
  memoryLimit: number = 128000
): Promise<ExecutionSummary> => {
  const results: TestCaseResult[] = [];
  let passedTests = 0;
  let totalTime = 0;
  let maxMemory = 0;
  let hasCompilationError = false;
  let hasRuntimeError = false;
  let hasTimeLimit = false;
  let hasMemoryLimit = false;

  for (const testCase of testCases) {
    try {
      const result = await executeCode(
        sourceCode,
        language,
        testCase.input,
        testCase.expectedOutput,
        cpuTimeLimit,
        memoryLimit
      );

      const actualOutput = result.stdout?.trim() || '';
      const expectedTrimmed = testCase.expectedOutput.trim();
      const passed = result.status.id === 3 || actualOutput === expectedTrimmed;

      if (passed) passedTests++;
      
      totalTime += parseFloat(result.time || '0');
      maxMemory = Math.max(maxMemory, result.memory || 0);

      // Check for specific error types
      if (result.status.id === 6) hasCompilationError = true;
      if (result.status.id >= 7 && result.status.id <= 12) hasRuntimeError = true;
      if (result.status.id === 5) hasTimeLimit = true;

      results.push({
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: result.stdout,
        passed,
        error: result.stderr || result.compile_output || result.message,
        executionTime: result.time,
        memoryUsed: result.memory,
        status: result.status.description,
        isHidden: testCase.isHidden,
        points: testCase.points,
      });
    } catch (error) {
      results.push({
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput: null,
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: null,
        memoryUsed: null,
        status: 'Error',
        isHidden: testCase.isHidden,
        points: testCase.points,
      });
    }
  }

  // Determine overall status
  let status: ExecutionSummary['status'] = 'accepted';
  if (hasCompilationError) status = 'compilation_error';
  else if (hasTimeLimit) status = 'time_limit';
  else if (hasMemoryLimit) status = 'memory_limit';
  else if (hasRuntimeError) status = 'runtime_error';
  else if (passedTests < testCases.length) status = 'wrong_answer';

  return {
    totalTests: testCases.length,
    passedTests,
    failedTests: testCases.length - passedTests,
    totalTime,
    maxMemory,
    status,
    results,
  };
};

// Get language boilerplate code
export const getBoilerplate = (language: SupportedLanguage): string => {
  const boilerplates: Record<SupportedLanguage, string> = {
    python: `# Write your Python code here
def solution():
    # Your code here
    pass

# Read input
n = int(input())
print(solution())
`,
    javascript: `// Write your JavaScript code here
function solution() {
    // Your code here
}

// Read input from stdin
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', (line) => {
    console.log(solution(line));
    rl.close();
});
`,
    java: `import java.util.*;

public class Main {
    public static void main(String[] args) {
        Scanner scanner = new Scanner(System.in);
        // Read input
        int n = scanner.nextInt();
        
        // Your code here
        System.out.println(n);
    }
}
`,
    cpp: `#include <iostream>
#include <vector>
#include <string>
using namespace std;

int main() {
    // Read input
    int n;
    cin >> n;
    
    // Your code here
    cout << n << endl;
    
    return 0;
}
`,
    c: `#include <stdio.h>

int main() {
    // Read input
    int n;
    scanf("%d", &n);
    
    // Your code here
    printf("%d\\n", n);
    
    return 0;
}
`,
    typescript: `// Write your TypeScript code here
function solution(input: string): string {
    // Your code here
    return input;
}

// This will be executed with ts-node
const input = require('fs').readFileSync(0, 'utf-8').trim();
console.log(solution(input));
`,
    ruby: `# Write your Ruby code here
def solution(input)
  # Your code here
  input
end

input = gets.chomp
puts solution(input)
`,
    go: `package main

import (
    "fmt"
)

func main() {
    var n int
    fmt.Scan(&n)
    
    // Your code here
    fmt.Println(n)
}
`,
    rust: `use std::io;

fn main() {
    let mut input = String::new();
    io::stdin().read_line(&mut input).unwrap();
    let n: i32 = input.trim().parse().unwrap();
    
    // Your code here
    println!("{}", n);
}
`,
    csharp: `using System;

class Program {
    static void Main() {
        // Read input
        int n = int.Parse(Console.ReadLine());
        
        // Your code here
        Console.WriteLine(n);
    }
}
`,
  };

  return boilerplates[language] || '';
};

// Format execution time
export const formatTime = (seconds: string | null): string => {
  if (!seconds) return '-';
  const ms = parseFloat(seconds) * 1000;
  if (ms < 1) return '< 1ms';
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${parseFloat(seconds).toFixed(2)}s`;
};

// Format memory usage
export const formatMemory = (kb: number | null): string => {
  if (!kb) return '-';
  if (kb < 1024) return `${kb}KB`;
  return `${(kb / 1024).toFixed(1)}MB`;
};

// Check if Judge0 is configured
export const isConfigured = (): boolean => {
  if (currentConfig.useRapidAPI) {
    return !!currentConfig.apiKey;
  }
  return !!currentConfig.baseUrl;
};

// Get status color for UI
export const getStatusColor = (statusId: number): string => {
  if (statusId === 3) return 'text-emerald-400';
  if (statusId === 4) return 'text-amber-400';
  if (statusId === 5) return 'text-orange-400';
  if (statusId === 6) return 'text-red-400';
  if (statusId >= 7 && statusId <= 12) return 'text-red-400';
  return 'text-gray-400';
};

// Get status background color for UI
export const getStatusBgColor = (statusId: number): string => {
  if (statusId === 3) return 'bg-emerald-500/20 border-emerald-500/30';
  if (statusId === 4) return 'bg-amber-500/20 border-amber-500/30';
  if (statusId === 5) return 'bg-orange-500/20 border-orange-500/30';
  if (statusId === 6) return 'bg-red-500/20 border-red-500/30';
  if (statusId >= 7 && statusId <= 12) return 'bg-red-500/20 border-red-500/30';
  return 'bg-gray-500/20 border-gray-500/30';
};

export default {
  JUDGE0_LANGUAGES,
  JUDGE0_STATUS,
  configureJudge0,
  getJudge0Config,
  submitCode,
  getSubmissionResult,
  pollSubmissionResult,
  executeCode,
  executeWithTestCases,
  getBoilerplate,
  formatTime,
  formatMemory,
  isConfigured,
  getStatusColor,
  getStatusBgColor,
};
