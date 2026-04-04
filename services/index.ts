// Export all services — barrel file

// Auth & API
export { api, tokenStore } from './apiClient';
export { default as authService } from './authService';

// Domain services
export { default as assessmentService } from './assessmentService';
export { default as questionService } from './questionService';
export { default as submissionService } from './submissionService';
export { userService } from './userService';
export { classService } from './classService';
export { default as executeService } from './executeService';
export { parseErrorsToMarkers } from './errorParser';

// Plagiarism
export { default as plagiarismService, scanPlagiarism, getPlagiarismResults, reviewPlagiarismResult, getPlagiarismStats, generatePlagiarismReport } from './plagiarismService';

// Export
export { default as exportService, exportAssessmentResultsCSV, exportUsersCSV, exportAnalyticsCSV, exportPlagiarismReportCSV, exportAssessmentResultsPDF, exportStudentResultPDF, exportLogsJSON, exportToJSON } from './exportService';

// Real-time & monitoring
export { default as realtimeService, useRealtimeUpdates } from './realtimeService';
export { default as monitoringService } from './monitoringService';
export type { ViolationType, ViolationHandler } from './monitoringService';

// Drafts & timers
export { draftService, timerService, bookmarkService } from './draftService';

// DevTools protection
export { initDevtoolProtection, isDevtoolProtectionActive } from './devtoolProtection';

// Judge0 Code Execution Service
export {
  default as judge0Service,
  JUDGE0_LANGUAGES,
  JUDGE0_STATUS,
  configureJudge0,
  getJudge0Config,
  executeCode as executeJudge0Code,
  executeWithTestCases,
  getBoilerplate,
  formatTime,
  formatMemory,
  isConfigured as isJudge0Configured,
  getStatusColor,
  getStatusBgColor,
} from './judge0Service';
export type { SupportedLanguage, Judge0Result, TestCaseInput, TestCaseResult, ExecutionSummary } from './judge0Service';
