import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, ClassInfo, SystemLog, SystemHealth, Backup, LeaderboardEntry, PlagiarismResult, PlagiarismScanSummary, ActiveSession } from '../types';
import { userService, CreateUserResult } from '../services/userService';
import { classService } from '../services/classService';
import api from '../services/apiClient';
import { useAuth } from './AuthContext';

export interface AdminContextType {
  users: User[];
  classes: ClassInfo[];
  systemLogs: SystemLog[];
  systemHealth: SystemHealth;
  backups: Backup[];
  leaderboard: LeaderboardEntry[];
  plagiarismResults: PlagiarismResult[];
  plagiarismSummary: PlagiarismScanSummary | null;
  plagiarismScanning: boolean;
  activeSessions: ActiveSession[];
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => Promise<CreateUserResult>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  loadUsers: () => Promise<void>;
  loadClasses: () => Promise<void>;
  createBackup: (options: { name: string; type: 'full' | 'incremental' | 'differential'; includes: string[] }) => Promise<void>;
  deleteBackup: (id: string) => Promise<void>;
  scanPlagiarism: (assessmentId: string, sensitivity?: 'low' | 'medium' | 'high') => Promise<void>;
  loadPlagiarismResults: (assessmentId: string) => Promise<void>;
  reviewPlagiarism: (id: string, status: 'cleared' | 'confirmed') => Promise<void>;
  addSystemLog: (log: Omit<SystemLog, 'id' | 'createdAt'>) => void;
  refreshSystemHealth: () => void;
}

