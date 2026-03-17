/**
 * AppContext — Bridge Pattern
 *
 * This file composes all 7 domain-specific contexts and re-exports a single
 * `useApp()` hook that returns the merged interface. This preserves backward
 * compatibility with all existing consumers while the migration is underway.
 *
 * New code should import from the individual context files directly:
 *   import { useAuth } from '@/store/AuthContext';
 *   import { useAssessments } from '@/store/AssessmentContext';
 *   etc.
 *
 * Sub-contexts:
 *   AuthContext, NotificationContext, UIContext, QuestionContext,
 *   AssessmentContext, SubmissionContext, AdminContext
 */

import React, { ReactNode, useEffect } from 'react';
import { User, Role, Notification, Question, Assessment, Submission, AssessmentAttempt, SystemLog, SystemHealth, Backup, LeaderboardEntry, PlagiarismResult, PlagiarismScanSummary, ActiveSession, RolePermissions, ClassInfo } from '../types';
import { CreateUserResult } from '../services/userService';

import { AuthProvider, useAuth } from './AuthContext';
import { NotificationProvider, useNotifications } from './NotificationContext';
import { UIProvider, useUI } from './UIContext';
import { QuestionProvider, useQuestions } from './QuestionContext';
import { AssessmentProvider, useAssessments } from './AssessmentContext';
import { SubmissionProvider, useSubmissions } from './SubmissionContext';
import { AdminProvider, useAdmin } from './AdminContext';

// ── Merged interface (backward-compatible) ─────────────────────────────
export interface AppContextType {
  // Auth
  isAuthenticated: boolean;
  currentUser: User | null;
  isDemoMode: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string, role: Role) => Promise<boolean>;
  logout: () => void;
  setRole: (role: Role) => void;
  startDemoMode: () => Promise<void>;
  hasPermission: (permission: keyof RolePermissions) => boolean;

  // Questions
  questions: Question[];
  editingQuestion: Question | null;
  addQuestion: (question: Omit<Question, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>) => Promise<void>;
  updateQuestion: (id: string, updates: Partial<Question>) => Promise<void>;
  deleteQuestion: (id: string) => Promise<void>;
  setEditingQuestion: (question: Question | null) => void;

  // Assessments
  assessments: Assessment[];
  currentAssessment: Assessment | null;
  currentAttempt: AssessmentAttempt | null;
  currentQuestionIndex: number;
  editingAssessment: Assessment | null;
  attempts: AssessmentAttempt[];
  addAssessment: (assessment: Omit<Assessment, 'id' | 'createdAt'>) => Promise<void>;
  updateAssessment: (id: string, updates: Partial<Assessment>) => Promise<void>;
  deleteAssessment: (id: string) => Promise<void>;
  cloneAssessment: (assessmentId: string) => Promise<void>;
  startAssessment: (assessmentId: string) => Promise<void>;
  submitAssessment: () => Promise<void>;
  setEditingAssessment: (assessment: Assessment | null) => void;
  setCurrentQuestionIndex: (index: number) => void;

  // Submissions
  submissions: Submission[];
  submitCode: (questionId: string, code: string, language: string) => Promise<Submission>;

  // Notifications
  notifications: Notification[];
  unreadCount: number;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  deleteNotification: (id: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  refreshNotifications: () => Promise<void>;

  // Admin
  users: User[];
  classes: ClassInfo[];
  systemLogs: SystemLog[];
  systemHealth: SystemHealth;
  backups: Backup[];
  leaderboard: LeaderboardEntry[];
  plagiarismResults: PlagiarismResult[];
  plagiarismSummary: PlagiarismScanSummary | null;
  plagiarismScanning: boolean;
  activeSessions: ActiveSession[];
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<CreateUserResult>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  loadUsers: () => Promise<void>;
  loadClasses: () => Promise<void>;
  createBackup: (options: { name: string; type: 'full' | 'incremental' | 'differential'; includes: string[] }) => Promise<void>;
  deleteBackup: (id: string) => Promise<void>;
  scanPlagiarism: (assessmentId: string, sensitivity?: 'low' | 'medium' | 'high') => Promise<void>;
  loadPlagiarismResults: (assessmentId: string) => Promise<void>;
  reviewPlagiarism: (id: string, status: 'cleared' | 'confirmed') => Promise<void>;
  addSystemLog: (log: Omit<SystemLog, 'id' | 'timestamp'>) => void;
  refreshSystemHealth: () => void;

  // UI
  darkMode: boolean;
  sidebarCollapsed: boolean;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
}

