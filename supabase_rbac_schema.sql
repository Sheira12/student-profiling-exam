-- ══════════════════════════════════════════════════════════════
-- RBAC SCHEMA — Safe, Idempotent Migration
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ══════════════════════════════════════════════════════════════

-- ── 1. EMPLOYEES ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS employees (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id   text        NOT NULL UNIQUE,
  first_name    text        NOT NULL,
  last_name     text        NOT NULL,
  email         text        UNIQUE,
  phone         text,
  department    text        DEFAULT 'CCS',
  position      text        DEFAULT 'Adviser',
  password_hash text        DEFAULT 'adviser123',
  avatar_url    text,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all employees" ON employees;
CREATE POLICY "Allow all employees" ON employees FOR ALL USING (true) WITH CHECK (true);

-- ── 2. SUBJECTS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subjects (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  code        text        NOT NULL UNIQUE,
  name        text        NOT NULL,
  description text,
  units       integer     DEFAULT 3,
  semester    text        DEFAULT 'First Semester',
  year_level  integer     DEFAULT 1,
  created_by  text        DEFAULT 'admin',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all subjects" ON subjects;
CREATE POLICY "Allow all subjects" ON subjects FOR ALL USING (true) WITH CHECK (true);

-- ── 3. ADVISER ASSIGNMENTS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS adviser_assignments (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id uuid        NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  student_id  uuid        NOT NULL REFERENCES students(id)  ON DELETE CASCADE,
  assigned_by text        DEFAULT 'admin',
  assigned_at timestamptz DEFAULT now(),
  notes       text,
  UNIQUE(employee_id, student_id)
);

ALTER TABLE adviser_assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all assignments" ON adviser_assignments;
CREATE POLICY "Allow all assignments" ON adviser_assignments FOR ALL USING (true) WITH CHECK (true);

-- ── 4. SUBJECT DEPLOYMENTS ────────────────────────────────────
CREATE TABLE IF NOT EXISTS subject_deployments (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id  uuid        NOT NULL REFERENCES subjects(id)  ON DELETE CASCADE,
  student_id  uuid        NOT NULL REFERENCES students(id)  ON DELETE CASCADE,
  status      text        DEFAULT 'Pending'
                          CHECK (status IN ('Pending','Ongoing','Completed','Dropped')),
  grade       text,
  remarks     text,
  deployed_by text        DEFAULT 'admin',
  deployed_at timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE(subject_id, student_id)
);

ALTER TABLE subject_deployments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all deployments" ON subject_deployments;
CREATE POLICY "Allow all deployments" ON subject_deployments FOR ALL USING (true) WITH CHECK (true);

-- ── 5. NOTIFICATIONS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_type text        NOT NULL CHECK (recipient_type IN ('student','employee','admin')),
  recipient_id   text        NOT NULL,
  title          text        NOT NULL,
  message        text        NOT NULL,
  type           text        DEFAULT 'info'
                             CHECK (type IN ('info','success','warning','error')),
  is_read        boolean     DEFAULT false,
  created_at     timestamptz DEFAULT now()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all notifications" ON notifications;
CREATE POLICY "Allow all notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);

-- ── 6. MESSAGES ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_type   text        NOT NULL CHECK (sender_type   IN ('student','employee')),
  sender_id     text        NOT NULL,
  receiver_type text        NOT NULL CHECK (receiver_type IN ('student','employee')),
  receiver_id   text        NOT NULL,
  content       text        NOT NULL,
  is_read       boolean     DEFAULT false,
  created_at    timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all messages" ON messages;
CREATE POLICY "Allow all messages" ON messages FOR ALL USING (true) WITH CHECK (true);

-- ── 7. ACTIVITY LOGS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_logs (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_type  text        NOT NULL CHECK (actor_type IN ('admin','employee','student','system')),
  actor_id    text        NOT NULL,
  actor_name  text,
  action      text        NOT NULL,
  entity_type text,
  entity_id   text,
  details     jsonb       DEFAULT '{}'::jsonb,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all logs" ON activity_logs;
CREATE POLICY "Allow all logs" ON activity_logs FOR ALL USING (true) WITH CHECK (true);

-- ── Performance indexes ────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_adviser_assignments_employee ON adviser_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_adviser_assignments_student  ON adviser_assignments(student_id);
CREATE INDEX IF NOT EXISTS idx_subject_deployments_student  ON subject_deployments(student_id);
CREATE INDEX IF NOT EXISTS idx_subject_deployments_subject  ON subject_deployments(subject_id);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient      ON notifications(recipient_type, recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender              ON messages(sender_type, sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver            ON messages(receiver_type, receiver_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created        ON activity_logs(created_at DESC);

-- ── Sample Employees (safe upsert) ────────────────────────────
INSERT INTO employees (employee_id, first_name, last_name, email, department, position, password_hash)
VALUES
  ('EMP-001', 'Maria',  'Santos', 'maria.santos@pnc.edu.ph', 'CCS', 'Adviser', 'adviser123'),
  ('EMP-002', 'Jose',   'Reyes',  'jose.reyes@pnc.edu.ph',   'CCS', 'Adviser', 'adviser123'),
  ('EMP-003', 'Ana',    'Garcia', 'ana.garcia@pnc.edu.ph',   'CCS', 'Adviser', 'adviser123')
ON CONFLICT (employee_id) DO NOTHING;

-- ── Sample Subjects (safe upsert) ─────────────────────────────
INSERT INTO subjects (code, name, description, units, semester, year_level)
VALUES
  ('CS101', 'Introduction to Computing',   'Fundamentals of computing and IT',     3, 'First Semester',  1),
  ('CS102', 'Computer Programming 1',      'Basic programming using Python',        3, 'First Semester',  1),
  ('CS201', 'Data Structures',             'Arrays, linked lists, trees, graphs',   3, 'First Semester',  2),
  ('CS202', 'Object-Oriented Programming', 'OOP concepts using Java',               3, 'Second Semester', 2),
  ('CS301', 'Database Management',         'Relational databases and SQL',          3, 'First Semester',  3),
  ('CS302', 'Web Development',             'HTML, CSS, JavaScript, React',          3, 'Second Semester', 3),
  ('CS401', 'Capstone Project 1',          'Research and system design',            3, 'First Semester',  4),
  ('CS402', 'Capstone Project 2',          'System implementation and defense',     3, 'Second Semester', 4)
ON CONFLICT (code) DO NOTHING;

-- ── Verify tables were created ────────────────────────────────
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'employees','subjects','adviser_assignments',
    'subject_deployments','notifications','messages','activity_logs'
  )
ORDER BY table_name;

-- ══════════════════════════════════════════════════════════════
-- ADDITIONS: Announcements + Curriculum Deployments
-- ══════════════════════════════════════════════════════════════

-- 8. ANNOUNCEMENTS
CREATE TABLE IF NOT EXISTS announcements (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  title        text        NOT NULL,
  content      text        NOT NULL,
  author_type  text        DEFAULT 'admin' CHECK (author_type IN ('admin','employee')),
  author_id    text        DEFAULT 'admin',
  author_name  text        DEFAULT 'Admin',
  target       text        DEFAULT 'all' CHECK (target IN ('all','students','employees')),
  priority     text        DEFAULT 'normal' CHECK (priority IN ('normal','important','urgent')),
  is_active    boolean     DEFAULT true,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all announcements" ON announcements;
CREATE POLICY "Allow all announcements" ON announcements FOR ALL USING (true) WITH CHECK (true);

-- 9. CURRICULUM DEPLOYMENTS (tracks academic_progress subjects per student)
-- This links CURRICULUM subjects (by code) to students with status tracking
CREATE TABLE IF NOT EXISTS curriculum_deployments (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id   uuid        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_code text        NOT NULL,
  subject_desc text,
  units        integer     DEFAULT 3,
  semester     text,
  year_level   integer,
  status       text        DEFAULT 'Pending'
                           CHECK (status IN ('Pending','Enrolled','Ongoing','Passed','Failed','INC','Dropped')),
  grade        text,
  remarks      text,
  deployed_by  text        DEFAULT 'admin',
  adviser_id   uuid        REFERENCES employees(id) ON DELETE SET NULL,
  deployed_at  timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now(),
  UNIQUE(student_id, subject_code)
);

ALTER TABLE curriculum_deployments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all curriculum deployments" ON curriculum_deployments;
CREATE POLICY "Allow all curriculum deployments" ON curriculum_deployments FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_curriculum_dep_student ON curriculum_deployments(student_id);
CREATE INDEX IF NOT EXISTS idx_curriculum_dep_code    ON curriculum_deployments(subject_code);
CREATE INDEX IF NOT EXISTS idx_announcements_active   ON announcements(is_active, created_at DESC);

-- Sample announcements
INSERT INTO announcements (title, content, author_name, target, priority) VALUES
  ('Welcome to the New Semester', 'Welcome back, students! Please check your deployed subjects and contact your adviser for any concerns.', 'Admin', 'all', 'important'),
  ('Enrollment Reminder', 'Please ensure all your subjects are properly enrolled before the deadline.', 'Admin', 'students', 'urgent')
ON CONFLICT DO NOTHING;

-- ══════════════════════════════════════════════════════════════
-- ADDITIONAL TABLES: Curriculum Deployments + Announcements
-- Append to existing schema and run in Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════

-- ── 8. CURRICULUM DEPLOYMENTS ─────────────────────────────────
-- Tracks individual curriculum subjects deployed to students
-- Syncs with students.academic_progress (jsonb)
CREATE TABLE IF NOT EXISTS curriculum_deployments (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id    uuid        NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_code  text        NOT NULL,
  subject_desc  text        NOT NULL,
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
CREATE INDEX IF NOT EXISTS idx_curr_dep_code     ON curriculum_deployments(subject_code);

-- ── 9. ANNOUNCEMENTS ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS announcements (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  title        text        NOT NULL,
  content      text        NOT NULL,
  target       text        DEFAULT 'all'
                           CHECK (target IN ('all','student','employee')),
  priority     text        DEFAULT 'normal'
                           CHECK (priority IN ('low','normal','high','urgent')),
  author_id    text        DEFAULT 'admin',
  author_type  text        DEFAULT 'admin',
  author_name  text        DEFAULT 'Admin',
  is_active    boolean     DEFAULT true,
  expires_at   timestamptz,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all announcements" ON announcements;
CREATE POLICY "Allow all announcements" ON announcements FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_announcements_target    ON announcements(target, is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_created   ON announcements(created_at DESC);

-- Verify
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('curriculum_deployments','announcements')
ORDER BY table_name;
