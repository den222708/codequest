import React, { useState, useMemo } from 'react';
import { Submission, Question } from '../types';
import {
  formatDateTime,
  getSubmissionStatusColor,
  getSubmissionStatusIcon,
  getDifficultyBadge,
} from '../utils/formatters';

type SortKey = 'date' | 'score' | 'question';

interface SubmissionHistoryProps {
  submissions: Submission[];
  questions: Question[];
  onViewSubmission?: (submission: Submission) => void;
  onResubmit?: (questionId: string) => void;
}

const SubmissionHistory: React.FC<SubmissionHistoryProps> = ({
  submissions,
  questions,
  onViewSubmission,
  onResubmit,
}) => {
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed' | 'partial'>('all');
  const [sortBy, setSortBy] = useState<SortKey>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  const getQuestion = (questionId: string) => questions.find(q => q.id === questionId);

  const filteredSubmissions = useMemo(() => {
    let result = [...submissions];

    // Apply status filter
    if (filter !== 'all') {
      result = result.filter(s => s.status === filter);
    }

    // Apply search
    if (searchQuery) {
      result = result.filter(s => {
        const question = getQuestion(s.questionId);
        return question?.title.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime();
          break;
        case 'score':
          comparison = (a.score / a.maxScore) - (b.score / b.maxScore);
          break;
        case 'question':
          const qA = getQuestion(a.questionId)?.title || '';
          const qB = getQuestion(b.questionId)?.title || '';
          comparison = qA.localeCompare(qB);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [submissions, filter, searchQuery, sortBy, sortOrder, questions]);

  const getStatusColor = getSubmissionStatusColor;

  const getStatusIcon = (status: string) => (
    <span className="material-symbols-outlined">{getSubmissionStatusIcon(status)}</span>
  );

  const stats = useMemo(() => {
    const total = submissions.length;
    const passed = submissions.filter(s => s.status === 'passed').length;
    const failed = submissions.filter(s => s.status === 'failed').length;
    const partial = submissions.filter(s => s.status === 'partial').length;
    const avgScore = total > 0
      ? submissions.reduce((acc, s) => acc + (s.score / s.maxScore) * 100, 0) / total
      : 0;
    return { total, passed, failed, partial, avgScore };
  }, [submissions]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Submission History</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">View and track all your code submissions</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-background-card border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="text-slate-500 dark:text-slate-400 text-sm">Total Submissions</div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.total}</div>
        </div>
        <div className="bg-white dark:bg-background-card border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="text-slate-500 dark:text-slate-400 text-sm">Passed</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1">{stats.passed}</div>
        </div>
        <div className="bg-white dark:bg-background-card border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="text-slate-500 dark:text-slate-400 text-sm">Failed</div>
          <div className="text-2xl font-bold text-red-400 mt-1">{stats.failed}</div>
        </div>
        <div className="bg-white dark:bg-background-card border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="text-slate-500 dark:text-slate-400 text-sm">Partial</div>
          <div className="text-2xl font-bold text-amber-400 mt-1">{stats.partial}</div>
        </div>
        <div className="bg-white dark:bg-background-card border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <div className="text-slate-500 dark:text-slate-400 text-sm">Avg. Score</div>
          <div className="text-2xl font-bold text-primary mt-1">{stats.avgScore.toFixed(1)}%</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-background-card border border-slate-200 dark:border-slate-800 rounded-xl p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2"><span className="material-symbols-outlined text-slate-500 dark:text-slate-400">search</span></span>
              <input
                type="text"
                placeholder="Search by question title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg pl-10 pr-4 py-2 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            {(['all', 'passed', 'failed', 'partial'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg capitalize transition-all ${
                  filter === status
                    ? 'bg-primary text-white'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-300 dark:border-slate-600'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-primary"
            >
              <option value="date">Sort by Date</option>
              <option value="score">Sort by Score</option>
              <option value="question">Sort by Question</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-4 py-2 text-slate-900 dark:text-white hover:border-primary transition-colors"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Submissions List */}
      <div className="bg-white dark:bg-background-card border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
        {filteredSubmissions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-6xl mb-4"><span className="material-symbols-outlined text-4xl">description</span></div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No submissions found</h3>
            <p className="text-slate-500 dark:text-slate-400">
              {submissions.length === 0
                ? "You haven't made any submissions yet. Start solving problems!"
                : 'No submissions match your current filters.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-700">
            {filteredSubmissions.map((submission) => {
              const question = getQuestion(submission.questionId);
              const scorePercentage = (submission.score / submission.maxScore) * 100;

              return (
                <div
                  key={submission.id}
                  className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedSubmission(submission)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedSubmission(submission); } }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Status Badge */}
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold border ${getStatusColor(submission.status)}`}>
                        {getStatusIcon(submission.status)}
                      </div>

                      {/* Question Info */}
                      <div>
                        <h3 className="text-slate-900 dark:text-white font-medium">
                          {question?.title || 'Unknown Question'}
                        </h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-slate-500 dark:text-slate-400">
                          <span className={`px-2 py-0.5 rounded text-xs ${getDifficultyBadge(question?.difficulty || '')}`}>
                            {question?.difficulty}
                          </span>
                          <span>{question?.topic}</span>
                          <span>•</span>
                          <span>{submission.language}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {/* Score */}
                      <div className="text-right">
                        <div className="text-slate-900 dark:text-white font-semibold">
                          {submission.score}/{submission.maxScore}
                        </div>
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {scorePercentage.toFixed(0)}%
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-32">
                        <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              scorePercentage >= 80 ? 'bg-emerald-500' :
                              scorePercentage >= 50 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${scorePercentage}%` }}
                          />
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          {submission.testResults.filter(t => t.passed).length}/{submission.testResults.length} tests
                        </div>
                      </div>

                      {/* Execution Stats */}
                      <div className="text-right text-sm">
                        <div className="text-slate-500 dark:text-slate-400">
                          <span className="material-symbols-outlined text-sm">timer</span> {submission.executionTime?.toFixed(0)}ms
                        </div>
                        <div className="text-slate-500 dark:text-slate-400">
                          <span className="material-symbols-outlined text-sm">memory</span> {submission.memoryUsed?.toFixed(1)}MB
                        </div>
                      </div>

                      {/* Date */}
                      <div className="text-right text-sm text-slate-500 dark:text-slate-400 w-36">
                        {formatDateTime(submission.submittedAt)}
                      </div>

                      {/* Actions */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewSubmission?.(submission);
                        }}
                        className="p-2 hover:bg-primary/20 rounded-lg transition-colors text-primary"
                      >
                        <span className="material-symbols-outlined">visibility</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Submission Detail Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-background-card border border-slate-200 dark:border-slate-800 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {getQuestion(selectedSubmission.questionId)?.title}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                  Submitted on {formatDateTime(selectedSubmission.submittedAt)}
                </p>
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Stats Row */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                  <div className="text-slate-500 dark:text-slate-400 text-sm">Status</div>
                  <div className={`text-lg font-semibold capitalize ${
                    selectedSubmission.status === 'passed' ? 'text-emerald-400' :
                    selectedSubmission.status === 'partial' ? 'text-amber-400' : 'text-red-400'
                  }`}>
                    {selectedSubmission.status}
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                  <div className="text-slate-500 dark:text-slate-400 text-sm">Score</div>
                  <div className="text-lg font-semibold text-slate-900 dark:text-white">
                    {selectedSubmission.score}/{selectedSubmission.maxScore}
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                  <div className="text-slate-500 dark:text-slate-400 text-sm">Execution Time</div>
                  <div className="text-lg font-semibold text-slate-900 dark:text-white">
                    {selectedSubmission.executionTime?.toFixed(2)}ms
                  </div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                  <div className="text-slate-500 dark:text-slate-400 text-sm">Memory Used</div>
                  <div className="text-lg font-semibold text-slate-900 dark:text-white">
                    {selectedSubmission.memoryUsed?.toFixed(2)}MB
                  </div>
                </div>
              </div>

              {/* Code */}
              <div>
                <h3 className="text-slate-900 dark:text-white font-medium mb-2">Submitted Code ({selectedSubmission.language})</h3>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-slate-700 dark:text-slate-300 font-mono whitespace-pre-wrap">
                    {selectedSubmission.code}
                  </pre>
                </div>
              </div>

              {/* Test Results */}
              <div>
                <h3 className="text-slate-900 dark:text-white font-medium mb-2">Test Results</h3>
                <div className="space-y-2">
                  {selectedSubmission.testResults.map((result, index) => (
                    <div
                      key={result.testCaseId}
                      className={`bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border-l-4 ${
                        result.passed ? 'border-emerald-500' : 'border-red-500'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-slate-900 dark:text-white">
                          Test Case #{index + 1}
                        </span>
                        <span className={result.passed ? 'text-emerald-400' : 'text-red-400'}>
                          {result.passed ? <><span className="material-symbols-outlined text-sm align-middle">check</span> Passed</> : <><span className="material-symbols-outlined text-sm align-middle">close</span> Failed</>}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Expected:</span>
                          <pre className="text-slate-700 dark:text-slate-300 mt-1 bg-white dark:bg-background-card p-2 rounded">
                            {result.expectedOutput}
                          </pre>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Your Output:</span>
                          <pre className={`mt-1 p-2 rounded ${
                            result.passed ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
                          }`}>
                            {result.actualOutput || '(empty)'}
                          </pre>
                        </div>
                      </div>
                      {result.error && (
                        <div className="mt-2 text-red-400 text-sm">
                          <span className="font-medium">Error:</span> {result.error}
                        </div>
                      )}
                      <div className="flex gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                        <span><span className="material-symbols-outlined text-sm">timer</span> {result.executionTime.toFixed(2)}ms</span>
                        <span><span className="material-symbols-outlined text-sm">memory</span> {result.memoryUsed.toFixed(2)}MB</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-4 border-t border-slate-200 dark:border-slate-800">
              {onResubmit && (
                <button
                  onClick={() => {
                    onResubmit(selectedSubmission.questionId);
                    setSelectedSubmission(null);
                  }}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                >
                  Try Again
                </button>
              )}
              <button
                onClick={() => setSelectedSubmission(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubmissionHistory;
