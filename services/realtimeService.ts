import { LiveUpdate, ActiveSession } from '../types';

// Simulated real-time service
// In production, this would use WebSocket connections

type UpdateCallback = (update: LiveUpdate) => void;
type SessionCallback = (sessions: ActiveSession[]) => void;

class RealtimeService {
  private updateCallbacks: UpdateCallback[] = [];
  private sessionCallbacks: SessionCallback[] = [];
  private activeSessions: Map<string, ActiveSession> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;
  private isConnected: boolean = false;

  // Connect to real-time updates
  connect() {
    if (this.isConnected) return;
    
    this.isConnected = true;
    console.log('[RealtimeService] Connected');
    
    // Simulate periodic updates
    this.updateInterval = setInterval(() => {
      this.simulateUpdates();
    }, 5000);
  }

  // Disconnect from real-time updates
  disconnect() {
    if (!this.isConnected) return;
    
    this.isConnected = false;
    console.log('[RealtimeService] Disconnected');
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  // Subscribe to live updates
  onUpdate(callback: UpdateCallback): () => void {
    this.updateCallbacks.push(callback);
    return () => {
      this.updateCallbacks = this.updateCallbacks.filter(cb => cb !== callback);
    };
  }

  // Subscribe to session updates
  onSessionUpdate(callback: SessionCallback): () => void {
    this.sessionCallbacks.push(callback);
    return () => {
      this.sessionCallbacks = this.sessionCallbacks.filter(cb => cb !== callback);
    };
  }

  // Emit update to all subscribers
  private emitUpdate(update: LiveUpdate) {
    this.updateCallbacks.forEach(cb => cb(update));
  }

  // Emit session update to all subscribers
  private emitSessionUpdate() {
    const sessions = Array.from(this.activeSessions.values());
    this.sessionCallbacks.forEach(cb => cb(sessions));
  }

  // Add or update an active session
  updateSession(session: ActiveSession) {
    this.activeSessions.set(session.id, session);
    this.emitSessionUpdate();
    
    // Emit update notification
    this.emitUpdate({
      type: 'status_change',
      assessmentId: session.assessmentId,
      studentId: session.studentId,
      studentName: session.studentName,
      data: { status: session.status },
      timestamp: new Date().toISOString(),
    });
  }

  // Remove an active session
  removeSession(sessionId: string) {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      this.activeSessions.delete(sessionId);
      this.emitSessionUpdate();
      
      this.emitUpdate({
        type: 'completion',
        assessmentId: session.assessmentId,
        studentId: session.studentId,
        studentName: session.studentName,
        data: { completed: true },
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Get all active sessions
  getActiveSessions(): ActiveSession[] {
    return Array.from(this.activeSessions.values());
  }

  // Get sessions for a specific assessment
  getAssessmentSessions(assessmentId: string): ActiveSession[] {
    return Array.from(this.activeSessions.values())
      .filter(s => s.assessmentId === assessmentId);
  }

  // Simulate real-time updates (for demo purposes)
  private simulateUpdates() {
    if (!this.isConnected) return;
    
    // Randomly update existing sessions
    this.activeSessions.forEach((session, id) => {
      const random = Math.random();
      
      // 20% chance of activity update
      if (random < 0.2) {
        const updatedSession = {
          ...session,
          lastActivity: new Date().toISOString(),
        };
        
        // 10% chance of submission
        if (random < 0.1 && session.submittedQuestions < session.totalQuestions) {
          updatedSession.submittedQuestions += 1;
          updatedSession.currentQuestion = Math.min(
            session.currentQuestion + 1,
            session.totalQuestions
          );
          
          this.emitUpdate({
            type: 'submission',
            assessmentId: session.assessmentId,
            studentId: session.studentId,
            studentName: session.studentName,
            data: {
              questionIndex: session.currentQuestion,
              submitted: updatedSession.submittedQuestions,
              total: session.totalQuestions,
            },
            timestamp: new Date().toISOString(),
          });
        }
        
        // 5% chance of tab switch (suspicious activity)
        if (random < 0.05) {
          updatedSession.tabSwitches += 1;
          if (updatedSession.tabSwitches >= 3) {
            updatedSession.status = 'suspicious';
          }
        }
        
        // 3% chance of completion
        if (random < 0.03 && session.submittedQuestions === session.totalQuestions) {
          updatedSession.status = 'completed';
          this.removeSession(id);
          return;
        }
        
        this.activeSessions.set(id, updatedSession);
      }
    });
    
    this.emitSessionUpdate();
  }

  // Start a new session (called when student starts assessment)
  startSession(
    assessmentId: string,
    studentId: string,
    studentName: string,
    avatar: string,
    totalQuestions: number,
    ipAddress: string = '192.168.1.' + Math.floor(Math.random() * 255)
  ): ActiveSession {
    const session: ActiveSession = {
      id: `session-${Date.now()}-${studentId}`,
      assessmentId,
      studentId,
      studentName,
      avatar,
      startedAt: new Date().toISOString(),
      currentQuestion: 1,
      totalQuestions,
      submittedQuestions: 0,
      status: 'active',
      lastActivity: new Date().toISOString(),
      ipAddress,
      tabSwitches: 0,
      copyPasteCount: 0,
    };
    
    this.activeSessions.set(session.id, session);
    
    this.emitUpdate({
      type: 'new_student',
      assessmentId,
      studentId,
      studentName,
      data: { session },
      timestamp: new Date().toISOString(),
    });
    
    this.emitSessionUpdate();
    
    return session;
  }

  // Record suspicious activity
  recordSuspiciousActivity(
    sessionId: string,
    type: 'tab_switch' | 'copy_paste' | 'idle'
  ) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;
    
    const updatedSession = { ...session };
    
    switch (type) {
      case 'tab_switch':
        updatedSession.tabSwitches += 1;
        break;
      case 'copy_paste':
        updatedSession.copyPasteCount += 1;
        break;
      case 'idle':
        updatedSession.status = 'idle';
        break;
    }
    
    // Mark as suspicious if threshold exceeded
    if (updatedSession.tabSwitches >= 3 || updatedSession.copyPasteCount >= 5) {
      updatedSession.status = 'suspicious';
    }
    
    this.activeSessions.set(sessionId, updatedSession);
    this.emitSessionUpdate();
  }

  // Get connection status
  isActive(): boolean {
    return this.isConnected;
  }
}

// Singleton instance
export const realtimeService = new RealtimeService();

// Hook for React components
export const useRealtimeUpdates = (
  assessmentId?: string,
  onUpdate?: UpdateCallback
): {
  isConnected: boolean;
  sessions: ActiveSession[];
  connect: () => void;
  disconnect: () => void;
} => {
  // This would be a proper React hook in the actual implementation
  // For now, return the service methods
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
