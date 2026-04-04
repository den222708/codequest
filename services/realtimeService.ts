/**
 * Real-time Service — Socket.IO client for proctored assessment monitoring.
 *
 * Two usage modes:
 *   1. Student: connects to /proctoring, sends heartbeats/violations, receives instructions
 *   2. Admin: connects to /admin, subscribes to assessment monitoring feeds
 *
 * For 'standard' mode assessments, this service is NOT used — violations are
 * logged via REST API only.
 */

import { io, Socket } from 'socket.io-client';
import { LiveUpdate, ActiveSession } from '../types';
import type { ViolationType } from './monitoringService';
import { tokenStore } from './apiClient';

export type { ViolationType };

// ── Types matching backend monitoringTypes.ts ───────────────────────────

interface HeartbeatPayload {
  attemptId: string;
  assessmentId: string;
  seq: number;
  timestamp: number;
  questionIndex: number;
  isFullscreen: boolean;
  isOnline: boolean;
}

interface ViolationPayload {
  attemptId: string;
  assessmentId: string;
  type: ViolationType;
  detail?: string;
  timestamp: number;
}

interface StudentJoinPayload {
  attemptId: string;
  assessmentId: string;
  studentId: string;
  studentName: string;
  userAgent: string;
}

interface InstructionPayload {
  id: string;
  type: 'warning' | 'terminate' | 'message' | 'lock';
  message: string;
  timestamp: number;
}

interface MonitoringSessionState {
  socketId: string;
  attemptId: string;
  assessmentId: string;
  studentId: string;
  studentName: string;
  joinedAt: string;
  lastHeartbeat: string;
  lastSeq: number;
  gapCount: number;
  questionIndex: number;
  isFullscreen: boolean;
  isOnline: boolean;
  status: 'active' | 'idle' | 'suspicious' | 'flagged' | 'disconnected';
  violations: {
    tabSwitches: number;
    pasteCount: number;
    fullscreenExits: number;
    clipboardAccess: number;
    offlineEvents: number;
    focusLost: number;
    devtoolsOpen: number;
    total: number;
  };
}

interface MonitoringDashboardUpdate {
  assessmentId: string;
  sessions: MonitoringSessionState[];
  timestamp: string;
}

// ── Callback types ──────────────────────────────────────────────────────

type UpdateCallback = (update: LiveUpdate) => void;
type SessionCallback = (sessions: ActiveSession[]) => void;
type InstructionCallback = (instruction: InstructionPayload) => void;
type DashboardCallback = (update: MonitoringDashboardUpdate) => void;
type ViolationAlertCallback = (data: {
  assessmentId: string;
  attemptId: string;
  studentName: string;
  violation: ViolationPayload;
}) => void;

// ── API base URL ────────────────────────────────────────────────────────

function getBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_BASE_URL as string | undefined;
  if (envUrl) {
    // Strip /api/v1 suffix — Socket.IO connects to the root
    return envUrl.replace(/\/api\/v1\/?$/, '');
  }
  return 'http://localhost:3001';
}

function getSocketToken(): string | null {
  return tokenStore.getAccessToken();
}

// ── Student Client ──────────────────────────────────────────────────────

class StudentMonitoringClient {
  private socket: Socket | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private heartbeatSeq = 0;
  private attemptId = '';
  private assessmentId = '';
  private questionIndex = 0;
  private isFullscreen = true;
  private isOnline = true;
  private instructionCallbacks: InstructionCallback[] = [];

