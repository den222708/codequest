import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import Editor, { OnMount, useMonaco } from '@monaco-editor/react';
import * as monacoEditor from 'monaco-editor';
import {
  JUDGE0_LANGUAGES,
  SupportedLanguage,
  getBoilerplate,
  TestCaseInput,
} from '../services/judge0Service';
import { useApp } from '../store/AppContext';
import executeService from '../services/executeService';
import { parseErrorsToMarkers } from '../services/errorParser';

interface Props {
  onSubmit: () => void;
  onExit: () => void;
}

interface Problem {
  id: number;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  examples: { input: string; output: string; explanation?: string }[];
  constraints: string[];
  hints: string[];
  testCases: TestCaseInput[];
  boilerplate: Record<SupportedLanguage, string>;
}

interface EditorTestResult {
  passed: boolean;
  executionTime: number;
  wallTime?: number;
  memoryUsed: number;
  input: string;
  expectedOutput: string;
  actualOutput: string;
  error?: string;
  stderr?: string;
  compileOutput?: string;
  message?: string;
  statusId?: number;
  statusDescription?: string;
  exitCode?: number;
  token?: string;
  isHidden?: boolean;
}

interface EditorExecutionSummary {
  status: 'accepted' | 'wrong_answer';
  passedTests: number;
  totalTests: number;
  totalTime: number;
  maxMemory: number;
}

interface ConsoleDiagnostics {
  title: string;
  status?: string;
  statusId?: number;
  exitCode?: number | null;
  token?: string;
  executionTime?: number;
  wallTime?: number;
  memoryUsed?: number;
  stdout?: string;
  stderr?: string;
  compileOutput?: string;
  message?: string;
}

const formatTimeMs = (ms?: number) => `${(((ms || 0) as number) / 1000).toFixed(3)}s`;
const formatMemoryKb = (kb?: number) => (kb ? `${(kb / 1024).toFixed(1)} MB` : '-');
const hasText = (value?: string) => Boolean(value && value.trim().length > 0);
const formatAwayDuration = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
};

const normalizeInputForLookup = (input: string): string => input.trim().replace(/\s+/g, ' ');

const escapeJava = (value: string): string =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');

const escapeCpp = (value: string): string =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');

const buildDemoAnswerCode = (lang: SupportedLanguage, testCases: TestCaseInput[]): string => {
  const pairs = testCases.map((tc) => ({
    key: normalizeInputForLookup(tc.input),
    output: tc.expectedOutput,
  }));

  if (lang === 'python') {
    const mapLines = pairs.map((pair) => `cases[${JSON.stringify(pair.key)}] = ${JSON.stringify(pair.output)}`).join('\n');
    return `import sys

def norm(s: str) -> str:
    return " ".join(s.strip().split())

raw = sys.stdin.read()
key = norm(raw)
cases = {}
${mapLines}

print(cases.get(key, ""), end="")
`;
  }

  if (lang === 'javascript') {
    const mapEntries = pairs.map((pair) => `  ${JSON.stringify(pair.key)}: ${JSON.stringify(pair.output)}`).join(',\n');
    return `const fs = require('fs');

const norm = (s) => s.trim().replace(/\\s+/g, ' ');
const raw = fs.readFileSync(0, 'utf8');
const key = norm(raw);

const cases = {
${mapEntries}
};

process.stdout.write(cases[key] ?? '');
`;
  }

  if (lang === 'java') {
    const putLines = pairs.map((pair) => `        cases.put("${escapeJava(pair.key)}", "${escapeJava(pair.output)}");`).join('\n');
    return `import java.io.*;
import java.util.*;

public class Main {
    static String norm(String s) {
        return s.trim().replaceAll("\\\\s+", " ");
    }

    public static void main(String[] args) throws Exception {
        String raw = new String(System.in.readAllBytes());
        String key = norm(raw);

        Map<String, String> cases = new HashMap<>();
${putLines}

        System.out.print(cases.getOrDefault(key, ""));
    }
}
`;
  }

  if (lang === 'cpp') {
    const entries = pairs.map((pair) => `        {"${escapeCpp(pair.key)}", "${escapeCpp(pair.output)}"}`).join(',\n');
    return `#include <bits/stdc++.h>
using namespace std;

string norm(const string& s) {
    string token, out;
    stringstream ss(s);
    while (ss >> token) {
        if (!out.empty()) out += " ";
        out += token;
    }
    return out;
}

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    string raw((istreambuf_iterator<char>(cin)), istreambuf_iterator<char>());
    string key = norm(raw);

    unordered_map<string, string> cases = {
${entries}
    };

    auto it = cases.find(key);
    if (it != cases.end()) cout << it->second;
    return 0;
}
`;
  }

  return '';
};

const getLanguageLabel = (lang: SupportedLanguage): string => {
  const labels: Record<string, string> = {
    python: 'Python',
    javascript: 'JavaScript',
    java: 'Java',
    cpp: 'C++',
    c: 'C',
    typescript: 'TypeScript',
    ruby: 'Ruby',
    go: 'Go',
    rust: 'Rust',
    csharp: 'C#',
  };
  return labels[lang] || lang;
};

