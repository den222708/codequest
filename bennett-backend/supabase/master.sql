-- ============================================================================
-- Bennett CodeQuest — Master SQL (Supabase SQL Editor)
-- Generated: 2026-03-17
-- Run this ONCE in Supabase SQL Editor to create all tables, indexes,
-- RLS policies, triggers, and seed data from scratch.
--
-- IMPORTANT: This file creates profile rows with PLACEHOLDER UUIDs.
-- After running, you must:
--   1. Create admin + teacher in Supabase Auth (Dashboard > Authentication)
--   2. UPDATE profiles SET user_id = '<real-uuid>' WHERE email = '...'
--   3. Students: use the /admin/users/bulk API endpoint, or let them self-register
-- ============================================================================

-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 1: Extensions
-- ════════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 2: Tables (17 tables in dependency order)
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. Profiles ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  user_id               UUID PRIMARY KEY,
  name                  TEXT NOT NULL,
  email                 TEXT NOT NULL UNIQUE,
  role                  TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')) DEFAULT 'student',
  avatar_url            TEXT,
  department            TEXT,
  enrollment_id         TEXT,
  status                TEXT NOT NULL CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  last_login            TIMESTAMPTZ,
  failed_login_attempts INT NOT NULL DEFAULT 0,
  locked_until          TIMESTAMPTZ,
  password_changed_at   TIMESTAMPTZ DEFAULT now(),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 2. Questions ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS questions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            TEXT NOT NULL,
  description      TEXT NOT NULL,
  difficulty       TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  question_type    TEXT NOT NULL DEFAULT 'coding' CHECK (question_type IN ('coding', 'mcq', 'short_answer', 'true_false')),
  topic            TEXT NOT NULL,
  tags             TEXT[] DEFAULT '{}',
  points           INT NOT NULL DEFAULT 10,
  time_limit       INT NOT NULL DEFAULT 30,
  memory_limit     INT NOT NULL DEFAULT 256,
  test_cases       JSONB NOT NULL DEFAULT '[]',
  boilerplate_code JSONB DEFAULT '{}',
  solution         TEXT,
  hints            TEXT[] DEFAULT '{}',
  options          JSONB DEFAULT NULL,
  correct_answer   TEXT DEFAULT NULL,
  is_visible       BOOLEAN NOT NULL DEFAULT true,
  usage_count      INT NOT NULL DEFAULT 0,
  created_by       UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 3. Assessments ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assessments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('quiz', 'exam', 'assignment', 'practice')),
  difficulty      TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  duration        INT NOT NULL,
  passing_score   NUMERIC NOT NULL DEFAULT 60,
  total_points    INT NOT NULL,
  start_date      TIMESTAMPTZ NOT NULL,
  end_date        TIMESTAMPTZ NOT NULL,
  settings        JSONB DEFAULT '{}',
  status          TEXT NOT NULL CHECK (status IN ('draft', 'published', 'active', 'completed')) DEFAULT 'draft',
  course_code     TEXT,
  course_name     TEXT,
  monitoring_mode TEXT DEFAULT 'standard' CHECK (monitoring_mode IN ('standard', 'proctored')),
  created_by      UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 4. Assessment Questions (junction) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS assessment_questions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  question_id   UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  "order"       INT NOT NULL DEFAULT 0,
  points        INT NOT NULL DEFAULT 0,
  UNIQUE(assessment_id, question_id)
);

-- ── 5. Assessment Attempts ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS assessment_attempts (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  student_id    UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  status        TEXT NOT NULL CHECK (status IN ('in-progress', 'completed', 'timed-out')) DEFAULT 'in-progress',
  score         INT NOT NULL DEFAULT 0,
  max_score     INT NOT NULL DEFAULT 0,
  time_spent    INT NOT NULL DEFAULT 0,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 6. Submissions ───────────────────────────────────────────────────────
-- BUG FIX: Added 'wrong_answer' to status CHECK (backend writes it for MCQ/short_answer/true_false)
CREATE TABLE IF NOT EXISTS submissions (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id    UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  question_id   UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  attempt_id    UUID NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
  code          TEXT NOT NULL,
  language      TEXT NOT NULL,
  score         INT NOT NULL DEFAULT 0,
  max_score     INT NOT NULL DEFAULT 0,
  tests_passed  INT NOT NULL DEFAULT 0,
  tests_total   INT NOT NULL DEFAULT 0,
  test_results  JSONB DEFAULT '[]',
  status        TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'partial', 'rejected', 'error', 'wrong_answer')) DEFAULT 'pending',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 7. Activity Logs ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_logs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  action     TEXT NOT NULL,
  details    JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 8. Classes (course sections) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS classes (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  code        TEXT NOT NULL UNIQUE,
  description TEXT,
  department  TEXT,
  schedule    TEXT,
  teacher_id  UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  status      TEXT NOT NULL CHECK (status IN ('active', 'archived')) DEFAULT 'active',
  created_by  UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 9. Class Enrollments ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS class_enrollments (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id    UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id  UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(class_id, student_id)
);

-- ── 10. Assessment Assignments (to classes) ──────────────────────────────
CREATE TABLE IF NOT EXISTS assessment_assignments (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  class_id      UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  assigned_by   UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  assigned_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(assessment_id, class_id)
);

-- ── 11. Token Blacklist ──────────────────────────────────────────────────
-- BUG FIX: Added id + created_at columns (cleanupJobs.ts references them)
CREATE TABLE IF NOT EXISTS token_blacklist (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token_hash TEXT NOT NULL UNIQUE,
  user_id    UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  revoked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 12. Active Sessions ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS active_sessions (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id        UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  token_hash     TEXT NOT NULL,
  ip_address     TEXT,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 13. Notifications ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'assessment', 'submission', 'system')) DEFAULT 'info',
  is_read    BOOLEAN NOT NULL DEFAULT false,
  link       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 14. Password History ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS password_history (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 15. Backups ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS backups (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('full', 'incremental', 'differential')) DEFAULT 'full',
  size         BIGINT NOT NULL DEFAULT 0,
  status       TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'failed')) DEFAULT 'in_progress',
  includes     TEXT[] DEFAULT '{}',
  created_by   UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  completed_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 16. Plagiarism Results ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS plagiarism_results (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id       UUID REFERENCES assessments(id) ON DELETE CASCADE,
  student_id          UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  student_name        TEXT,
  similarity_score    NUMERIC NOT NULL DEFAULT 0,
  flagged             BOOLEAN NOT NULL DEFAULT false,
  status              TEXT NOT NULL CHECK (status IN ('pending', 'cleared', 'confirmed')) DEFAULT 'pending',
  matched_submissions JSONB DEFAULT '[]',
  reviewed_by         UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  reviewed_at         TIMESTAMPTZ,
  submission_id       UUID REFERENCES submissions(id) ON DELETE CASCADE,
  question_id         UUID REFERENCES questions(id) ON DELETE CASCADE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── 17. Monitoring Events ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS monitoring_events (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id    UUID NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  student_id    UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  event_type    TEXT NOT NULL CHECK (event_type IN ('heartbeat', 'violation', 'join', 'leave', 'instruction', 'instruction_ack')),
  payload       JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 3: Indexes
-- ════════════════════════════════════════════════════════════════════════════

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Questions
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic);
CREATE INDEX IF NOT EXISTS idx_questions_created_by ON questions(created_by);

-- Assessments
CREATE INDEX IF NOT EXISTS idx_assessments_status ON assessments(status);
CREATE INDEX IF NOT EXISTS idx_assessments_created_by ON assessments(created_by);

-- Assessment Questions
CREATE INDEX IF NOT EXISTS idx_assessment_questions_assessment ON assessment_questions(assessment_id);

-- Assessment Attempts
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_assessment ON assessment_attempts(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_student ON assessment_attempts(student_id);

-- Submissions
CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assessment ON submissions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_attempt ON submissions(attempt_id);

-- Activity Logs
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);

-- Classes
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_code ON classes(code);

-- Class Enrollments
CREATE INDEX IF NOT EXISTS idx_class_enrollments_class ON class_enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_student ON class_enrollments(student_id);

-- Assessment Assignments
CREATE INDEX IF NOT EXISTS idx_assessment_assignments_assessment ON assessment_assignments(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_assignments_class ON assessment_assignments(class_id);

-- Token Blacklist
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires ON token_blacklist(expires_at);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_created ON token_blacklist(created_at);

-- Active Sessions
CREATE INDEX IF NOT EXISTS idx_active_sessions_user ON active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_token ON active_sessions(token_hash);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, is_read);

-- Password History
CREATE INDEX IF NOT EXISTS idx_password_history_user ON password_history(user_id);

-- Plagiarism Results
CREATE INDEX IF NOT EXISTS idx_plagiarism_assessment ON plagiarism_results(assessment_id);
CREATE INDEX IF NOT EXISTS idx_plagiarism_student ON plagiarism_results(student_id);
CREATE INDEX IF NOT EXISTS idx_plagiarism_submission ON plagiarism_results(submission_id);
CREATE INDEX IF NOT EXISTS idx_plagiarism_question ON plagiarism_results(question_id);

-- Monitoring Events
CREATE INDEX IF NOT EXISTS idx_monitoring_events_attempt ON monitoring_events(attempt_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_events_assessment ON monitoring_events(assessment_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_events_type ON monitoring_events(assessment_id, event_type);
CREATE INDEX IF NOT EXISTS idx_monitoring_events_created ON monitoring_events(created_at);

-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 4: Functions
-- ════════════════════════════════════════════════════════════════════════════

-- Auto-update updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Helper: SECURITY DEFINER function to get current user's role
-- (avoids recursive RLS on profiles table)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role FROM public.profiles WHERE user_id = auth.uid();
$$;

-- Helper: check if caller has a given role
CREATE OR REPLACE FUNCTION public.is_role(allowed_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
      AND role = ANY(allowed_roles)
  );
$$;

-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 5: Triggers
-- ════════════════════════════════════════════════════════════════════════════

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER questions_updated_at BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER assessments_updated_at BEFORE UPDATE ON assessments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER attempts_updated_at BEFORE UPDATE ON assessment_attempts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER classes_updated_at BEFORE UPDATE ON classes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 6: Row Level Security (RLS)
-- ════════════════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_blacklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE plagiarism_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitoring_events ENABLE ROW LEVEL SECURITY;

-- token_blacklist intentionally has no user policies:
-- with RLS enabled and no policies, anon/authenticated clients are denied.
-- Backend service-role operations continue to work.

-- ────────────────────────────────────────────────────────────────────────
-- PROFILES
-- ────────────────────────────────────────────────────────────────────────
CREATE POLICY profiles_select ON profiles FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_role(ARRAY['teacher','admin'])
  );

CREATE POLICY profiles_update_self ON profiles FOR UPDATE
  TO authenticated
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY profiles_insert ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR public.is_role(ARRAY['admin'])
  );

CREATE POLICY profiles_delete ON profiles FOR DELETE
  TO authenticated
  USING (public.is_role(ARRAY['admin']));

-- ────────────────────────────────────────────────────────────────────────
-- QUESTIONS
-- ────────────────────────────────────────────────────────────────────────
CREATE POLICY questions_select ON questions FOR SELECT
  TO authenticated
  USING (
    is_visible = true
    OR public.is_role(ARRAY['teacher','admin'])
  );

CREATE POLICY questions_insert ON questions FOR INSERT
  TO authenticated
  WITH CHECK (public.is_role(ARRAY['teacher','admin']));

CREATE POLICY questions_update ON questions FOR UPDATE
  TO authenticated
  USING (public.is_role(ARRAY['teacher','admin']));

CREATE POLICY questions_delete ON questions FOR DELETE
  TO authenticated
  USING (public.is_role(ARRAY['teacher','admin']));

-- ────────────────────────────────────────────────────────────────────────
-- ASSESSMENTS
-- ────────────────────────────────────────────────────────────────────────
CREATE POLICY assessments_select ON assessments FOR SELECT
  TO authenticated
  USING (
    status IN ('published', 'active', 'completed')
    OR public.is_role(ARRAY['teacher','admin'])
  );

CREATE POLICY assessments_insert ON assessments FOR INSERT
  TO authenticated
  WITH CHECK (public.is_role(ARRAY['teacher','admin']));

CREATE POLICY assessments_update ON assessments FOR UPDATE
  TO authenticated
  USING (public.is_role(ARRAY['teacher','admin']));

CREATE POLICY assessments_delete ON assessments FOR DELETE
  TO authenticated
  USING (public.is_role(ARRAY['teacher','admin']));

-- ────────────────────────────────────────────────────────────────────────
-- ASSESSMENT_QUESTIONS (junction)
-- ────────────────────────────────────────────────────────────────────────
CREATE POLICY aq_select ON assessment_questions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY aq_insert ON assessment_questions FOR INSERT
  TO authenticated
  WITH CHECK (public.is_role(ARRAY['teacher','admin']));

CREATE POLICY aq_update ON assessment_questions FOR UPDATE
  TO authenticated
  USING (public.is_role(ARRAY['teacher','admin']));

CREATE POLICY aq_delete ON assessment_questions FOR DELETE
  TO authenticated
  USING (public.is_role(ARRAY['teacher','admin']));

-- ────────────────────────────────────────────────────────────────────────
-- ASSESSMENT_ATTEMPTS
-- ────────────────────────────────────────────────────────────────────────
CREATE POLICY attempts_select ON assessment_attempts FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
    OR public.is_role(ARRAY['teacher','admin'])
  );

