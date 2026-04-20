-- ══════════════════════════════════════════════════════════════
-- RLS FIX — Run this if student/adviser login is not working
-- Supabase SQL Editor → New Query → paste → Run
-- ══════════════════════════════════════════════════════════════

-- Allow anonymous (unauthenticated) reads on students for login
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON students;
DROP POLICY IF EXISTS "Allow anon read students" ON students;
DROP POLICY IF EXISTS "Allow all students" ON students;
CREATE POLICY "Allow all students" ON students
  FOR ALL USING (true) WITH CHECK (true);

-- Allow anonymous reads on employees for login
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all employees" ON employees;
CREATE POLICY "Allow all employees" ON employees
  FOR ALL USING (true) WITH CHECK (true);

-- Allow all on remaining tables
ALTER TABLE adviser_assignments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE curriculum_deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications          ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages               ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements          ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all assignments"            ON adviser_assignments;
DROP POLICY IF EXISTS "Allow all curriculum_deployments" ON curriculum_deployments;
DROP POLICY IF EXISTS "Allow all notifications"          ON notifications;
DROP POLICY IF EXISTS "Allow all messages"               ON messages;
DROP POLICY IF EXISTS "Allow all logs"                   ON activity_logs;
DROP POLICY IF EXISTS "Allow all announcements"          ON announcements;

CREATE POLICY "Allow all assignments"            ON adviser_assignments    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all curriculum_deployments" ON curriculum_deployments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all notifications"          ON notifications          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all messages"               ON messages               FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all logs"                   ON activity_logs          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all announcements"          ON announcements          FOR ALL USING (true) WITH CHECK (true);

-- Also grant usage to anon role (needed when using anon key)
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Verify policies
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