// Sample problem data
const sampleProblem: Problem = {
  id: 2,
  title: 'Two Sum',
  difficulty: 'Easy',
  description: `Given an array of integers <code>nums</code> and an integer <code>target</code>, return <em>indices of the two numbers such that they add up to target</em>.

You may assume that each input would have <strong>exactly one solution</strong>, and you may not use the same element twice.

You can return the answer in any order.`,
  examples: [
    {
      input: 'nums = [2,7,11,15], target = 9',
      output: '[0,1]',
      explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
    },
    {
      input: 'nums = [3,2,4], target = 6',
      output: '[1,2]',
    },
    {
      input: 'nums = [3,3], target = 6',
      output: '[0,1]',
    },
  ],
  constraints: [
    '2 <= nums.length <= 10^4',
    '-10^9 <= nums[i] <= 10^9',
    '-10^9 <= target <= 10^9',
    'Only one valid answer exists.',
  ],
  hints: [
    'A hash map can store value -> index while scanning once.',
    'For each value x, check if target - x already exists in the map.',
    'Aim for O(n) time and O(n) space.',
  ],
  testCases: [
    { input: '4\n2 7 11 15\n9', expectedOutput: '0 1', points: 10 },
    { input: '3\n3 2 4\n6', expectedOutput: '1 2', points: 10 },
    { input: '2\n3 3\n6', expectedOutput: '0 1', points: 10 },
    { input: '5\n1 5 3 7 2\n8', expectedOutput: '0 3', points: 10, isHidden: true },
    { input: '6\n-1 -2 -3 -4 -5 -6\n-8', expectedOutput: '1 4', points: 10, isHidden: true },
  ],
  boilerplate: {
    python: `def two_sum(nums, target):
    """
    :type nums: List[int]
    :type target: int
    :rtype: List[int]
    """
    # Write your code here
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []

# Read input
n = int(input())
nums = list(map(int, input().split()))
target = int(input())

# Get result and print
result = two_sum(nums, target)
print(result[0], result[1])
`,
    javascript: `function twoSum(nums, target) {
    // Write your code here
    const seen = {};
    for (let i = 0; i < nums.length; i++) {
        const complement = target - nums[i];
        if (complement in seen) {
            return [seen[complement], i];
        }
        seen[nums[i]] = i;
    }
    return [];
}

// Read input
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const lines = [];
rl.on('line', (line) => lines.push(line));
rl.on('close', () => {
    const n = parseInt(lines[0]);
    const nums = lines[1].split(' ').map(Number);
    const target = parseInt(lines[2]);
    const result = twoSum(nums, target);
    console.log(result[0], result[1]);
});
`,
    java: `import java.util.*;

public class Main {
    public static int[] twoSum(int[] nums, int target) {
        // Write your code here
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            int complement = target - nums[i];
            if (seen.containsKey(complement)) {
                return new int[]{seen.get(complement), i};
            }
            seen.put(nums[i], i);
        }
        return new int[]{};
    }
    
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) {
            nums[i] = sc.nextInt();
        }
        int target = sc.nextInt();
        int[] result = twoSum(nums, target);
        System.out.println(result[0] + " " + result[1]);
    }
}
`,
    cpp: `#include <iostream>
#include <vector>
#include <unordered_map>
using namespace std;

vector<int> twoSum(vector<int>& nums, int target) {
    // Write your code here
    unordered_map<int, int> seen;
    for (int i = 0; i < nums.size(); i++) {
        int complement = target - nums[i];
        if (seen.find(complement) != seen.end()) {
            return {seen[complement], i};
        }
        seen[nums[i]] = i;
    }
    return {};
}

int main() {
    int n;
    cin >> n;
    vector<int> nums(n);
    for (int i = 0; i < n; i++) {
        cin >> nums[i];
    }
    int target;
    cin >> target;
    vector<int> result = twoSum(nums, target);
    cout << result[0] << " " << result[1] << endl;
    return 0;
}
`,
    c: getBoilerplate('c'),
    typescript: getBoilerplate('typescript'),
    ruby: getBoilerplate('ruby'),
    go: getBoilerplate('go'),
    rust: getBoilerplate('rust'),
    csharp: getBoilerplate('csharp'),
  },
};

