import { describe, it, expect, beforeEach } from 'vitest';
import { tokenStore, ApiError } from './apiClient';

// ── tokenStore ───────────────────────────────────────────────────────
describe('tokenStore', () => {
  beforeEach(() => localStorage.clear());

  it('returns null when no tokens are stored', () => {
    expect(tokenStore.getAccessToken()).toBeNull();
    expect(tokenStore.getRefreshToken()).toBeNull();
    expect(tokenStore.getUser()).toBeNull();
  });

  it('setTokens stores access and refresh tokens', () => {
    tokenStore.setTokens('access-123', 'refresh-456');
    expect(tokenStore.getAccessToken()).toBe('access-123');
    expect(tokenStore.getRefreshToken()).toBe('refresh-456');
  });

  it('setUser stores and retrieves user object', () => {
    const user = { id: 'u1', name: 'Alice', role: 'student' };
    tokenStore.setUser(user);
    expect(tokenStore.getUser()).toEqual(user);
  });

  it('clear removes all stored tokens and user', () => {
    tokenStore.setTokens('a', 'r');
    tokenStore.setUser({ id: 'u1' });
    tokenStore.clear();
    expect(tokenStore.getAccessToken()).toBeNull();
    expect(tokenStore.getRefreshToken()).toBeNull();
    expect(tokenStore.getUser()).toBeNull();
  });

  it('setTokens overwrites previous values', () => {
    tokenStore.setTokens('old-a', 'old-r');
    tokenStore.setTokens('new-a', 'new-r');
    expect(tokenStore.getAccessToken()).toBe('new-a');
    expect(tokenStore.getRefreshToken()).toBe('new-r');
  });
});

// ── ApiError ─────────────────────────────────────────────────────────
describe('ApiError', () => {
  it('creates error with status and message', () => {
    const err = new ApiError(404, 'Not Found');
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(404);
    expect(err.message).toBe('Not Found');
    expect(err.name).toBe('ApiError');
  });

  it('is catchable as Error', () => {
    try {
      throw new ApiError(500, 'Server Error');
    } catch (e) {
      expect(e).toBeInstanceOf(Error);
      expect((e as ApiError).status).toBe(500);
    }
  });

  it('preserves stack trace', () => {
    const err = new ApiError(403, 'Forbidden');
    expect(err.stack).toBeDefined();
    expect(err.stack).toContain('ApiError');
  });
});
