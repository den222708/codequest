import api from './apiClient';
import type { User } from '../types';

function mapUser(raw: any): User {
  return {
    id: raw.id || raw.userId || raw.user_id,
    name: raw.name,
    email: raw.email,
    role: raw.role,
    avatar: raw.avatar || raw.avatar_url || '',
    department: raw.department || '',
    enrollmentId: raw.enrollmentId || raw.enrollment_id || '',
    employeeId: raw.employeeId || raw.employee_id || '',
    status: raw.status || 'active',
    createdAt: raw.createdAt || raw.created_at || '',
    lastLogin: raw.lastLogin || raw.last_login || undefined,
  };
}

export interface CreateUserResult {
  user: User;
  generatedPassword?: string;
}

export interface BulkCreateResult {
  created: CreateUserResult[];
  failed: { email: string; error: string }[];
}

export const userService = {
  async getAll(filters?: { role?: string; status?: string; search?: string }): Promise<User[]> {
    const params = new URLSearchParams();
    if (filters?.role) params.set('role', filters.role);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.search) params.set('search', filters.search);
    const qs = params.toString();
    const data = await api.get<any[]>(`/users${qs ? `?${qs}` : ''}`);
    return data.map(mapUser);
  },

  async getById(id: string): Promise<User> {
    const data = await api.get(`/users/${encodeURIComponent(id)}`);
    return mapUser(data);
  },

  async create(input: {
    name: string;
    email: string;
    role: string;
    department?: string;
    enrollmentId?: string;
  }): Promise<CreateUserResult> {
    const data = await api.post<any>('/admin/users', {
      name: input.name,
      email: input.email,
      role: input.role === 'professor' ? 'teacher' : input.role,
      department: input.department || undefined,
      enrollmentId: input.enrollmentId || undefined,
    });
    return {
      user: mapUser(data),
      generatedPassword: data.generatedPassword,
    };
  },

  async createBulk(users: {
    name: string;
    email: string;
    role: string;
    department?: string;
    enrollmentId?: string;
  }[]): Promise<BulkCreateResult> {
    const data = await api.post<any>('/admin/users/bulk', {
      users: users.map(u => ({
        ...u,
        role: u.role === 'professor' ? 'teacher' : u.role,
      })),
    });
    return {
      created: (data.created || []).map((r: any) => ({
        user: mapUser(r),
        generatedPassword: r.generatedPassword,
      })),
      failed: data.failed || [],
    };
  },

  async update(id: string, updates: Partial<User>): Promise<User> {
    const body: Record<string, unknown> = {};
    if (updates.name) body.name = updates.name;
    if (updates.department !== undefined) body.department = updates.department;
    if (updates.enrollmentId !== undefined) body.enrollmentId = updates.enrollmentId;
    if (updates.status) body.status = updates.status;
    if (updates.role) body.role = updates.role === 'professor' ? 'teacher' : updates.role;
    const data = await api.put(`/users/${encodeURIComponent(id)}`, body);
    return mapUser(data);
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/users/${encodeURIComponent(id)}`);
  },
};