  /** Connect to the /proctoring namespace and join a session */
  connect(payload: StudentJoinPayload): void {
    if (this.socket?.connected) return;

    const token = getSocketToken();
    if (!token) {
      console.warn('[ws/student] cannot connect without access token');
      return;
    }

    this.attemptId = payload.attemptId;
    this.assessmentId = payload.assessmentId;

    this.socket = io(`${getBaseUrl()}/proctoring`, {
      transports: ['websocket'],
      withCredentials: true,
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    this.socket.on('connect', () => {
      console.log('[ws/student] connected');
      this.socket!.emit('student:join', payload);
      this.startHeartbeat();
    });

    this.socket.on('instruction', (instruction: InstructionPayload) => {
      // Acknowledge receipt
      this.socket!.emit('instruction:ack', {
        instructionId: instruction.id,
        timestamp: Date.now(),
      });
      // Notify listeners
      for (const cb of this.instructionCallbacks) {
        cb(instruction);
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[ws/student] disconnected:', reason);
      this.stopHeartbeat();
    });

    this.socket.on('connect_error', (err) => {
      console.error('[ws/student] connection error:', err.message);
    });
  }

  /** Disconnect from proctoring */
  disconnect(reason: 'submit' | 'timeout' | 'disconnect' = 'disconnect'): void {
    this.stopHeartbeat();
    if (this.socket) {
      this.socket.emit('student:leave', {
        attemptId: this.attemptId,
        assessmentId: this.assessmentId,
        reason,
      });
      this.socket.disconnect();
      this.socket = null;
    }
    this.heartbeatSeq = 0;
  }

  /** Report a violation to the server */
  reportViolation(type: ViolationType, detail?: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('student:violation', {
      attemptId: this.attemptId,
      assessmentId: this.assessmentId,
      type,
      detail,
      timestamp: Date.now(),
    });
  }

  /** Update local state for heartbeat data */
  updateState(updates: { questionIndex?: number; isFullscreen?: boolean; isOnline?: boolean }): void {
    if (updates.questionIndex !== undefined) this.questionIndex = updates.questionIndex;
    if (updates.isFullscreen !== undefined) this.isFullscreen = updates.isFullscreen;
    if (updates.isOnline !== undefined) this.isOnline = updates.isOnline;
  }

  /** Subscribe to instructions from the server */
  onInstruction(callback: InstructionCallback): () => void {
    this.instructionCallbacks.push(callback);
    return () => {
      this.instructionCallbacks = this.instructionCallbacks.filter(cb => cb !== callback);
    };
  }

  /** Check if connected */
  getIsConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    // Send heartbeat every 10 seconds
    this.heartbeatInterval = setInterval(() => {
      if (!this.socket?.connected) return;
      this.heartbeatSeq++;
      const payload: HeartbeatPayload = {
        attemptId: this.attemptId,
        assessmentId: this.assessmentId,
        seq: this.heartbeatSeq,
        timestamp: Date.now(),
        questionIndex: this.questionIndex,
        isFullscreen: this.isFullscreen,
        isOnline: this.isOnline,
      };
      this.socket.emit('student:heartbeat', payload);
    }, 10_000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}

// ── Admin Client ────────────────────────────────────────────────────────

class AdminMonitoringClient {
  private socket: Socket | null = null;
  private subscribedAssessments = new Set<string>();
  private dashboardCallbacks: DashboardCallback[] = [];
  private violationAlertCallbacks: ViolationAlertCallback[] = [];
  private joinCallbacks: Array<(data: { assessmentId: string; session: MonitoringSessionState }) => void> = [];
  private leaveCallbacks: Array<(data: { assessmentId: string; attemptId: string; reason: string }) => void> = [];

  /** Connect to the /admin namespace */
  connect(): boolean {
    if (this.socket?.connected) return true;

    const token = getSocketToken();
    if (!token) {
      console.warn('[ws/admin] cannot connect without access token');
      return false;
    }

    this.socket = io(`${getBaseUrl()}/admin`, {
      transports: ['websocket'],
      withCredentials: true,
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('[ws/admin] connected');
      // Re-subscribe to assessments if reconnecting
      for (const assessmentId of this.subscribedAssessments) {
        this.socket!.emit('monitor:subscribe', { assessmentId });
      }
    });

    this.socket.on('monitor:update', (update: MonitoringDashboardUpdate) => {
      for (const cb of this.dashboardCallbacks) cb(update);
    });

    this.socket.on('monitor:violation', (data: any) => {
      for (const cb of this.violationAlertCallbacks) cb(data);
    });

    this.socket.on('monitor:join', (data: any) => {
      for (const cb of this.joinCallbacks) cb(data);
    });

    this.socket.on('monitor:leave', (data: any) => {
      for (const cb of this.leaveCallbacks) cb(data);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[ws/admin] disconnected:', reason);
    });

    return true;
  }

  /** Disconnect from admin monitoring */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.subscribedAssessments.clear();
  }

  /** Subscribe to live updates for an assessment */
  subscribe(assessmentId: string): void {
    this.subscribedAssessments.add(assessmentId);
    if (this.socket?.connected) {
      this.socket.emit('monitor:subscribe', { assessmentId });
    }
  }

  /** Unsubscribe from an assessment */
  unsubscribe(assessmentId: string): void {
    this.subscribedAssessments.delete(assessmentId);
    if (this.socket?.connected) {
      this.socket.emit('monitor:unsubscribe', { assessmentId });
    }
  }

  /** Send an instruction to a student */
  sendInstruction(attemptId: string, type: InstructionPayload['type'], message: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('instruction:send', {
      attemptId,
      instruction: { type, message },
    });
  }

  /** Subscribe to dashboard updates */
  onDashboardUpdate(callback: DashboardCallback): () => void {
    this.dashboardCallbacks.push(callback);
    return () => { this.dashboardCallbacks = this.dashboardCallbacks.filter(cb => cb !== callback); };
  }

  /** Subscribe to violation alerts */
  onViolationAlert(callback: ViolationAlertCallback): () => void {
    this.violationAlertCallbacks.push(callback);
    return () => { this.violationAlertCallbacks = this.violationAlertCallbacks.filter(cb => cb !== callback); };
  }

  /** Subscribe to student join events */
  onStudentJoin(callback: (data: { assessmentId: string; session: MonitoringSessionState }) => void): () => void {
    this.joinCallbacks.push(callback);
    return () => { this.joinCallbacks = this.joinCallbacks.filter(cb => cb !== callback); };
  }

  /** Subscribe to student leave events */
  onStudentLeave(callback: (data: { assessmentId: string; attemptId: string; reason: string }) => void): () => void {
    this.leaveCallbacks.push(callback);
    return () => { this.leaveCallbacks = this.leaveCallbacks.filter(cb => cb !== callback); };
  }

  /** Check if connected */
  getIsConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}

// ── Backward-compatible RealtimeService facade ──────────────────────────

/**
 * Legacy facade that wraps both StudentMonitoringClient and AdminMonitoringClient.
 * Preserves the existing API used by `useRealtimeUpdates` and `AdminContext`.
 */
class RealtimeService {
  readonly student = new StudentMonitoringClient();
  readonly admin = new AdminMonitoringClient();

  private updateCallbacks: UpdateCallback[] = [];
  private sessionCallbacks: SessionCallback[] = [];
  private activeSessions: Map<string, ActiveSession> = new Map();
  private isConnected = false;

  /** Connect admin monitoring (for backward compatibility) */
  connect(): void {
    if (this.isConnected) return;
    const started = this.admin.connect();
    if (!started) return;
    this.isConnected = true;

    // Wire admin dashboard updates to legacy ActiveSession format
    this.admin.onDashboardUpdate((update) => {
      this.syncSessionsFromDashboard(update);
    });

    this.admin.onStudentJoin(({ session }) => {
      this.activeSessions.set(session.attemptId, this.toLegacySession(session));
      this.emitSessionUpdate();
    });

    this.admin.onStudentLeave(({ attemptId }) => {
      this.activeSessions.delete(attemptId);
      this.emitSessionUpdate();
    });
  }

  /** Disconnect all clients */
  disconnect(): void {
    if (!this.isConnected) return;
    this.isConnected = false;
    this.admin.disconnect();
    this.student.disconnect();
  }

  /** Subscribe to LiveUpdate events (legacy) */
  onUpdate(callback: UpdateCallback): () => void {
    this.updateCallbacks.push(callback);
    return () => { this.updateCallbacks = this.updateCallbacks.filter(cb => cb !== callback); };
  }

  /** Subscribe to session list changes (legacy) */
  onSessionUpdate(callback: SessionCallback): () => void {
    this.sessionCallbacks.push(callback);
    return () => { this.sessionCallbacks = this.sessionCallbacks.filter(cb => cb !== callback); };
  }

  /** Get all active sessions (legacy) */
  getActiveSessions(): ActiveSession[] {
    return Array.from(this.activeSessions.values());
  }

  /** Get sessions for a specific assessment (legacy) */
  getAssessmentSessions(assessmentId: string): ActiveSession[] {
    return Array.from(this.activeSessions.values())
      .filter(s => s.assessmentId === assessmentId);
  }

  /** Check connection state */
  isActive(): boolean {
    return this.isConnected;
  }

  // ── Private ──────────────────────────────────────────────────

  private syncSessionsFromDashboard(update: MonitoringDashboardUpdate): void {
    // Convert MonitoringSessionState → ActiveSession
    for (const ws of update.sessions) {
      this.activeSessions.set(ws.attemptId, this.toLegacySession(ws));
    }

    this.emitSessionUpdate();
  }

  private toLegacySession(ws: MonitoringSessionState): ActiveSession {
    return {
      id: ws.attemptId,
      assessmentId: ws.assessmentId,
      studentId: ws.studentId,
      studentName: ws.studentName,
      avatar: '',
      startedAt: ws.joinedAt,
      currentQuestion: ws.questionIndex + 1,
      totalQuestions: 0,
      submittedQuestions: 0,
      status: ws.status === 'flagged' || ws.status === 'suspicious'
        ? 'suspicious'
        : ws.status === 'disconnected'
          ? 'completed'
          : ws.status === 'idle'
            ? 'idle'
            : 'active',
      lastActivity: ws.lastHeartbeat,
      ipAddress: '',
      tabSwitches: ws.violations.tabSwitches,
      copyPasteCount: ws.violations.pasteCount,
    };
  }

  private emitSessionUpdate(): void {
    const sessions = Array.from(this.activeSessions.values());
    for (const cb of this.sessionCallbacks) cb(sessions);
  }
}

// ── Singleton exports ───────────────────────────────────────────────────

export const realtimeService = new RealtimeService();

/**
 * Hook-like helper for components (non-reactive — for React hooks, wrap in context).
 */
export const useRealtimeUpdates = (
  assessmentId?: string,
): {
  isConnected: boolean;
  sessions: ActiveSession[];
  connect: () => void;
  disconnect: () => void;
} => {
  return {
    isConnected: realtimeService.isActive(),
    sessions: assessmentId
      ? realtimeService.getAssessmentSessions(assessmentId)
      : realtimeService.getActiveSessions(),
    connect: () => realtimeService.connect(),
    disconnect: () => realtimeService.disconnect(),
  };
};

export default realtimeService;
