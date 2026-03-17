/**
 * Monitoring Events — shared types for WebSocket proctoring system.
 *
 * SEB-inspired architecture:
 * - Student clients emit events to the proctoring namespace
 * - Server aggregates, persists, and forwards to admin namespace
 * - Heartbeat with sequential counter enables gap detection
 * - Two modes: 'standard' (REST-only, no WS) and 'proctored' (full WS monitoring)
 */

// ── Client → Server Events ──────────────────────────────────────────────

export interface HeartbeatPayload {
  attemptId: string;
  assessmentId: string;
  seq: number;            // sequential counter, starts at 1
  timestamp: number;      // Date.now() on client
  questionIndex: number;
  isFullscreen: boolean;
  isOnline: boolean;
}

export type ViolationType =
  | 'tab_switch'
  | 'paste_detected'
  | 'fullscreen_exit'
  | 'clipboard_access'
  | 'offline'
  | 'focus_lost'
  | 'devtools_open';

export interface ViolationPayload {
  attemptId: string;
  assessmentId: string;
  type: ViolationType;
  detail?: string;        // additional context
  timestamp: number;
}

export interface StudentJoinPayload {
  attemptId: string;
  assessmentId: string;
  studentId: string;
  studentName: string;
  userAgent: string;
}

export interface StudentLeavePayload {
  attemptId: string;
  assessmentId: string;
  reason: 'submit' | 'timeout' | 'disconnect';
}

// ── Server → Client Events ──────────────────────────────────────────────

export interface InstructionPayload {
  id: string;
  type: 'warning' | 'terminate' | 'message' | 'lock';
  message: string;
  timestamp: number;
}

export interface InstructionAckPayload {
  instructionId: string;
  timestamp: number;
}

// ── Server → Admin Events ───────────────────────────────────────────────

export interface MonitoringSessionState {
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
  violations: ViolationSummary;
}

export interface ViolationSummary {
  tabSwitches: number;
  pasteCount: number;
  fullscreenExits: number;
  clipboardAccess: number;
  offlineEvents: number;
  focusLost: number;
  devtoolsOpen: number;
  total: number;
}

export interface MonitoringDashboardUpdate {
  assessmentId: string;
  sessions: MonitoringSessionState[];
  timestamp: string;
}

// ── DB Persistence ──────────────────────────────────────────────────────

export interface MonitoringEventRow {
  id?: string;
  attempt_id: string;
  assessment_id: string;
  student_id: string;
  event_type: 'heartbeat' | 'violation' | 'join' | 'leave' | 'instruction' | 'instruction_ack';
  payload: Record<string, unknown>;
  created_at?: string;
}

// ── Socket.IO Event Maps ────────────────────────────────────────────────

/** Client (student) → Server */
export interface ClientToServerEvents {
  'student:join': (payload: StudentJoinPayload) => void;
  'student:heartbeat': (payload: HeartbeatPayload) => void;
  'student:violation': (payload: ViolationPayload) => void;
  'student:leave': (payload: StudentLeavePayload) => void;
  'instruction:ack': (payload: InstructionAckPayload) => void;
}

/** Server → Client (student) */
export interface ServerToClientEvents {
  'instruction': (payload: InstructionPayload) => void;
  'session:status': (payload: { status: string; message?: string }) => void;
}

/** Admin → Server */
export interface AdminToServerEvents {
  'monitor:subscribe': (payload: { assessmentId: string }) => void;
  'monitor:unsubscribe': (payload: { assessmentId: string }) => void;
  'instruction:send': (payload: { attemptId: string; instruction: Omit<InstructionPayload, 'id' | 'timestamp'> }) => void;
}

/** Server → Admin */
export interface ServerToAdminEvents {
  'monitor:update': (payload: MonitoringDashboardUpdate) => void;
  'monitor:violation': (payload: { assessmentId: string; attemptId: string; studentName: string; violation: ViolationPayload }) => void;
  'monitor:join': (payload: { assessmentId: string; session: MonitoringSessionState }) => void;
  'monitor:leave': (payload: { assessmentId: string; attemptId: string; reason: string }) => void;
}
