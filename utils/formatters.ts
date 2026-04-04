// Shared formatting utilities — single source of truth across all screens

/** Format ISO date string to short display: "Mar 20, 2026" */
export const formatDate = (dateStr?: string): string => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

/** Format ISO date string to short date without year: "Mar 20" */
export const formatDateShort = (dateStr?: string): string => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

/** Format ISO date string to time: "3:30 PM" */
export const formatTime = (dateStr: string): string => {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
};

/** Format ISO date string to full date+time: "Mar 20, 2026, 3:30 PM" */
export const formatDateTime = (dateStr: string): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
};

/** Relative time: "Just now", "5m ago", "3h ago", "2d ago", or date */
export const formatRelativeTime = (dateStr: string): string => {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

/** Format seconds to "Xm Ys" display */
export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
};

/** Generate avatar initials from a name: "John Doe" -> "JD", "Alice" -> "AL" */
export const getInitials = (name?: string | null): string => {
  if (!name) return '??';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// -- Status helpers -------------------------------------------------------

type AssessmentStatus = 'active' | 'published' | 'draft' | 'completed';
type SubmissionStatus = string;

/** Badge CSS classes for assessment statuses */
export const getAssessmentStatusBadge = (status: AssessmentStatus) => {
  const map: Record<AssessmentStatus, { bg: string; label: string }> = {
    active: { bg: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', label: 'Active' },
    published: { bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', label: 'Upcoming' },
    draft: { bg: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400', label: 'Draft' },
    completed: { bg: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', label: 'Completed' },
  };
  return map[status] ?? { bg: 'bg-slate-100 text-slate-600', label: status };
};

/** CSS class for submission status badges */
export const getSubmissionStatusColor = (status: SubmissionStatus): string => {
  const map: Record<string, string> = {
    passed: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30',
    accepted: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30',
    failed: 'bg-red-500/20 text-red-500 border-red-500/30',
    rejected: 'bg-red-500/20 text-red-500 border-red-500/30',
    wrong_answer: 'bg-red-500/20 text-red-500 border-red-500/30',
    error: 'bg-red-500/20 text-red-500 border-red-500/30',
    partial: 'bg-amber-500/20 text-amber-500 border-amber-500/30',
    running: 'bg-blue-500/20 text-blue-500 border-blue-500/30',
    pending: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };
  return map[status] ?? 'bg-slate-500/20 text-slate-400 border-slate-500/30';
};

/** Material Symbols icon name for submission status */
export const getSubmissionStatusIcon = (status: SubmissionStatus): string => {
  const map: Record<string, string> = {
    passed: 'check_circle',
    accepted: 'check_circle',
    failed: 'cancel',
    rejected: 'cancel',
    wrong_answer: 'cancel',
    error: 'error',
    partial: 'timelapse',
    running: 'sync',
    pending: 'radio_button_unchecked',
  };
  return map[status] ?? 'help';
};

/** Difficulty label color class */
export const getDifficultyColor = (difficulty: string): string => {
  const map: Record<string, string> = {
    easy: 'text-green-500',
    beginner: 'text-green-500',
    medium: 'text-yellow-500',
    intermediate: 'text-yellow-500',
    hard: 'text-red-500',
    advanced: 'text-red-500',
  };
  return map[difficulty] ?? 'text-slate-500';
};

/** Difficulty badge background + text color class */
export const getDifficultyBadge = (difficulty: string): string => {
  const map: Record<string, string> = {
    easy: 'bg-emerald-500/20 text-emerald-500',
    beginner: 'bg-emerald-500/20 text-emerald-500',
    medium: 'bg-amber-500/20 text-amber-500',
    intermediate: 'bg-amber-500/20 text-amber-500',
    hard: 'bg-red-500/20 text-red-500',
    advanced: 'bg-red-500/20 text-red-500',
  };
  return map[difficulty] ?? 'bg-slate-500/20 text-slate-400';
};

// -- Notification helpers -------------------------------------------------

/** Icon name for notification type */
export const getNotificationIcon = (type: string): string => {
  const map: Record<string, string> = {
    success: 'check_circle',
    error: 'error',
    warning: 'warning',
    assessment: 'assignment',
    submission: 'grading',
    system: 'settings',
    info: 'info',
  };
  return map[type] ?? 'info';
};

/** Icon + background color class for notification type */
export const getNotificationColor = (type: string): string => {
  const map: Record<string, string> = {
    success: 'text-green-500 bg-green-100 dark:bg-green-900/30',
    error: 'text-red-500 bg-red-100 dark:bg-red-900/30',
    warning: 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/30',
    assessment: 'text-purple-500 bg-purple-100 dark:bg-purple-900/30',
    submission: 'text-teal-500 bg-teal-100 dark:bg-teal-900/30',
    system: 'text-slate-500 bg-slate-100 dark:bg-slate-700/30',
    info: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
  };
  return map[type] ?? 'text-blue-500 bg-blue-100 dark:bg-blue-900/30';
};

// -- Validation -----------------------------------------------------------

export interface PasswordChecks {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
}

/** Validate password against all complexity rules */
export const validatePassword = (pwd: string): PasswordChecks => ({
  length: pwd.length >= 8,
  uppercase: /[A-Z]/.test(pwd),
  lowercase: /[a-z]/.test(pwd),
  number: /[0-9]/.test(pwd),
  special: /[^A-Za-z0-9]/.test(pwd),
});

/** Check if all password rules pass */
export const isPasswordValid = (pwd: string): boolean =>
  Object.values(validatePassword(pwd)).every(Boolean);

// -- HTML sanitization ----------------------------------------------------

/** Escape a string for safe insertion into HTML (prevents XSS) */
export const escapeHtml = (str: string): string =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