CREATE POLICY attempts_insert ON assessment_attempts FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

CREATE POLICY attempts_update ON assessment_attempts FOR UPDATE
  TO authenticated
  USING (
    student_id = auth.uid()
    OR public.is_role(ARRAY['teacher','admin'])
  );

CREATE POLICY attempts_delete ON assessment_attempts FOR DELETE
  TO authenticated
  USING (public.is_role(ARRAY['admin']));

-- ────────────────────────────────────────────────────────────────────────
-- SUBMISSIONS (immutable — no update/delete policies)
-- ────────────────────────────────────────────────────────────────────────
CREATE POLICY submissions_select ON submissions FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
    OR public.is_role(ARRAY['teacher','admin'])
  );

CREATE POLICY submissions_insert ON submissions FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

-- ────────────────────────────────────────────────────────────────────────
-- ACTIVITY_LOGS (immutable — no update/delete policies)
-- ────────────────────────────────────────────────────────────────────────
CREATE POLICY logs_select ON activity_logs FOR SELECT
  TO authenticated
  USING (public.is_role(ARRAY['admin']));

CREATE POLICY logs_insert ON activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ────────────────────────────────────────────────────────────────────────
-- CLASSES
-- ────────────────────────────────────────────────────────────────────────
CREATE POLICY classes_select ON classes FOR SELECT
  TO authenticated
  USING (
    public.is_role(ARRAY['admin'])
    OR teacher_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.class_enrollments
      WHERE class_enrollments.class_id = classes.id
        AND class_enrollments.student_id = auth.uid()
    )
  );

CREATE POLICY classes_insert ON classes FOR INSERT
  TO authenticated
  WITH CHECK (public.is_role(ARRAY['admin']));

CREATE POLICY classes_update ON classes FOR UPDATE
  TO authenticated
  USING (public.is_role(ARRAY['admin']));

CREATE POLICY classes_delete ON classes FOR DELETE
  TO authenticated
  USING (public.is_role(ARRAY['admin']));

-- ────────────────────────────────────────────────────────────────────────
-- CLASS_ENROLLMENTS
-- ────────────────────────────────────────────────────────────────────────
CREATE POLICY enrollments_select ON class_enrollments FOR SELECT
  TO authenticated
  USING (
    public.is_role(ARRAY['admin'])
    OR student_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.classes
      WHERE classes.id = class_enrollments.class_id
        AND classes.teacher_id = auth.uid()
    )
  );

CREATE POLICY enrollments_insert ON class_enrollments FOR INSERT
  TO authenticated
  WITH CHECK (public.is_role(ARRAY['admin']));

CREATE POLICY enrollments_delete ON class_enrollments FOR DELETE
  TO authenticated
  USING (public.is_role(ARRAY['admin']));

-- ────────────────────────────────────────────────────────────────────────
-- ASSESSMENT_ASSIGNMENTS
-- ────────────────────────────────────────────────────────────────────────
CREATE POLICY assignments_select ON assessment_assignments FOR SELECT
  TO authenticated
  USING (
    public.is_role(ARRAY['admin'])
    OR EXISTS (
      SELECT 1 FROM public.classes
      WHERE classes.id = assessment_assignments.class_id
        AND classes.teacher_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.class_enrollments
      WHERE class_enrollments.class_id = assessment_assignments.class_id
        AND class_enrollments.student_id = auth.uid()
    )
  );

CREATE POLICY assignments_insert ON assessment_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_role(ARRAY['admin'])
    OR EXISTS (
      SELECT 1 FROM public.classes
      WHERE classes.id = assessment_assignments.class_id
        AND classes.teacher_id = auth.uid()
    )
  );

CREATE POLICY assignments_delete ON assessment_assignments FOR DELETE
  TO authenticated
  USING (
    public.is_role(ARRAY['admin'])
    OR EXISTS (
      SELECT 1 FROM public.classes
      WHERE classes.id = assessment_assignments.class_id
        AND classes.teacher_id = auth.uid()
    )
  );

-- ────────────────────────────────────────────────────────────────────────
-- ACTIVE_SESSIONS
-- ────────────────────────────────────────────────────────────────────────
CREATE POLICY active_sessions_select ON active_sessions FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_role(ARRAY['admin'])
  );

