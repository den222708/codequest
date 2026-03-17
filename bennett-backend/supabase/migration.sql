-- ============================================================
-- Bennett CodeQuest — Supabase SQL Migration
-- Run this in the Supabase SQL Editor to create all tables
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Profiles ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  user_id     UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  role        TEXT NOT NULL CHECK (role IN ('student', 'teacher', 'admin')) DEFAULT 'student',
  avatar_url  TEXT,
  department  TEXT,
  enrollment_id TEXT,
  status      TEXT NOT NULL CHECK (status IN ('active', 'inactive')) DEFAULT 'active',
  last_login  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Questions ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS questions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           TEXT NOT NULL,
  description     TEXT NOT NULL,
  difficulty      TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  question_type   TEXT NOT NULL DEFAULT 'coding' CHECK (question_type IN ('coding', 'mcq', 'short_answer', 'true_false')),
  topic           TEXT NOT NULL,
  tags            TEXT[] DEFAULT '{}',
  points          INT NOT NULL DEFAULT 10,
  time_limit      INT NOT NULL DEFAULT 30,
  memory_limit    INT NOT NULL DEFAULT 256,
  test_cases      JSONB NOT NULL DEFAULT '[]',
  boilerplate_code JSONB DEFAULT '{}',
  solution        TEXT,
  hints           TEXT[] DEFAULT '{}',
  options         JSONB DEFAULT NULL,
  correct_answer  TEXT DEFAULT NULL,
  is_visible      BOOLEAN NOT NULL DEFAULT true,
  usage_count     INT NOT NULL DEFAULT 0,
  created_by      UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Assessments ─────────────────────────────────────────────
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
  created_by      UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Assessment Questions (junction) ─────────────────────────
CREATE TABLE IF NOT EXISTS assessment_questions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id   UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  question_id     UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  "order"         INT NOT NULL DEFAULT 0,
  points          INT NOT NULL DEFAULT 0,
  UNIQUE(assessment_id, question_id)
);

-- ── Assessment Attempts ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS assessment_attempts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id   UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  student_id      UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  status          TEXT NOT NULL CHECK (status IN ('in-progress', 'completed', 'timed-out')) DEFAULT 'in-progress',
  score           INT NOT NULL DEFAULT 0,
  max_score       INT NOT NULL DEFAULT 0,
  time_spent      INT NOT NULL DEFAULT 0,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Submissions ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS submissions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id      UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  assessment_id   UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  question_id     UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  attempt_id      UUID NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
  code            TEXT NOT NULL,
  language        TEXT NOT NULL,
  score           INT NOT NULL DEFAULT 0,
  max_score       INT NOT NULL DEFAULT 0,
  tests_passed    INT NOT NULL DEFAULT 0,
  tests_total     INT NOT NULL DEFAULT 0,
  test_results    JSONB DEFAULT '[]',
  status          TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'partial', 'rejected', 'error')) DEFAULT 'pending',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Activity Logs ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_logs (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  action          TEXT NOT NULL,
  details         JSONB DEFAULT '{}',
  ip_address      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Classes (course sections) ───────────────────────────────
CREATE TABLE IF NOT EXISTS classes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  code            TEXT NOT NULL UNIQUE,
  description     TEXT,
  department      TEXT,
  schedule        TEXT,
  teacher_id      UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  status          TEXT NOT NULL CHECK (status IN ('active', 'archived')) DEFAULT 'active',
  created_by      UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Class Enrollments ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS class_enrollments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id        UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id      UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  enrolled_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(class_id, student_id)
);

