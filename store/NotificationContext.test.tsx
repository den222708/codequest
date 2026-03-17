import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { NotificationProvider, useNotifications } from './NotificationContext';

// Mock useAuth — NotificationProvider depends on AuthContext being above it.
// We mock the module so useAuth returns a minimal stub.
vi.mock('./AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: false,
    currentUser: null,
    isDemoMode: false,
    _addNotification: { current: null },
    _onLoginSuccess: { current: [] },
  }),
}));

// Mock apiClient so no real HTTP calls are made
vi.mock('../services/apiClient', () => ({
  api: {
    get: vi.fn().mockResolvedValue([]),
    put: vi.fn().mockResolvedValue({}),
    delete: vi.fn().mockResolvedValue({}),
  },
  tokenStore: {
    getAccessToken: vi.fn().mockReturnValue(null),
  },
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(NotificationProvider, null, children);
}

describe('NotificationContext', () => {
  describe('useNotifications hook', () => {
    it('throws when used outside provider', () => {
      // Need a clean test without the mock — but since we can't un-mock, just
      // verify the hook throws *something* when no provider wraps it.
      // The mock for useAuth doesn't matter here since Provider isn't rendered.
      expect(() => {
        renderHook(() => useNotifications());
      }).toThrow('useNotifications must be used within NotificationProvider');
    });

    it('starts with empty notifications and zero unreadCount', () => {
      const { result } = renderHook(() => useNotifications(), { wrapper });
      expect(result.current.notifications).toEqual([]);
      expect(result.current.unreadCount).toBe(0);
    });

    it('addNotification adds a client-side notification', () => {
      const { result } = renderHook(() => useNotifications(), { wrapper });

      act(() => {
        result.current.addNotification({
          type: 'info',
          title: 'Test',
          message: 'Hello',
        });
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0].title).toBe('Test');
      expect(result.current.notifications[0].message).toBe('Hello');
      expect(result.current.notifications[0].type).toBe('info');
      expect(result.current.notifications[0].read).toBe(false);
      expect(result.current.notifications[0].id).toMatch(/^client-/);
      expect(result.current.notifications[0].createdAt).toBeTruthy();
      expect(result.current.unreadCount).toBe(1);
    });

    it('new notifications are prepended', () => {
      const { result } = renderHook(() => useNotifications(), { wrapper });

      act(() => {
        result.current.addNotification({ type: 'info', title: 'First', message: '1' });
      });
      act(() => {
        result.current.addNotification({ type: 'info', title: 'Second', message: '2' });
      });

      expect(result.current.notifications[0].title).toBe('Second');
      expect(result.current.notifications[1].title).toBe('First');
    });

    it('markNotificationRead marks a specific client notification', () => {
      const { result } = renderHook(() => useNotifications(), { wrapper });

      act(() => {
        result.current.addNotification({ type: 'success', title: 'A', message: '1' });
      });
      act(() => {
        result.current.addNotification({ type: 'error', title: 'B', message: '2' });
      });

      expect(result.current.notifications).toHaveLength(2);

      const idToMark = result.current.notifications[0].id; // 'B' (prepended)

      act(() => {
        result.current.markNotificationRead(idToMark);
      });

      const marked = result.current.notifications.find(n => n.id === idToMark);
      expect(marked?.read).toBe(true);
      const unmarked = result.current.notifications.find(n => n.id !== idToMark);
      expect(unmarked?.read).toBe(false);
    });

    it('clearNotifications marks all as read', () => {
      const { result } = renderHook(() => useNotifications(), { wrapper });

      act(() => {
        result.current.addNotification({ type: 'info', title: 'A', message: '1' });
        result.current.addNotification({ type: 'warning', title: 'B', message: '2' });
        result.current.addNotification({ type: 'error', title: 'C', message: '3' });
      });

      act(() => {
        result.current.clearNotifications();
      });

      expect(result.current.notifications.every(n => n.read)).toBe(true);
      expect(result.current.notifications).toHaveLength(3);
      expect(result.current.unreadCount).toBe(0);
    });

    it('deleteNotification removes a client notification', () => {
      const { result } = renderHook(() => useNotifications(), { wrapper });

      act(() => {
        result.current.addNotification({ type: 'info', title: 'A', message: '1' });
      });

      const id = result.current.notifications[0].id;

      act(() => {
        result.current.deleteNotification(id);
      });

      expect(result.current.notifications).toHaveLength(0);
    });

    it('markNotificationRead with invalid id does nothing', () => {
      const { result } = renderHook(() => useNotifications(), { wrapper });

      act(() => {
        result.current.addNotification({ type: 'info', title: 'A', message: '1' });
      });

      act(() => {
        result.current.markNotificationRead('nonexistent-id');
      });

      expect(result.current.notifications[0].read).toBe(false);
    });
  });
});
