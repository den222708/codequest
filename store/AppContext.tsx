import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { User, Role, Notification, Question, Assessment, Submission, AssessmentAttempt, SystemLog, SystemHealth, Backup, LeaderboardEntry, PlagiarismResult, ActiveSession, RolePermissions, ROLE_PERMISSIONS, ClassInfo } from '../types';

import { demoAssessment, demoQuestions, demoStudentUser } from '../data/demoModeData';
import { authService } from '../services/authService';
import { assessmentService } from '../services/assessmentService';
import { questionService } from '../services/questionService';
import { submissionService } from '../services/submissionService';
import { executeService } from '../services/executeService';
import { userService, CreateUserResult } from '../services/userService';
import { classService } from '../services/classService';
import { ApiError, tokenStore } from '../services/apiClient';

interface AppState {
  // Auth
  isAuthenticated: boolean;
  currentUser: User | null;

  // Data
  users: User[];
  classes: ClassInfo[];
  questions: Question[];
  assessments: Assessment[];
  notifications: Notification[];
  submissions: Submission[];
  attempts: AssessmentAttempt[];

  // New Data
  systemLogs: SystemLog[];
  systemHealth: SystemHealth;
  backups: Backup[];
  leaderboard: LeaderboardEntry[];
  plagiarismResults: PlagiarismResult[];
  activeSessions: ActiveSession[];

  // UI State
  darkMode: boolean;
  sidebarCollapsed: boolean;
  isDemoMode: boolean;

  // Current Assessment State
  currentAssessment: Assessment | null;
  currentAttempt: AssessmentAttempt | null;
  currentQuestionIndex: number;

  // Edit State
  editingAssessment: Assessment | null;
  editingQuestion: Question | null;
}

