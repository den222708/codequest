export type Role = 'student' | 'professor' | 'admin' | null;

export type View =
  | 'login'
  | 'signup'
  | 'forgot-password'
  | 'role-selection'
  | 'student-dashboard'
  | 'student-profile'
  | 'all-assessments'
  | 'submission-history'
  | 'instructions'
  | 'editor'
  | 'results'
  | 'prof-dashboard'
  | 'create-assessment'
  | 'edit-assessment'
  | 'question-bank'
  | 'create-question'
  | 'edit-question'
  | 'assessments'
  | 'questions'
  | 'leaderboard'
  | 'user-management'
  | 'system-logs'
  | 'system-health'
  | 'backup-management'
  | 'notifications';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  department?: string;
  enrollmentId?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  lastLogin?: string;
}

export interface TestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  points: number;
  timeLimit: number; // in ms
}

export type QuestionType = 'coding' | 'mcq' | 'short_answer' | 'true_false';

export interface MCQOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface Question {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questionType: QuestionType;
  topic: string;
  tags: string[];
  points: number;
  timeLimit: number; // in seconds
  memoryLimit: number; // in MB
  testCases: TestCase[];
  boilerplateCode: {
    python?: string;
    javascript?: string;
    java?: string;
    cpp?: string;
  };
  solution?: string;
  hints?: string[];
  options?: MCQOption[] | null;
  correctAnswer?: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isVisible: boolean;
  usageCount: number;
}

export interface Assessment {
  id: string;
  title: string;
  description: string;
  type: 'quiz' | 'exam' | 'assignment' | 'practice';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  passingScore: number; // percentage
  totalPoints: number;
  questions: Question[];
  startDate: string;
  endDate: string;
  status: 'draft' | 'published' | 'active' | 'completed';
  settings: AssessmentSettings;
  createdBy: string;
  createdAt: string;
  courseCode?: string;
  courseName?: string;
  professorName?: string;
}

export interface AssessmentSettings {
  randomizeQuestions: boolean;
  showCorrectAnswers: boolean;
  showScoreImmediately: boolean;
  allowRetakes: boolean;
  maxAttempts: number;
  ipRestriction: boolean;
  allowedIPs: string[];
  plagiarismSensitivity: 'low' | 'medium' | 'high';
  proctoring: boolean;
}

export interface Submission {
  id: string;
  assessmentId: string;
  questionId: string;
  studentId: string;
  attemptId?: string;
  studentName?: string;
  questionTitle?: string;
  code: string;
  language: 'python' | 'javascript' | 'java' | 'cpp';
  status: 'pending' | 'accepted' | 'passed' | 'partial' | 'rejected' | 'failed' | 'error' | 'wrong_answer';
  score: number;
  maxScore: number;
  testResults: TestResult[];
  executionTime?: number; // in ms — populated from Judge0, not stored in DB
  memoryUsed?: number; // in MB — populated from Judge0, not stored in DB
  submittedAt: string;
  plagiarismScore?: number;
}

export interface TestResult {
  testCaseId: string;
  passed: boolean;
  actualOutput: string;
  expectedOutput: string;
  executionTime: number;
  memoryUsed: number;
  error?: string;
}

export interface AssessmentAttempt {
  id: string;
  assessmentId: string;
  studentId: string;
  startedAt: string;
  submittedAt?: string;
  timeSpent: number; // in seconds
  score: number;
  maxScore: number;
  status: 'in-progress' | 'completed' | 'timed-out';
  submissions: Submission[];
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'assessment' | 'submission' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

export interface AnalyticsData {
  totalStudents: number;
  totalProfessors: number;
  totalAssessments: number;
  averagePassRate: number;
  activeUsers: number;
  submissionsToday: number;
  topPerformers: {
    id: string;
    name: string;
    score: number;
    rank: number;
  }[];
  performanceTrend: {
    date: string;
    score: number;
  }[];
  departmentStats: {
    department: string;
    students: number;
    avgScore: number;
  }[];
}

// Code Execution Types
export interface CodeExecutionRequest {
  code: string;
  language: 'python' | 'javascript' | 'java' | 'cpp';
  testCases: TestCase[];
  timeLimit: number;
  memoryLimit: number;
}

export interface CodeExecutionResult {
  status: 'success' | 'error' | 'timeout' | 'memory_exceeded';
  testResults: TestResult[];
  totalExecutionTime: number;
  totalMemoryUsed: number;
  compilationError?: string;
  runtimeError?: string;
}

// Plagiarism Types
export interface PlagiarismResult {
  id: string;
  assessmentId?: string;
  submissionId: string;
  studentId: string;
  studentName: string;
  questionId?: string;
  similarityScore: number;
  matchedSubmissions: {
    submissionId: string;
    studentId: string;
    studentName: string;
    similarity: number;
    matchedRegions?: { linesA: { start: number; end: number }; linesB: { start: number; end: number } }[];
    matchedLines?: { start: number; end: number }[];
  }[];
  flagged: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
  status: 'pending' | 'reviewed' | 'cleared' | 'confirmed';
  createdAt?: string;
}

export interface PlagiarismScanSummary {
  totalPairs: number;
  flaggedStudents: number;
  maxSimilarity: number;
}

// System Logs Types
export interface SystemLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  details: Record<string, any> | null;
  ipAddress: string;
  createdAt: string;
}

