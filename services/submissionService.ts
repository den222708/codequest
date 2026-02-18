import api from './apiClient';
import type { Submission } from '../types';

export const submissionService = {
  async getAll(filters?: { userId?: string; questionId?: string }): Promise<Submission[]> {
    const params = new URLSearchParams();
    if (filters?.userId) params.set('userId', filters.userId);
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
    const data = await api.get<any[]>(`/submissions/user/${userId}`);
    return data.map(mapSubmission);
  },

  async create(submission: {
    code: string;
    language: string;
    userId: string;
    questionId: string;
    attemptId?: string;
    status?: string;
    score?: number;
    results?: any;
    executionTime?: number;
    memoryUsed?: number;
  }): Promise<Submission> {
    const data = await api.post('/submissions', submission);
    return mapSubmission(data);
  },
};

function mapSubmission(s: any): Submission {
  return {
    id: s.id,
    assessmentId: s.attemptId || '',
    questionId: s.questionId,
    studentId: s.userId || s.studentId || '',
    code: s.code,
    language: s.language,
    status: s.status || 'pending',
    score: s.score || 0,
    maxScore: s.maxScore || 100,
    testResults: s.results?.testResults || s.testResults || [],
    executionTime: s.executionTime || 0,
    memoryUsed: s.memoryUsed || 0,
    submittedAt: s.submittedAt || s.createdAt || new Date().toISOString(),
    plagiarismScore: s.plagiarismScore,
  };
}

export default submissionService;
