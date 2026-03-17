import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { draftService, timerService, bookmarkService } from './draftService';

// ── DraftService ─────────────────────────────────────────────────────
describe('DraftService', () => {
  beforeEach(() => localStorage.clear());

  const base = {
    assessmentId: 'a1',
    questionId: 'q1',
    studentId: 's1',
    code: 'print("hi")',
    language: 'python' as const,
    bookmarked: false,
  };

  it('returns empty array when no drafts exist', () => {
    expect(draftService.getAllDrafts()).toEqual([]);
  });

  it('saves a new draft and retrieves it', () => {
    const saved = draftService.saveDraft(base);
    expect(saved.id).toMatch(/^draft-/);
    expect(saved.savedAt).toBeTruthy();
    expect(saved.code).toBe(base.code);

    const fetched = draftService.getDraft('a1', 'q1', 's1');
    expect(fetched).not.toBeNull();
    expect(fetched!.code).toBe('print("hi")');
  });

  it('updates an existing draft in place', () => {
    draftService.saveDraft(base);
    const updated = draftService.saveDraft({ ...base, code: 'print("bye")' });
    expect(draftService.getAllDrafts()).toHaveLength(1);
    expect(updated.code).toBe('print("bye")');
  });

  it('preserves bookmarked flag on update', () => {
    draftService.saveDraft(base);
    draftService.toggleBookmark('a1', 'q1', 's1'); // toggles true
    const updated = draftService.saveDraft({ ...base, code: 'x = 2' });
    expect(updated.bookmarked).toBe(true);
  });

  it('getDraft returns null for missing draft', () => {
    expect(draftService.getDraft('x', 'y', 'z')).toBeNull();
  });

  it('deleteDraft removes matching draft', () => {
    draftService.saveDraft(base);
    draftService.deleteDraft('a1', 'q1', 's1');
    expect(draftService.getAllDrafts()).toHaveLength(0);
  });

  it('deleteAssessmentDrafts removes all drafts for assessment+student', () => {
    draftService.saveDraft(base);
    draftService.saveDraft({ ...base, questionId: 'q2' });
    draftService.saveDraft({ ...base, studentId: 's2' }); // different student
    draftService.deleteAssessmentDrafts('a1', 's1');
    const remaining = draftService.getAllDrafts();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].studentId).toBe('s2');
  });

  it('toggleBookmark creates draft if none exists and bookmarks it', () => {
    const result = draftService.toggleBookmark('a1', 'q1', 's1');
    expect(result).toBe(true);
    const draft = draftService.getDraft('a1', 'q1', 's1');
    expect(draft!.bookmarked).toBe(true);
    expect(draft!.code).toBe('');
  });

  it('toggleBookmark toggles off an existing bookmark', () => {
    draftService.saveDraft(base);
    draftService.toggleBookmark('a1', 'q1', 's1'); // true
    const result = draftService.toggleBookmark('a1', 'q1', 's1'); // false
    expect(result).toBe(false);
  });

  it('getBookmarkedQuestions returns only bookmarked question IDs', () => {
    draftService.saveDraft(base);
    draftService.saveDraft({ ...base, questionId: 'q2' });
    draftService.toggleBookmark('a1', 'q1', 's1');
    const bookmarked = draftService.getBookmarkedQuestions('a1', 's1');
    expect(bookmarked).toEqual(['q1']);
  });

  it('getAssessmentDrafts returns all drafts for an assessment+student', () => {
    draftService.saveDraft(base);
    draftService.saveDraft({ ...base, questionId: 'q2' });
    draftService.saveDraft({ ...base, assessmentId: 'a2' });
    expect(draftService.getAssessmentDrafts('a1', 's1')).toHaveLength(2);
  });

  it('startAutoSave calls saveDraft periodically and returns cleanup', () => {
    vi.useFakeTimers();
    const getCode = vi.fn(() => 'code');
    const getLang = vi.fn(() => 'python');
    const cleanup = draftService.startAutoSave('a1', 'q1', 's1', getCode, getLang, 100);

    vi.advanceTimersByTime(250);
    expect(getCode).toHaveBeenCalledTimes(2);
    expect(draftService.getDraft('a1', 'q1', 's1')).not.toBeNull();

    cleanup();
    vi.advanceTimersByTime(200);
    expect(getCode).toHaveBeenCalledTimes(2); // no more calls

    vi.useRealTimers();
  });

  it('startAutoSave skips saving when code is blank/whitespace', () => {
    vi.useFakeTimers();
    const getCode = vi.fn(() => '   ');
    const getLang = vi.fn(() => 'python');
    const cleanup = draftService.startAutoSave('a1', 'q1', 's1', getCode, getLang, 100);

    vi.advanceTimersByTime(150);
    expect(draftService.getDraft('a1', 'q1', 's1')).toBeNull();

    cleanup();
    vi.useRealTimers();
  });
});

