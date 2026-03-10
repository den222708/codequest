import api from './apiClient';
import type { Question, TestCase } from '../types';

function mapQuestion(q: any): Question {
  return {
    id: q.id,
    title: q.title,
    description: q.description,
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

export const questionService = {
  async getAll(): Promise<Question[]> {
    const data = await api.get<any[]>('/questions');
    return data.map(mapQuestion);
  },

  async getById(id: string): Promise<Question> {
    const data = await api.get(`/questions/${id}`);
    return mapQuestion(data);
  },

  async create(question: Partial<Question>): Promise<Question> {
    const body = {
      title: question.title,
      description: question.description,
      difficulty: question.difficulty?.toLowerCase() || 'medium',
      topic: question.topic,
      tags: question.tags,
      points: question.points,
      timeLimit: question.timeLimit,
      memoryLimit: question.memoryLimit,
      boilerplateCode: question.boilerplateCode,
      isVisible: question.isVisible,
      testCases: question.testCases?.map(tc => ({
        input: tc.input,
        expectedOutput: tc.expectedOutput,
        isHidden: tc.isHidden || false,
        points: tc.points || 10,
        timeLimit: tc.timeLimit || 5000,
      })),
    };
    const data = await api.post('/questions', body);
    return mapQuestion(data);
  },

  async update(id: string, updates: Partial<Question>): Promise<Question> {
    const body: any = {};
    if (updates.title) body.title = updates.title;
    if (updates.description) body.description = updates.description;
    if (updates.difficulty) body.difficulty = updates.difficulty.toLowerCase();
    if (updates.topic) body.topic = updates.topic;
    if (updates.tags) body.tags = updates.tags;
    if (updates.points !== undefined) body.points = updates.points;
    if (updates.timeLimit !== undefined) body.timeLimit = updates.timeLimit;
    if (updates.memoryLimit !== undefined) body.memoryLimit = updates.memoryLimit;
    if (updates.boilerplateCode) body.boilerplateCode = updates.boilerplateCode;
    if (updates.isVisible !== undefined) body.isVisible = updates.isVisible;
    const data = await api.put(`/questions/${id}`, body);
    return mapQuestion(data);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/questions/${id}`);
  },
};

export default questionService;
