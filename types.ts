export type Role = 'student' | 'professor' | 'admin' | 'subadmin' | 'superadmin' | null;

export type View =
  | 'landing'
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
  | 'live-monitor'
  | 'create-assessment'
  | 'edit-assessment'
  | 'question-bank'
  | 'create-question'
  | 'edit-question'
  | 'group-setup'
  | 'plagiarism'
  | 'analytics'
  | 'leaderboard'
  | 'admin-settings'
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
  employeeId?: string;
  status: 'active' | 'inactive' | 'pending';
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

export interface Question {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
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
  code: string;
  language: 'python' | 'javascript' | 'java' | 'cpp';
  status: 'pending' | 'running' | 'passed' | 'failed' | 'partial' | 'error';
  score: number;
  maxScore: number;
  testResults: TestResult[];
  executionTime: number; // in ms
  memoryUsed: number; // in MB
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
  status: 'in-progress' | 'submitted' | 'graded';
  submissions: Submission[];
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
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
  submissionId: string;
  studentId: string;
  studentName: string;
  similarityScore: number;
  matchedSubmissions: {
    submissionId: string;
    studentId: string;
    studentName: string;
    similarity: number;
    matchedLines: { start: number; end: number }[];
  }[];
  flagged: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
  status: 'pending' | 'reviewed' | 'cleared' | 'confirmed';
}

// System Logs Types
export interface SystemLog {
  id: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  category: 'auth' | 'submission' | 'assessment' | 'user' | 'system' | 'security';
  message: string;
  userId?: string;
  userName?: string;
  ipAddress: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

// System Health Types
export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  lastChecked: string;
  services: {
    name: string;
    status: 'up' | 'down' | 'degraded';
    responseTime: number;
    lastChecked: string;
  }[];
  metrics: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    activeConnections: number;
    requestsPerMinute: number;
    averageResponseTime: number;
  };
  recentErrors: SystemLog[];
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

// Feedback Types
export interface Feedback {
  id: string;
  submissionId: string;
  professorId: string;
  professorName: string;
  comment: string;
  rating?: number;
  createdAt: string;
  updatedAt?: string;
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
  subadmin: {
    canAttemptQuiz: false,
    canCreateAssessment: false,
    canManageQuestionBank: false,
    canViewClassAnalytics: true,
    canViewSystemAnalytics: true,
    canManageUsers: true, // Limited - can manage students/professors only
    canManageAdmins: false,
    canAccessSystemSettings: false, // View-only
    canViewPlagiarism: true,
    canManageBackups: false, // View-only
    canAccessLiveMonitor: false,
    canViewLeaderboard: true,
    canViewSystemLogs: true, // View-only
    canViewSystemHealth: true, // View-only
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
  superadmin: {
    canAttemptQuiz: false,
    canCreateAssessment: true, // Full access
    canManageQuestionBank: true, // Full access
    canViewClassAnalytics: true,
    canViewSystemAnalytics: true,
    canManageUsers: true,
    canManageAdmins: true, // Can manage other admins
    canAccessSystemSettings: true,
    canViewPlagiarism: true,
    canManageBackups: true,
    canAccessLiveMonitor: true, // Full access
    canViewLeaderboard: true,
    canViewSystemLogs: true,
    canViewSystemHealth: true,
  },
};

// Course Management Types
export interface Course {
  id: string;
  code: string;           // e.g., "CS201"
  name: string;           // e.g., "Data Structures"
  description: string;
  department: string;
  credits: number;
  status: 'active' | 'archived';
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Semester {
  id: string;
  courseId: string;
  name: string;           // e.g., "Fall 2026"
  year: number;
  term: 'spring' | 'summer' | 'fall' | 'winter';
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'completed';
}

export interface Lab {
  id: string;
  semesterId: string;
  name: string;           // e.g., "Lab Section A"
  schedule: string;       // e.g., "Mon/Wed 10:00 AM - 11:30 AM"
  location: string;       // e.g., "Room 301, Engineering Building"
  capacity: number;
  professorId?: string;
  professorName?: string;
  parentLabId?: string;   // For recursive nesting (sub-labs)
  status: 'active' | 'inactive';
}

export interface StudentGroup {
  id: string;
  labId: string;
  name: string;           // e.g., "Group A" or "Morning Batch"
  studentIds: string[];   // Array of student user IDs
  createdAt: string;
}

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
  status: string;
}