CREATE POLICY active_sessions_insert ON active_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY active_sessions_delete ON active_sessions FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_role(ARRAY['admin'])
  );

-- ────────────────────────────────────────────────────────────────────────
-- NOTIFICATIONS
-- ────────────────────────────────────────────────────────────────────────
CREATE POLICY notifications_select ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY notifications_insert ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY notifications_update ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY notifications_delete ON notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- ────────────────────────────────────────────────────────────────────────
-- PASSWORD_HISTORY (service-role only — no user policies)
-- ────────────────────────────────────────────────────────────────────────
-- Access is via service-role key in auth routes

-- ────────────────────────────────────────────────────────────────────────
-- BACKUPS
-- ────────────────────────────────────────────────────────────────────────
CREATE POLICY backups_select ON backups FOR SELECT
  TO authenticated
  USING (public.is_role(ARRAY['admin']));

CREATE POLICY backups_insert ON backups FOR INSERT
  TO authenticated
  WITH CHECK (public.is_role(ARRAY['admin']));

CREATE POLICY backups_update ON backups FOR UPDATE
  TO authenticated
  USING (public.is_role(ARRAY['admin']));

CREATE POLICY backups_delete ON backups FOR DELETE
  TO authenticated
  USING (public.is_role(ARRAY['admin']));

-- ────────────────────────────────────────────────────────────────────────
-- PLAGIARISM_RESULTS
-- ────────────────────────────────────────────────────────────────────────
CREATE POLICY plagiarism_results_select ON plagiarism_results FOR SELECT
  TO authenticated
  USING (public.is_role(ARRAY['teacher', 'admin']));

CREATE POLICY plagiarism_results_insert ON plagiarism_results FOR INSERT
  TO authenticated
  WITH CHECK (public.is_role(ARRAY['teacher', 'admin']));

CREATE POLICY plagiarism_results_update ON plagiarism_results FOR UPDATE
  TO authenticated
  USING (public.is_role(ARRAY['teacher', 'admin']));

CREATE POLICY plagiarism_results_delete ON plagiarism_results FOR DELETE
  TO authenticated
  USING (public.is_role(ARRAY['teacher', 'admin']));

-- ────────────────────────────────────────────────────────────────────────
-- MONITORING_EVENTS
-- ────────────────────────────────────────────────────────────────────────
CREATE POLICY monitoring_events_select_teacher ON monitoring_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM assessments a
      WHERE a.id = assessment_id
        AND a.created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid()
        AND p.role = 'admin'
    )
  );

CREATE POLICY monitoring_events_select_student ON monitoring_events FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

CREATE POLICY monitoring_events_insert ON monitoring_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ════════════════════════════════════════════════════════════════════════════
-- SECTION 7: Seed Data
-- ════════════════════════════════════════════════════════════════════════════
-- NOTE: Profile rows use PLACEHOLDER UUIDs because auth.users are managed
-- by Supabase Auth. After running this file:
--   1. Create users in Supabase Dashboard > Authentication > Users
--   2. Run UPDATE profiles SET user_id = '<real-uuid>' WHERE email = '...'
--
-- Hosted Supabase does not allow disabling system FK triggers. To keep this
-- script runnable in SQL Editor, we seed first and add the profiles->auth.users
-- FK at the end in NOT VALID mode.
-- ════════════════════════════════════════════════════════════════════════════

-- If this file is re-run after a previous attempt, drop the validated FK so
-- placeholder profile UUIDs can be seeded safely.
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;

-- ── 7.1 Admin Profile ────────────────────────────────────────────────────
INSERT INTO profiles (user_id, name, email, role, department, enrollment_id, status)
VALUES
  ('a0000000-0000-4000-a000-000000000001', 'Admin', 'admin@bennett.edu.in', 'admin', 'Computer Science and Engineering', NULL, 'active')
ON CONFLICT (user_id) DO NOTHING;

-- ── 7.2 Teacher Profile (Sanchit) ────────────────────────────────────────
INSERT INTO profiles (user_id, name, email, role, department, enrollment_id, status)
VALUES
  ('b0000000-0001-4000-a000-000000000001', 'Sanchit', 'sanchit@bennett.edu.in', 'teacher', 'Computer Science and Engineering', NULL, 'active')
ON CONFLICT (user_id) DO NOTHING;

