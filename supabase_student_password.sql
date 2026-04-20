-- =====================================================
-- STUDENT PASSWORD SETUP
-- Run in Supabase SQL Editor
-- =====================================================

-- Step 1: Add password column (safe to re-run)
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS password text;

-- Step 2: Set default password = student_id for ALL students
-- (students without a password get their student_id as password)
UPDATE students
SET password = student_id
WHERE password IS NULL OR password = '';

-- Step 3: Verify — shows all students with their login credentials
SELECT
  student_id        AS "Student ID (login username)",
  password          AS "Password",
  first_name || ' ' || last_name AS "Full Name",
  course            AS "Course"
FROM students
ORDER BY last_name, first_name;