const CodeEditor: React.FC<Props> = ({ onSubmit, onExit }) => {
  const {
    currentAssessment,
    currentQuestionIndex,
    setCurrentQuestionIndex,
    submitCode,
    isDemoMode,
  } = useApp();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [language, setLanguage] = useState<SupportedLanguage>('python');
  const [code, setCode] = useState(getBoilerplate('python'));
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'solutions'>('description');
  const [outputTab, setOutputTab] = useState<'results' | 'console'>('results');
  const [testResults, setTestResults] = useState<EditorTestResult[]>([]);
  const [executionSummary, setExecutionSummary] = useState<EditorExecutionSummary | null>(null);
  const [consoleDiagnostics, setConsoleDiagnostics] = useState<ConsoleDiagnostics | null>(null);
  const [consoleOutput, setConsoleOutput] = useState<string>('');
  const [customInput, setCustomInput] = useState('');
  const [useCustomInput, setUseCustomInput] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(45 * 60); // 45 minutes
  const [fontSize, setFontSize] = useState(14);
  const [theme, setTheme] = useState<'vs-dark' | 'light'>('light');
  const [problemSidebarCollapsed, setProblemSidebarCollapsed] = useState(false);
  const [problemSidebarWidth, setProblemSidebarWidth] = useState<number>(() => Number(localStorage.getItem('cq_editor_problem_sidebar_width')) || 256);
  const [descriptionWidth, setDescriptionWidth] = useState<number>(() => Number(localStorage.getItem('cq_editor_description_width')) || 400);
  const [outputHeight, setOutputHeight] = useState<number>(() => Number(localStorage.getItem('cq_editor_output_height')) || 220);
  const [isDraggingLayout, setIsDraggingLayout] = useState(false);
  const [securityViolations, setSecurityViolations] = useState(0);
  const [securityWarningOpen, setSecurityWarningOpen] = useState(false);
  const [securityWarningText, setSecurityWarningText] = useState('');
  const [awaySeconds, setAwaySeconds] = useState(0);
  const [lastAwaySeconds, setLastAwaySeconds] = useState(0);
  const [awayPopupOpen, setAwayPopupOpen] = useState(false);
  const [editorMarkers, setEditorMarkers] = useState<monacoEditor.editor.IMarkerData[]>([]);
  const [sessionExpired, setSessionExpired] = useState(false);

  const editorRef = useRef<monacoEditor.editor.IStandaloneCodeEditor | null>(null);
  const workspaceRef = useRef<HTMLDivElement | null>(null);
  const editorColumnRef = useRef<HTMLDivElement | null>(null);
  const violationTimerRef = useRef<number | null>(null);
  const lastViolationAtRef = useRef(0);
  const securityGraceUntilRef = useRef(0);
  const fullscreenRequestInProgressRef = useRef(false);
  const awayStartRef = useRef<number | null>(null);
  const monaco = useMonaco();

  const setSecurityGraceWindow = useCallback((durationMs = 1400) => {
    securityGraceUntilRef.current = Date.now() + durationMs;
  }, []);

  const handleExitAssessment = async () => {
    if (document.fullscreenElement && document.exitFullscreen) {
      try {
        await document.exitFullscreen();
      } catch (error) {
        console.warn('Exit fullscreen failed:', error);
      }
    }
    onExit();
  };

  const handleAcknowledgeSecurityWarning = async () => {
    if (securityEnabled && !document.fullscreenElement) {
      await requestSecureFullscreen();
      if (!document.fullscreenElement) {
        setSecurityWarningText('Fullscreen is required. Please allow fullscreen and try again.');
        setSecurityWarningOpen(true);
        return;
      }
    }

    setSecurityWarningOpen(false);
    setAwayPopupOpen(false);
  };

  const beginAwayTracking = useCallback(() => {
    if (awayStartRef.current !== null) return;
    awayStartRef.current = Date.now();
  }, []);

  const endAwayTracking = useCallback(() => {
    if (awayStartRef.current === null) return;

    const elapsed = Math.max(1, Math.round((Date.now() - awayStartRef.current) / 1000));
    awayStartRef.current = null;
    setLastAwaySeconds(elapsed);
    setAwaySeconds(prev => prev + elapsed);
    setSecurityWarningText(`You were away from the assessment window for ${formatAwayDuration(elapsed)}.`);
    setAwayPopupOpen(true);
  }, []);

  const assessmentProblems = useMemo<Problem[]>(() => {
    if (!currentAssessment?.questions?.length) return [];
    return currentAssessment.questions.map((q, idx) => ({
      id: idx + 1,
      title: q.title,
      difficulty: q.difficulty === 'hard' ? 'Hard' : q.difficulty === 'medium' ? 'Medium' : 'Easy',
      description: q.description,
      examples: (q.testCases || []).filter(tc => !tc.isHidden).slice(0, 2).map(tc => ({
        input: tc.input,
        output: tc.expectedOutput,
      })),
      constraints: q.hints?.length
        ? q.hints
        : [
            `Time Limit: ${q.timeLimit || 5}s`,
            `Memory Limit: ${q.memoryLimit || 256} MB`,
            `Max Score: ${q.points || 100}`,
          ],
      hints: q.hints || [
        'Break the problem into smaller steps and validate each step.',
        'Start with visible test cases before hidden test cases.',
      ],
      testCases: (q.testCases || []).map(tc => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        points: tc.points,
        isHidden: tc.isHidden,
      })),
      boilerplate: {
        python: q.boilerplateCode?.python || getBoilerplate('python'),
        javascript: q.boilerplateCode?.javascript || getBoilerplate('javascript'),
        java: q.boilerplateCode?.java || getBoilerplate('java'),
        cpp: q.boilerplateCode?.cpp || getBoilerplate('cpp'),
        c: getBoilerplate('c'),
        typescript: getBoilerplate('typescript'),
        ruby: getBoilerplate('ruby'),
        go: getBoilerplate('go'),
        rust: getBoilerplate('rust'),
        csharp: getBoilerplate('csharp'),
      },
    }));
  }, [currentAssessment]);

  const activeProblem = assessmentProblems[currentQuestionIndex] || null;
  const activeQuestionId = activeProblem ? currentAssessment?.questions?.[currentQuestionIndex]?.id : undefined;
  const securityEnabled = isDemoMode || !!currentAssessment?.settings?.proctoring;

  const requestSecureFullscreen = useCallback(async () => {
    if (!securityEnabled || document.fullscreenElement || !document.documentElement.requestFullscreen) return;
    setSecurityGraceWindow(1800);
    fullscreenRequestInProgressRef.current = true;
    try {
      await document.documentElement.requestFullscreen();
    } catch (error) {
      console.warn('Fullscreen request failed:', error);
    } finally {
      window.setTimeout(() => {
        fullscreenRequestInProgressRef.current = false;
      }, 150);
    }
  }, [securityEnabled, setSecurityGraceWindow]);

  const reportSecurityViolation = useCallback((message: string) => {
    const now = Date.now();
    if (fullscreenRequestInProgressRef.current) return;
    if (now < securityGraceUntilRef.current) return;
    if (now - lastViolationAtRef.current < 900) return;
    lastViolationAtRef.current = now;

    setSecurityViolations(prev => prev + 1);
    setSecurityWarningText(message);
    setSecurityWarningOpen(true);

    if (violationTimerRef.current) {
      window.clearTimeout(violationTimerRef.current);
    }
    violationTimerRef.current = window.setTimeout(() => {
      // timer kept for cleanup
    }, 3000);
  }, []);

  useEffect(() => {
    if (!securityEnabled) return;

    let mounted = true;
    setSecurityGraceWindow(1800);

    (async () => {
      await requestSecureFullscreen();
      if (mounted && !document.fullscreenElement) {
        setSecurityWarningText('Fullscreen is required before continuing this assessment.');
        setSecurityWarningOpen(true);
      }
    })();

    const onFullscreenChange = () => {
      if (document.fullscreenElement) {
        setSecurityGraceWindow(900);
        return;
      }

      if (!document.fullscreenElement) {
        reportSecurityViolation('Fullscreen exited. Return to fullscreen for secure demo mode.');
      }
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        beginAwayTracking();
        reportSecurityViolation('Tab switch detected. Stay on the assessment window.');
      } else {
        endAwayTracking();
      }
    };

    const onBlur = () => {
      beginAwayTracking();
      reportSecurityViolation('Window focus lost. Stay in the active assessment tab.');
    };

    const onFocus = () => {
      endAwayTracking();
    };

    const blockClipboard = (event: Event) => {
      event.preventDefault();
      reportSecurityViolation('Copy, paste, and context menu are disabled in secure demo mode.');
    };

    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    document.addEventListener('copy', blockClipboard);
    document.addEventListener('cut', blockClipboard);
    document.addEventListener('paste', blockClipboard);
    document.addEventListener('contextmenu', blockClipboard);

    return () => {
      mounted = false;
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('copy', blockClipboard);
      document.removeEventListener('cut', blockClipboard);
      document.removeEventListener('paste', blockClipboard);
      document.removeEventListener('contextmenu', blockClipboard);
    };
  }, [
    securityEnabled,
    requestSecureFullscreen,
    reportSecurityViolation,
    setSecurityGraceWindow,
    beginAwayTracking,
    endAwayTracking,
  ]);

  useEffect(() => {
    if (!securityEnabled || securityViolations < 3) return;
    setSecurityWarningOpen(true);
  }, [securityEnabled, securityViolations]);

  useEffect(() => {
    localStorage.setItem('cq_editor_problem_sidebar_width', String(problemSidebarWidth));
  }, [problemSidebarWidth]);

  useEffect(() => {
    localStorage.setItem('cq_editor_description_width', String(descriptionWidth));
  }, [descriptionWidth]);

  useEffect(() => {
    localStorage.setItem('cq_editor_output_height', String(outputHeight));
  }, [outputHeight]);

  useEffect(() => {
    if (currentAssessment?.id) {
      setProblemSidebarCollapsed(true);
    }
  }, [currentAssessment?.id]);

  useEffect(() => {
    return () => {
      if (violationTimerRef.current) {
        window.clearTimeout(violationTimerRef.current);
      }

      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => undefined);
      }
    };
  }, []);

  // Listen for session expiry during assessment
  useEffect(() => {
    const handler = () => setSessionExpired(true);
    window.addEventListener('cq:session-expired', handler);
    return () => window.removeEventListener('cq:session-expired', handler);
  }, []);

  const startResize = (type: 'sidebar' | 'description' | 'output', e: React.MouseEvent) => {
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    const initialSidebarWidth = problemSidebarWidth;
    const initialDescriptionWidth = descriptionWidth;
    const initialOutputHeight = outputHeight;

    setIsDraggingLayout(true);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = type === 'output' ? 'row-resize' : 'col-resize';

    const onMouseMove = (event: MouseEvent) => {
      if (type === 'sidebar' && !problemSidebarCollapsed) {
        const next = Math.min(420, Math.max(180, initialSidebarWidth + (event.clientX - startX)));
        setProblemSidebarWidth(next);
        return;
      }

      if (type === 'description') {
        const workspaceWidth = workspaceRef.current?.clientWidth || 1200;
        const max = Math.max(420, workspaceWidth - 420);
        const next = Math.min(max, Math.max(300, initialDescriptionWidth + (event.clientX - startX)));
        setDescriptionWidth(next);
        return;
      }

      const editorHeight = editorColumnRef.current?.clientHeight || 700;
      const max = Math.max(260, editorHeight - 220);
      const next = Math.min(max, Math.max(150, initialOutputHeight - (event.clientY - startY)));
      setOutputHeight(next);
    };

    const onMouseUp = () => {
      setIsDraggingLayout(false);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  useEffect(() => {
    if (currentQuestionIndex >= assessmentProblems.length) {
      setCurrentQuestionIndex(0);
    }
  }, [assessmentProblems.length, currentQuestionIndex, setCurrentQuestionIndex]);

  // Timer effect
  useEffect(() => {
    setTimeRemaining((currentAssessment?.duration || 45) * 60);
  }, [currentAssessment?.id]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (timeRemaining !== 0) return;
    setConsoleOutput('Time limit reached. Submitting assessment...');
    setOutputTab('console');
    const timeout = window.setTimeout(() => onSubmit(), 1000);
    return () => window.clearTimeout(timeout);
  }, [timeRemaining, onSubmit]);

  // Format time display
  const formatTimeDisplay = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle editor mount
  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
    editor.focus();
  };

  // Handle language change
  const handleLanguageChange = (newLanguage: SupportedLanguage) => {
    setLanguage(newLanguage);
    setEditorMarkers([]);
    if (!activeProblem) {
      setCode(getBoilerplate(newLanguage));
      return;
    }

    setCode(activeProblem.boilerplate[newLanguage] || getBoilerplate(newLanguage));
  };

  const handleLoadDemoAnswer = () => {
    if (!activeProblem) {
      setConsoleDiagnostics(null);
      setConsoleOutput('No active question found. Please restart the assessment and try again.');
      setOutputTab('console');
      return;
    }

    const supported: SupportedLanguage[] = ['python', 'javascript', 'java', 'cpp'];
    const targetLanguage: SupportedLanguage = supported.includes(language) ? language : 'python';
    const generated = buildDemoAnswerCode(targetLanguage, activeProblem.testCases);

    if (!generated) {
      setConsoleOutput('Could not generate demo answer for this question.');
      setOutputTab('console');
      return;
    }

    if (targetLanguage !== language) {
      setLanguage(targetLanguage);
    }

    setCode(generated);
    setConsoleOutput(
      `Loaded correct demo answer in ${targetLanguage}.\n` +
      `Use Run or Submit to verify compilation and test-case checks.${
        targetLanguage !== language ? `\nLanguage switched to ${targetLanguage} for demo compatibility.` : ''
      }`
    );
    setOutputTab('console');
  };

  useEffect(() => {
    setEditorMarkers([]);
    if (!activeProblem) {
      setCode(getBoilerplate(language));
      return;
    }

    setCode(activeProblem.boilerplate[language] || getBoilerplate(language));
  }, [activeProblem?.id, language]);

  useEffect(() => {
    if (theme !== 'light') setTheme('light');
  }, [theme]);

  // Configure Monaco JS/TS live diagnostics (squiggles while typing)
  useEffect(() => {
    if (!monaco) return;
    // @ts-expect-error -- monaco.languages.typescript is available at runtime
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
      noSuggestionDiagnostics: false,
    });
    // @ts-expect-error -- monaco.languages.typescript is available at runtime
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      lib: ['es2020'],
      allowNonTsExtensions: true,
    });
    // @ts-expect-error -- monaco.languages.typescript is available at runtime
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });
  }, [monaco]);

  // Apply post-execution error markers to Monaco editor
  useEffect(() => {
    if (!monaco) return;
    const model = editorRef.current?.getModel();
    if (!model) return;
    monaco.editor.setModelMarkers(model, 'judge0', editorMarkers);
  }, [editorMarkers, monaco]);

  // Run code against visible test cases
  const handleRunCode = async () => {
    if (!activeProblem) {
      setConsoleDiagnostics(null);
      setConsoleOutput('No active question loaded. Please return to instructions and start again.');
      setOutputTab('console');
      return;
    }

    setIsRunning(true);
    setTestResults([]);
    setExecutionSummary(null);
    setConsoleDiagnostics(null);
    setConsoleOutput('Running code...\n');
    setOutputTab('results');

    try {
      if (useCustomInput) {
        const result = await executeService.runCode(code, language, customInput);

        setConsoleDiagnostics({
          title: 'Custom Input Run',
          status: result.status?.description || (result.exitCode === 0 ? 'Accepted' : 'Error'),
          statusId: result.status?.id,
          executionTime: result.executionTime,
          wallTime: result.wallTime,
          memoryUsed: result.memoryUsed,
          exitCode: result.exitCode,
          token: result.token,
          stdout: result.stdout,
          stderr: result.stderr,
          compileOutput: result.compileOutput,
          message: result.message,
        });
        setEditorMarkers(
          parseErrorsToMarkers(
            { stderr: result.stderr, compileOutput: result.compileOutput, statusId: result.status?.id },
            language
          )
        );
        setConsoleOutput('Custom run completed.');
        setOutputTab('console');
      } else {
        // Run against visible test cases
        const visibleTests = activeProblem.testCases.filter(tc => !tc.isHidden);
        const run = await executeService.runTests(
          code,
          language,
          visibleTests.map(tc => ({ input: tc.input, expectedOutput: tc.expectedOutput }))
        );
        const mappedResults: EditorTestResult[] = run.results.map((r, idx) => ({
          passed: r.passed,
          executionTime: r.executionTime,
          wallTime: r.wallTime,
          memoryUsed: r.memoryUsed,
          input: visibleTests[idx]?.input || '',
          expectedOutput: r.expectedOutput || visibleTests[idx]?.expectedOutput || '',
          actualOutput: r.stdout || '',
          error: r.error,
          stderr: r.stderr,
          compileOutput: r.compileOutput,
          message: r.message,
          statusId: r.status?.id,
          statusDescription: r.status?.description,
          exitCode: r.exitCode,
          token: r.token,
          isHidden: visibleTests[idx]?.isHidden,
        }));
        const summary: EditorExecutionSummary = {
          status: run.summary.passed === run.summary.total ? 'accepted' : 'wrong_answer',
          passedTests: run.summary.passed,
          totalTests: run.summary.total,
          totalTime: mappedResults.reduce((sum, r) => sum + (r.executionTime || 0), 0) / 1000,
          maxMemory: run.summary.maxMemory || Math.max(...mappedResults.map(r => r.memoryUsed || 0), 0),
        };

        const diagnosticCase = mappedResults.find(r =>
          hasText(r.compileOutput) || hasText(r.stderr) || hasText(r.message) || hasText(r.error)
        );

        // Parse error markers from all test results and apply to editor
        const allMarkers = mappedResults.flatMap((r) =>
          parseErrorsToMarkers(
            { stderr: r.stderr, compileOutput: r.compileOutput, error: r.error, statusId: r.statusId },
            language
          )
        );
        const uniqueMarkers = allMarkers.filter(
          (m, i, arr) =>
            i === arr.findIndex((o) => o.startLineNumber === m.startLineNumber && o.message === m.message)
        );
        setEditorMarkers(uniqueMarkers);

        setExecutionSummary(summary);
        setTestResults(mappedResults);
        setConsoleDiagnostics({
          title: 'Visible Test Run',
          status: run.summary.status === 'accepted' ? 'Accepted' : 'Wrong Answer',
          executionTime: Math.round(summary.totalTime * 1000),
          memoryUsed: summary.maxMemory,
          token: diagnosticCase?.token,
          stdout: diagnosticCase?.actualOutput,
          stderr: diagnosticCase?.stderr,
          compileOutput: diagnosticCase?.compileOutput,
          message: diagnosticCase?.message || diagnosticCase?.error,
          exitCode: diagnosticCase?.exitCode,
          statusId: diagnosticCase?.statusId,
        });
        setConsoleOutput(
          `Executed ${summary.totalTests} test cases\n` +
          `Passed: ${summary.passedTests}/${summary.totalTests}\n` +
          `Total Time: ${summary.totalTime.toFixed(3)}s\n` +
          `Max Memory: ${formatMemoryKb(summary.maxMemory)}`
        );
      }
    } catch (error) {
      setConsoleDiagnostics(null);
      setConsoleOutput(`Run Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setOutputTab('console');
    } finally {
      setIsRunning(false);
    }
  };

  // Submit code against all test cases
  const handleSubmitCode = async () => {
    if (!activeProblem) {
      setConsoleDiagnostics(null);
      setConsoleOutput('No active question loaded. Please return to instructions and start again.');
      setOutputTab('console');
      return;
    }

    setIsSubmitting(true);
    setTestResults([]);
    setExecutionSummary(null);
    setConsoleDiagnostics(null);
    setConsoleOutput('Submitting code...\n');
    setOutputTab('results');

    try {
      if (!activeQuestionId) {
        throw new Error('No active question selected for submission.');
      }

      const savedSubmission = await submitCode(activeQuestionId, code, language);
      const mappedResults: EditorTestResult[] = (savedSubmission.testResults || []).map((r, idx) => ({
        passed: r.passed,
        executionTime: r.executionTime,
        memoryUsed: r.memoryUsed,
        input: activeProblem.testCases[idx]?.input || '',
        expectedOutput: r.expectedOutput || '',
        actualOutput: r.actualOutput || '',
        error: r.error,
        isHidden: activeProblem.testCases[idx]?.isHidden,
      }));

      const passedTests = mappedResults.filter(r => r.passed).length;
      const totalTests = mappedResults.length || 1;
      const summary: EditorExecutionSummary = {
        status: passedTests === totalTests ? 'accepted' : 'wrong_answer',
        passedTests,
        totalTests,
        totalTime: (mappedResults.reduce((sum, r) => sum + (r.executionTime || 0), 0) || savedSubmission.executionTime || 0) / 1000,
        maxMemory: Math.max(...mappedResults.map(r => r.memoryUsed || 0), savedSubmission.memoryUsed || 0),
      };

      // Parse error markers from submit results
      const submitMarkers = mappedResults.flatMap((r) =>
        parseErrorsToMarkers({ error: r.error, statusId: r.passed ? 3 : undefined }, language)
      );
      const uniqueSubmitMarkers = submitMarkers.filter(
        (m, i, arr) =>
          i === arr.findIndex((o) => o.startLineNumber === m.startLineNumber && o.message === m.message)
      );
      setEditorMarkers(uniqueSubmitMarkers);

      setExecutionSummary(summary);
      setTestResults(mappedResults);

      const submissionLabel = summary.status === 'accepted' ? 'Accepted' : 'Wrong Answer';

      const firstDiagnostic = mappedResults.find(r => hasText(r.error));
      setConsoleDiagnostics({
        title: 'Submission Run',
        status: submissionLabel,
        executionTime: Math.round(summary.totalTime * 1000),
        memoryUsed: summary.maxMemory,
        message: firstDiagnostic?.error,
      });

      setConsoleOutput(
        `Submission Complete!\n\n` +
        `Status: ${submissionLabel}\n` +
        `Test Cases: ${summary.passedTests}/${summary.totalTests} passed\n` +
        `Total Time: ${summary.totalTime.toFixed(3)}s\n` +
        `Max Memory: ${formatMemoryKb(summary.maxMemory)}`
      );

      setTimeout(() => onSubmit(), 1200);
    } catch (error) {
      setConsoleDiagnostics(null);
      setConsoleOutput(`Submission Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setOutputTab('console');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-emerald-400';
      case 'Medium': return 'text-amber-400';
      case 'Hard': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const renderConsoleSection = (label: string, value?: string, tone: 'normal' | 'error' | 'warn' = 'normal') => {
    if (!hasText(value)) return null;

    const toneClass =
      tone === 'error' ? 'text-red-700 bg-red-50 border-red-200' :
      tone === 'warn' ? 'text-amber-800 bg-amber-50 border-amber-200' :
      'text-slate-800 bg-slate-50 border-slate-200';

    return (
      <div className={`rounded border p-3 ${toneClass}`}>
        <p className="text-[11px] font-semibold uppercase tracking-wider mb-2">{label}</p>
        <pre className="text-xs font-mono whitespace-pre-wrap break-words">{value}</pre>
      </div>
    );
  };

  if (!activeProblem) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-900 p-6">
        <div className="max-w-lg w-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold mb-2">No Active Question Loaded</h2>
          <p className="text-sm text-slate-600 mb-5">
            The assessment question data is unavailable right now. Restart the demo assessment session and try again.
          </p>
          <button
            onClick={handleExitAssessment}
            className="inline-flex items-center gap-2 px-4 py-2 rounded bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Exit Assessment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden ${isDraggingLayout ? 'select-none' : ''}`}>
      {/* Left Sidebar - Problem List */}
      <aside
        style={{ width: problemSidebarCollapsed ? 64 : problemSidebarWidth }}
        className="relative bg-white border-r border-slate-200 flex flex-col shrink-0 transition-[width] duration-200"
      >
        <div className="p-3 border-b border-slate-200">
          <div className="flex items-center justify-between">
            {!problemSidebarCollapsed && <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Problems</h2>}
            <button
              onClick={() => setProblemSidebarCollapsed(prev => !prev)}
              className="w-7 h-7 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 flex items-center justify-center"
              title={problemSidebarCollapsed ? 'Expand questions' : 'Collapse questions'}
            >
              <span className="material-symbols-outlined text-[18px]">
                {problemSidebarCollapsed ? 'chevron_right' : 'chevron_left'}
              </span>
            </button>
          </div>
          {!problemSidebarCollapsed && (
            <>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2">
                <div className="bg-teal-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, Math.round(((currentQuestionIndex + 1) / Math.max(assessmentProblems.length, 1)) * 100))}%` }}></div>
              </div>
              <p className="text-xs text-right text-slate-500 mt-1">{currentQuestionIndex + 1}/{assessmentProblems.length}</p>
            </>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {assessmentProblems.map((prob, idx) => (
            <button
              key={prob.title}
              onClick={() => setCurrentQuestionIndex(idx)}
              className={`w-full flex items-center ${problemSidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-3 rounded-lg text-left transition-colors ${
                idx === currentQuestionIndex
                  ? 'bg-teal-500/10 border-l-2 border-teal-500 text-white'
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
              title={problemSidebarCollapsed ? prob.title : undefined}
            >
              <div
                className={`size-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                  idx === currentQuestionIndex
                    ? 'bg-teal-500 text-white border-none'
                    : 'border-slate-300 text-slate-500'
                }`}
              >
                {idx === currentQuestionIndex ? (
                  <span className="material-symbols-outlined text-[14px]">edit</span>
                ) : (
                  idx + 1
                )}
              </div>
              {!problemSidebarCollapsed && <span className="text-sm font-medium truncate flex-1">{prob.title}</span>}
              {!problemSidebarCollapsed && idx === currentQuestionIndex && (
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${getDifficultyColor(prob.difficulty)} bg-emerald-500/10`}>
                  {prob.difficulty}
                </span>
              )}
            </button>
          ))}
        </nav>

        {!problemSidebarCollapsed && (
          <div
            onMouseDown={(e) => startResize('sidebar', e)}
            className="absolute top-0 right-0 h-full w-1 cursor-col-resize hover:bg-teal-500/40"
            title="Resize question list"
          />
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Top Bar */}
        <header className="h-12 border-b border-slate-200 bg-white flex items-center justify-between px-4 shrink-0 z-10">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
                <span className="text-sm font-bold">&lt;/&gt;</span>
              </div>
              <span className="text-sm font-bold">CodeQuest Assessment</span>
            </div>
            {securityEnabled && (
              <span className="hidden md:inline-flex items-center gap-1 px-2 py-1 text-[11px] rounded bg-emerald-100 text-emerald-700 border border-emerald-300">
                <span className="material-symbols-outlined text-[14px]">verified_user</span>
                Secure Demo
              </span>
            )}
          </div>
          
          {/* Timer */}
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 bg-slate-100 px-4 py-1.5 rounded-full border border-slate-300">
            <span className="material-symbols-outlined text-teal-400 text-[18px]">timer</span>
            <span className={`font-mono font-bold tracking-widest ${timeRemaining < 300 ? 'text-red-400' : ''}`}>
              {formatTimeDisplay(timeRemaining)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-slate-100 text-slate-600 text-sm transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">settings</span>
            </button>
            <button
              onClick={handleExitAssessment}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-medium rounded transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Exit
            </button>
          </div>
        </header>

        {/* Workspace Split */}
        <div ref={workspaceRef} className="flex-1 flex overflow-hidden">
          {/* Problem Description */}
          <section
            style={{ width: descriptionWidth }}
            className="min-w-[300px] border-r border-slate-200 bg-white flex flex-col"
          >
            <div className="flex items-center border-b border-slate-200 bg-slate-50">
              <button
                onClick={() => setActiveTab('description')}
                className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === 'description'
                    ? 'text-slate-900 border-b-2 border-teal-500 bg-white'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Description
              </button>
              <button
                onClick={() => setActiveTab('solutions')}
                className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === 'solutions'
                    ? 'text-slate-900 border-b-2 border-teal-500 bg-white'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Solutions
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              {activeTab === 'description' ? (
                <>
                  <div>
                    <h2 className="text-xl font-bold mb-2">{activeProblem.id}. {activeProblem.title}</h2>
                    <div className="flex gap-3 text-sm">
                      <span className={getDifficultyColor(activeProblem.difficulty)}>{activeProblem.difficulty}</span>
                      <span className="text-slate-500">|</span>
                      <span className="text-slate-600">{activeProblem.testCases.reduce((sum, tc) => sum + (tc.points || 0), 0)} Points</span>
                    </div>
                  </div>

                  <div className="text-slate-700 whitespace-pre-wrap text-sm leading-6">
                    {activeProblem.description.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')}
                  </div>

                  {activeProblem.examples.map((example, idx) => (
                    <div key={idx} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                      <p className="text-xs font-bold text-slate-500 uppercase mb-3">Example {idx + 1}</p>
                      <div className="space-y-2 font-mono text-sm">
                        <p>
                          <span className="text-teal-400">Input:</span>{' '}
                          <span className="text-slate-700 whitespace-pre-wrap">{example.input}</span>
                        </p>
                        <p>
                          <span className="text-teal-400">Output:</span>{' '}
                          <span className="text-slate-700 whitespace-pre-wrap">{example.output}</span>
                        </p>
                        {example.explanation && (
                          <p className="text-slate-500 text-xs mt-2">
                            <span className="text-slate-500">Explanation:</span> {example.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}

                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">Constraints</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-slate-600 font-mono">
                      {activeProblem.constraints.map((constraint, idx) => (
                        <li key={idx}>{constraint}</li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">Hints</p>
                    <div className="space-y-2">
                      {activeProblem.hints.map((hint, idx) => (
                        <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm text-slate-700">
                          <span className="text-teal-400 font-semibold mr-2">Hint {idx + 1}:</span>
                          {hint}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-500 uppercase mb-2">Visible Test Cases</p>
                    <div className="space-y-2">
                      {activeProblem.testCases.filter(tc => !tc.isHidden).map((tc, idx) => (
                        <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs font-mono">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-teal-400">Case {idx + 1}</span>
                            <span className="text-slate-500">{tc.points || 0} pts</span>
                          </div>
                          <p className="text-slate-500">Input:</p>
                          <pre className="text-slate-700 whitespace-pre-wrap mb-2">{tc.input}</pre>
                          <p className="text-slate-500">Expected Output:</p>
                          <pre className="text-slate-700 whitespace-pre-wrap">{tc.expectedOutput}</pre>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-3">Reference Boilerplate ({language})</p>
                    <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono leading-5">{activeProblem.boilerplate[language] || getBoilerplate(language)}</pre>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <p className="text-xs font-bold text-slate-500 uppercase mb-3">Checklist</p>
                    <ul className="text-sm text-slate-700 list-disc list-inside space-y-1">
                      <li>Handle edge cases from constraints.</li>
                      <li>Return output exactly in the expected format.</li>
                      <li>Optimize for both time and memory limits.</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </section>

          <div
            onMouseDown={(e) => startResize('description', e)}
            className="w-1 cursor-col-resize bg-slate-200 hover:bg-teal-300"
            title="Resize problem panel"
          />

          {/* Code Editor */}
          <section ref={editorColumnRef} className="flex-1 flex flex-col bg-white min-w-0">
            {/* Editor Header */}
            <div className="h-10 border-b border-slate-200 flex items-center justify-between px-4 bg-slate-50">
              <div className="flex items-center gap-4">
                <select
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value as SupportedLanguage)}
                  className="bg-white text-sm text-slate-800 border border-slate-300 rounded px-2 py-1 outline-none focus:border-teal-500"
                >
                  {Object.entries(JUDGE0_LANGUAGES).map(([key]) => (
                    <option key={key} value={key}>
                      {getLanguageLabel(key as SupportedLanguage)}
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="material-symbols-outlined text-[14px]">info</span>
                  Auto-save enabled
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isDemoMode && (
                  <button
                    onClick={handleLoadDemoAnswer}
                    className="text-emerald-300 hover:text-emerald-200 text-xs flex items-center gap-1 px-2 py-1 rounded border border-emerald-500/30 hover:bg-emerald-500/10"
                    title="Load a guaranteed-correct demo answer"
                  >
                    <span className="material-symbols-outlined text-[14px]">auto_fix_high</span>
                    Correct Answer
                  </button>
                )}
                <span className="text-[11px] text-slate-500 px-2">Q {currentQuestionIndex + 1}/{assessmentProblems.length}</span>
              </div>
            </div>

            {/* Monaco Editor */}
            <div className="flex-1 min-h-0">
              <Editor
                height="100%"
                language={JUDGE0_LANGUAGES[language].monacoId}
                value={code}
                onChange={(value) => setCode(value || '')}
                onMount={handleEditorDidMount}
                theme={theme}
                options={{
                  fontSize: fontSize,
                  fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  lineNumbers: 'on',
                  renderLineHighlight: 'line',
                  tabSize: 4,
                  insertSpaces: true,
                  wordWrap: 'on',
                  automaticLayout: true,
                  padding: { top: 16, bottom: 16 },
                  cursorBlinking: 'smooth',
                  cursorSmoothCaretAnimation: 'on',
                  smoothScrolling: true,
                  bracketPairColorization: { enabled: true },
                  formatOnPaste: true,
                  formatOnType: true,
                }}
              />
            </div>

            <div
              onMouseDown={(e) => startResize('output', e)}
              className="h-1 cursor-row-resize bg-slate-200 hover:bg-teal-300"
              title="Resize output panel"
            />

            {/* Output Panel */}
            <div style={{ height: outputHeight }} className="border-t border-slate-200 bg-white flex flex-col min-h-[150px]">
              <div className="flex items-center justify-between px-4 bg-slate-50 border-b border-slate-200">
                    <div className="flex">
                  <button
                    onClick={() => setOutputTab('results')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      outputTab === 'results'
                        ? 'text-slate-900 border-b-2 border-teal-500'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Test Results
                  </button>
                  <button
                    onClick={() => setOutputTab('console')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      outputTab === 'console'
                        ? 'text-slate-900 border-b-2 border-teal-500'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Console
                  </button>
                    </div>
                    <div className="flex gap-2 py-1">
                  <button
                    onClick={handleRunCode}
                    disabled={isRunning || isSubmitting}
                    className="px-4 py-1.5 rounded border border-emerald-300 bg-emerald-100 text-emerald-800 text-sm hover:bg-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isRunning ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                        Running...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                        Run
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleSubmitCode}
                    disabled={isRunning || isSubmitting}
                    className="px-4 py-1.5 rounded bg-teal-600 hover:bg-teal-500 text-white text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="material-symbols-outlined animate-spin text-[16px]">progress_activity</span>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
                        Submit
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {outputTab === 'results' ? (
                  testResults.length > 0 ? (
                    <div className="space-y-3">
                      {executionSummary && (
                        <div className="flex items-center gap-3 mb-4">
                          <span
                            className={`px-3 py-1 rounded text-sm font-bold border ${
                              executionSummary.status === 'accepted'
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                : 'bg-red-500/20 text-red-400 border-red-500/30'
                            }`}
                          >
                            {executionSummary.passedTests}/{executionSummary.totalTests} Passed
                          </span>
                          <span className="text-slate-500 text-sm">
                            Time: {executionSummary.totalTime.toFixed(3)}s
                          </span>
                          <span className="text-slate-500 text-sm">
                            Memory: {formatMemoryKb(executionSummary.maxMemory)}
                          </span>
                        </div>
                      )}
                      {testResults.map((result, idx) => (
                        <div
                          key={idx}
                          className={`border rounded p-3 ${
                            result.passed
                              ? 'bg-emerald-500/5 border-emerald-500/30'
                              : 'bg-red-500/5 border-red-500/30'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className={`material-symbols-outlined text-[18px] ${
                                result.passed ? 'text-emerald-400' : 'text-red-400'
                              }`}
                            >
                              {result.passed ? 'check_circle' : 'cancel'}
                            </span>
                            <span className="font-medium">
                              Test Case {idx + 1}
                              {result.isHidden && ' (Hidden)'}
                            </span>
                            {result.statusDescription && (
                              <span className="text-[11px] px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600">
                                {result.statusDescription}
                                {typeof result.statusId === 'number' ? ` (${result.statusId})` : ''}
                              </span>
                            )}
                            {result.executionTime && (
                              <span className="text-slate-500 text-xs ml-auto">
                                {formatTimeMs(result.executionTime)}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mb-2">
                            <span>CPU: {formatTimeMs(result.executionTime)}</span>
                            {typeof result.wallTime === 'number' && result.wallTime > 0 && (
                              <span>Wall: {formatTimeMs(result.wallTime)}</span>
                            )}
                            <span>Memory: {formatMemoryKb(result.memoryUsed)}</span>
                            {typeof result.exitCode === 'number' && <span>Exit: {result.exitCode}</span>}
                            {hasText(result.token) && <span className="truncate max-w-[280px]">Token: {result.token}</span>}
                          </div>
                          {!result.isHidden && (
                            <div className="text-sm font-mono space-y-1">
                              <p className="text-slate-500">
                                Input: <span className="text-slate-700">{result.input.replace(/\n/g, ', ')}</span>
                              </p>
                              <p className="text-slate-500">
                                Expected: <span className="text-emerald-400">{result.expectedOutput}</span>
                              </p>
                              <p className="text-slate-500">
                                Output:{' '}
                                <span className={result.passed ? 'text-emerald-400' : 'text-red-400'}>
                                  {result.actualOutput || '(no output)'}
                                </span>
                              </p>
                            </div>
                          )}
                          {hasText(result.compileOutput) && (
                            <pre className="mt-2 text-xs text-red-700 whitespace-pre-wrap break-words bg-red-50 border border-red-200 rounded p-2 font-mono">
                              {result.compileOutput}
                            </pre>
                          )}
                          {hasText(result.stderr) && (
                            <pre className="mt-2 text-xs text-amber-800 whitespace-pre-wrap break-words bg-amber-50 border border-amber-200 rounded p-2 font-mono">
                              {result.stderr}
                            </pre>
                          )}
                          {hasText(result.message) && (
                            <pre className="mt-2 text-xs text-slate-700 whitespace-pre-wrap break-words bg-slate-50 border border-slate-200 rounded p-2 font-mono">
                              {result.message}
                            </pre>
                          )}
                          {!hasText(result.compileOutput) && !hasText(result.stderr) && !hasText(result.message) && hasText(result.error) && (
                            <pre className="mt-2 text-xs text-red-700 whitespace-pre-wrap break-words bg-red-50 border border-red-200 rounded p-2 font-mono">
                              {result.error}
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-slate-500 text-sm text-center py-8">
                      Click "Run" to test your code against sample test cases
                    </div>
                  )
                ) : (
                  consoleDiagnostics ? (
                    <div className="space-y-3">
                      <div className="rounded border border-slate-200 bg-slate-50 p-3">
                        <p className="text-sm font-semibold text-slate-800">{consoleDiagnostics.title}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                          {hasText(consoleDiagnostics.status) && (
                            <span className="px-2 py-0.5 rounded bg-white border border-slate-200">
                              Status: {consoleDiagnostics.status}
                              {typeof consoleDiagnostics.statusId === 'number' ? ` (${consoleDiagnostics.statusId})` : ''}
                            </span>
                          )}
                          {typeof consoleDiagnostics.exitCode === 'number' && <span>Exit: {consoleDiagnostics.exitCode}</span>}
                          {typeof consoleDiagnostics.executionTime === 'number' && <span>CPU: {formatTimeMs(consoleDiagnostics.executionTime)}</span>}
                          {typeof consoleDiagnostics.wallTime === 'number' && consoleDiagnostics.wallTime > 0 && (
                            <span>Wall: {formatTimeMs(consoleDiagnostics.wallTime)}</span>
                          )}
                          {typeof consoleDiagnostics.memoryUsed === 'number' && <span>Memory: {formatMemoryKb(consoleDiagnostics.memoryUsed)}</span>}
                        </div>
                        {hasText(consoleDiagnostics.token) && (
                          <p className="mt-2 text-[11px] text-slate-500 break-all font-mono">Token: {consoleDiagnostics.token}</p>
                        )}
                      </div>

                      {renderConsoleSection('stdout', consoleDiagnostics.stdout)}
                      {renderConsoleSection('stderr', consoleDiagnostics.stderr, 'warn')}
                      {renderConsoleSection('compile_output', consoleDiagnostics.compileOutput, 'error')}
                      {renderConsoleSection('message', consoleDiagnostics.message, 'warn')}
                    </div>
                  ) : (
                    <pre className="text-sm font-mono text-slate-700 whitespace-pre-wrap">
                      {consoleOutput || 'Console output will appear here...'}
                    </pre>
                  )
                )}
                </div>
            </div>
          </section>
        </div>
      </div>

      {/* Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border border-slate-200 w-[500px] max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-400">settings</span>
                Editor Settings
              </h3>
              <button onClick={() => setSettingsOpen(false)}>
                <span className="material-symbols-outlined text-slate-500 hover:text-slate-800">close</span>
              </button>
            </div>
            <div className="p-4 space-y-6">
              {/* Font Size */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Font Size: {fontSize}px
                </label>
                <input
                  type="range"
                  min="10"
                  max="24"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="w-full accent-teal-500"
                />
                    </div>

              {/* Theme */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Editor Theme
                </label>
                <div className="py-2 px-3 rounded border border-slate-300 bg-slate-50 text-sm text-slate-600">
                  Light mode is enforced for demo consistency.
                </div>
              </div>

              {/* Custom Input Toggle */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={useCustomInput}
                    onChange={(e) => setUseCustomInput(e.target.checked)}
                    className="w-4 h-4 rounded accent-teal-500"
                  />
                  <span className="text-sm text-slate-700">Use custom input when running</span>
                </label>
                {useCustomInput && (
                  <textarea
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="Enter custom input here..."
                    className="w-full mt-2 bg-white border border-slate-300 rounded px-3 py-2 text-sm text-slate-800 focus:border-teal-500 outline-none font-mono h-24 resize-none"
                  />
                )}
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSettingsOpen(false)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded font-medium"
              >
                Save Settings
              </button>
                </div>
            </div>
        </div>
      )}

      {/* Security Warning Popup */}
      {(securityWarningOpen || awayPopupOpen) && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-xl border border-amber-300 bg-amber-50 shadow-xl">
            <div className="p-5 border-b border-amber-500/30 flex items-center gap-3">
              <span className="material-symbols-outlined text-amber-700">warning</span>
              <div>
                <h4 className="font-bold text-amber-800">Security Warning</h4>
                <p className="text-xs text-amber-700">Assessment is still running. Please stay in the test window.</p>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <p className="text-sm text-amber-800">{securityWarningText || 'A security event was detected.'}</p>
              {lastAwaySeconds > 0 && (
                <p className="text-xs text-amber-700">Last away duration: {formatAwayDuration(lastAwaySeconds)}</p>
              )}
              {awaySeconds > 0 && (
                <p className="text-xs text-amber-700">Total away duration: {formatAwayDuration(awaySeconds)}</p>
              )}
              <p className="text-xs text-amber-700">Violations detected: {securityViolations}</p>
            </div>
            <div className="p-4 border-t border-amber-500/30 flex justify-end">
              <button
                onClick={handleAcknowledgeSecurityWarning}
                className="px-4 py-2 rounded bg-amber-500 hover:bg-amber-400 text-black font-semibold"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Session Expired Modal */}
      {sessionExpired && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md rounded-xl border border-red-300 bg-white dark:bg-slate-800 shadow-xl">
            <div className="p-5 border-b border-red-200 dark:border-red-800 flex items-center gap-3">
              <span className="material-symbols-outlined text-red-500">lock</span>
              <div>
                <h4 className="font-bold text-red-700 dark:text-red-400">Session Expired</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Your session has ended. Please log in again to continue.</p>
              </div>
            </div>
            <div className="p-5">
              <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">
                Your code has been preserved in the editor. After logging back in, you can return to this assessment if it is still open.
              </p>
              <button
                onClick={() => { window.location.href = '/login'; }}
                className="w-full px-4 py-2.5 rounded-lg bg-primary hover:bg-primary-dark text-white font-semibold transition-colors"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeEditor;
