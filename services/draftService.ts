import { Draft, TimerState } from '../types';

// Local storage keys
const DRAFT_KEY = 'codequest_drafts';
const TIMER_KEY = 'codequest_timers';
const BOOKMARK_KEY = 'codequest_bookmarks';

// Draft Service - Saves code drafts for students
class DraftService {
  // Get all drafts
  getAllDrafts(): Draft[] {
    const data = localStorage.getItem(DRAFT_KEY);
    return data ? JSON.parse(data) : [];
  }

  // Get draft for specific question
  getDraft(assessmentId: string, questionId: string, studentId: string): Draft | null {
    const drafts = this.getAllDrafts();
    return drafts.find(
      d => d.assessmentId === assessmentId && 
           d.questionId === questionId && 
           d.studentId === studentId
    ) || null;
  }

  // Save or update draft
  saveDraft(draft: Omit<Draft, 'id' | 'savedAt'>): Draft {
    const drafts = this.getAllDrafts();
    const existingIndex = drafts.findIndex(
      d => d.assessmentId === draft.assessmentId && 
           d.questionId === draft.questionId && 
           d.studentId === draft.studentId
    );

    const savedDraft: Draft = {
      ...draft,
      id: existingIndex >= 0 ? drafts[existingIndex].id : `draft-${Date.now()}`,
      savedAt: new Date().toISOString(),
      bookmarked: existingIndex >= 0 ? drafts[existingIndex].bookmarked : false,
    };

    if (existingIndex >= 0) {
      drafts[existingIndex] = savedDraft;
    } else {
      drafts.push(savedDraft);
    }

    localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts));
    return savedDraft;
  }

  // Delete draft
  deleteDraft(assessmentId: string, questionId: string, studentId: string) {
    const drafts = this.getAllDrafts();
    const filtered = drafts.filter(
      d => !(d.assessmentId === assessmentId && 
             d.questionId === questionId && 
             d.studentId === studentId)
    );
    localStorage.setItem(DRAFT_KEY, JSON.stringify(filtered));
  }

  // Delete all drafts for an assessment
  deleteAssessmentDrafts(assessmentId: string, studentId: string) {
    const drafts = this.getAllDrafts();
    const filtered = drafts.filter(
      d => !(d.assessmentId === assessmentId && d.studentId === studentId)
    );
    localStorage.setItem(DRAFT_KEY, JSON.stringify(filtered));
  }

  // Toggle bookmark for a question
  toggleBookmark(assessmentId: string, questionId: string, studentId: string): boolean {
    const drafts = this.getAllDrafts();
    const index = drafts.findIndex(
      d => d.assessmentId === assessmentId && 
           d.questionId === questionId && 
           d.studentId === studentId
    );

    if (index >= 0) {
      drafts[index].bookmarked = !drafts[index].bookmarked;
      localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts));
      return drafts[index].bookmarked;
    }

    // Create draft with bookmark if doesn't exist
    const newDraft: Draft = {
      id: `draft-${Date.now()}`,
      assessmentId,
      questionId,
      studentId,
      code: '',
      language: 'python',
      savedAt: new Date().toISOString(),
      bookmarked: true,
    };
    drafts.push(newDraft);
    localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts));
    return true;
  }

  // Get bookmarked questions for an assessment
  getBookmarkedQuestions(assessmentId: string, studentId: string): string[] {
    const drafts = this.getAllDrafts();
    return drafts
      .filter(d => d.assessmentId === assessmentId && 
                   d.studentId === studentId && 
                   d.bookmarked)
      .map(d => d.questionId);
  }

  // Get all drafts for an assessment
  getAssessmentDrafts(assessmentId: string, studentId: string): Draft[] {
    const drafts = this.getAllDrafts();
    return drafts.filter(
      d => d.assessmentId === assessmentId && d.studentId === studentId
    );
  }

  // Auto-save interval (returns cleanup function)
  startAutoSave(
    assessmentId: string,
    questionId: string,
    studentId: string,
    getCode: () => string,
    getLanguage: () => string,
    interval: number = 30000 // 30 seconds default
  ): () => void {
    const autoSaveInterval = setInterval(() => {
      const code = getCode();
      if (code.trim()) {
        this.saveDraft({
          assessmentId,
          questionId,
          studentId,
          code,
          language: getLanguage() as any,
          bookmarked: false,
        });
        console.log('[DraftService] Auto-saved draft');
      }
    }, interval);

    return () => clearInterval(autoSaveInterval);
  }
}

// Timer Service - Manages assessment timers with persistence
class TimerService {
  // Get all timer states
  getAllTimers(): TimerState[] {
    const data = localStorage.getItem(TIMER_KEY);
    return data ? JSON.parse(data) : [];
  }

  // Get timer for specific assessment
  getTimer(assessmentId: string, studentId: string): TimerState | null {
    const timers = this.getAllTimers();
    return timers.find(
      t => t.assessmentId === assessmentId && t.studentId === studentId
    ) || null;
  }

