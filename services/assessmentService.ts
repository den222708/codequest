import api from './apiClient';
import type { Assessment, Question, TestCase } from '../types';

/** Map backend assessment to frontend shape */
function mapAssessment(raw: any): Assessment {
  const questions: Question[] = (raw.questions || []).map((aq: any) => {
    const q = aq.question || aq;
    return mapQuestion(q);
  });

  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    type: raw.type?.toLowerCase(),
    difficulty: mapDifficulty(raw.difficulty),
    duration: raw.duration,
    passingScore: raw.passingScore,
    totalPoints: raw.totalPoints,
    questions,
    startDate: raw.startDate,
    endDate: raw.endDate,
    status: raw.status?.toLowerCase(),
    settings: typeof raw.settings === 'string' ? JSON.parse(raw.settings) : (raw.settings || defaultSettings()),
    createdBy: raw.createdById || raw.createdBy?.id || raw.createdBy || '',
    createdAt: raw.createdAt,
    courseCode: raw.courseCode,
    courseName: raw.courseName,
    professorName: raw.professorName || raw.createdBy?.name,
  };
}

function mapQuestion(q: any): Question {
  return {
    id: q.id,
    title: q.title || '',
    description: q.description || '',
    difficulty: q.difficulty?.toLowerCase() || 'medium',
    topic: q.topic || '',
    tags: typeof q.tags === 'string' ? JSON.parse(q.tags) : (q.tags || []),
    points: q.points || 100,
    timeLimit: q.timeLimit || 5,
    memoryLimit: q.memoryLimit || 256,
    testCases: (q.testCases || []).map((tc: any): TestCase => ({
      id: tc.id,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      isHidden: tc.isHidden || false,
      points: tc.points || 10,
      timeLimit: tc.timeLimit || 5000,
    })),
    boilerplateCode: typeof q.boilerplateCode === 'string' ? JSON.parse(q.boilerplateCode) : (q.boilerplateCode || {}),
    solution: q.solution,
    hints: q.hints,
    createdBy: q.createdById || q.createdBy?.id || q.createdBy || '',
    createdAt: q.createdAt || '',
    updatedAt: q.updatedAt || '',
    isVisible: q.isVisible !== false,
    usageCount: q.usageCount || 0,
  };
}

function mapDifficulty(d: string): 'beginner' | 'intermediate' | 'advanced' {
  const lower = d?.toLowerCase();
  if (lower === 'easy' || lower === 'beginner') return 'beginner';
  if (lower === 'hard' || lower === 'advanced') return 'advanced';
  return 'intermediate';
}

function defaultSettings() {
  return {
    randomizeQuestions: false,
    showCorrectAnswers: false,
    showScoreImmediately: true,
    allowRetakes: false,
    maxAttempts: 1,
    ipRestriction: false,
    allowedIPs: [],
    plagiarismSensitivity: 'medium' as const,
    proctoring: false,
  };
}

export const assessmentService = {
  async getAll(): Promise<Assessment[]> {
    const data = await api.get<any[]>('/assessments');
    return data.map(mapAssessment);
  },

  async getById(id: string): Promise<Assessment> {
    const data = await api.get(`/assessments/${id}`);
    return mapAssessment(data);
  },

  async create(assessment: Partial<Assessment> & { questionIds?: string[] }): Promise<Assessment> {
    const body = {
      title: assessment.title,
      description: assessment.description,
      type: assessment.type?.toUpperCase(),
      difficulty: mapDifficultyToBackend(assessment.difficulty),
      duration: assessment.duration,
      passingScore: assessment.passingScore,
      totalPoints: assessment.totalPoints,
      startDate: assessment.startDate || new Date().toISOString(),
      endDate: assessment.endDate || new Date(Date.now() + 7 * 86400000).toISOString(),
      settings: assessment.settings,
      courseCode: assessment.courseCode,
      courseName: assessment.courseName,
      professorName: assessment.professorName,
      status: assessment.status?.toUpperCase() || 'DRAFT',
      questionIds: assessment.questionIds || assessment.questions?.map(q => q.id) || [],
    };
    const data = await api.post('/assessments', body);
    return mapAssessment(data);
  },

  async update(id: string, updates: Partial<Assessment>): Promise<Assessment> {
    const body: any = {};
    if (updates.title) body.title = updates.title;
    if (updates.description) body.description = updates.description;
    if (updates.type) body.type = updates.type.toUpperCase();
    if (updates.difficulty) body.difficulty = mapDifficultyToBackend(updates.difficulty);
    if (updates.duration) body.duration = updates.duration;
    if (updates.passingScore) body.passingScore = updates.passingScore;
    if (updates.startDate) body.startDate = updates.startDate;
    if (updates.endDate) body.endDate = updates.endDate;
    if (updates.status) body.status = updates.status.toUpperCase();
    if (updates.settings) body.settings = updates.settings;
    const data = await api.put(`/assessments/${id}`, body);
    return mapAssessment(data);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/assessments/${id}`);
  },

  async clone(id: string): Promise<Assessment> {
    const data = await api.post(`/assessments/${id}/clone`);
    return mapAssessment(data);
  },

  async publish(id: string): Promise<Assessment> {
    const data = await api.post(`/assessments/${id}/publish`);
    return mapAssessment(data);
  },

  async startAttempt(id: string): Promise<any> {
    return api.post(`/assessments/${id}/attempts`);
  },
};

function mapDifficultyToBackend(d?: string): string {
  if (!d) return 'MEDIUM';
  const lower = d.toLowerCase();
  if (lower === 'beginner' || lower === 'easy') return 'EASY';
  if (lower === 'advanced' || lower === 'hard') return 'HARD';
  return 'MEDIUM';
}

export default assessmentService;
