/**
 * WebSocket Server — Socket.IO proctoring & admin monitoring.
 *
 * Two namespaces:
 *   /proctoring  — student clients connect here during proctored assessments
 *   /admin       — professor/admin clients subscribe to live monitoring feeds
 *
 * SEB-inspired patterns:
 *   - Heartbeat with sequential counter → gap detection
 *   - Instruction queue (server → student) with ack confirmation
 *   - Event batching: violations and heartbeats are persisted in batches
 *   - Fast/slow data split: static data on join, dynamic data via heartbeat
 */

import { Server as SocketIOServer, Socket, Namespace } from "socket.io";
import type { Server as HttpServer } from "node:http";
import { getSupabaseAdmin } from "../lib/supabase.js";
import { createChildLogger } from "../lib/logger.js";
import type { AppRole } from "../middleware/auth.js";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  AdminToServerEvents,
  ServerToAdminEvents,
  MonitoringSessionState,
  ViolationSummary,
  HeartbeatPayload,
  ViolationPayload,
  StudentJoinPayload,
  StudentLeavePayload,
  InstructionPayload,
  InstructionAckPayload,
  MonitoringEventRow,
} from "../lib/monitoringTypes.js";

const log = createChildLogger({ module: "ws" });

// ── In-memory session store ─────────────────────────────────────────────

const sessions = new Map<string, MonitoringSessionState>(); // keyed by attemptId
const socketToAttempt = new Map<string, string>(); // socketId → attemptId

// Instruction queue: attemptId → pending instructions
const instructionQueues = new Map<string, InstructionPayload[]>();
const MAX_INSTRUCTIONS_PER_SESSION = 10;

