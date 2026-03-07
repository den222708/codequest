/**
 * API Client for CodeQuest Backend
 * Handles all HTTP requests with JWT auth and token refresh
 */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD
    ? 'https://bennett-api.codequest.qzz.io/api/v1'
    : 'http://localhost:3001/api/v1');

// Token storage
const TOKEN_KEY = 'cq_access_token';
const REFRESH_KEY = 'cq_refresh_token';
const USER_KEY = 'cq_user';

export const tokenStore = {
  getAccessToken: () => localStorage.getItem(TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_KEY),
  getUser: () => {
    const u = localStorage.getItem(USER_KEY);
    return u ? JSON.parse(u) : null;
  },
  setTokens: (access: string, refresh: string) => {
    localStorage.setItem(TOKEN_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  setUser: (user: any) => {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

// Generic API error
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

// Attempt to refresh the access token
async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = tokenStore.getRefreshToken();
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    const tokens = data.data?.tokens || data.tokens;
    if (tokens?.accessToken) {
      tokenStore.setTokens(tokens.accessToken, tokens.refreshToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// Core fetch wrapper
async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const token = tokenStore.getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  // Handle 401 with token refresh
  if (res.status === 401 && retry) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      return apiFetch<T>(path, options, false);
    }
    // Refresh failed — clear tokens
    tokenStore.clear();
    throw new ApiError(401, 'Session expired. Please log in again.');
  }

  const body = await res.json().catch(() => null);

  if (!res.ok) {
    const msg = body?.error || body?.message || `Request failed with status ${res.status}`;
    throw new ApiError(res.status, msg);
  }

  // Backend wraps in { success, data, error, timestamp } envelope
  return body?.data !== undefined ? body.data : body;
}

// Convenience methods
export const api = {
  get: <T = any>(path: string, options: Omit<RequestInit, 'method'> = {}) =>
    apiFetch<T>(path, { ...options, method: 'GET' }),
  post: <T = any>(path: string, data?: any, options: Omit<RequestInit, 'method' | 'body'> = {}) =>
    apiFetch<T>(path, {
      ...options,
      method: 'POST',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),
  put: <T = any>(path: string, data?: any, options: Omit<RequestInit, 'method' | 'body'> = {}) =>
    apiFetch<T>(path, {
      ...options,
      method: 'PUT',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    }),
  delete: <T = any>(path: string, options: Omit<RequestInit, 'method'> = {}) =>
    apiFetch<T>(path, { ...options, method: 'DELETE' }),
};

export default api;
