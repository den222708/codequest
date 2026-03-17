import React, { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import { Submission, Question } from '../types';
import { submissionService } from '../services/submissionService';
import { executeService } from '../services/executeService';
import { useAuth } from './AuthContext';

export interface SubmissionContextType {
  submissions: Submission[];
  submitCode: (questionId: string, code: string, language: string) => Promise<Submission>;
  /** Internal: set submissions directly */
  _setSubmissions: (submissions: Submission[]) => void;
  /** Internal: refs for cross-context access */
  _questionsRef: React.MutableRefObject<Question[]>;
  _currentAssessmentIdRef: React.MutableRefObject<string | null>;
  _currentAttemptIdRef: React.MutableRefObject<string | null>;
}

const SubmissionContext = createContext<SubmissionContextType | undefined>(undefined);

export const SubmissionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const { currentUser, isDemoMode, _onLoginSuccess } = useAuth();
  const isDemoModeRef = useRef(isDemoMode);

  const _questionsRef = useRef<Question[]>([]);
  const _currentAssessmentIdRef = useRef<string | null>(null);
  const _currentAttemptIdRef = useRef<string | null>(null);

  useEffect(() => { isDemoModeRef.current = isDemoMode; }, [isDemoMode]);

  // Load submissions on login
  useEffect(() => {
    const handler = (user: { id: string; role: string } & Record<string, unknown>) => {
      submissionService.getAll(user.role === 'student' ? { userId: user.id } : undefined)
        .then(data => setSubmissions(data))
        .catch(() => {});
    };
    _onLoginSuccess.current.push(handler as (user: any) => void);
    return () => {
      _onLoginSuccess.current = _onLoginSuccess.current.filter(h => h !== (handler as any));
    };
  }, [_onLoginSuccess]);

  const VALID_LANGUAGES = ['python', 'javascript', 'java', 'cpp'] as const;

  const submitCode = useCallback(async (questionId: string, code: string, language: string): Promise<Submission> => {
    if (!currentUser) {
      throw new Error('You must be logged in to submit code.');
    }
    if (!VALID_LANGUAGES.includes(language as typeof VALID_LANGUAGES[number])) {
      throw new Error(`Unsupported language: ${language}`);
    }
    const question = _questionsRef.current.find(q => q.id === questionId);
    if (!question) {
      throw new Error('Question not found.');
    }

    const questionTestCases = (question.testCases || []).map(tc => ({
      input: tc.input,
      expectedOutput: tc.expectedOutput,
    }));

    let run: Awaited<ReturnType<typeof executeService.runTests>>;
    try {
      run = await executeService.runTests(code, language, questionTestCases);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Execution service error';
      throw new Error(`Code execution failed: ${message}`);
    }

    const totalTests = run.summary.total || question.testCases.length || 1;
    const passedTests = run.summary.passed;
    const status: Submission['status'] =
      passedTests === totalTests ? 'passed' : passedTests > 0 ? 'partial' : 'failed';
    const score = Math.round((passedTests / totalTests) * (question.points || 100));
    const testResults = run.results.map((r: any, idx: number) => ({
      testCaseId: question.testCases[idx]?.id || `tc-${idx + 1}`,
      passed: r.passed,
      actualOutput: r.stdout || '',
      expectedOutput: r.expectedOutput || question.testCases[idx]?.expectedOutput || '',
      executionTime: r.executionTime,
      memoryUsed: r.memoryUsed,
      error: r.error || r.compileOutput || r.stderr || r.message,
    }));
    const executionTime = run.summary.averageTime;
    const memoryUsed = run.results.reduce((max: number, r: any) => Math.max(max, r.memoryUsed || 0), 0);

    let persisted: Submission | null = null;
    if (!isDemoModeRef.current) {
      try {
        persisted = await submissionService.create({
          code,
          language,
          assessmentId: _currentAssessmentIdRef.current || '',
          questionId,
          attemptId: _currentAttemptIdRef.current || undefined,
          status,
          score,
          results: { passed: passedTests, total: totalTests, testResults },
          executionTime,
          memoryUsed,
        });
      } catch (err) {
        console.error('Failed to persist submission:', err);
      }
    }

    const submission: Submission = {
      id: persisted?.id || `sub-${Date.now()}`,
      assessmentId: _currentAssessmentIdRef.current || '',
      questionId,
      studentId: currentUser.id,
      code,
      language: language as Submission['language'],
      status,
      score,
      maxScore: question.points || 100,
      testResults,
      executionTime,
      memoryUsed,
      submittedAt: persisted?.submittedAt || new Date().toISOString(),
    };

    setSubmissions(prev => [...prev, submission]);
    return submission;
  }, [currentUser]);

  const _setSubmissions = useCallback((s: Submission[]) => setSubmissions(s), []);

  return (
    <SubmissionContext.Provider value={{
      submissions,
      submitCode,
      _setSubmissions,
      _questionsRef,
      _currentAssessmentIdRef,
      _currentAttemptIdRef,
    }}>
      {children}
    </SubmissionContext.Provider>
  );
};

export const useSubmissions = () => {
  const context = useContext(SubmissionContext);
  if (!context) throw new Error('useSubmissions must be used within SubmissionProvider');
  return context;
};