// System Health Types
export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  timestamp: string;
  database: { connected: boolean; responseTime?: number };
  codeExecution: { provider: string; status: string; circuitBreaker?: any };
  memory: { heapUsed: number; heapTotal: number; rss: number };
  cache: { keys: number; hits: number; misses: number };
  nodeVersion: string;
}

// Backup Types
export interface Backup {
  id: string;
  name: string;
  type: 'full' | 'incremental' | 'differential';
  size: number;
  status: 'completed' | 'in_progress' | 'failed' | 'scheduled';
  createdAt: string;
  completedAt?: string;
  createdBy: string;
  includes: ('users' | 'assessments' | 'questions' | 'submissions' | 'logs')[];
  downloadUrl?: string;
}

// Leaderboard Types
export interface LeaderboardEntry {
  rank: number;
  id: string;
  name: string;
  avatar: string;
  department: string;
  totalScore: number;
  problemsSolved: number;
  averageTime: number;
  streak: number;
  badges: string[];
}

// Draft Types (for saving student progress)
export interface Draft {
  id: string;
  assessmentId: string;
  questionId: string;
  studentId: string;
  code: string;
  language: 'python' | 'javascript' | 'java' | 'cpp';
  savedAt: string;
  bookmarked: boolean;
}

// Timer State for persistence
export interface TimerState {
  assessmentId: string;
  studentId: string;
  startTime: string;
  elapsedSeconds: number;
  totalSeconds: number;
  isPaused: boolean;
}

// Export Types
export interface ExportOptions {
  format: 'pdf' | 'csv' | 'excel';
  includeDetails: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  filters?: Record<string, any>;
}

// Real-time Types
export interface LiveUpdate {
  type: 'submission' | 'status_change' | 'new_student' | 'completion';
  assessmentId: string;
  studentId?: string;
  studentName?: string;
  data: any;
  timestamp: string;
}

export interface ActiveSession {
  id: string;
  assessmentId: string;
  studentId: string;
  studentName: string;
  avatar: string;
  startedAt: string;
  currentQuestion: number;
  totalQuestions: number;
  submittedQuestions: number;
  status: 'active' | 'idle' | 'suspicious' | 'completed';
  lastActivity: string;
  ipAddress: string;
  tabSwitches: number;
  copyPasteCount: number;
}

// Role-Based Permissions
export interface RolePermissions {
  canAttemptQuiz: boolean;
  canCreateAssessment: boolean;
  canManageQuestionBank: boolean;
  canViewClassAnalytics: boolean;
  canViewSystemAnalytics: boolean;
  canManageUsers: boolean;
  canManageAdmins: boolean; // Super Admin only
  canAccessSystemSettings: boolean;
  canViewPlagiarism: boolean;
  canManageBackups: boolean;
  canAccessLiveMonitor: boolean;
  canViewLeaderboard: boolean;
  canViewSystemLogs: boolean;
  canViewSystemHealth: boolean;
}

export const ROLE_PERMISSIONS: Record<string, RolePermissions> = {
  student: {
    canAttemptQuiz: true,
    canCreateAssessment: false,
    canManageQuestionBank: false,
    canViewClassAnalytics: false,
    canViewSystemAnalytics: false,
    canManageUsers: false,
    canManageAdmins: false,
    canAccessSystemSettings: false,
    canViewPlagiarism: false,
    canManageBackups: false,
    canAccessLiveMonitor: false,
    canViewLeaderboard: true,
    canViewSystemLogs: false,
    canViewSystemHealth: false,
  },
  professor: {
    canAttemptQuiz: false,
    canCreateAssessment: true,
    canManageQuestionBank: true,
    canViewClassAnalytics: true,
    canViewSystemAnalytics: false,
    canManageUsers: false,
    canManageAdmins: false,
    canAccessSystemSettings: false,
    canViewPlagiarism: true,
    canManageBackups: false,
    canAccessLiveMonitor: true,
    canViewLeaderboard: true,
    canViewSystemLogs: false,
    canViewSystemHealth: false,
  },
  admin: {
    canAttemptQuiz: false,
    canCreateAssessment: false,
    canManageQuestionBank: false,
    canViewClassAnalytics: true,
    canViewSystemAnalytics: true,
    canManageUsers: true,
    canManageAdmins: false,
    canAccessSystemSettings: true,
    canViewPlagiarism: true,
    canManageBackups: true,
    canAccessLiveMonitor: false,
    canViewLeaderboard: true,
    canViewSystemLogs: true,
    canViewSystemHealth: true,
  },
};

export interface ClassInfo {
  id: string;
  name: string;
  code: string;
  description: string;
  department: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  status: 'active' | 'archived';
  schedule: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  studentCount: number;
}

export interface ClassStudent {
  enrollmentRecordId: string;
  enrolledAt: string;
  id: string;
  name: string;
  email: string;
  enrollmentId: string;
  department: string;
  avatar: string;
  status: 'active' | 'inactive';
}