// ── Cross-context wiring component ─────────────────────────────────────
// This component sits inside all providers and wires up the internal refs
// so sub-contexts can communicate without circular dependencies.
const ContextWiring: React.FC<{ children: ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const notifications = useNotifications();
  const questions = useQuestions();
  const assessments = useAssessments();
  const submissions = useSubmissions();

  // Wire auth._addNotification → notifications.addNotification
  useEffect(() => {
    auth._addNotification.current = notifications.addNotification as any;
  }, [auth._addNotification, notifications.addNotification]);

  // Wire submission refs for cross-context data access
  useEffect(() => {
    submissions._questionsRef.current = questions.questions;
  }, [questions.questions, submissions._questionsRef]);

  useEffect(() => {
    submissions._currentAssessmentIdRef.current = assessments.currentAssessment?.id ?? null;
  }, [assessments.currentAssessment, submissions._currentAssessmentIdRef]);

  useEffect(() => {
    submissions._currentAttemptIdRef.current = assessments.currentAttempt?.id ?? null;
  }, [assessments.currentAttempt, submissions._currentAttemptIdRef]);

  // Reset data on logout
  useEffect(() => {
    if (!auth.isAuthenticated) {
      questions._setQuestions([]);
      assessments._setAssessments([]);
      assessments._setCurrentAssessment(null);
      assessments._setCurrentAttempt(null);
      submissions._setSubmissions([]);
    }
  }, [auth.isAuthenticated, questions, assessments, submissions]);

  return <>{children}</>;
};

// ── Composed Provider ──────────────────────────────────────────────────
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <UIProvider>
      <AuthProvider>
        <NotificationProvider>
          <QuestionProvider>
            <AssessmentProvider>
              <SubmissionProvider>
                <AdminProvider>
                  <ContextWiring>
                    {children}
                  </ContextWiring>
                </AdminProvider>
              </SubmissionProvider>
            </AssessmentProvider>
          </QuestionProvider>
        </NotificationProvider>
      </AuthProvider>
    </UIProvider>
  );
};

// ── Bridge hook (backward-compatible) ──────────────────────────────────
export const useApp = (): AppContextType => {
  const auth = useAuth();
  const notifications = useNotifications();
  const ui = useUI();
  const questions = useQuestions();
  const assessments = useAssessments();
  const submissions = useSubmissions();
  const admin = useAdmin();

  return {
    // Auth
    isAuthenticated: auth.isAuthenticated,
    currentUser: auth.currentUser,
    isDemoMode: auth.isDemoMode,
    login: auth.login,
    signup: auth.signup,
    logout: auth.logout,
    setRole: auth.setRole,
    startDemoMode: auth.startDemoMode,
    hasPermission: auth.hasPermission,

    // Questions
    questions: questions.questions,
    editingQuestion: questions.editingQuestion,
    addQuestion: questions.addQuestion,
    updateQuestion: questions.updateQuestion,
    deleteQuestion: questions.deleteQuestion,
    setEditingQuestion: questions.setEditingQuestion,

    // Assessments
    assessments: assessments.assessments,
    currentAssessment: assessments.currentAssessment,
    currentAttempt: assessments.currentAttempt,
    currentQuestionIndex: assessments.currentQuestionIndex,
    editingAssessment: assessments.editingAssessment,
    attempts: assessments.attempts,
    addAssessment: assessments.addAssessment,
    updateAssessment: assessments.updateAssessment,
    deleteAssessment: assessments.deleteAssessment,
    cloneAssessment: assessments.cloneAssessment,
    startAssessment: assessments.startAssessment,
    submitAssessment: assessments.submitAssessment,
    setEditingAssessment: assessments.setEditingAssessment,
    setCurrentQuestionIndex: assessments.setCurrentQuestionIndex,

    // Submissions
    submissions: submissions.submissions,
    submitCode: submissions.submitCode,

    // Notifications
    notifications: notifications.notifications,
    unreadCount: notifications.unreadCount,
    markNotificationRead: notifications.markNotificationRead,
    clearNotifications: notifications.clearNotifications,
    deleteNotification: notifications.deleteNotification,
    addNotification: notifications.addNotification,
    refreshNotifications: notifications.refreshNotifications,

    // Admin
    users: admin.users,
    classes: admin.classes,
    systemLogs: admin.systemLogs,
    systemHealth: admin.systemHealth,
    backups: admin.backups,
    leaderboard: admin.leaderboard,
    plagiarismResults: admin.plagiarismResults,
    plagiarismSummary: admin.plagiarismSummary,
    plagiarismScanning: admin.plagiarismScanning,
    activeSessions: admin.activeSessions,
    addUser: admin.addUser,
    updateUser: admin.updateUser,
    deleteUser: admin.deleteUser,
    loadUsers: admin.loadUsers,
    loadClasses: admin.loadClasses,
    createBackup: admin.createBackup,
    deleteBackup: admin.deleteBackup,
    scanPlagiarism: admin.scanPlagiarism,
    loadPlagiarismResults: admin.loadPlagiarismResults,
    reviewPlagiarism: admin.reviewPlagiarism,
    addSystemLog: admin.addSystemLog,
    refreshSystemHealth: admin.refreshSystemHealth,

    // UI
    darkMode: ui.darkMode,
    sidebarCollapsed: ui.sidebarCollapsed,
    toggleDarkMode: ui.toggleDarkMode,
    toggleSidebar: ui.toggleSidebar,
  };
};
