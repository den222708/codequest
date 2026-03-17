import { describe, it, expect } from 'vitest';
import { ROLE_PERMISSIONS } from './types';
import type { RolePermissions } from './types';

describe('ROLE_PERMISSIONS', () => {
  const allKeys: (keyof RolePermissions)[] = [
    'canAttemptQuiz',
    'canCreateAssessment',
    'canManageQuestionBank',
    'canViewClassAnalytics',
    'canViewSystemAnalytics',
    'canManageUsers',
    'canManageAdmins',
    'canAccessSystemSettings',
    'canViewPlagiarism',
    'canManageBackups',
    'canAccessLiveMonitor',
    'canViewLeaderboard',
    'canViewSystemLogs',
    'canViewSystemHealth',
  ];

  it('defines exactly student, professor, admin roles', () => {
    expect(Object.keys(ROLE_PERMISSIONS).sort()).toEqual(['admin', 'professor', 'student']);
  });

  it('every role has all 14 permission keys', () => {
    for (const role of Object.keys(ROLE_PERMISSIONS)) {
      const perms = ROLE_PERMISSIONS[role];
      for (const key of allKeys) {
        expect(typeof perms[key]).toBe('boolean');
      }
      expect(Object.keys(perms)).toHaveLength(allKeys.length);
    }
  });

  it('all permission values are booleans', () => {
    for (const role of Object.values(ROLE_PERMISSIONS)) {
      for (const val of Object.values(role)) {
        expect(typeof val).toBe('boolean');
      }
    }
  });

  // ── Student ──
  it('student can attempt quizzes and view leaderboard', () => {
    expect(ROLE_PERMISSIONS.student.canAttemptQuiz).toBe(true);
    expect(ROLE_PERMISSIONS.student.canViewLeaderboard).toBe(true);
  });

  it('student cannot create assessments or manage users', () => {
    expect(ROLE_PERMISSIONS.student.canCreateAssessment).toBe(false);
    expect(ROLE_PERMISSIONS.student.canManageUsers).toBe(false);
    expect(ROLE_PERMISSIONS.student.canAccessSystemSettings).toBe(false);
  });

  // ── Professor ──
  it('professor can create assessments and manage question bank', () => {
    expect(ROLE_PERMISSIONS.professor.canCreateAssessment).toBe(true);
    expect(ROLE_PERMISSIONS.professor.canManageQuestionBank).toBe(true);
  });

  it('professor can view class analytics and plagiarism', () => {
    expect(ROLE_PERMISSIONS.professor.canViewClassAnalytics).toBe(true);
    expect(ROLE_PERMISSIONS.professor.canViewPlagiarism).toBe(true);
    expect(ROLE_PERMISSIONS.professor.canAccessLiveMonitor).toBe(true);
  });

  it('professor cannot manage users or access system settings', () => {
    expect(ROLE_PERMISSIONS.professor.canManageUsers).toBe(false);
    expect(ROLE_PERMISSIONS.professor.canAccessSystemSettings).toBe(false);
    expect(ROLE_PERMISSIONS.professor.canViewSystemAnalytics).toBe(false);
  });

  // ── Admin ──
  it('admin can manage users and system settings', () => {
    expect(ROLE_PERMISSIONS.admin.canManageUsers).toBe(true);
    expect(ROLE_PERMISSIONS.admin.canAccessSystemSettings).toBe(true);
    expect(ROLE_PERMISSIONS.admin.canViewSystemAnalytics).toBe(true);
  });

  it('admin can manage backups and view system logs/health', () => {
    expect(ROLE_PERMISSIONS.admin.canManageBackups).toBe(true);
    expect(ROLE_PERMISSIONS.admin.canViewSystemLogs).toBe(true);
    expect(ROLE_PERMISSIONS.admin.canViewSystemHealth).toBe(true);
  });

  it('admin cannot attempt quizzes or create assessments', () => {
    expect(ROLE_PERMISSIONS.admin.canAttemptQuiz).toBe(false);
    expect(ROLE_PERMISSIONS.admin.canCreateAssessment).toBe(false);
  });

  it('no role can manage admins (super-admin only)', () => {
    for (const perms of Object.values(ROLE_PERMISSIONS)) {
      expect(perms.canManageAdmins).toBe(false);
    }
  });
});
