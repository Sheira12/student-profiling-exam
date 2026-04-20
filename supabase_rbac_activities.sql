-- ══════════════════════════════════════════════════════════════
-- RBAC Activities Migration
-- Run in Supabase SQL Editor after supabase_complete_schema.sql
-- ══════════════════════════════════════════════════════════════

-- ── ACTIVITIES ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activities (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  title       text        NOT NULL,
  description text,
  type        text        NOT NULL CHECK (type IN ('assignment', 'event', 'task')),
  due_date    timestamptz,
  adviser_id  uuid        NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  status      text        DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all activities" ON activities;
CREATE POLICY "Allow all activities" ON activities
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_activities_adviser ON activities(adviser_id);
CREATE INDEX IF NOT EXISTS idx_activities_status  ON activities(status);

-- ── STUDENT ACTIVITIES ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_activities (
  id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id     uuid        NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  student_id      uuid        NOT NULL REFERENCES students(id)   ON DELETE CASCADE,
  status          text        DEFAULT 'pending'
                              CHECK (status IN ('pending', 'submitted', 'done')),
  submission_note text,
  updated_at      timestamptz DEFAULT now(),
  UNIQUE(activity_id, student_id)
);

ALTER TABLE student_activities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all student_activities" ON student_activities;
CREATE POLICY "Allow all student_activities" ON student_activities
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_student_activities_student  ON student_activities(student_id);
CREATE INDEX IF NOT EXISTS idx_student_activities_activity ON student_activities(activity_id);

-- ── Verify ────────────────────────────────────────────────────
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('activities', 'student_activities')
ORDER BY table_name;