const defaultHealth: SystemHealth = {
  status: 'healthy' as const,
  uptime: 0,
  timestamp: new Date().toISOString(),
  database: { connected: false },
  codeExecution: { provider: 'programiz', status: 'unknown' },
  memory: { heapUsed: 0, heapTotal: 0, rss: 0 },
  cache: { keys: 0, hits: 0, misses: 0 },
  nodeVersion: '',
};

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>(defaultHealth);
  const [backups, setBackups] = useState<Backup[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [plagiarismResults, setPlagiarismResults] = useState<PlagiarismResult[]>([]);
  const [plagiarismSummary, setPlagiarismSummary] = useState<PlagiarismScanSummary | null>(null);
  const [plagiarismScanning, setPlagiarismScanning] = useState(false);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>([]);

  const { currentUser, _onLoginSuccess, _addNotification } = useAuth();

  // Load admin data on login
  useEffect(() => {
    const handler = (user: { role: string } & Record<string, unknown>) => {
      const isAdmin = user.role === 'admin';
      if (isAdmin) {
        userService.getAll().then(data => setUsers(data)).catch(() => {});
        api.get('/system/logs?limit=100').then((data: any) => setSystemLogs(Array.isArray(data) ? data : [])).catch(() => {});
        api.get('/system/stats').then((data: any) => {
          if (Array.isArray(data?.leaderboard)) setLeaderboard(data.leaderboard);
          if (Array.isArray(data?.activeSessions)) setActiveSessions(data.activeSessions);
        }).catch(() => {});
      }
      if (isAdmin || user.role === 'professor') {
        classService.getAll().then(data => setClasses(data)).catch(() => {});
      }
    };
    _onLoginSuccess.current.push(handler as (user: any) => void);
    return () => {
      _onLoginSuccess.current = _onLoginSuccess.current.filter(h => h !== (handler as any));
    };
  }, [_onLoginSuccess]);

  const loadUsers = useCallback(async () => {
    try {
      const data = await userService.getAll();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  }, []);

  const addUser = useCallback(async (user: Omit<User, 'id' | 'createdAt'>): Promise<CreateUserResult> => {
    const result = await userService.create({
      name: user.name,
      email: user.email,
      role: user.role as string,
      department: user.department,
      enrollmentId: user.enrollmentId || undefined,
    });
    await loadUsers();
    return result;
  }, [loadUsers]);

  const updateUser = useCallback(async (id: string, updates: Partial<User>): Promise<void> => {
    try {
      const updated = await userService.update(id, updates);
      setUsers(prev => prev.map(u => u.id === id ? updated : u));
    } catch (err) {
      console.error('Failed to update user:', err);
      throw err;
    }
  }, []);

  const deleteUser = useCallback(async (id: string): Promise<void> => {
    try {
      await userService.remove(id);
      setUsers(prev => prev.filter(u => u.id !== id));
      _addNotification.current?.({ type: 'success', title: 'User Deleted', message: 'User account has been removed.' });
    } catch (err) {
      console.error('Failed to delete user:', err);
      throw err;
    }
  }, [_addNotification]);

  const loadClasses = useCallback(async () => {
    try {
      const data = await classService.getAll();
      setClasses(data);
    } catch (err) {
      console.error('Failed to load classes:', err);
    }
  }, []);

  const createBackup = useCallback(async (options: { name: string; type: 'full' | 'incremental' | 'differential'; includes: string[] }) => {
    try {
      const created = await api.post('/system/backups', options);
      const newBackup: Backup = {
        id: created.id,
        name: created.name,
        type: created.type,
        size: created.size ?? 0,
        status: created.status ?? 'completed',
        createdAt: created.createdAt,
        createdBy: created.createdBy,
        includes: created.includes ?? options.includes,
        completedAt: created.completedAt,
      };
      setBackups(prev => [newBackup, ...prev]);
      _addNotification.current?.({ type: 'success', title: 'Backup Completed', message: `"${options.name}" has been created successfully.` });
    } catch {
      _addNotification.current?.({ type: 'error', title: 'Backup Failed', message: `Failed to create backup "${options.name}".` });
    }
  }, [_addNotification]);

  const deleteBackup = useCallback(async (id: string) => {
    try {
      await api.delete(`/system/backups/${id}`);
      setBackups(prev => prev.filter(b => b.id !== id));
    } catch {
      _addNotification.current?.({ type: 'error', title: 'Delete Failed', message: 'Failed to delete backup.' });
    }
  }, [_addNotification]);

  const reviewPlagiarism = useCallback(async (id: string, status: 'cleared' | 'confirmed') => {
    try {
      await api.put(`/system/plagiarism/${id}/review`, { status });
      setPlagiarismResults(prev => prev.map(p =>
        p.id === id
          ? { ...p, status, flagged: status === 'confirmed', reviewedBy: currentUser?.id, reviewedAt: new Date().toISOString() }
          : p
      ));
    } catch {
      _addNotification.current?.({ type: 'error', title: 'Review Failed', message: 'Failed to persist plagiarism review.' });
    }
  }, [currentUser, _addNotification]);

  const scanPlagiarism = useCallback(async (assessmentId: string, sensitivity: 'low' | 'medium' | 'high' = 'medium') => {
    setPlagiarismScanning(true);
    try {
      const data = await api.post(`/system/plagiarism/scan/${assessmentId}`, { sensitivity });
      setPlagiarismResults(data.results ?? []);
      setPlagiarismSummary(data.summary ?? null);
      const flagged = (data.summary?.flaggedStudents ?? 0);
      _addNotification.current?.({
        type: flagged > 0 ? 'warning' : 'success',
        title: 'Plagiarism Scan Complete',
        message: flagged > 0
          ? `Found ${flagged} flagged student(s) with high similarity.`
          : 'No suspicious submissions detected.',
      });
    } catch {
      _addNotification.current?.({ type: 'error', title: 'Scan Failed', message: 'Plagiarism scan failed. Please try again.' });
    } finally {
      setPlagiarismScanning(false);
    }
  }, [_addNotification]);

  const loadPlagiarismResults = useCallback(async (assessmentId: string) => {
    try {
      const data = await api.get(`/system/plagiarism/${assessmentId}`);
      setPlagiarismResults(data as PlagiarismResult[]);
    } catch {
      console.error('Failed to load plagiarism results');
    }
  }, []);

  const addSystemLog = useCallback((_log: Omit<SystemLog, 'id' | 'createdAt'>) => {
    // No-op: system logs are persisted server-side via activity_logs
  }, []);

  const refreshSystemHealth = useCallback(async () => {
    try {
      const data = await api.get('/system/health');
      setSystemHealth({
        status: data.status ?? 'healthy',
        uptime: data.uptime ?? 0,
        timestamp: data.timestamp ?? new Date().toISOString(),
        database: data.database ?? { connected: false },
        codeExecution: data.codeExecution ?? { provider: 'programiz', status: 'unknown' },
        memory: data.memory ?? { heapUsed: 0, heapTotal: 0, rss: 0 },
        cache: data.cache ?? { keys: 0, hits: 0, misses: 0 },
        nodeVersion: data.nodeVersion ?? '',
      });
    } catch {
      setSystemHealth(prev => ({
        ...prev,
        status: 'degraded' as const,
        timestamp: new Date().toISOString(),
      }));
    }
  }, []);

  return (
    <AdminContext.Provider value={{
      users,
      classes,
      systemLogs,
      systemHealth,
      backups,
      leaderboard,
      plagiarismResults,
      plagiarismSummary,
      plagiarismScanning,
      activeSessions,
      addUser,
      updateUser,
      deleteUser,
      loadUsers,
      loadClasses,
      createBackup,
      deleteBackup,
      scanPlagiarism,
      loadPlagiarismResults,
      reviewPlagiarism,
      addSystemLog,
      refreshSystemHealth,
    }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) throw new Error('useAdmin must be used within AdminProvider');
  return context;
};
