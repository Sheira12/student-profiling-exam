-- ══════════════════════════════════════════════════════════════
-- COMPLETE SCHEMA — CCS Student Profiling System
-- Run this ONCE in Supabase SQL Editor (Dashboard → SQL Editor)
-- Safe to re-run: uses IF NOT EXISTS + DROP POLICY IF EXISTS
-- ══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- 0. PATCH EXISTING STUDENTS TABLE
--    (adds academic_progress column if missing)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS academic_progress jsonb DEFAULT '{}'::jsonb;

-- ─────────────────────────────────────────────────────────────
-- 1. EMPLOYEES
-- ─────────────────────────────────────────────────────────────
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
CREATE POLICY "Allow all employees" ON employees
  FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 2. SUBJECTS  (admin-managed subject catalog)
-- ─────────────────────────────────────────────────────────────
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
CREATE POLICY "Allow all subjects" ON subjects
  FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 3. ADVISER ASSIGNMENTS  (employee → student, 1 adviser/student)
-- ─────────────────────────────────────────────────────────────
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
CREATE POLICY "Allow all assignments" ON adviser_assignments
  FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 4. CURRICULUM DEPLOYMENTS
--    Per-student, per-subject record based on the curriculum.
--    Synced with students.academic_progress via app logic.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS curriculum_deployments (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id    uuid        NOT NULL REFERENCES students(id)  ON DELETE CASCADE,
  subject_code  text        NOT NULL,
  subject_desc  text,
  units         integer     DEFAULT 3,
  semester      text,
  year_level    integer,
  status        text        DEFAULT 'Enrolled'
                            CHECK (status IN (
                              'Enrolled','Ongoing','Passed',
                              'Failed','INC','Dropped','Pending'
                            )),
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
CREATE POLICY "Allow all curriculum_deployments" ON curriculum_deployments
  FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 5. NOTIFICATIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id             uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  recipient_type text        NOT NULL
                             CHECK (recipient_type IN ('student','employee','admin')),
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
CREATE POLICY "Allow all notifications" ON notifications
  FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 6. MESSAGES  (student ↔ adviser)
-- ─────────────────────────────────────────────────────────────
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
CREATE POLICY "Allow all messages" ON messages
  FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 7. ACTIVITY LOGS  (audit trail)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_logs (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  actor_type  text        NOT NULL
                          CHECK (actor_type IN ('admin','employee','student','system')),
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
CREATE POLICY "Allow all logs" ON activity_logs
  FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 8. ANNOUNCEMENTS
-- ─────────────────────────────────────────────────────────────
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
CREATE POLICY "Allow all announcements" ON announcements
  FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────
-- 9. PERFORMANCE INDEXES
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_adviser_assignments_employee
  ON adviser_assignments(employee_id);
CREATE INDEX IF NOT EXISTS idx_adviser_assignments_student
  ON adviser_assignments(student_id);

CREATE INDEX IF NOT EXISTS idx_curr_dep_student
  ON curriculum_deployments(student_id);
CREATE INDEX IF NOT EXISTS idx_curr_dep_adviser
  ON curriculum_deployments(adviser_id);
CREATE INDEX IF NOT EXISTS idx_curr_dep_status
  ON curriculum_deployments(status);
CREATE INDEX IF NOT EXISTS idx_curr_dep_code
  ON curriculum_deployments(subject_code);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient
  ON notifications(recipient_type, recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON notifications(recipient_id, is_read) WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_messages_sender
  ON messages(sender_type, sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver
  ON messages(receiver_type, receiver_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_created
  ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_actor
  ON activity_logs(actor_type, actor_id);

CREATE INDEX IF NOT EXISTS idx_announcements_active
  ON announcements(is_active, target);
CREATE INDEX IF NOT EXISTS idx_announcements_created
  ON announcements(created_at DESC);

-- ─────────────────────────────────────────────────────────────
-- 10. SAMPLE DATA
-- ─────────────────────────────────────────────────────────────

-- Sample Employees
INSERT INTO employees
  (employee_id, first_name, last_name, email, department, position, password_hash)
VALUES
  ('EMP-001', 'Maria',  'Santos', 'maria.santos@pnc.edu.ph', 'CCS', 'Adviser', 'adviser123'),
  ('EMP-002', 'Jose',   'Reyes',  'jose.reyes@pnc.edu.ph',   'CCS', 'Adviser', 'adviser123'),
  ('EMP-003', 'Ana',    'Garcia', 'ana.garcia@pnc.edu.ph',   'CCS', 'Adviser', 'adviser123')
ON CONFLICT (employee_id) DO NOTHING;

-- Sample Subjects (catalog)
INSERT INTO subjects (code, name, description, units, semester, year_level)
VALUES
  ('CS101', 'Introduction to Computing',    'Fundamentals of computing and IT',     3, 'First Semester',  1),
  ('CS102', 'Computer Programming 1',       'Basic programming using Python',        3, 'First Semester',  1),
  ('CS201', 'Data Structures',              'Arrays, linked lists, trees, graphs',   3, 'First Semester',  2),
  ('CS202', 'Object-Oriented Programming',  'OOP concepts using Java',               3, 'Second Semester', 2),
  ('CS301', 'Database Management',          'Relational databases and SQL',          3, 'First Semester',  3),
  ('CS302', 'Web Development',              'HTML, CSS, JavaScript, React',          3, 'Second Semester', 3),
  ('CS401', 'Capstone Project 1',           'Research and system design',            3, 'First Semester',  4),
  ('CS402', 'Capstone Project 2',           'System implementation and defense',     3, 'Second Semester', 4)
ON CONFLICT (code) DO NOTHING;

-- Sample Announcement
INSERT INTO announcements (title, content, target, priority, is_active, author_name)
VALUES (
  'Welcome to the CCS Student Profiling System',
  'This system allows you to track your academic progress, view your assigned adviser, and stay updated with announcements. Please ensure your profile information is complete.',
  'all', 'important', true, 'CCS Admin'
)
ON CONFLICT DO NOTHING;

-- ─────────────────────────────────────────────────────────────
-- 11. VERIFY — lists all created tables
-- ─────────────────────────────────────────────────────────────
SELECT
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns c
   WHERE c.table_name = t.table_name AND c.table_schema = 'public') AS column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN (
    'students',
    'employees',
    'subjects',
    'adviser_assignments',
    'curriculum_deployments',
    'notifications',
    'messages',
    'activity_logs',
    'announcements'
  )
ORDER BY table_name;