-- ── 7.3 Student Profiles (113 students — Bennett CSE Batch 2023) ─────────
INSERT INTO profiles (user_id, name, email, role, department, enrollment_id, status)
VALUES
  ('d0000000-0001-4000-a000-000000000001', 'GEETESH DALAL', 'e23cseu0361@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0361', 'active'),
  ('d0000000-0002-4000-a000-000000000002', 'CHAHAT THAKUR', 'e23cseu0365@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0365', 'active'),
  ('d0000000-0003-4000-a000-000000000003', 'GAURIKA AGARWAL', 'e23cseu0369@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0369', 'active'),
  ('d0000000-0004-4000-a000-000000000004', 'ANSH JAIN', 'e23cseu0371@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0371', 'active'),
  ('d0000000-0005-4000-a000-000000000005', 'YASH VERMA', 'e23cseu0372@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0372', 'active'),
  ('d0000000-0006-4000-a000-000000000006', 'SAUMYA KUMARI', 'e23cseu0375@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0375', 'active'),
  ('d0000000-0007-4000-a000-000000000007', 'TANYA CHANDRA', 'e23cseu0376@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0376', 'active'),
  ('d0000000-0008-4000-a000-000000000008', 'DIVYANSHU PATHAK', 'e23cseu0379@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0379', 'active'),
  ('d0000000-0009-4000-a000-000000000009', 'HIMANSHU GYANESHWAR WANKHADE', 'e23cseu0380@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0380', 'active'),
  ('d0000000-0010-4000-a000-000000000010', 'LAKSHAY GUPTA', 'e23cseu0383@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0383', 'active'),
  ('d0000000-0011-4000-a000-000000000011', 'MEHUL KATARIA', 'e23cseu0385@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0385', 'active'),
  ('d0000000-0012-4000-a000-000000000012', 'VARISHTH SINGH', 'e23cseu0392@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0392', 'active'),
  ('d0000000-0013-4000-a000-000000000013', 'LAVANSH JINDAL', 'e23cseu0395@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0395', 'active'),
  ('d0000000-0014-4000-a000-000000000014', 'TANISHA TOMER', 'e23cseu0399@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0399', 'active'),
  ('d0000000-0015-4000-a000-000000000015', 'BHAVYA TOMAR', 'e23cseu0405@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0405', 'active'),
  ('d0000000-0016-4000-a000-000000000016', 'DAKSH BALIYAN', 'e23cseu0407@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0407', 'active'),
  ('d0000000-0017-4000-a000-000000000017', 'AYAN SAWHNEY', 'e23cseu0408@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0408', 'active'),
  ('d0000000-0018-4000-a000-000000000018', 'KISHA AGARWAL', 'e23cseu0409@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0409', 'active'),
  ('d0000000-0019-4000-a000-000000000019', 'KAVYA RATHI', 'e23cseu0415@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0415', 'active'),
  ('d0000000-0020-4000-a000-000000000020', 'ARYAN GUPTA', 'e23cseu0422@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0422', 'active'),
  ('d0000000-0021-4000-a000-000000000021', 'AKINCHAN JAIN', 'e23cseu0423@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0423', 'active'),
  ('d0000000-0022-4000-a000-000000000022', 'RIDDHI CHAPLOT', 'e23cseu0425@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0425', 'active'),
  ('d0000000-0023-4000-a000-000000000023', 'YASH AGARWAL', 'e23cseu0426@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0426', 'active'),
  ('d0000000-0024-4000-a000-000000000024', 'SAGAR SUNIL CHAURASIA', 'e23cseu0428@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0428', 'active'),
  ('d0000000-0025-4000-a000-000000000025', 'RISHIT AJAY ADITYA', 'e23cseu0430@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0430', 'active'),
  ('d0000000-0026-4000-a000-000000000026', 'SUYASH SAXENA', 'e23cseu0434@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0434', 'active'),
  ('d0000000-0027-4000-a000-000000000027', 'VINIT SONI', 'e23cseu0437@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0437', 'active'),
  ('d0000000-0028-4000-a000-000000000028', 'RAGHAV AGGARWAL', 'e23cseu0440@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0440', 'active'),
  ('d0000000-0029-4000-a000-000000000029', 'Nishant .', 'e23cseu0449@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0449', 'active'),
  ('d0000000-0030-4000-a000-000000000030', 'TANMAY AGARWAL', 'e23cseu0452@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0452', 'active'),
  ('d0000000-0031-4000-a000-000000000031', 'BHAVESH KUMAR', 'e23cseu0453@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0453', 'active'),
  ('d0000000-0032-4000-a000-000000000032', 'JATIN BISHT', 'e23cseu0456@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0456', 'active'),
  ('d0000000-0033-4000-a000-000000000033', 'VANSH TYAGI', 'e23cseu0457@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0457', 'active'),
  ('d0000000-0034-4000-a000-000000000034', 'MRIDUL SAHNAN', 'e23cseu0459@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0459', 'active'),
  ('d0000000-0035-4000-a000-000000000035', 'VIBHOR AGARWAL', 'e23cseu0470@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0470', 'active'),
  ('d0000000-0036-4000-a000-000000000036', 'MANAN JAIN', 'e23cseu0479@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0479', 'active'),
  ('d0000000-0037-4000-a000-000000000037', 'DIVITA POKHRIYAL', 'e23cseu0481@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0481', 'active'),
  ('d0000000-0038-4000-a000-000000000038', 'ANUSHKA SHARMA', 'e23cseu0490@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0490', 'active'),
  ('d0000000-0039-4000-a000-000000000039', 'AAYUSH KUMAR', 'e23cseu0500@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0500', 'active'),
  ('d0000000-0040-4000-a000-000000000040', 'PARTH .', 'e23cseu0505@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0505', 'active'),
  ('d0000000-0041-4000-a000-000000000041', 'ARYAN SANGWAN', 'e23cseu0510@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0510', 'active'),
  ('d0000000-0042-4000-a000-000000000042', 'VIKRAM SINGH', 'e23cseu0513@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0513', 'active'),
  ('d0000000-0043-4000-a000-000000000043', 'GAURAV PANDIT', 'e23cseu0514@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0514', 'active'),
  ('d0000000-0044-4000-a000-000000000044', 'VANSH KHANNA', 'e23cseu0518@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0518', 'active'),
  ('d0000000-0045-4000-a000-000000000045', 'SHIVANSH KOACHER', 'e23cseu0521@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0521', 'active'),
  ('d0000000-0046-4000-a000-000000000046', 'HARSHIT BATRA', 'e23cseu0523@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0523', 'active'),
  ('d0000000-0047-4000-a000-000000000047', 'RUDRAKSHA YADAV', 'e23cseu0529@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0529', 'active'),
  ('d0000000-0048-4000-a000-000000000048', 'NISHKARSH AWASTHI', 'e23cseu0530@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0530', 'active'),
  ('d0000000-0049-4000-a000-000000000049', 'VARDHAN PURWAR', 'e23cseu0531@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0531', 'active'),
  ('d0000000-0050-4000-a000-000000000050', 'VANSH TYAGI', 'e23cseu0532@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0532', 'active'),
  ('d0000000-0051-4000-a000-000000000051', 'SHASHI SHEKHAR', 'e23cseu0534@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0534', 'active'),
  ('d0000000-0052-4000-a000-000000000052', 'VARUN CHOUDHARY', 'e23cseu0539@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0539', 'active'),
  ('d0000000-0053-4000-a000-000000000053', 'RONIT AGARWAL', 'e23cseu0540@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU0540', 'active'),
  ('d0000000-0054-4000-a000-000000000054', 'SHAURYA VEER NAGAR', 'e23cseu2014@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2014', 'active'),
  ('d0000000-0055-4000-a000-000000000055', 'PRARTHNA KULSHRESTHA', 'e23cseu2021@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2021', 'active'),
  ('d0000000-0056-4000-a000-000000000056', 'GRACE ESTHER SAMUEL', 'e23cseu2022@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2022', 'active'),
  ('d0000000-0057-4000-a000-000000000057', 'VANSHIKA RAJPUT', 'e23cseu2026@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2026', 'active'),
  ('d0000000-0058-4000-a000-000000000058', 'PRIYANSH AGRAWAL', 'e23cseu2029@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2029', 'active'),
  ('d0000000-0059-4000-a000-000000000059', 'AARYAN GOYAL', 'e23cseu2030@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2030', 'active'),
  ('d0000000-0060-4000-a000-000000000060', 'ANUSHKA SINGH', 'e23cseu2037@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2037', 'active'),
  ('d0000000-0061-4000-a000-000000000061', 'VRIDDHI JAIN', 'e23cseu2042@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2042', 'active'),
  ('d0000000-0062-4000-a000-000000000062', 'SANKALP AGARWAL', 'e23cseu2043@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2043', 'active'),
  ('d0000000-0063-4000-a000-000000000063', 'DEVRAJ SINGH BHADORIA', 'e23cseu2045@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2045', 'active'),
  ('d0000000-0064-4000-a000-000000000064', 'AAKASH .', 'e23cseu2046@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2046', 'active'),
  ('d0000000-0065-4000-a000-000000000065', 'AYUSH KUMAR JHA', 'e23cseu2047@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2047', 'active'),
  ('d0000000-0066-4000-a000-000000000066', 'HARSHIT GUPTA', 'e23cseu2048@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2048', 'active'),
  ('d0000000-0067-4000-a000-000000000067', 'AYUSH PRATAP SINGH', 'e23cseu2049@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2049', 'active'),
  ('d0000000-0068-4000-a000-000000000068', 'SHIVEN CHANDRA', 'e23cseu2051@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2051', 'active'),
  ('d0000000-0069-4000-a000-000000000069', 'ANKUSH AGGARWAL', 'e23cseu2052@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2052', 'active'),
  ('d0000000-0070-4000-a000-000000000070', 'IYANSHI SHARMA', 'e23cseu2055@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2055', 'active'),
  ('d0000000-0071-4000-a000-000000000071', 'GAURAV DUBEY', 'e23cseu2056@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2056', 'active'),
  ('d0000000-0072-4000-a000-000000000072', 'JATIN .', 'e23cseu2059@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2059', 'active'),
  ('d0000000-0073-4000-a000-000000000073', 'POTHULA NAGA VENKATA UDAY TEJ', 'e23cseu2060@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2060', 'active'),
  ('d0000000-0074-4000-a000-000000000074', 'ADITYA SINGH', 'e23cseu2061@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2061', 'active'),
  ('d0000000-0075-4000-a000-000000000075', 'SAKSHAM AGARWAL', 'e23cseu2062@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2062', 'active'),
  ('d0000000-0076-4000-a000-000000000076', 'SUMIT KUMAR', 'e23cseu2065@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2065', 'active'),
  ('d0000000-0077-4000-a000-000000000077', 'VAIBHAVI RAWAT', 'e23cseu2066@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2066', 'active'),
  ('d0000000-0078-4000-a000-000000000078', 'AADYA SINHA', 'e23cseu2067@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2067', 'active'),
  ('d0000000-0079-4000-a000-000000000079', 'UTKARSH MISHRA', 'e23cseu2069@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2069', 'active'),
  ('d0000000-0080-4000-a000-000000000080', 'MOHAMMAD KAIF', 'e23cseu2070@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2070', 'active'),
  ('d0000000-0081-4000-a000-000000000081', 'DEV OJHA', 'e23cseu2071@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2071', 'active'),
  ('d0000000-0082-4000-a000-000000000082', 'DAKSH JAIN', 'e23cseu2072@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2072', 'active'),
  ('d0000000-0083-4000-a000-000000000083', 'AMAN GANGWAR', 'e23cseu2073@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2073', 'active'),
  ('d0000000-0084-4000-a000-000000000084', 'PRINCE KUMAR', 'e23cseu2074@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2074', 'active'),
  ('d0000000-0085-4000-a000-000000000085', 'UTTKARSH THAKUR', 'e23cseu2075@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2075', 'active'),
  ('d0000000-0086-4000-a000-000000000086', 'RAGHAV RATAN AGARWAL', 'e23cseu2076@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2076', 'active'),
  ('d0000000-0087-4000-a000-000000000087', 'PARUL CHHOKER', 'e23cseu2077@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2077', 'active'),
  ('d0000000-0088-4000-a000-000000000088', 'ANSHUL SINGH SANGWAN', 'e23cseu2078@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2078', 'active'),
  ('d0000000-0089-4000-a000-000000000089', 'SARTHAK SHAH', 'e23cseu2079@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2079', 'active'),
  ('d0000000-0090-4000-a000-000000000090', 'ABHISHEK YADAV', 'e23cseu2081@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2081', 'active'),
  ('d0000000-0091-4000-a000-000000000091', 'AYUSH MISHRA', 'e23cseu2082@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2082', 'active'),
  ('d0000000-0092-4000-a000-000000000092', 'NAVYA GUPTA', 'e23cseu2083@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2083', 'active'),
  ('d0000000-0093-4000-a000-000000000093', 'ROHIT OJHA', 'e23cseu2084@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2084', 'active'),
  ('d0000000-0094-4000-a000-000000000094', 'MAYANK JAIN MALU', 'e23cseu2086@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2086', 'active'),
  ('d0000000-0095-4000-a000-000000000095', 'CHIRAG KHOLA', 'e23cseu2087@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2087', 'active'),
  ('d0000000-0096-4000-a000-000000000096', 'BHAVYA KHOKHAR', 'e23cseu2089@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2089', 'active'),
  ('d0000000-0097-4000-a000-000000000097', 'LAKSHAY GOLA', 'e23cseu2090@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2090', 'active'),
  ('d0000000-0098-4000-a000-000000000098', 'SARAS .', 'e23cseu2097@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2097', 'active'),
  ('d0000000-0099-4000-a000-000000000099', 'MRIDU CHAUHAN', 'e23cseu2098@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2098', 'active'),
  ('d0000000-0100-4000-a000-000000000100', 'YUVRAJ SINGH', 'e23cseu2100@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2100', 'active'),
  ('d0000000-0101-4000-a000-000000000101', 'SWASTIK GAUR', 'e23cseu2102@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2102', 'active'),
  ('d0000000-0102-4000-a000-000000000102', 'AVANTIKA SINGH', 'e23cseu2103@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2103', 'active'),
  ('d0000000-0103-4000-a000-000000000103', 'PANKAJ KUMAR SAH', 'e23cseu2104@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2104', 'active'),
  ('d0000000-0104-4000-a000-000000000104', 'D ANIL KUMAR', 'e23cseu2108@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2108', 'active'),
  ('d0000000-0105-4000-a000-000000000105', 'IKSHITA SABOO', 'e23cseu2112@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2112', 'active'),
  ('d0000000-0106-4000-a000-000000000106', 'AARAW THAWARE', 'e23cseu2122@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2122', 'active'),
  ('d0000000-0107-4000-a000-000000000107', 'SAMAKSH JAIN', 'e23cseu2130@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2130', 'active'),
  ('d0000000-0108-4000-a000-000000000108', 'VINAYAK KUMAR SINGH', 'e23cseu2426@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2426', 'active'),
  ('d0000000-0109-4000-a000-000000000109', 'VAIBHAV IDUPULURI', 'e23cseu2427@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2427', 'active'),
  ('d0000000-0110-4000-a000-000000000110', 'DAKSH VASHISTHA', 'e23cseu2429@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2429', 'active'),
  ('d0000000-0111-4000-a000-000000000111', 'PRIYANSH BANSAL', 'e23cseu2430@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2430', 'active'),
  ('d0000000-0112-4000-a000-000000000112', 'SUYASH DANGI', 'e23cseu2432@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2432', 'active'),
  ('d0000000-0113-4000-a000-000000000113', 'KRISHANG VERMA', 'e23cseu2436@bennett.edu.in', 'student', 'Computer Science and Engineering', 'E23CSEU2436', 'active')