  // Start or resume timer
  startTimer(
    assessmentId: string, 
    studentId: string, 
    totalSeconds: number
  ): TimerState {
    const existing = this.getTimer(assessmentId, studentId);
    
    if (existing) {
      // Resume existing timer
      const now = new Date();
      const started = new Date(existing.startTime);
      const pausedElapsed = existing.elapsedSeconds;
      
      // If was paused, continue from paused state
      // If wasn't paused, calculate elapsed time
      const elapsed = existing.isPaused 
        ? pausedElapsed 
        : pausedElapsed + Math.floor((now.getTime() - started.getTime()) / 1000);
      
      const timer: TimerState = {
        ...existing,
        startTime: new Date().toISOString(),
        elapsedSeconds: Math.min(elapsed, totalSeconds),
        isPaused: false,
      };
      
      this.saveTimer(timer);
      return timer;
    }

    // Create new timer
    const timer: TimerState = {
      assessmentId,
      studentId,
      startTime: new Date().toISOString(),
      elapsedSeconds: 0,
      totalSeconds,
      isPaused: false,
    };

    this.saveTimer(timer);
    return timer;
  }

  // Save timer state
  saveTimer(timer: TimerState) {
    const timers = this.getAllTimers();
    const index = timers.findIndex(
      t => t.assessmentId === timer.assessmentId && t.studentId === timer.studentId
    );

    if (index >= 0) {
      timers[index] = timer;
    } else {
      timers.push(timer);
    }

    localStorage.setItem(TIMER_KEY, JSON.stringify(timers));
  }

  // Update elapsed time
  updateElapsed(assessmentId: string, studentId: string, elapsedSeconds: number) {
    const timer = this.getTimer(assessmentId, studentId);
    if (timer) {
      timer.elapsedSeconds = elapsedSeconds;
      this.saveTimer(timer);
    }
  }

  // Pause timer
  pauseTimer(assessmentId: string, studentId: string) {
    const timer = this.getTimer(assessmentId, studentId);
    if (timer) {
      timer.isPaused = true;
      this.saveTimer(timer);
    }
  }

  // Resume timer
  resumeTimer(assessmentId: string, studentId: string) {
    const timer = this.getTimer(assessmentId, studentId);
    if (timer) {
      timer.isPaused = false;
      timer.startTime = new Date().toISOString();
      this.saveTimer(timer);
    }
  }

  // Delete timer (when assessment is submitted)
  deleteTimer(assessmentId: string, studentId: string) {
    const timers = this.getAllTimers();
    const filtered = timers.filter(
      t => !(t.assessmentId === assessmentId && t.studentId === studentId)
    );
    localStorage.setItem(TIMER_KEY, JSON.stringify(filtered));
  }

  // Get remaining time in seconds
  getRemainingTime(assessmentId: string, studentId: string): number | null {
    const timer = this.getTimer(assessmentId, studentId);
    if (!timer) return null;
    
    if (timer.isPaused) {
      return Math.max(0, timer.totalSeconds - timer.elapsedSeconds);
    }
    
    const now = new Date();
    const started = new Date(timer.startTime);
    const currentElapsed = timer.elapsedSeconds + 
      Math.floor((now.getTime() - started.getTime()) / 1000);
    
    return Math.max(0, timer.totalSeconds - currentElapsed);
  }

  // Check if timer has expired
  isExpired(assessmentId: string, studentId: string): boolean {
    const remaining = this.getRemainingTime(assessmentId, studentId);
    return remaining !== null && remaining <= 0;
  }

  // Format time for display
  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

// Bookmark Service - Separate for simplicity
class BookmarkService {
  private getBookmarks(): Record<string, string[]> {
    const data = localStorage.getItem(BOOKMARK_KEY);
    return data ? JSON.parse(data) : {};
  }

  private saveBookmarks(bookmarks: Record<string, string[]>) {
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(bookmarks));
  }

  private getKey(assessmentId: string, studentId: string): string {
    return `${assessmentId}_${studentId}`;
  }

  isBookmarked(assessmentId: string, questionId: string, studentId: string): boolean {
    const bookmarks = this.getBookmarks();
    const key = this.getKey(assessmentId, studentId);
    return bookmarks[key]?.includes(questionId) || false;
  }

  toggle(assessmentId: string, questionId: string, studentId: string): boolean {
    const bookmarks = this.getBookmarks();
    const key = this.getKey(assessmentId, studentId);
    
    if (!bookmarks[key]) {
      bookmarks[key] = [];
    }
    
    const index = bookmarks[key].indexOf(questionId);
    if (index >= 0) {
      bookmarks[key].splice(index, 1);
      this.saveBookmarks(bookmarks);
      return false;
    } else {
      bookmarks[key].push(questionId);
      this.saveBookmarks(bookmarks);
      return true;
    }
  }

  getAll(assessmentId: string, studentId: string): string[] {
    const bookmarks = this.getBookmarks();
    const key = this.getKey(assessmentId, studentId);
    return bookmarks[key] || [];
  }

  clear(assessmentId: string, studentId: string) {
    const bookmarks = this.getBookmarks();
    const key = this.getKey(assessmentId, studentId);
    delete bookmarks[key];
    this.saveBookmarks(bookmarks);
  }
}

// Export singleton instances
export const draftService = new DraftService();
export const timerService = new TimerService();
export const bookmarkService = new BookmarkService();

export default {
  draft: draftService,
  timer: timerService,
  bookmark: bookmarkService,
};
