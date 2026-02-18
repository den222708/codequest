// Export all services
export { default as plagiarismService, checkPlagiarism, batchCheckPlagiarism, reviewPlagiarismResult, getPlagiarismStats, generatePlagiarismReport } from './plagiarismService';
export { default as exportService, exportAssessmentResultsCSV, exportUsersCSV, exportAnalyticsCSV, exportPlagiarismReportCSV, exportAssessmentResultsPDF, exportStudentResultPDF, exportLogsJSON, exportToJSON } from './exportService';
export { default as realtimeService, useRealtimeUpdates } from './realtimeService';
export { draftService, timerService, bookmarkService } from './draftService';

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