interface AppContextType extends AppState {
  // Auth Actions
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string, role: Role) => Promise<boolean>;
  logout: () => void;
  setRole: (role: Role) => void;
  startDemoMode: () => Promise<void>;

  // User Actions
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<CreateUserResult>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  loadUsers: () => Promise<void>;

  // Class Actions
  loadClasses: () => Promise<void>;

  // Question Actions
  addQuestion: (question: Omit<Question, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => void;
  updateQuestion: (id: string, updates: Partial<Question>) => void;
  deleteQuestion: (id: string) => void;
  setEditingQuestion: (question: Question | null) => void;

  // Assessment Actions
  addAssessment: (assessment: Omit<Assessment, 'id' | 'createdAt'>) => void;
  updateAssessment: (id: string, updates: Partial<Assessment>) => void;
  deleteAssessment: (id: string) => void;
  cloneAssessment: (assessmentId: string) => void;
  startAssessment: (assessmentId: string) => void;
  submitAssessment: () => void;
  setEditingAssessment: (assessment: Assessment | null) => void;

  // Submission Actions
  submitCode: (questionId: string, code: string, language: string) => Promise<Submission>;

  // Notification Actions
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;

  // Backup Actions
  createBackup: (options: { name: string; type: 'full' | 'incremental' | 'differential'; includes: string[] }) => void;
  deleteBackup: (id: string) => void;

  // Plagiarism Actions
  reviewPlagiarism: (id: string, status: 'cleared' | 'confirmed') => void;

  // System Actions
  addSystemLog: (log: Omit<SystemLog, 'id' | 'timestamp'>) => void;
  refreshSystemHealth: () => void;

  // UI Actions
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  setCurrentQuestionIndex: (index: number) => void;

  // Permission Helper
  hasPermission: (permission: keyof RolePermissions) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    isAuthenticated: false,
    currentUser: null,
    users: [],
    classes: [],
    questions: [],
    assessments: [],
    notifications: [],
    submissions: [],
    attempts: [],
    systemLogs: [],
    systemHealth: { cpu: 0, memory: 0, disk: 0, uptime: '0h', activeUsers: 0, requestsPerMinute: 0, avgResponseTime: 0, errorRate: 0, services: [] },
    backups: [],
    leaderboard: [],
    plagiarismResults: [],
    activeSessions: [],
    darkMode: false,
    sidebarCollapsed: false,
    isDemoMode: false,
    currentAssessment: null,
    currentAttempt: null,
    currentQuestionIndex: 0,
    editingAssessment: null,
    editingQuestion: null,
  });
  const demoBootstrapPromise = useRef<Promise<void> | null>(null);

  useEffect(() => {
    if (state.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state.darkMode]);

  // Session restore on mount
  useEffect(() => {
    const demoFlag = localStorage.getItem('codequest_demo_mode') === 'true';
    if (demoFlag) {
      startDemoMode().catch((err) => {
        console.error('Failed to restore demo mode:', err);
      });
      return;
    }

    const storedUser = authService.getStoredUser();
    if (storedUser) {
      setState(prev => ({ ...prev, isAuthenticated: true, currentUser: storedUser }));
      loadData(storedUser);
    }
  }, []);

  // Load data from backend
  const loadData = async (user?: User | null) => {
    try {
      const current = user || state.currentUser;
      const isAdmin = current?.role === 'admin' || current?.role === 'superadmin' || current?.role === 'subadmin';
      const [questions, assessments, submissions, users, classes] = await Promise.all([
        questionService.getAll().catch(() => []),
        assessmentService.getAll().catch(() => []),
        current
          ? submissionService.getAll(current.role === 'student' ? { userId: current.id } : undefined).catch(() => [])
          : Promise.resolve([]),
        isAdmin ? userService.getAll().catch(() => []) : Promise.resolve([]),
        (isAdmin || current?.role === 'professor') ? classService.getAll().catch(() => []) : Promise.resolve([]),
      ]);
      setState(prev => ({ ...prev, questions, assessments, submissions, users, classes }));
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  };

  const startDemoMode = async (): Promise<void> => {
    if (demoBootstrapPromise.current) {
      return demoBootstrapPromise.current;
    }

    const bootstrap = (async () => {
      const demoUser: User = { ...demoStudentUser, lastLogin: new Date().toISOString() };

      const assessment: Assessment = {
        ...demoAssessment,
        questions: demoQuestions,
      };

      localStorage.setItem('codequest_demo_mode', 'true');
      tokenStore.clear();

      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        currentUser: demoUser,
        isDemoMode: true,
        questions: demoQuestions,
        assessments: [assessment],
        submissions: [],
        attempts: [],
        currentAssessment: null,
        currentAttempt: null,
        currentQuestionIndex: 0,
      }));

      addNotification({
        type: 'info',
        title: 'Demo Mode Enabled',
        message: 'You are now in secure student demo mode.',
      });
    })().finally(() => {
      demoBootstrapPromise.current = null;
    });

    demoBootstrapPromise.current = bootstrap;
    return bootstrap;
  };

  // Auth Actions
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      localStorage.removeItem('codequest_demo_mode');
      const user = await authService.login(email, password);
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        currentUser: { ...user, lastLogin: new Date().toISOString() },
        isDemoMode: false,
      }));
      await loadData(user);
      return true;
    } catch (err) {
      console.error('Login failed:', err);
      addNotification({
        type: 'error',
        title: 'Login Failed',
        message: err instanceof ApiError ? err.message : 'Invalid email or password',
      });
      return false;
    }
  };

  const signup = async (name: string, email: string, password: string, role: Role): Promise<boolean> => {
    try {
      localStorage.removeItem('codequest_demo_mode');
      const user = await authService.signup(name, email, password, role);
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        currentUser: user,
        isDemoMode: false,
      }));
      await loadData(user);
      return true;
    } catch (err) {
      console.error('Signup failed:', err);
      addNotification({
        type: 'error',
        title: 'Signup Failed',
        message: err instanceof ApiError ? err.message : 'Could not create account',
      });
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('codequest_demo_mode');
    authService.logout();
    setState(prev => ({
      ...prev,
      isAuthenticated: false,
      currentUser: null,
      isDemoMode: false,
      currentAssessment: null,
      currentAttempt: null,
      questions: [],
      assessments: [],
      submissions: [],
    }));
  };

  const setRole = (role: Role) => {
    if (state.currentUser) {
      setState(prev => ({
        ...prev,
        currentUser: { ...prev.currentUser!, role }
      }));
    }
  };

  // User Actions
  const loadUsers = async () => {
    try {
      const users = await userService.getAll();
      setState(prev => ({ ...prev, users }));
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const addUser = async (user: Omit<User, 'id' | 'createdAt'>): Promise<CreateUserResult> => {
    const result = await userService.create({
      name: user.name,
      email: user.email,
      role: user.role as string,
      department: user.department,
      enrollmentId: user.enrollmentId || user.employeeId,
    });
    setState(prev => ({ ...prev, users: [...prev.users, result.user] }));
    addNotification({ type: 'success', title: 'User Created', message: `Account for ${result.user.name} created successfully.` });
    return result;
  };

  const updateUser = async (id: string, updates: Partial<User>): Promise<void> => {
    try {
      const updated = await userService.update(id, updates);
      setState(prev => ({
        ...prev,
        users: prev.users.map(u => u.id === id ? updated : u)
      }));
    } catch (err) {
      console.error('Failed to update user:', err);
      throw err;
    }
  };

  const deleteUser = async (id: string): Promise<void> => {
    try {
      await userService.remove(id);
      setState(prev => ({
        ...prev,
        users: prev.users.filter(u => u.id !== id)
      }));
      addNotification({ type: 'success', title: 'User Deleted', message: 'User account has been removed.' });
    } catch (err) {
      console.error('Failed to delete user:', err);
      throw err;
    }
  };

  // Class Actions
  const loadClasses = async () => {
    try {
      const classes = await classService.getAll();
      setState(prev => ({ ...prev, classes }));
    } catch (err) {
      console.error('Failed to load classes:', err);
    }
  };

  // Question Actions
  const addQuestion = async (question: Omit<Question, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => {
    try {
      const created = await questionService.create(question);
      setState(prev => ({ ...prev, questions: [...prev.questions, created] }));
      addNotification({ type: 'success', title: 'Question Created', message: `"${created.title}" added.` });
    } catch (err) {
      console.error('Failed to create question:', err);
      // Fallback to local
      const newQuestion: Question = { ...question, id: `q-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), usageCount: 0 };
      setState(prev => ({ ...prev, questions: [...prev.questions, newQuestion] }));
    }
  };

  const updateQuestion = async (id: string, updates: Partial<Question>) => {
    try {
      const updated = await questionService.update(id, updates);
      setState(prev => ({
        ...prev,
        questions: prev.questions.map(q => q.id === id ? updated : q)
      }));
    } catch (err) {
      console.error('Failed to update question:', err);
      setState(prev => ({
        ...prev,
        questions: prev.questions.map(q => q.id === id ? { ...q, ...updates, updatedAt: new Date().toISOString() } : q)
      }));
    }
  };

  const deleteQuestion = async (id: string) => {
    try {
      await questionService.delete(id);
    } catch (err) {
      console.error('Failed to delete question:', err);
    }
    setState(prev => ({ ...prev, questions: prev.questions.filter(q => q.id !== id) }));
  };

  // Assessment Actions
  const addAssessment = async (assessment: Omit<Assessment, 'id' | 'createdAt'>) => {
    try {
      const created = await assessmentService.create({
        ...assessment,
        questionIds: assessment.questions?.map(q => q.id),
      });
      setState(prev => ({ ...prev, assessments: [...prev.assessments, created] }));
      addNotification({ type: 'success', title: 'Assessment Created', message: `"${assessment.title}" has been created successfully.` });
    } catch (err) {
      console.error('Failed to create assessment:', err);
      // Fallback to local
      const newAssessment: Assessment = { ...assessment, id: `assess-${Date.now()}`, createdAt: new Date().toISOString() };
      setState(prev => ({ ...prev, assessments: [...prev.assessments, newAssessment] }));
      addNotification({ type: 'success', title: 'Assessment Created', message: `"${assessment.title}" created (offline).` });
    }
  };

  const updateAssessment = async (id: string, updates: Partial<Assessment>) => {
    try {
      const updated = await assessmentService.update(id, updates);
      setState(prev => ({
        ...prev,
        assessments: prev.assessments.map(a => a.id === id ? { ...updated, questions: a.questions } : a)
      }));
    } catch (err) {
      console.error('Failed to update assessment:', err);
      setState(prev => ({
        ...prev,
        assessments: prev.assessments.map(a => a.id === id ? { ...a, ...updates } : a)
      }));
    }
  };

  const deleteAssessment = async (id: string) => {
    try {
      await assessmentService.delete(id);
    } catch (err) {
      console.error('Failed to delete assessment:', err);
    }
    setState(prev => ({ ...prev, assessments: prev.assessments.filter(a => a.id !== id) }));
  };

  const startAssessment = async (assessmentId: string) => {
    try {
      if (state.isDemoMode) {
        const demoAssessmentData = state.assessments.find(a => a.id === assessmentId);
        if (!demoAssessmentData || !state.currentUser) return;

        const existingAttempt = state.attempts.find(
          a => a.assessmentId === assessmentId && a.studentId === state.currentUser!.id && a.status === 'in-progress'
        );

        const attempt: AssessmentAttempt = existingAttempt || {
          id: `demo-attempt-${Date.now()}`,
          assessmentId,
          studentId: state.currentUser.id,
          startedAt: new Date().toISOString(),
          timeSpent: 0,
          score: 0,
          maxScore: demoAssessmentData.totalPoints,
          status: 'in-progress',
          submissions: [],
        };

        setState(prev => ({
          ...prev,
          currentAssessment: demoAssessmentData,
          currentAttempt: attempt,
          currentQuestionIndex: 0,
          attempts: existingAttempt ? prev.attempts : [...prev.attempts, attempt],
        }));
        return;
      }

      // Fetch full assessment with questions from backend
      const assessment = await assessmentService.getById(assessmentId).catch(() =>
        state.assessments.find(a => a.id === assessmentId)
      );
      if (!assessment || !state.currentUser) return;

      // Create attempt on backend
      const backendAttempt = await assessmentService.startAttempt(assessmentId).catch(() => null);

      const attempt: AssessmentAttempt = {
        id: backendAttempt?.id || `attempt-${Date.now()}`,
        assessmentId,
        studentId: state.currentUser.id,
        startedAt: backendAttempt?.startedAt || new Date().toISOString(),
        timeSpent: 0,
        score: 0,
        maxScore: assessment.totalPoints,
        status: 'in-progress',
        submissions: [],
      };
      setState(prev => ({
        ...prev,
        currentAssessment: assessment,
        currentAttempt: attempt,
        currentQuestionIndex: 0,
        attempts: [...prev.attempts, attempt]
      }));
    } catch (err) {
      console.error('Failed to start assessment:', err);
    }
  };

  const submitAssessment = () => {
    if (state.currentAttempt) {
      const relatedSubmissions = state.submissions.filter(
        s => s.assessmentId === state.currentAttempt!.assessmentId && s.studentId === state.currentAttempt!.studentId,
      );
      const score = relatedSubmissions.reduce((sum, s) => sum + s.score, 0);
      const maxScore = relatedSubmissions.reduce((sum, s) => sum + s.maxScore, 0) || state.currentAttempt.maxScore;
      const elapsedSeconds = Math.max(
        1,
        Math.floor((Date.now() - new Date(state.currentAttempt.startedAt).getTime()) / 1000),
      );

      const updatedAttempt = {
        ...state.currentAttempt,
        submittedAt: new Date().toISOString(),
        timeSpent: elapsedSeconds,
        score,
        maxScore,
        status: 'submitted' as const,
      };
      setState(prev => ({
        ...prev,
        attempts: prev.attempts.map(a => a.id === updatedAttempt.id ? updatedAttempt : a),
        currentAttempt: null,
        currentAssessment: null,
      }));
      addNotification({
        type: 'success',
        title: 'Assessment Submitted',
        message: 'Your assessment has been submitted successfully!'
      });
    }
  };

  // Submission Actions
  const submitCode = async (questionId: string, code: string, language: string): Promise<Submission> => {
    if (!state.currentUser) {
      throw new Error('You must be logged in to submit code.');
    }
    const question = state.questions.find(q => q.id === questionId);
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
    const testResults = run.results.map((r, idx) => ({
      testCaseId: question.testCases[idx]?.id || `tc-${idx + 1}`,
      passed: r.passed,
      actualOutput: r.stdout || '',
      expectedOutput: r.expectedOutput || question.testCases[idx]?.expectedOutput || '',
      executionTime: r.executionTime,
      memoryUsed: r.memoryUsed,
      error: r.error || r.compileOutput || r.stderr || r.message,
    }));
    const executionTime = run.summary.averageTime;
    const memoryUsed = run.results.reduce((max, r) => Math.max(max, r.memoryUsed || 0), 0);

    let persisted: Submission | null = null;
    if (!state.isDemoMode) {
      try {
        persisted = await submissionService.create({
          code,
          language,
          userId: state.currentUser.id,
          questionId,
          attemptId: state.currentAttempt?.id,
          status,
          score,
          results: {
            passed: passedTests,
            total: totalTests,
            testResults,
          },
          executionTime,
          memoryUsed,
        });
      } catch (err) {
        console.error('Failed to persist submission:', err);
      }
    }

    const submission: Submission = {
      id: persisted?.id || `sub-${Date.now()}`,
      assessmentId: state.currentAssessment?.id || '',
      questionId,
      studentId: state.currentUser.id,
      code,
      language: language as any,
      status,
      score,
      maxScore: question.points || 100,
      testResults,
      executionTime,
      memoryUsed,
      submittedAt: persisted?.submittedAt || new Date().toISOString(),
    };

    setState(prev => ({ ...prev, submissions: [...prev.submissions, submission] }));
    return submission;
  };

  // Notification Actions
  const markNotificationRead = (id: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => n.id === id ? { ...n, read: true } : n)
    }));
  };

  const clearNotifications = () => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => ({ ...n, read: true }))
    }));
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setState(prev => ({ ...prev, notifications: [newNotification, ...prev.notifications] }));
  };

  // UI Actions
  const toggleDarkMode = () => {
    setState(prev => ({ ...prev, darkMode: !prev.darkMode }));
  };

  const toggleSidebar = () => {
    setState(prev => ({ ...prev, sidebarCollapsed: !prev.sidebarCollapsed }));
  };

  const setCurrentQuestionIndex = (index: number) => {
    setState(prev => ({ ...prev, currentQuestionIndex: index }));
  };

  // Edit Actions
  const setEditingAssessment = (assessment: Assessment | null) => {
    setState(prev => ({ ...prev, editingAssessment: assessment }));
  };

  const setEditingQuestion = (question: Question | null) => {
    setState(prev => ({ ...prev, editingQuestion: question }));
  };

  // Clone Assessment
  const cloneAssessment = (assessmentId: string) => {
    const original = state.assessments.find(a => a.id === assessmentId);
    if (original) {
      const cloned: Assessment = {
        ...original,
        id: `assess-${Date.now()}`,
        title: `${original.title} (Copy)`,
        status: 'draft',
        createdAt: new Date().toISOString(),
      };
      setState(prev => ({ ...prev, assessments: [...prev.assessments, cloned] }));
      addNotification({
        type: 'success',
        title: 'Assessment Cloned',
        message: `"${cloned.title}" has been created.`
      });
    }
  };

  // Backup Actions
  const createBackup = (options: { name: string; type: 'full' | 'incremental' | 'differential'; includes: string[] }) => {
    const newBackup: Backup = {
      id: `backup-${Date.now()}`,
      name: options.name,
      type: options.type,
      size: Math.floor(Math.random() * 500000000) + 50000000, // 50-550 MB
      status: 'in_progress',
      createdAt: new Date().toISOString(),
      createdBy: state.currentUser?.id || 'system',
      includes: options.includes as any,
    };
    setState(prev => ({ ...prev, backups: [newBackup, ...prev.backups] }));

    // Simulate backup completion
    setTimeout(() => {
      setState(prev => ({
        ...prev,
        backups: prev.backups.map(b =>
          b.id === newBackup.id
            ? { ...b, status: 'completed' as const, completedAt: new Date().toISOString() }
            : b
        )
      }));
      addNotification({
        type: 'success',
        title: 'Backup Completed',
        message: `"${options.name}" has been created successfully.`
      });
    }, 3000);
  };

  const deleteBackup = (id: string) => {
    setState(prev => ({
      ...prev,
      backups: prev.backups.filter(b => b.id !== id)
    }));
  };

  // Plagiarism Actions
  const reviewPlagiarism = (id: string, status: 'cleared' | 'confirmed') => {
    setState(prev => ({
      ...prev,
      plagiarismResults: prev.plagiarismResults.map(p =>
        p.id === id
          ? {
            ...p,
            status,
            flagged: status === 'confirmed',
            reviewedBy: state.currentUser?.id,
            reviewedAt: new Date().toISOString()
          }
          : p
      )
    }));
  };

  // System Actions
  const addSystemLog = (log: Omit<SystemLog, 'id' | 'timestamp'>) => {
    const newLog: SystemLog = {
      ...log,
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
    };
    setState(prev => ({ ...prev, systemLogs: [newLog, ...prev.systemLogs] }));
  };

  const refreshSystemHealth = () => {
    // Simulate refreshing system health with slightly varied metrics
    setState(prev => ({
      ...prev,
      systemHealth: {
        ...prev.systemHealth,
        lastChecked: new Date().toISOString(),
        metrics: {
          ...prev.systemHealth.metrics,
          cpuUsage: Math.max(10, Math.min(90, prev.systemHealth.metrics.cpuUsage + (Math.random() * 10 - 5))),
          memoryUsage: Math.max(20, Math.min(95, prev.systemHealth.metrics.memoryUsage + (Math.random() * 5 - 2.5))),
          activeConnections: Math.max(50, prev.systemHealth.metrics.activeConnections + Math.floor(Math.random() * 20 - 10)),
          requestsPerMinute: Math.max(100, prev.systemHealth.metrics.requestsPerMinute + Math.floor(Math.random() * 100 - 50)),
        }
      }
    }));
  };

  // Permission Helper
  const hasPermission = (permission: keyof RolePermissions): boolean => {
    if (!state.currentUser?.role) return false;
    return ROLE_PERMISSIONS[state.currentUser.role]?.[permission] ?? false;
  };

  return (
    <AppContext.Provider value={{
      ...state,
      login,
      signup,
      logout,
      setRole,
      startDemoMode,
      addUser,
      updateUser,
      deleteUser,
      loadUsers,
      loadClasses,
      addQuestion,
      updateQuestion,
      deleteQuestion,
      setEditingQuestion,
      addAssessment,
      updateAssessment,
      deleteAssessment,
      cloneAssessment,
      startAssessment,
      submitAssessment,
      setEditingAssessment,
      submitCode,
      markNotificationRead,
      clearNotifications,
      addNotification,
      createBackup,
      deleteBackup,
      reviewPlagiarism,
      addSystemLog,
      refreshSystemHealth,
      toggleDarkMode,
      toggleSidebar,
      setCurrentQuestionIndex,
      hasPermission,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