ON CONFLICT (user_id) DO NOTHING;

-- ── 7.4 Questions (12 Array Algorithm questions — C++) ───────────────────
INSERT INTO questions (id, title, description, difficulty, question_type, topic, tags, points, time_limit, test_cases, boilerplate_code, solution, created_by)
VALUES

-- Q1: Find First Occurrence (Linear Search)
('e0000000-0001-4000-a000-000000000001',
 'Find First Occurrence (Linear Search)',
 'You are given an array of N integers and an integer X. Find the index of the first occurrence of X in the array. If the element appears multiple times return the index of the first occurrence. If the element does not exist print -1.

Input Format:
N
Array elements
X

Output Format:
Index of first occurrence or -1',
 'easy', 'coding', 'Array Algorithms and Techniques',
 ARRAY['arrays','linear-search','easy'],
 10, 30,
 '[
   {"input":"5\n4 2 7 2 9\n2","expectedOutput":"1","isHidden":false},
   {"input":"6\n10 20 30 40 50 60\n40","expectedOutput":"3","isHidden":false},
   {"input":"4\n5 6 7 8\n10","expectedOutput":"-1","isHidden":true},
   {"input":"1\n9\n9","expectedOutput":"0","isHidden":true},
   {"input":"5\n3 3 3 3 3\n3","expectedOutput":"0","isHidden":true},
   {"input":"5\n1 2 3 4 5\n5","expectedOutput":"4","isHidden":true}
 ]'::jsonb,
 '{"cpp":"#include <iostream>\nusing namespace std;\nint main(){\n  int n,x;\n  cin>>n;\n  int a[n];\n  for(int i=0;i<n;i++) cin>>a[i];\n  cin>>x;\n  // Write your solution here\n  return 0;\n}"}'::jsonb,
 '#include <iostream>\nusing namespace std;\nint main(){\nint n,x;\ncin>>n;\nint a[n];\nfor(int i=0;i<n;i++) cin>>a[i];\ncin>>x;\nfor(int i=0;i<n;i++){\n if(a[i]==x){ cout<<i; return 0;}\n}\ncout<<-1;\n}',
 'b0000000-0001-4000-a000-000000000001'),

-- Q2: Binary Search in Sorted Array
('e0000000-0002-4000-a000-000000000002',
 'Binary Search in Sorted Array',
 'Given a sorted array and value X, use binary search to find the index of X. If the element is not present print -1.

Input Format:
N
Sorted array
X

Output Format:
Index or -1',
 'easy', 'coding', 'Array Algorithms and Techniques',
 ARRAY['arrays','binary-search','easy'],
 10, 30,
 '[
   {"input":"6\n1 3 5 7 9 11\n7","expectedOutput":"3","isHidden":false},
   {"input":"5\n2 4 6 8 10\n8","expectedOutput":"3","isHidden":false},
   {"input":"5\n2 4 6 8 10\n1","expectedOutput":"-1","isHidden":true},
   {"input":"1\n5\n5","expectedOutput":"0","isHidden":true},
   {"input":"7\n1 2 3 4 5 6 7\n6","expectedOutput":"5","isHidden":true},
   {"input":"4\n10 20 30 40\n25","expectedOutput":"-1","isHidden":true}
 ]'::jsonb,
 '{"cpp":"#include <iostream>\nusing namespace std;\nint main(){\n  int n,x;\n  cin>>n;\n  int a[n];\n  for(int i=0;i<n;i++) cin>>a[i];\n  cin>>x;\n  // Write your binary search solution here\n  return 0;\n}"}'::jsonb,
 '#include <iostream>\nusing namespace std;\nint main(){\nint n,x;\ncin>>n;\nint a[n];\nfor(int i=0;i<n;i++) cin>>a[i];\ncin>>x;\nint l=0,r=n-1;\nwhile(l<=r){\n int mid=(l+r)/2;\n if(a[mid]==x){cout<<mid;return 0;}\n else if(a[mid]<x) l=mid+1;\n else r=mid-1;\n}\ncout<<-1;\n}',
 'b0000000-0001-4000-a000-000000000001'),

-- Q3: Count Occurrences
('e0000000-0003-4000-a000-000000000003',
 'Count Occurrences',
 'Given an array and value X, count how many times X appears.

Input Format:
N
Array
X

Output Format:
Count',
 'easy', 'coding', 'Array Algorithms and Techniques',
 ARRAY['arrays','counting','easy'],
 10, 30,
 '[
   {"input":"7\n1 2 3 2 4 2 5\n2","expectedOutput":"3","isHidden":false},
   {"input":"5\n1 1 1 1 1\n1","expectedOutput":"5","isHidden":false},
   {"input":"4\n3 4 5 6\n1","expectedOutput":"0","isHidden":true},
   {"input":"6\n10 20 10 30 10 40\n10","expectedOutput":"3","isHidden":true},
   {"input":"3\n7 8 9\n8","expectedOutput":"1","isHidden":true},
   {"input":"1\n5\n5","expectedOutput":"1","isHidden":true}
 ]'::jsonb,
 '{"cpp":"#include <iostream>\nusing namespace std;\nint main(){\n  int n,x;\n  cin>>n;\n  int a[n];\n  for(int i=0;i<n;i++) cin>>a[i];\n  cin>>x;\n  // Count occurrences of x\n  return 0;\n}"}'::jsonb,
 '#include <iostream>\nusing namespace std;\nint main(){\nint n,x,count=0;\ncin>>n;\nint a[n];\nfor(int i=0;i<n;i++) cin>>a[i];\ncin>>x;\nfor(int i=0;i<n;i++)\n if(a[i]==x) count++;\ncout<<count;\n}',
 'b0000000-0001-4000-a000-000000000001'),

