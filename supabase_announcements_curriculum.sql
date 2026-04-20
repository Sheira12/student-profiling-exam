-- ══════════════════════════════════════════════════════════════
-- ANNOUNCEMENTS + CURRICULUM DEPLOYMENTS
-- Run in Supabase SQL Editor after supabase_rbac_schema.sql
-- ══════════════════════════════════════════════════════════════

-- ── ANNOUNCEMENTS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  title       text        NOT NULL,
  content     text        NOT NULL,
  target      text        DEFAULT 'all'
                          CHECK (target IN ('all','students','employees')),
  priority    text        DEFAULT 'normal'
                          CHECK (priority IN ('normal','important','urgent')),
  is_active   boolean     DEFAULT true,
  author_name text        DEFAULT 'Admin',
  author_type text        DEFAULT 'admin',
  author_id   text        DEFAULT 'admin',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all announcements" ON announcements;
CREATE POLICY "Allow all announcements" ON announcements FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_announcements_active  ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_target  ON announcements(target);
CREATE INDEX IF NOT EXISTS idx_announcements_created ON announcements(created_at DESC);

-- ── CURRICULUM DEPLOYMENTS ────────────────────────────────────
-- Tracks per-student per-subject deployment from the curriculum
CREATE TABLE IF NOT EXISTS curriculum_deployments (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id    uuid        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_code  text        NOT NULL,
  subject_desc  text,
  units         integer     DEFAULT 3,
  semester      text,
  year_level    integer,
  status        text        DEFAULT 'Enrolled'
                            CHECK (status IN ('Enrolled','Ongoing','Passed','Failed','INC','Dropped','Pending')),
  grade         text,
  remarks       text,
  deployed_by   text        DEFAULT 'admin',
  adviser_id    uuid        REFERENCES employees(id) ON DELETE SET NULL,
  deployed_at   timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now(),
  UNIQUE(student_id, subject_code)
);

ALTER TABLE curriculum_deployments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all curriculum_deployments" ON curriculum_deployments;
CREATE POLICY "Allow all curriculum_deployments" ON curriculum_deployments FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_curr_dep_student  ON curriculum_deployments(student_id);
CREATE INDEX IF NOT EXISTS idx_curr_dep_adviser  ON curriculum_deployments(adviser_id);
CREATE INDEX IF NOT EXISTS idx_curr_dep_status   ON curriculum_deployments(status);
CREATE INDEX IF NOT EXISTS idx_curr_dep_code     ON curriculum_deployments(subject_code);

-- ── Verify ────────────────────────────────────────────────────
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('announcements','curriculum_deployments')
ORDER BY table_name;
