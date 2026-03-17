import api from './apiClient';
import type { Submission } from '../types';

export const submissionService = {
  async getAll(filters?: { userId?: string; questionId?: string }): Promise<Submission[]> {
    const params = new URLSearchParams();
    if (filters?.userId) params.set('studentId', filters.userId);
    if (filters?.questionId) params.set('questionId', filters.questionId);
    const query = params.toString();
    const data = await api.get<any[]>(`/submissions${query ? `?${query}` : ''}`);
    return data.map(mapSubmission);
  },

  async getById(id: string): Promise<Submission> {
    const data = await api.get(`/submissions/${id}`);
    return mapSubmission(data);
  },

  async getByUser(userId: string): Promise<Submission[]> {
    const params = new URLSearchParams();
    params.set('studentId', userId);
    const data = await api.get<any[]>(`/submissions?${params.toString()}`);
    return data.map(mapSubmission);
  },

  async create(submission: {
    code: string;
    language: string;
    questionId: string;
    assessmentId: string;
    attemptId?: string;
    answer?: string;
    status?: string;
    score?: number;
    results?: any;
    executionTime?: number;
    memoryUsed?: number;
  }): Promise<Submission> {
    const data = await api.post('/submissions', submission);
    return mapSubmission(data);
  },

  async completeAttempt(attemptId: string, payload?: { score?: number; timeSpent?: number }): Promise<any> {
    return api.post(`/submissions/${attemptId}/complete`, payload || {});
  },
};

function mapSubmission(s: any): Submission {
  return {
    id: s.id,
    assessmentId: s.assessmentId || '',
    questionId: s.questionId || '',
    studentId: s.studentId || '',
    code: s.code,
    language: s.language,
    status: mapSubmissionStatus(s.status),
    score: s.score || 0,
    maxScore: s.maxScore || 100,
    testResults: s.testResults || [],
    executionTime: s.executionTime || 0,
    memoryUsed: s.memoryUsed || 0,
    submittedAt: s.createdAt || new Date().toISOString(),
    plagiarismScore: s.plagiarismScore,
  };
}

/** Map backend status values to frontend enum */
function mapSubmissionStatus(status?: string): Submission['status'] {
  if (!status) return 'pending';
  const map: Record<string, Submission['status']> = {
    pending: 'pending',
    running: 'pending',
    passed: 'passed',
    failed: 'failed',
    error: 'error',
    accepted: 'accepted',
    rejected: 'rejected',
    wrong_answer: 'wrong_answer',
    partial: 'partial',
    completed: 'passed',
    'timed-out': 'error',
  };
  return map[status] || 'pending';
}

export default submissionService;