-- Q4: Find Minimum Element
('e0000000-0004-4000-a000-000000000004',
 'Find Minimum Element',
 'Find the smallest element in the given array.

Input Format:
N
Array

Output Format:
Minimum element',
 'easy', 'coding', 'Array Algorithms and Techniques',
 ARRAY['arrays','min-max','easy'],
 10, 30,
 '[
   {"input":"5\n8 3 6 2 7","expectedOutput":"2","isHidden":false},
   {"input":"4\n10 20 30 40","expectedOutput":"10","isHidden":false},
   {"input":"3\n5 1 9","expectedOutput":"1","isHidden":true},
   {"input":"1\n7","expectedOutput":"7","isHidden":true},
   {"input":"5\n9 8 7 6 5","expectedOutput":"5","isHidden":true},
   {"input":"6\n4 4 4 4 4 4","expectedOutput":"4","isHidden":true}
 ]'::jsonb,
 '{"cpp":"#include <iostream>\nusing namespace std;\nint main(){\n  int n;\n  cin>>n;\n  int a[n];\n  for(int i=0;i<n;i++) cin>>a[i];\n  // Find minimum element\n  return 0;\n}"}'::jsonb,
 '#include <iostream>\nusing namespace std;\nint main(){\nint n;\ncin>>n;\nint a[n];\nfor(int i=0;i<n;i++) cin>>a[i];\nint mn=a[0];\nfor(int i=1;i<n;i++)\n if(a[i]<mn) mn=a[i];\ncout<<mn;\n}',
 'b0000000-0001-4000-a000-000000000001'),

-- Q5: Pair With Given Sum
('e0000000-0005-4000-a000-000000000005',
 'Pair With Given Sum',
 'Given a sorted array and integer K, determine whether two numbers exist whose sum equals K.

Input Format:
N
Sorted array
K

Output Format:
YES or NO',
 'medium', 'coding', 'Array Algorithms and Techniques',
 ARRAY['arrays','two-pointer','medium'],
 15, 30,
 '[
   {"input":"5\n1 2 3 4 6\n6","expectedOutput":"YES","isHidden":false},
   {"input":"4\n2 5 9 11\n10","expectedOutput":"NO","isHidden":false},
   {"input":"6\n1 3 5 7 9 11\n12","expectedOutput":"YES","isHidden":true},
   {"input":"3\n1 2 3\n7","expectedOutput":"NO","isHidden":true},
   {"input":"5\n2 4 6 8 10\n14","expectedOutput":"YES","isHidden":true},
   {"input":"4\n1 1 1 1\n2","expectedOutput":"YES","isHidden":true}
 ]'::jsonb,
 '{"cpp":"#include <iostream>\nusing namespace std;\nint main(){\n  int n,k;\n  cin>>n;\n  int a[n];\n  for(int i=0;i<n;i++) cin>>a[i];\n  cin>>k;\n  // Use two pointers to find pair with sum k\n  return 0;\n}"}'::jsonb,
 '#include <iostream>\nusing namespace std;\nint main(){\nint n,k;\ncin>>n;\nint a[n];\nfor(int i=0;i<n;i++) cin>>a[i];\ncin>>k;\nint l=0,r=n-1;\nwhile(l<r){\n int sum=a[l]+a[r];\n if(sum==k){cout<<"YES";return 0;}\n else if(sum<k) l++;\n else r--;\n}\ncout<<"NO";\n}',
 'b0000000-0001-4000-a000-000000000001'),

-- Q6: Remove Duplicates from Sorted Array
('e0000000-0006-4000-a000-000000000006',
 'Remove Duplicates from Sorted Array',
 'Given a sorted array remove duplicates and print number of unique elements.

Input Format:
N
Sorted array

Output Format:
Count of unique elements',
 'easy', 'coding', 'Array Algorithms and Techniques',
 ARRAY['arrays','deduplication','easy'],
 10, 30,
 '[
   {"input":"6\n1 1 2 2 3 4","expectedOutput":"4","isHidden":false},
   {"input":"5\n1 1 1 1 1","expectedOutput":"1","isHidden":false},
   {"input":"4\n1 2 3 4","expectedOutput":"4","isHidden":true},
   {"input":"3\n5 5 6","expectedOutput":"2","isHidden":true},
   {"input":"7\n1 2 2 3 3 4 5","expectedOutput":"5","isHidden":true},
   {"input":"1\n10","expectedOutput":"1","isHidden":true}
 ]'::jsonb,
 '{"cpp":"#include <iostream>\nusing namespace std;\nint main(){\n  int n;\n  cin>>n;\n  int a[n];\n  for(int i=0;i<n;i++) cin>>a[i];\n  // Count unique elements\n  return 0;\n}"}'::jsonb,
 '#include <iostream>\nusing namespace std;\nint main(){\nint n;\ncin>>n;\nint a[n];\nfor(int i=0;i<n;i++) cin>>a[i];\nint count=1;\nfor(int i=1;i<n;i++)\n if(a[i]!=a[i-1]) count++;\ncout<<count;\n}',
 'b0000000-0001-4000-a000-000000000001'),

-- Q7: Reverse Array Using Two Pointers
('e0000000-0007-4000-a000-000000000007',
 'Reverse Array Using Two Pointers',
 'Reverse the given array using two pointer technique.

Input Format:
N
Array

Output Format:
Reversed array (space-separated)',
 'easy', 'coding', 'Array Algorithms and Techniques',
 ARRAY['arrays','two-pointer','reversal','easy'],
 10, 30,
 '[
   {"input":"5\n1 2 3 4 5","expectedOutput":"5 4 3 2 1","isHidden":false},
   {"input":"4\n10 20 30 40","expectedOutput":"40 30 20 10","isHidden":false},
   {"input":"1\n7","expectedOutput":"7","isHidden":true},
   {"input":"3\n3 2 1","expectedOutput":"1 2 3","isHidden":true},
   {"input":"6\n5 6 7 8 9 10","expectedOutput":"10 9 8 7 6 5","isHidden":true},
   {"input":"5\n1 1 2 2 3","expectedOutput":"3 2 2 1 1","isHidden":true}
 ]'::jsonb,
 '{"cpp":"#include <iostream>\nusing namespace std;\nint main(){\n  int n;\n  cin>>n;\n  int a[n];\n  for(int i=0;i<n;i++) cin>>a[i];\n  // Reverse using two pointers\n  return 0;\n}"}'::jsonb,
 '#include <iostream>\nusing namespace std;\nint main(){\nint n;\ncin>>n;\nint a[n];\nfor(int i=0;i<n;i++) cin>>a[i];\nint l=0,r=n-1;\nwhile(l<r){\n swap(a[l],a[r]);\n l++; r--;\n}\nfor(int i=0;i<n;i++) cout<<a[i]<<" ";\n}',
 'b0000000-0001-4000-a000-000000000001'),

-- Q8: Move Zeros to End
('e0000000-0008-4000-a000-000000000008',
 'Move Zeros to End',
 'Move all zeros in the array to the end while maintaining order of non-zero elements.

Input Format:
N
Array

Output Format:
Modified array (space-separated)',
 'medium', 'coding', 'Array Algorithms and Techniques',
 ARRAY['arrays','two-pointer','medium'],
 15, 30,
 '[
   {"input":"5\n0 1 0 3 12","expectedOutput":"1 3 12 0 0","isHidden":false},
   {"input":"4\n1 2 3 4","expectedOutput":"1 2 3 4","isHidden":false},
   {"input":"3\n0 0 0","expectedOutput":"0 0 0","isHidden":true},
   {"input":"6\n1 0 2 0 3 0","expectedOutput":"1 2 3 0 0 0","isHidden":true},
   {"input":"1\n0","expectedOutput":"0","isHidden":true},
   {"input":"5\n4 5 0 0 6","expectedOutput":"4 5 6 0 0","isHidden":true}
 ]'::jsonb,
 '{"cpp":"#include <iostream>\nusing namespace std;\nint main(){\n  int n;\n  cin>>n;\n  int a[n];\n  for(int i=0;i<n;i++) cin>>a[i];\n  // Move zeros to end\n  return 0;\n}"}'::jsonb,
 '#include <iostream>\nusing namespace std;\nint main(){\nint n;\ncin>>n;\nint a[n];\nfor(int i=0;i<n;i++) cin>>a[i];\nint j=0;\nfor(int i=0;i<n;i++){\n if(a[i]!=0){\n  swap(a[i],a[j]);\n  j++;\n }\n}\nfor(int i=0;i<n;i++) cout<<a[i]<<" ";\n}',
 'b0000000-0001-4000-a000-000000000001'),

-- Q9: Maximum Sum Subarray of Size K
('e0000000-0009-4000-a000-000000000009',
 'Maximum Sum Subarray of Size K',
 'Find the maximum sum of any subarray of size K using sliding window.

Input Format:
N
Array
K

Output Format:
Maximum sum',
 'medium', 'coding', 'Array Algorithms and Techniques',
 ARRAY['arrays','sliding-window','medium'],
 20, 30,
 '[
   {"input":"6\n2 1 5 1 3 2\n3","expectedOutput":"9","isHidden":false},
   {"input":"5\n1 2 3 4 5\n2","expectedOutput":"9","isHidden":false},
   {"input":"4\n4 2 1 7\n2","expectedOutput":"8","isHidden":true},
   {"input":"3\n1 1 1\n1","expectedOutput":"1","isHidden":true},
   {"input":"6\n5 5 5 5 5 5\n3","expectedOutput":"15","isHidden":true},
   {"input":"5\n10 20 30 40 50\n4","expectedOutput":"140","isHidden":true}
 ]'::jsonb,
 '{"cpp":"#include <iostream>\nusing namespace std;\nint main(){\n  int n,k;\n  cin>>n;\n  int a[n];\n  for(int i=0;i<n;i++) cin>>a[i];\n  cin>>k;\n  // Sliding window to find max sum subarray of size k\n  return 0;\n}"}'::jsonb,
 '#include <iostream>\nusing namespace std;\nint main(){\nint n,k;\ncin>>n;\nint a[n];\nfor(int i=0;i<n;i++) cin>>a[i];\ncin>>k;\nint sum=0;\nfor(int i=0;i<k;i++) sum+=a[i];\nint mx=sum;\nfor(int i=k;i<n;i++){\n sum+=a[i]-a[i-k];\n mx=max(mx,sum);\n}\ncout<<mx;\n}',
 'b0000000-0001-4000-a000-000000000001'),