// ── TimerService ─────────────────────────────────────────────────────
describe('TimerService', () => {
  beforeEach(() => localStorage.clear());

  it('returns empty array when no timers', () => {
    expect(timerService.getAllTimers()).toEqual([]);
  });

  it('startTimer creates a new timer', () => {
    const timer = timerService.startTimer('a1', 's1', 3600);
    expect(timer.assessmentId).toBe('a1');
    expect(timer.totalSeconds).toBe(3600);
    expect(timer.elapsedSeconds).toBe(0);
    expect(timer.isPaused).toBe(false);
    expect(timerService.getAllTimers()).toHaveLength(1);
  });

  it('startTimer resumes an existing paused timer', () => {
    const t = timerService.startTimer('a1', 's1', 3600);
    timerService.updateElapsed('a1', 's1', 100);
    timerService.pauseTimer('a1', 's1');
    const resumed = timerService.startTimer('a1', 's1', 3600);
    expect(resumed.isPaused).toBe(false);
    expect(resumed.elapsedSeconds).toBe(100);
  });

  it('getTimer returns null for nonexistent timer', () => {
    expect(timerService.getTimer('x', 'y')).toBeNull();
  });

  it('updateElapsed persists new elapsed value', () => {
    timerService.startTimer('a1', 's1', 3600);
    timerService.updateElapsed('a1', 's1', 500);
    const timer = timerService.getTimer('a1', 's1');
    expect(timer!.elapsedSeconds).toBe(500);
  });

  it('pauseTimer sets isPaused to true', () => {
    timerService.startTimer('a1', 's1', 3600);
    timerService.pauseTimer('a1', 's1');
    expect(timerService.getTimer('a1', 's1')!.isPaused).toBe(true);
  });

  it('resumeTimer sets isPaused to false and resets startTime', () => {
    timerService.startTimer('a1', 's1', 3600);
    timerService.pauseTimer('a1', 's1');
    timerService.resumeTimer('a1', 's1');
    const timer = timerService.getTimer('a1', 's1')!;
    expect(timer.isPaused).toBe(false);
    expect(new Date(timer.startTime).getTime()).toBeGreaterThan(0);
  });

  it('deleteTimer removes the timer', () => {
    timerService.startTimer('a1', 's1', 3600);
    timerService.deleteTimer('a1', 's1');
    expect(timerService.getTimer('a1', 's1')).toBeNull();
  });

  it('getRemainingTime returns full time for fresh timer', () => {
    timerService.startTimer('a1', 's1', 60);
    // Fresh timer with ~0 elapsed, remaining ≈ 60
    const remaining = timerService.getRemainingTime('a1', 's1');
    expect(remaining).toBeLessThanOrEqual(60);
    expect(remaining).toBeGreaterThanOrEqual(59);
  });

  it('getRemainingTime returns correct time for paused timer', () => {
    timerService.startTimer('a1', 's1', 100);
    timerService.updateElapsed('a1', 's1', 30);
    timerService.pauseTimer('a1', 's1');
    expect(timerService.getRemainingTime('a1', 's1')).toBe(70);
  });

  it('getRemainingTime returns null for nonexistent timer', () => {
    expect(timerService.getRemainingTime('x', 'y')).toBeNull();
  });

  it('isExpired returns true when remaining is 0', () => {
    timerService.startTimer('a1', 's1', 10);
    timerService.updateElapsed('a1', 's1', 10);
    timerService.pauseTimer('a1', 's1'); // pause so remaining is deterministic
    expect(timerService.isExpired('a1', 's1')).toBe(true);
  });

  it('isExpired returns false for nonexistent timer', () => {
    expect(timerService.isExpired('x', 'y')).toBe(false);
  });

  it('formatTime formats seconds correctly', () => {
    expect(timerService.formatTime(65)).toBe('1:05');
    expect(timerService.formatTime(3661)).toBe('1:01:01');
    expect(timerService.formatTime(0)).toBe('0:00');
    expect(timerService.formatTime(59)).toBe('0:59');
  });
});

// ── BookmarkService ─────────────────────────────────────────────────
describe('BookmarkService', () => {
  beforeEach(() => localStorage.clear());

  it('isBookmarked returns false when nothing bookmarked', () => {
    expect(bookmarkService.isBookmarked('a1', 'q1', 's1')).toBe(false);
  });

  it('toggle adds a bookmark and returns true', () => {
    expect(bookmarkService.toggle('a1', 'q1', 's1')).toBe(true);
    expect(bookmarkService.isBookmarked('a1', 'q1', 's1')).toBe(true);
  });

  it('toggle removes a bookmark and returns false', () => {
    bookmarkService.toggle('a1', 'q1', 's1');
    expect(bookmarkService.toggle('a1', 'q1', 's1')).toBe(false);
    expect(bookmarkService.isBookmarked('a1', 'q1', 's1')).toBe(false);
  });

  it('getAll returns all bookmarked question IDs', () => {
    bookmarkService.toggle('a1', 'q1', 's1');
    bookmarkService.toggle('a1', 'q2', 's1');
    bookmarkService.toggle('a1', 'q3', 's1');
    expect(bookmarkService.getAll('a1', 's1')).toEqual(['q1', 'q2', 'q3']);
  });

  it('getAll returns empty for unknown assessment', () => {
    expect(bookmarkService.getAll('x', 'y')).toEqual([]);
  });

  it('clear removes all bookmarks for assessment+student', () => {
    bookmarkService.toggle('a1', 'q1', 's1');
    bookmarkService.toggle('a1', 'q2', 's1');
    bookmarkService.clear('a1', 's1');
    expect(bookmarkService.getAll('a1', 's1')).toEqual([]);
  });

  it('bookmarks are isolated per student', () => {
    bookmarkService.toggle('a1', 'q1', 's1');
    bookmarkService.toggle('a1', 'q1', 's2');
    bookmarkService.clear('a1', 's1');
    expect(bookmarkService.isBookmarked('a1', 'q1', 's2')).toBe(true);
    expect(bookmarkService.isBookmarked('a1', 'q1', 's1')).toBe(false);
  });
});
