import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { Notification } from '../types';
import { api, tokenStore } from '../services/apiClient';
import { useAuth } from './AuthContext';

const POLL_INTERVAL = 30_000; // 30 seconds

export interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  deleteNotification: (id: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => void;
  refreshNotifications: () => Promise<void>;
}

/** Map backend API response (isRead) → frontend model (read) */
function mapApiNotification(n: any): Notification {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    message: n.message,
    read: n.isRead ?? n.read ?? false,
    createdAt: n.createdAt,
    link: n.link,
  };
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  // Server-side notifications (persisted in DB)
  const [serverNotifications, setServerNotifications] = useState<Notification[]>([]);
  // Client-side ephemeral notifications (toast-style, lost on refresh)
  const [clientNotifications, setClientNotifications] = useState<Notification[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const clientIdCounter = useRef(0);

  // ── Fetch from backend ──────────────────────────────────────────────
  const fetchFromServer = useCallback(async () => {
    if (!tokenStore.getAccessToken()) return;
    try {
      const data = await api.get<any[]>('/notifications?limit=100');
      setServerNotifications((data ?? []).map(mapApiNotification));
    } catch {
      // Silently fail — server may be unreachable or user just logged out
    }
  }, []);

  // ── Polling lifecycle ───────────────────────────────────────────────
  useEffect(() => {
    if (isAuthenticated) {
      // Initial fetch
      fetchFromServer();
      // Start polling
      pollRef.current = setInterval(fetchFromServer, POLL_INTERVAL);
    } else {
      // Clear on logout
      setServerNotifications([]);
      setClientNotifications([]);
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [isAuthenticated, fetchFromServer]);

  // ── Merged notifications (server first, then client ephemeral) ──────
  // Client notifications are prepended (newest first), server are already sorted by API
  const notifications = [...clientNotifications, ...serverNotifications];
  const unreadCount = notifications.filter((n) => !n.read).length;

  // ── Mark read (backend + local) ─────────────────────────────────────
  const markNotificationRead = useCallback((id: string) => {
    // Client-side notification?
    if (id.startsWith('client-')) {
      setClientNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      return;
    }
    // Server-side: optimistic update, then API call
    setServerNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    api.put(`/notifications/${id}/read`).catch(() => {
      // Revert on failure
      setServerNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: false } : n)));
    });
  }, []);

  // ── Clear all (mark all read) ───────────────────────────────────────
  const clearNotifications = useCallback(() => {
    setClientNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setServerNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    api.put('/notifications/read-all').catch(() => {
      // Best-effort; next poll will correct state
    });
  }, []);

  // ── Delete notification ─────────────────────────────────────────────
  const deleteNotification = useCallback((id: string) => {
    if (id.startsWith('client-')) {
      setClientNotifications((prev) => prev.filter((n) => n.id !== id));
      return;
    }
    setServerNotifications((prev) => prev.filter((n) => n.id !== id));
    api.delete(`/notifications/${id}`).catch(() => {
      // Next poll will re-sync
      fetchFromServer();
    });
  }, [fetchFromServer]);

  // ── Add client-side ephemeral notification (toast) ──────────────────
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `client-${Date.now()}-${++clientIdCounter.current}`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setClientNotifications((prev) => [newNotification, ...prev]);
  }, []);

  // ── Refresh (manual re-fetch) ───────────────────────────────────────
  const refreshNotifications = useCallback(async () => {
    await fetchFromServer();
  }, [fetchFromServer]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markNotificationRead,
        clearNotifications,
        deleteNotification,
        addNotification,
        refreshNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};