-- Q10: Average of Subarrays of Size K
('e0000000-0010-4000-a000-000000000010',
 'Average of Subarrays of Size K',
 'Print average of every subarray of size K.

Input Format:
N
Array
K

Output Format:
Averages (space-separated)',
 'medium', 'coding', 'Array Algorithms and Techniques',
 ARRAY['arrays','sliding-window','medium'],
 20, 30,
 '[
   {"input":"5\n1 3 2 6 4\n2","expectedOutput":"2 2.5 4 5","isHidden":false},
   {"input":"4\n2 4 6 8\n2","expectedOutput":"3 5 7","isHidden":false},
   {"input":"3\n3 3 3\n2","expectedOutput":"3 3","isHidden":true},
   {"input":"6\n1 2 3 4 5 6\n3","expectedOutput":"2 3 4 5","isHidden":true},
   {"input":"5\n10 20 30 40 50\n2","expectedOutput":"15 25 35 45","isHidden":true},
   {"input":"4\n5 5 5 5\n3","expectedOutput":"5 5","isHidden":true}
 ]'::jsonb,
 '{"cpp":"#include <iostream>\nusing namespace std;\nint main(){\n  int n,k;\n  cin>>n;\n  int a[n];\n  for(int i=0;i<n;i++) cin>>a[i];\n  cin>>k;\n  // Sliding window to compute averages\n  return 0;\n}"}'::jsonb,
 '#include <iostream>\nusing namespace std;\nint main(){\nint n,k;\ncin>>n;\nint a[n];\nfor(int i=0;i<n;i++) cin>>a[i];\ncin>>k;\nint sum=0;\nfor(int i=0;i<k;i++) sum+=a[i];\ncout<<(float)sum/k<<" ";\nfor(int i=k;i<n;i++){\n sum+=a[i]-a[i-k];\n cout<<(float)sum/k<<" ";\n}\n}',
 'b0000000-0001-4000-a000-000000000001'),

-- Q11: Count Even Sum Subarrays of Size K
('e0000000-0011-4000-a000-000000000011',
 'Count Even Sum Subarrays of Size K',
 'Count number of subarrays of size K whose sum is even.

Input Format:
N
Array
K

Output Format:
Count',
 'medium', 'coding', 'Array Algorithms and Techniques',
 ARRAY['arrays','sliding-window','medium'],
 20, 30,
 '[
   {"input":"5\n1 2 3 4 5\n2","expectedOutput":"2","isHidden":false},
   {"input":"4\n2 2 2 2\n2","expectedOutput":"3","isHidden":false},
   {"input":"3\n1 1 1\n2","expectedOutput":"0","isHidden":true},
   {"input":"6\n1 3 5 7 9 11\n2","expectedOutput":"0","isHidden":true},
   {"input":"5\n2 4 6 8 10\n3","expectedOutput":"3","isHidden":true},
   {"input":"4\n5 6 7 8\n2","expectedOutput":"2","isHidden":true}
 ]'::jsonb,
 '{"cpp":"#include <iostream>\nusing namespace std;\nint main(){\n  int n,k;\n  cin>>n;\n  int a[n];\n  for(int i=0;i<n;i++) cin>>a[i];\n  cin>>k;\n  // Count subarrays of size k with even sum\n  return 0;\n}"}'::jsonb,
 '#include <iostream>\nusing namespace std;\nint main(){\nint n,k;\ncin>>n;\nint a[n];\nfor(int i=0;i<n;i++) cin>>a[i];\ncin>>k;\nint sum=0;\nfor(int i=0;i<k;i++) sum+=a[i];\nint count=0;\nif(sum%2==0) count++;\nfor(int i=k;i<n;i++){\n sum+=a[i]-a[i-k];\n if(sum%2==0) count++;\n}\ncout<<count;\n}',
 'b0000000-0001-4000-a000-000000000001'),

-- Q12: First Negative Number in Every Window
('e0000000-0012-4000-a000-000000000012',
 'First Negative Number in Every Window',
 'For every window of size K print first negative number. If none exists print 0.

Input Format:
N
Array
K

Output Format:
First negative in each window (space-separated)',
 'hard', 'coding', 'Array Algorithms and Techniques',
 ARRAY['arrays','sliding-window','hard'],
 25, 30,
 '[
   {"input":"8\n12 -1 -7 8 -15 30 16 28\n3","expectedOutput":"-1 -1 -7 -15 -15 0","isHidden":false},
   {"input":"5\n1 2 3 4 5\n2","expectedOutput":"0 0 0 0","isHidden":false},
   {"input":"6\n-1 -2 -3 -4 -5 -6\n3","expectedOutput":"-1 -2 -3 -4","isHidden":true},
   {"input":"4\n3 -1 4 -2\n2","expectedOutput":"-1 -1 -2","isHidden":true},
   {"input":"5\n5 -3 2 -1 6\n3","expectedOutput":"-3 -3 -1","isHidden":true},
   {"input":"3\n1 -1 1\n1","expectedOutput":"0 -1 0","isHidden":true}
 ]'::jsonb,
 '{"cpp":"#include <iostream>\nusing namespace std;\nint main(){\n  int n,k;\n  cin>>n;\n  int a[n];\n  for(int i=0;i<n;i++) cin>>a[i];\n  cin>>k;\n  // Find first negative in each window of size k\n  return 0;\n}"}'::jsonb,
 '#include <iostream>\nusing namespace std;\nint main(){\nint n,k;\ncin>>n;\nint a[n];\nfor(int i=0;i<n;i++) cin>>a[i];\ncin>>k;\nfor(int i=0;i<=n-k;i++){\n bool found=false;\n for(int j=i;j<i+k;j++){\n  if(a[j]<0){\n   cout<<a[j]<<" ";\n   found=true;\n   break;\n  }\n }\n if(!found) cout<<0<<" ";\n}\n}',
 'b0000000-0001-4000-a000-000000000001')

ON CONFLICT (id) DO NOTHING;

-- ── 7.5 Assessment ───────────────────────────────────────────────────────
INSERT INTO assessments (id, title, description, type, difficulty, duration, passing_score, total_points, start_date, end_date, settings, status, course_code, course_name, monitoring_mode, created_by)
VALUES (
  'a0000000-a001-4000-a000-000000000001',
  'Array Algorithms and Techniques — CSE Batch 2023',
  'Assessment covering array algorithms including linear search, binary search, two-pointer technique, and sliding window problems. 12 coding questions in C++.',
  'exam',
  'intermediate',
  120,
  60,
  175,
  '2026-01-01T00:00:00Z',
  '2026-12-31T23:59:59Z',
  '{"randomizeQuestions":false,"showCorrectAnswers":false,"showScoreImmediately":true,"allowRetakes":true,"maxAttempts":3,"ipRestriction":false,"allowedIPs":[],"plagiarismSensitivity":"medium","proctoring":false}'::jsonb,
  'published',
  'CSE-2023-ARR',
  'Array Algorithms — CSE Batch 2023',
  'standard',
  'b0000000-0001-4000-a000-000000000001'
)
ON CONFLICT (id) DO NOTHING;

-- ── 7.6 Assessment Questions (link 12 questions to assessment) ───────────
INSERT INTO assessment_questions (assessment_id, question_id, "order", points)
VALUES
  ('a0000000-a001-4000-a000-000000000001', 'e0000000-0001-4000-a000-000000000001',  1, 10),
  ('a0000000-a001-4000-a000-000000000001', 'e0000000-0002-4000-a000-000000000002',  2, 10),
  ('a0000000-a001-4000-a000-000000000001', 'e0000000-0003-4000-a000-000000000003',  3, 10),
  ('a0000000-a001-4000-a000-000000000001', 'e0000000-0004-4000-a000-000000000004',  4, 10),
  ('a0000000-a001-4000-a000-000000000001', 'e0000000-0005-4000-a000-000000000005',  5, 15),
  ('a0000000-a001-4000-a000-000000000001', 'e0000000-0006-4000-a000-000000000006',  6, 10),
  ('a0000000-a001-4000-a000-000000000001', 'e0000000-0007-4000-a000-000000000007',  7, 10),
  ('a0000000-a001-4000-a000-000000000001', 'e0000000-0008-4000-a000-000000000008',  8, 15),
  ('a0000000-a001-4000-a000-000000000001', 'e0000000-0009-4000-a000-000000000009',  9, 20),
  ('a0000000-a001-4000-a000-000000000001', 'e0000000-0010-4000-a000-000000000010', 10, 20),
  ('a0000000-a001-4000-a000-000000000001', 'e0000000-0011-4000-a000-000000000011', 11, 20),
  ('a0000000-a001-4000-a000-000000000001', 'e0000000-0012-4000-a000-000000000012', 12, 25)