// Event buffer for batch persistence
const eventBuffer: MonitoringEventRow[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;
const FLUSH_INTERVAL_MS = 5_000; // flush every 5 seconds
const MAX_BUFFER_SIZE = 100;

// ── Helpers ─────────────────────────────────────────────────────────────

function emptyViolationSummary(): ViolationSummary {
  return {
    tabSwitches: 0,
    pasteCount: 0,
    fullscreenExits: 0,
    clipboardAccess: 0,
    offlineEvents: 0,
    focusLost: 0,
    devtoolsOpen: 0,
    total: 0,
  };
}

function incrementViolation(summary: ViolationSummary, type: string): void {
  switch (type) {
    case 'tab_switch':      summary.tabSwitches++; break;
    case 'paste_detected':  summary.pasteCount++; break;
    case 'fullscreen_exit': summary.fullscreenExits++; break;
    case 'clipboard_access':summary.clipboardAccess++; break;
    case 'offline':         summary.offlineEvents++; break;
    case 'focus_lost':      summary.focusLost++; break;
    case 'devtools_open':   summary.devtoolsOpen++; break;
  }
  summary.total++;
}

function computeStatus(session: MonitoringSessionState): MonitoringSessionState['status'] {
  if (session.violations.total >= 5) return 'flagged';
  if (session.violations.total >= 2) return 'suspicious';
  // Idle if no heartbeat for > 30 seconds
  const lastHb = new Date(session.lastHeartbeat).getTime();
  if (Date.now() - lastHb > 30_000) return 'idle';
  return 'active';
}

function generateId(): string {
  return `instr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ── Event buffer & batch persistence ────────────────────────────────────

function bufferEvent(event: MonitoringEventRow): void {
  eventBuffer.push(event);
  if (eventBuffer.length >= MAX_BUFFER_SIZE) {
    flushEvents();
  }
}

async function flushEvents(): Promise<void> {
  if (eventBuffer.length === 0) return;
  const batch = eventBuffer.splice(0, eventBuffer.length);
  try {
    const supabase = getSupabaseAdmin();
    await supabase.from("monitoring_events").insert(batch);
  } catch (err) {
    log.error({ err }, "Failed to flush monitoring events");
    // Re-queue on failure (drop if buffer too large to prevent OOM)
    if (eventBuffer.length < MAX_BUFFER_SIZE * 3) {
      eventBuffer.unshift(...batch);
    }
  }
}

// ── Socket.IO Auth Middleware ────────────────────────────────────────────

interface SocketUser { id: string; email: string; role: AppRole; name: string }

async function authenticateSocket(socket: Socket, next: (err?: Error) => void): Promise<void> {
  const token = socket.handshake.auth?.token as string | undefined;
  if (!token) {
    return next(new Error("Authentication required"));
  }

  try {
    const supabase = getSupabaseAdmin();
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return next(new Error("Invalid or expired token"));
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, name")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return next(new Error("User profile not found"));
    }

    (socket as any).user = {
      id: user.id,
      email: user.email ?? "",
      role: profile.role as AppRole,
      name: profile.name ?? "",
    } satisfies SocketUser;

    next();
  } catch {
    next(new Error("Authentication failed"));
  }
}

function getSocketUser(socket: Socket): SocketUser {
  return (socket as any).user;
}

// ── Socket.IO Server Factory ────────────────────────────────────────────

let io: SocketIOServer | null = null;

export function createSocketServer(httpServer: HttpServer, corsOrigins: string[]): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: corsOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingInterval: 25_000,
    pingTimeout: 20_000,
    transports: ["websocket"],
  });

  // ── Proctoring Namespace (students) ───────────────────────────────────
  const proctoring = io.of("/proctoring") as unknown as Namespace<ClientToServerEvents, ServerToClientEvents>;

  // Apply JWT auth middleware to proctoring namespace
  (proctoring as any).use(authenticateSocket);

  proctoring.on("connection", (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
    const authedUser = getSocketUser(socket);
    log.debug({ socketId: socket.id, userId: authedUser.id }, "proctoring client connected");

    // ── student:join ──────────────────────────────────────
    socket.on("student:join", (payload: StudentJoinPayload) => {
      const { attemptId, assessmentId, studentName } = payload;
      // Security: use authenticated user ID, not payload
      const studentId = authedUser.id;

      const session: MonitoringSessionState = {
        socketId: socket.id,
        attemptId,
        assessmentId,
        studentId,
        studentName,
        joinedAt: new Date().toISOString(),
        lastHeartbeat: new Date().toISOString(),
        lastSeq: 0,
        gapCount: 0,
        questionIndex: 0,
        isFullscreen: true,
        isOnline: true,
        status: 'active',
        violations: emptyViolationSummary(),
      };

      sessions.set(attemptId, session);
      socketToAttempt.set(socket.id, attemptId);

      // Join Socket.IO room for this assessment
      socket.join(`assessment:${assessmentId}`);

      // Buffer join event
      bufferEvent({
        attempt_id: attemptId,
        assessment_id: assessmentId,
        student_id: studentId,
        event_type: 'join',
        payload: { studentName, userAgent: payload.userAgent },
      });

      // Notify admin namespace
      emitToAdminRoom(assessmentId, 'monitor:join', { assessmentId, session });

      // Deliver any queued instructions
      const pending = instructionQueues.get(attemptId) ?? [];
      for (const instr of pending) {
        socket.emit('instruction', instr);
      }
    });

    // ── student:heartbeat ──────────────────────────────────
    socket.on("student:heartbeat", (payload: HeartbeatPayload) => {
      const session = sessions.get(payload.attemptId);
      if (!session) return;

      // Gap detection: sequential counter must increment by 1
      const expectedSeq = session.lastSeq + 1;
      if (payload.seq > expectedSeq) {
        session.gapCount += (payload.seq - expectedSeq);
      }

      session.lastSeq = payload.seq;
      session.lastHeartbeat = new Date().toISOString();
      session.questionIndex = payload.questionIndex;
      session.isFullscreen = payload.isFullscreen;
      session.isOnline = payload.isOnline;
      session.status = computeStatus(session);

      // Buffer heartbeat (only every 5th to reduce DB writes)
      if (payload.seq % 5 === 0) {
        bufferEvent({
          attempt_id: payload.attemptId,
          assessment_id: payload.assessmentId,
          student_id: session.studentId,
          event_type: 'heartbeat',
          payload: { seq: payload.seq, questionIndex: payload.questionIndex, isFullscreen: payload.isFullscreen },
        });
      }
    });

    // ── student:violation ──────────────────────────────────
    socket.on("student:violation", (payload: ViolationPayload) => {
      const session = sessions.get(payload.attemptId);
      if (!session) return;

      incrementViolation(session.violations, payload.type);
      session.status = computeStatus(session);

      // Always persist violations
      bufferEvent({
        attempt_id: payload.attemptId,
        assessment_id: payload.assessmentId,
        student_id: session.studentId,
        event_type: 'violation',
        payload: { type: payload.type, detail: payload.detail },
      });

      // Notify admins immediately
      emitToAdminRoom(payload.assessmentId, 'monitor:violation', {
        assessmentId: payload.assessmentId,
        attemptId: payload.attemptId,
        studentName: session.studentName,
        violation: payload,
      });

      // Auto-warn after threshold
      if (session.violations.total === 3) {
        const warning: InstructionPayload = {
          id: generateId(),
          type: 'warning',
          message: 'You have been flagged for suspicious activity. Further violations may result in assessment termination.',
          timestamp: Date.now(),
        };
        socket.emit('instruction', warning);
      }
    });

    // ── student:leave ──────────────────────────────────────
    socket.on("student:leave", (payload: StudentLeavePayload) => {
      handleStudentDisconnect(socket.id, payload.reason);
    });

    // ── instruction:ack ────────────────────────────────────
    socket.on("instruction:ack", (payload: InstructionAckPayload) => {
      const attemptId = socketToAttempt.get(socket.id);
      if (!attemptId) return;
      const queue = instructionQueues.get(attemptId);
      if (queue) {
        const idx = queue.findIndex(i => i.id === payload.instructionId);
        if (idx >= 0) queue.splice(idx, 1);
      }
      // Buffer ack event
      const session = sessions.get(attemptId);
      if (session) {
        bufferEvent({
          attempt_id: attemptId,
          assessment_id: session.assessmentId,
          student_id: session.studentId,
          event_type: 'instruction_ack',
          payload: { instructionId: payload.instructionId },
        });
      }
    });

    // ── disconnect ─────────────────────────────────────────
    socket.on("disconnect", () => {
      handleStudentDisconnect(socket.id, 'disconnect');
    });
  });

  // ── Admin Namespace ───────────────────────────────────────────────────
  const admin = io.of("/admin") as unknown as Namespace<AdminToServerEvents, ServerToAdminEvents>;

  // Apply JWT auth middleware + role check to admin namespace
  (admin as any).use(authenticateSocket);
  (admin as any).use((socket: Socket, next: (err?: Error) => void) => {
    const user = getSocketUser(socket);
    if (user.role !== "teacher" && user.role !== "admin") {
      return next(new Error("Insufficient permissions: teacher or admin role required"));
    }
    next();
  });

  admin.on("connection", (socket: Socket<AdminToServerEvents, ServerToAdminEvents>) => {
    const authedUser = getSocketUser(socket);
    log.debug({ socketId: socket.id, userId: authedUser.id, role: authedUser.role }, "admin client connected");

    // ── monitor:subscribe ──────────────────────────────────
    socket.on("monitor:subscribe", ({ assessmentId }) => {
      socket.join(`admin:${assessmentId}`);

      // Send current snapshot
      const assessmentSessions = getAssessmentSessions(assessmentId);
      socket.emit('monitor:update', {
        assessmentId,
        sessions: assessmentSessions,
        timestamp: new Date().toISOString(),
      });
    });

    // ── monitor:unsubscribe ─────────────────────────────────
    socket.on("monitor:unsubscribe", ({ assessmentId }) => {
      socket.leave(`admin:${assessmentId}`);
    });

    // ── instruction:send ────────────────────────────────────
    socket.on("instruction:send", ({ attemptId, instruction }) => {
      const session = sessions.get(attemptId);
      if (!session) return;

      const fullInstruction: InstructionPayload = {
        ...instruction,
        id: generateId(),
        timestamp: Date.now(),
      };

      // Queue instruction
      const queue = instructionQueues.get(attemptId) ?? [];
      if (queue.length < MAX_INSTRUCTIONS_PER_SESSION) {
        queue.push(fullInstruction);
        instructionQueues.set(attemptId, queue);
      }

      // Deliver to student if connected
      const studentSocket = proctoring.sockets.get(session.socketId);
      if (studentSocket) {
        studentSocket.emit('instruction', fullInstruction);
      }

      // Buffer instruction event
      bufferEvent({
        attempt_id: attemptId,
        assessment_id: session.assessmentId,
        student_id: session.studentId,
        event_type: 'instruction',
        payload: { type: instruction.type, message: instruction.message },
      });
    });

    socket.on("disconnect", () => {
      log.debug({ socketId: socket.id }, "admin client disconnected");
    });
  });

  // ── Periodic tasks ────────────────────────────────────────────────────

  // Flush event buffer periodically
  flushTimer = setInterval(() => flushEvents(), FLUSH_INTERVAL_MS);

  // Push dashboard updates to admin rooms every 3 seconds
  setInterval(() => {
    // Group sessions by assessmentId
    const byAssessment = new Map<string, MonitoringSessionState[]>();
    for (const session of sessions.values()) {
      const arr = byAssessment.get(session.assessmentId) ?? [];
      arr.push(session);
      byAssessment.set(session.assessmentId, arr);
    }

    for (const [assessmentId, assessmentSessions] of byAssessment) {
      admin.to(`admin:${assessmentId}`).emit('monitor:update', {
        assessmentId,
        sessions: assessmentSessions,
        timestamp: new Date().toISOString(),
      });
    }
  }, 3_000);

  log.info({ namespaces: ["/proctoring", "/admin"] }, "Socket.IO server initialized");

  return io;
}

// ── Helpers ─────────────────────────────────────────────────────────────

function handleStudentDisconnect(socketId: string, reason: string): void {
  const attemptId = socketToAttempt.get(socketId);
  if (!attemptId) return;

  const session = sessions.get(attemptId);
  if (session) {
    session.status = 'disconnected';

    // Buffer leave event
    bufferEvent({
      attempt_id: attemptId,
      assessment_id: session.assessmentId,
      student_id: session.studentId,
      event_type: 'leave',
      payload: { reason },
    });

    // Notify admins
    emitToAdminRoom(session.assessmentId, 'monitor:leave', {
      assessmentId: session.assessmentId,
      attemptId,
      reason,
    });

    // Keep session in memory for 5 minutes (allows reconnection)
    setTimeout(() => {
      const current = sessions.get(attemptId);
      if (current && current.status === 'disconnected') {
        sessions.delete(attemptId);
        instructionQueues.delete(attemptId);
      }
    }, 5 * 60 * 1000);
  }

  socketToAttempt.delete(socketId);
}

function emitToAdminRoom(assessmentId: string, event: string, data: any): void {
  if (!io) return;
  io.of("/admin").to(`admin:${assessmentId}`).emit(event, data);
}

function getAssessmentSessions(assessmentId: string): MonitoringSessionState[] {
  const result: MonitoringSessionState[] = [];
  for (const session of sessions.values()) {
    if (session.assessmentId === assessmentId) {
      result.push(session);
    }
  }
  return result;
}

// ── Exports for testing / monitoring ────────────────────────────────────

export function getSessionCount(): number {
  return sessions.size;
}

export function getSession(attemptId: string): MonitoringSessionState | undefined {
  return sessions.get(attemptId);
}

export function getAllSessions(): MonitoringSessionState[] {
  return Array.from(sessions.values());
}

export function getIOInstance(): SocketIOServer | null {
  return io;
}

export async function shutdown(): Promise<void> {
  if (flushTimer) clearInterval(flushTimer);
  await flushEvents();
  if (io) {
    io.disconnectSockets(true);
    io.close();
    io = null;
  }
  sessions.clear();
  socketToAttempt.clear();
  instructionQueues.clear();
  eventBuffer.length = 0;
}
