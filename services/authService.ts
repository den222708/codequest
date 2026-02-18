import { api, tokenStore, ApiError } from './apiClient';
import type { User, Role } from '../types';

export interface LoginResponse {
  user: User;
  tokens: { accessToken: string; refreshToken: string };
}

export const authService = {
  async login(email: string, password: string): Promise<User> {
    const data = await api.post<LoginResponse>('/auth/login', { email, password });
    tokenStore.setTokens(data.tokens.accessToken, data.tokens.refreshToken);
    const user = mapUser(data.user);
    tokenStore.setUser(user);
    return user;
  },

  async signup(name: string, email: string, password: string, role: Role = 'student'): Promise<User> {
    const data = await api.post<LoginResponse>('/auth/signup', {
      name,
      email,
      password,
      role: role?.toUpperCase(),
    });
    tokenStore.setTokens(data.tokens.accessToken, data.tokens.refreshToken);
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
};

function mapUser(raw: any): User {
  return {
    id: raw.id,
    name: raw.name,
    email: raw.email,
    role: raw.role?.toLowerCase() as Role,
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