ON CONFLICT DO NOTHING;

-- ── 7.7 Class ────────────────────────────────────────────────────────────
INSERT INTO classes (id, name, code, description, department, schedule, teacher_id, status, created_by)
VALUES (
  'c0000000-0001-4000-a000-000000000001',
  'CSE Batch 2023 — Array Algorithms',
  'CSE-2023-S3',
  'Computer Science and Engineering Batch 2023 — Semester 3 Array Algorithms Lab',
  'Computer Science and Engineering',
  NULL,
  'b0000000-0001-4000-a000-000000000001',
  'active',
  'a0000000-0000-4000-a000-000000000001'
)
ON CONFLICT (id) DO NOTHING;

-- ── 7.8 Class Enrollments (113 students) ─────────────────────────────────
INSERT INTO class_enrollments (class_id, student_id)
VALUES
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0001-4000-a000-000000000001'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0002-4000-a000-000000000002'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0003-4000-a000-000000000003'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0004-4000-a000-000000000004'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0005-4000-a000-000000000005'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0006-4000-a000-000000000006'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0007-4000-a000-000000000007'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0008-4000-a000-000000000008'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0009-4000-a000-000000000009'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0010-4000-a000-000000000010'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0011-4000-a000-000000000011'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0012-4000-a000-000000000012'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0013-4000-a000-000000000013'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0014-4000-a000-000000000014'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0015-4000-a000-000000000015'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0016-4000-a000-000000000016'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0017-4000-a000-000000000017'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0018-4000-a000-000000000018'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0019-4000-a000-000000000019'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0020-4000-a000-000000000020'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0021-4000-a000-000000000021'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0022-4000-a000-000000000022'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0023-4000-a000-000000000023'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0024-4000-a000-000000000024'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0025-4000-a000-000000000025'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0026-4000-a000-000000000026'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0027-4000-a000-000000000027'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0028-4000-a000-000000000028'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0029-4000-a000-000000000029'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0030-4000-a000-000000000030'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0031-4000-a000-000000000031'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0032-4000-a000-000000000032'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0033-4000-a000-000000000033'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0034-4000-a000-000000000034'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0035-4000-a000-000000000035'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0036-4000-a000-000000000036'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0037-4000-a000-000000000037'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0038-4000-a000-000000000038'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0039-4000-a000-000000000039'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0040-4000-a000-000000000040'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0041-4000-a000-000000000041'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0042-4000-a000-000000000042'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0043-4000-a000-000000000043'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0044-4000-a000-000000000044'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0045-4000-a000-000000000045'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0046-4000-a000-000000000046'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0047-4000-a000-000000000047'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0048-4000-a000-000000000048'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0049-4000-a000-000000000049'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0050-4000-a000-000000000050'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0051-4000-a000-000000000051'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0052-4000-a000-000000000052'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0053-4000-a000-000000000053'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0054-4000-a000-000000000054'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0055-4000-a000-000000000055'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0056-4000-a000-000000000056'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0057-4000-a000-000000000057'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0058-4000-a000-000000000058'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0059-4000-a000-000000000059'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0060-4000-a000-000000000060'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0061-4000-a000-000000000061'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0062-4000-a000-000000000062'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0063-4000-a000-000000000063'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0064-4000-a000-000000000064'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0065-4000-a000-000000000065'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0066-4000-a000-000000000066'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0067-4000-a000-000000000067'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0068-4000-a000-000000000068'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0069-4000-a000-000000000069'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0070-4000-a000-000000000070'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0071-4000-a000-000000000071'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0072-4000-a000-000000000072'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0073-4000-a000-000000000073'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0074-4000-a000-000000000074'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0075-4000-a000-000000000075'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0076-4000-a000-000000000076'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0077-4000-a000-000000000077'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0078-4000-a000-000000000078'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0079-4000-a000-000000000079'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0080-4000-a000-000000000080'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0081-4000-a000-000000000081'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0082-4000-a000-000000000082'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0083-4000-a000-000000000083'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0084-4000-a000-000000000084'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0085-4000-a000-000000000085'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0086-4000-a000-000000000086'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0087-4000-a000-000000000087'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0088-4000-a000-000000000088'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0089-4000-a000-000000000089'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0090-4000-a000-000000000090'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0091-4000-a000-000000000091'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0092-4000-a000-000000000092'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0093-4000-a000-000000000093'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0094-4000-a000-000000000094'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0095-4000-a000-000000000095'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0096-4000-a000-000000000096'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0097-4000-a000-000000000097'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0098-4000-a000-000000000098'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0099-4000-a000-000000000099'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0100-4000-a000-000000000100'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0101-4000-a000-000000000101'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0102-4000-a000-000000000102'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0103-4000-a000-000000000103'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0104-4000-a000-000000000104'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0105-4000-a000-000000000105'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0106-4000-a000-000000000106'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0107-4000-a000-000000000107'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0108-4000-a000-000000000108'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0109-4000-a000-000000000109'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0110-4000-a000-000000000110'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0111-4000-a000-000000000111'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0112-4000-a000-000000000112'),
  ('c0000000-0001-4000-a000-000000000001', 'd0000000-0113-4000-a000-000000000113')
ON CONFLICT DO NOTHING;

-- ── 7.9 Assessment Assignment (assign assessment to class) ───────────────
INSERT INTO assessment_assignments (assessment_id, class_id, assigned_by)
VALUES (
  'a0000000-a001-4000-a000-000000000001',
  'c0000000-0001-4000-a000-000000000001',
  'b0000000-0001-4000-a000-000000000001'
)
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- Re-apply profiles FK to auth.users in NOT VALID mode
-- (new rows are enforced; existing placeholder rows can be updated later)
-- ════════════════════════════════════════════════════════════════════════════
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'profiles_user_id_fkey'
      AND conrelid = 'profiles'::regclass
  ) THEN
    ALTER TABLE profiles
      ADD CONSTRAINT profiles_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
      NOT VALID;
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- POST-SETUP INSTRUCTIONS
-- ════════════════════════════════════════════════════════════════════════════
-- 1. Go to Supabase Dashboard > Authentication > Users
--
-- 2. Create ADMIN user:
--    Email: admin@bennett.edu.in
--    Password: (your choice, min 8 chars, must have uppercase+lowercase+digit+special)
--    Copy the generated UUID, then run:
--    UPDATE profiles SET user_id = '<admin-real-uuid>' WHERE email = 'admin@bennett.edu.in';
--
-- 3. Create TEACHER user:
--    Email: sanchit@bennett.edu.in
--    Password: (your choice)
--    Copy the generated UUID, then run:
--    UPDATE profiles SET user_id = '<teacher-real-uuid>' WHERE email = 'sanchit@bennett.edu.in';
--    UPDATE classes SET teacher_id = '<teacher-real-uuid>', created_by = (SELECT user_id FROM profiles WHERE email = 'admin@bennett.edu.in') WHERE code = 'CSE-2023-S3';
--    UPDATE assessments SET created_by = '<teacher-real-uuid>' WHERE id = 'a0000000-a001-4000-a000-000000000001';
--    UPDATE questions SET created_by = '<teacher-real-uuid>' WHERE created_by = 'b0000000-0001-4000-a000-000000000001';
--    UPDATE assessment_assignments SET assigned_by = '<teacher-real-uuid>' WHERE class_id = 'c0000000-0001-4000-a000-000000000001';
--
-- 4. For STUDENTS: Use the admin panel's bulk-create API endpoint:
--    POST /admin/users/bulk with the student data array
--    NOTE: bulk-create currently SKIPS emails that already exist in profiles.
--    Since this seed inserts 113 student profiles, bulk-create will report them as failed.
--
-- 5. Recommended options for student login onboarding:
--    A) Keep seeded students as roster-only records (no login accounts yet), OR
--    B) Create matching auth.users first, then remap profile IDs and dependent FKs,
--       then VALIDATE the FK constraint:
--       ALTER TABLE profiles VALIDATE CONSTRAINT profiles_user_id_fkey;
--
-- ════════════════════════════════════════════════════════════════════════════
-- END OF MASTER SQL
-- ════════════════════════════════════════════════════════════════════════════