-- ── Assessment Assignments (to classes) ─────────────────────
CREATE TABLE IF NOT EXISTS assessment_assignments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id   UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  class_id        UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  assigned_by     UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  assigned_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(assessment_id, class_id)
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_questions_difficulty ON questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_questions_topic ON questions(topic);
CREATE INDEX IF NOT EXISTS idx_questions_created_by ON questions(created_by);
CREATE INDEX IF NOT EXISTS idx_assessments_status ON assessments(status);
CREATE INDEX IF NOT EXISTS idx_assessments_created_by ON assessments(created_by);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_assessment ON assessment_questions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_assessment ON assessment_attempts(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_student ON assessment_attempts(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assessment ON submissions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_submissions_attempt ON submissions(attempt_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_code ON classes(code);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_class ON class_enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_student ON class_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_assessment_assignments_assessment ON assessment_assignments(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_assignments_class ON assessment_assignments(class_id);

-- ============================================================
-- Row Level Security (RLS) Policies
-- ============================================================

-- Helper: SECURITY DEFINER function to get current user's role
-- without triggering recursive RLS on the profiles table.
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

-- ────────────────────────────────────────────────────────────
-- PROFILES
-- ────────────────────────────────────────────────────────────
-- Everyone can read their own row; teachers/admins read all
CREATE POLICY profiles_select ON profiles FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_role(ARRAY['teacher','admin'])
  );

-- Users can update only their own row
CREATE POLICY profiles_update_self ON profiles FOR UPDATE
  TO authenticated
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admins can insert (signup creates via service role, but belt-and-suspenders)
CREATE POLICY profiles_insert ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR public.is_role(ARRAY['admin'])
  );

-- Only admins can delete profiles
CREATE POLICY profiles_delete ON profiles FOR DELETE
  TO authenticated
  USING (public.is_role(ARRAY['admin']));

-- ────────────────────────────────────────────────────────────
-- QUESTIONS
-- ────────────────────────────────────────────────────────────
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

-- ────────────────────────────────────────────────────────────
-- ASSESSMENTS
-- ────────────────────────────────────────────────────────────
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

-- ────────────────────────────────────────────────────────────
-- ASSESSMENT_QUESTIONS (junction)
-- ────────────────────────────────────────────────────────────
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

-- ────────────────────────────────────────────────────────────
-- ASSESSMENT_ATTEMPTS
-- ────────────────────────────────────────────────────────────
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

-- ────────────────────────────────────────────────────────────
-- SUBMISSIONS
-- ────────────────────────────────────────────────────────────
CREATE POLICY submissions_select ON submissions FOR SELECT
  TO authenticated
  USING (
    student_id = auth.uid()
    OR public.is_role(ARRAY['teacher','admin'])
  );

CREATE POLICY submissions_insert ON submissions FOR INSERT
  TO authenticated
  WITH CHECK (student_id = auth.uid());

-- No update/delete for submissions (immutable audit trail)

-- ────────────────────────────────────────────────────────────
-- ACTIVITY_LOGS
-- ────────────────────────────────────────────────────────────
-- Only admins can read
CREATE POLICY logs_select ON activity_logs FOR SELECT
  TO authenticated
  USING (public.is_role(ARRAY['admin']));

-- Any authenticated user can insert (server logs on their behalf)
CREATE POLICY logs_insert ON activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Logs are immutable — no update or delete

-- ────────────────────────────────────────────────────────────
-- CLASSES
-- ────────────────────────────────────────────────────────────
-- Admins see all; teachers see own; students see enrolled
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

-- ────────────────────────────────────────────────────────────
-- CLASS_ENROLLMENTS
-- ────────────────────────────────────────────────────────────
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

-- ────────────────────────────────────────────────────────────
-- ASSESSMENT_ASSIGNMENTS
-- ────────────────────────────────────────────────────────────
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

-- ============================================================
-- Trigger: auto-update updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- ============================================================
-- Token Blacklist (persistent revoked token store)
-- ============================================================
CREATE TABLE IF NOT EXISTS token_blacklist (
  token_hash  TEXT PRIMARY KEY,
  user_id     UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  revoked_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_token_blacklist_expires ON token_blacklist(expires_at);

-- ── Backups ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS backups (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('full', 'incremental', 'differential')) DEFAULT 'full',
  size            BIGINT NOT NULL DEFAULT 0,
  status          TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'failed')) DEFAULT 'in_progress',
  includes        TEXT[] DEFAULT '{}',
  created_by      UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Backups: RLS ────────────────────────────────────────────
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;

-- Only admins can view backups
CREATE POLICY backups_select ON backups FOR SELECT
  TO authenticated
  USING (public.is_role(ARRAY['admin']));

-- Only admins can create backups
CREATE POLICY backups_insert ON backups FOR INSERT
  TO authenticated
  WITH CHECK (public.is_role(ARRAY['admin']));

-- Only admins can update backup status
CREATE POLICY backups_update ON backups FOR UPDATE
  TO authenticated
  USING (public.is_role(ARRAY['admin']));

-- Only admins can delete backups
CREATE POLICY backups_delete ON backups FOR DELETE
  TO authenticated
  USING (public.is_role(ARRAY['admin']));

-- ── Plagiarism Results ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS plagiarism_results (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assessment_id   UUID REFERENCES assessments(id) ON DELETE CASCADE,
  student_id      UUID REFERENCES profiles(user_id) ON DELETE CASCADE,
  student_name    TEXT,
  similarity_score NUMERIC NOT NULL DEFAULT 0,
  flagged         BOOLEAN NOT NULL DEFAULT false,
  status          TEXT NOT NULL CHECK (status IN ('pending', 'cleared', 'confirmed')) DEFAULT 'pending',
  matched_submissions JSONB DEFAULT '[]',
  reviewed_by     UUID REFERENCES profiles(user_id) ON DELETE SET NULL,
  reviewed_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plagiarism_assessment ON plagiarism_results(assessment_id);
CREATE INDEX IF NOT EXISTS idx_plagiarism_student ON plagiarism_results(student_id);

-- ── Plagiarism Results: add submission_id and question_id columns ────
ALTER TABLE plagiarism_results ADD COLUMN IF NOT EXISTS submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE;
ALTER TABLE plagiarism_results ADD COLUMN IF NOT EXISTS question_id UUID REFERENCES questions(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_plagiarism_submission ON plagiarism_results(submission_id);
CREATE INDEX IF NOT EXISTS idx_plagiarism_question ON plagiarism_results(question_id);

-- ── Plagiarism Results: RLS ─────────────────────────────────
ALTER TABLE plagiarism_results ENABLE ROW LEVEL SECURITY;

-- Teachers and admins can view all plagiarism results
CREATE POLICY plagiarism_results_select ON plagiarism_results FOR SELECT
  TO authenticated
  USING (public.is_role(ARRAY['teacher', 'admin']));

-- Only service-role or teachers/admins can insert (scan results)
CREATE POLICY plagiarism_results_insert ON plagiarism_results FOR INSERT
  TO authenticated
  WITH CHECK (public.is_role(ARRAY['teacher', 'admin']));

-- Teachers/admins can update (review)
CREATE POLICY plagiarism_results_update ON plagiarism_results FOR UPDATE
  TO authenticated
  USING (public.is_role(ARRAY['teacher', 'admin']));

-- Teachers/admins can delete (re-scan clears old results)
CREATE POLICY plagiarism_results_delete ON plagiarism_results FOR DELETE
  TO authenticated
  USING (public.is_role(ARRAY['teacher', 'admin']));

-- ============================================================
-- Active Sessions (concurrent session tracking + inactivity timeout)
-- ============================================================
CREATE TABLE IF NOT EXISTS active_sessions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  token_hash      TEXT NOT NULL,
  ip_address      TEXT,
  last_active_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_active_sessions_user ON active_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_active_sessions_token ON active_sessions(token_hash);

-- ── Account lockout columns on profiles ─────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS failed_login_attempts INT NOT NULL DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

-- ── Active sessions RLS ─────────────────────────────────────
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;

-- Users can see only their own sessions; admins see all
CREATE POLICY active_sessions_select ON active_sessions FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_role(ARRAY['admin'])
  );

-- Server inserts via service-role; authenticated users can insert own
CREATE POLICY active_sessions_insert ON active_sessions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can delete own sessions (logout); admins can delete any
CREATE POLICY active_sessions_delete ON active_sessions FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_role(ARRAY['admin'])
  );

-- Cleanup: remove expired sessions older than 24 hours (run periodically)
-- DELETE FROM active_sessions WHERE last_active_at < now() - interval '24 hours';

-- ============================================================
-- Notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'assessment', 'submission', 'system')) DEFAULT 'info',
  is_read     BOOLEAN NOT NULL DEFAULT false,
  link        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, is_read);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

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

