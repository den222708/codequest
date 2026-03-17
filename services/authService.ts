import { api, tokenStore, ApiError } from './apiClient';
import type { User, Role } from '../types';

export interface LoginResponse {
  user: User;
  session: { accessToken: string; refreshToken: string; expiresAt?: number };
}

export const authService = {
  async login(email: string, password: string): Promise<User> {
    const data = await api.post<LoginResponse>('/auth/login', { email, password });
    tokenStore.setTokens(data.session.accessToken, data.session.refreshToken);
    const user = mapUser(data.user);
    tokenStore.setUser(user);
    return user;
  },

  async signup(name: string, email: string, password: string, role: Role = 'student'): Promise<User> {
    const data = await api.post<LoginResponse>('/auth/signup', {
      name,
      email,
      password,
      role: role === 'professor' ? 'teacher' : role,
    });
    tokenStore.setTokens(data.session.accessToken, data.session.refreshToken);
    const user = mapUser(data.user);
    tokenStore.setUser(user);
    return user;
  },

  async logout(): Promise<void> {
    const refreshToken = tokenStore.getRefreshToken();
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch {
      // ignore logout errors
    }
    tokenStore.clear();
  },

  /** Restore session from stored tokens */
  getStoredUser(): User | null {
    const token = tokenStore.getAccessToken();
    if (!token) return null;
    const user = tokenStore.getUser();
    return user;
  },

  async forgotPassword(email: string): Promise<void> {
    await api.post('/auth/forgot-password', { email });
  },
};

function mapUser(raw: any): User {
  const rawRole = raw.role?.toLowerCase();
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    role: (rawRole === 'teacher' ? 'professor' : rawRole) as Role,
    avatar: raw.avatar || raw.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
    department: raw.department,
    enrollmentId: raw.enrollmentId,
    employeeId: raw.employeeId,
    status: raw.status?.toLowerCase() || 'active',
    createdAt: raw.createdAt || new Date().toISOString(),
    lastLogin: raw.lastLogin,
  };
}

export default authService;
