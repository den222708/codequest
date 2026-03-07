import api from './apiClient';
import type { ClassInfo, ClassStudent } from '../types';

function mapClass(raw: any): ClassInfo {
  return {
    id: raw.id,
    name: raw.name,
    code: raw.code,
    description: raw.description || '',
    department: raw.department || '',
    teacherId: raw.teacherId || raw.teacher_id,
    teacherName: raw.teacherName || '',
    teacherEmail: raw.teacherEmail || '',
    status: raw.status || 'active',
    createdBy: raw.createdBy || raw.created_by || '',
    createdAt: raw.createdAt || raw.created_at || '',
    updatedAt: raw.updatedAt || raw.updated_at || '',
    studentCount: raw.studentCount ?? 0,
  };
}

export const classService = {
  async getAll(): Promise<ClassInfo[]> {
    const data = await api.get<any[]>('/classes');
    return data.map(mapClass);
  },

  async getById(id: string): Promise<ClassInfo & { students: ClassStudent[] }> {
    const data = await api.get<any>(`/classes/${encodeURIComponent(id)}`);
    return {
      ...mapClass(data),
      students: (data.students || []).map((s: any) => ({
        enrollmentRecordId: s.enrollmentRecordId || s.id || '',
        enrolledAt: s.enrolledAt || '',
        id: s.id,
        name: s.name,
        email: s.email,
        enrollmentId: s.enrollmentId || '',
        department: s.department || '',
        avatar: s.avatar || '',
        status: s.status || 'active',
      })),
    };
  },

  async create(input: {
    name: string;
    code: string;
    description?: string;
    department?: string;
    teacherId: string;
  }): Promise<ClassInfo> {
    const data = await api.post<any>('/classes', input);
    return mapClass(data);
  },

  async update(id: string, updates: Partial<{
    name: string;
    code: string;
    description: string;
    department: string;
    teacherId: string;
    status: string;
  }>): Promise<ClassInfo> {
    const data = await api.put<any>(`/classes/${encodeURIComponent(id)}`, updates);
    return mapClass(data);
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/classes/${encodeURIComponent(id)}`);
  },

  async getStudents(classId: string): Promise<ClassStudent[]> {
    const data = await api.get<any[]>(`/classes/${encodeURIComponent(classId)}/students`);
    return data.map((s: any) => ({
      enrollmentRecordId: s.enrollmentRecordId || '',
      enrolledAt: s.enrolledAt || '',
      id: s.id,
      name: s.name,
      email: s.email,
      enrollmentId: s.enrollmentId || '',
      department: s.department || '',
      avatar: s.avatar || '',
      status: s.status || 'active',
    }));
  },

  async enrollStudents(classId: string, studentIds: string[]): Promise<{
    enrolled: number;
    skippedInvalid: string[];
    skippedDuplicates: number;
    message: string;
  }> {
    return api.post(`/classes/${encodeURIComponent(classId)}/enroll`, { studentIds });
  },

  async unenrollStudent(classId: string, studentId: string): Promise<void> {
    await api.delete(`/classes/${encodeURIComponent(classId)}/enroll/${encodeURIComponent(studentId)}`);
  },

  async assignAssessment(classId: string, assessmentId: string): Promise<void> {
    await api.post(`/classes/${encodeURIComponent(classId)}/assessments`, { assessmentId });
  },

  async unassignAssessment(classId: string, assessmentId: string): Promise<void> {
    await api.delete(`/classes/${encodeURIComponent(classId)}/assessments/${encodeURIComponent(assessmentId)}`);
  },

  async getAssessments(classId: string): Promise<any[]> {
    return api.get(`/classes/${encodeURIComponent(classId)}/assessments`);
  },
};