-- ============================================================
-- Password History (prevent reuse of last 5 passwords)
-- ============================================================
CREATE TABLE IF NOT EXISTS password_history (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  password_hash TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_history_user ON password_history(user_id);

ALTER TABLE password_history ENABLE ROW LEVEL SECURITY;

-- Only service-role should access this table (no user policies)
-- Access is via service-role key in auth routes

-- ── Password expiry column on profiles ───────────────────────
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ DEFAULT now();

-- ============================================================
-- Assessment monitoring mode (standard = REST logging only, proctored = WebSocket + live monitoring)
-- ============================================================
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS monitoring_mode TEXT DEFAULT 'standard'
  CHECK (monitoring_mode IN ('standard', 'proctored'));

-- ============================================================
-- Monitoring Events (proctored assessment WebSocket event log)
-- ============================================================
CREATE TABLE IF NOT EXISTS monitoring_events (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id      UUID NOT NULL REFERENCES assessment_attempts(id) ON DELETE CASCADE,
  assessment_id   UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  student_id      UUID NOT NULL REFERENCES profiles(user_id) ON DELETE CASCADE,
  event_type      TEXT NOT NULL CHECK (event_type IN ('heartbeat', 'violation', 'join', 'leave', 'instruction', 'instruction_ack')),
  payload         JSONB NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_monitoring_events_attempt ON monitoring_events(attempt_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_events_assessment ON monitoring_events(assessment_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_events_type ON monitoring_events(assessment_id, event_type);
CREATE INDEX IF NOT EXISTS idx_monitoring_events_created ON monitoring_events(created_at);

ALTER TABLE monitoring_events ENABLE ROW LEVEL SECURITY;

-- Teachers/admins can read monitoring events for their assessments
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

-- Students can read their own monitoring events
CREATE POLICY monitoring_events_select_student ON monitoring_events FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- Insert via service-role only (the socket server uses admin client)
CREATE POLICY monitoring_events_insert ON monitoring_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

