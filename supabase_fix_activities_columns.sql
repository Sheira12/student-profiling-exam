-- Fix missing columns on activities table
-- Run in Supabase SQL Editor

ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS file_url     text,
  ADD COLUMN IF NOT EXISTS subject_code text,
  ADD COLUMN IF NOT EXISTS max_score    numeric;

-- Fix missing score column on student_activities
ALTER TABLE student_activities
  ADD COLUMN IF NOT EXISTS score numeric;

-- Fix missing subject_code on announcements
ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS subject_code text;

-- Update the type CHECK constraint to include new types
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_type_check;
ALTER TABLE activities ADD CONSTRAINT activities_type_check
  CHECK (type IN ('assignment', 'event', 'task', 'laboratory', 'exam', 'quiz'));

-- Fix missing grade columns on curriculum_deployments
ALTER TABLE curriculum_deployments
  ADD COLUMN IF NOT EXISTS prelim_grade  numeric,
  ADD COLUMN IF NOT EXISTS midterm_grade numeric,
  ADD COLUMN IF NOT EXISTS finals_grade  numeric;

-- Fix missing password column on students
ALTER TABLE students
  ADD COLUMN IF NOT EXISTS password text;

UPDATE students SET password = student_id WHERE password IS NULL;

-- Verify all columns exist
SELECT
  'activities'            AS tbl, column_name FROM information_schema.columns WHERE table_name='activities'            AND column_name IN ('file_url','subject_code','max_score')
UNION ALL
SELECT
  'student_activities'    AS tbl, column_name FROM information_schema.columns WHERE table_name='student_activities'    AND column_name IN ('score')
UNION ALL
SELECT
  'announcements'         AS tbl, column_name FROM information_schema.columns WHERE table_name='announcements'         AND column_name IN ('subject_code')
UNION ALL
SELECT
  'curriculum_deployments' AS tbl, column_name FROM information_schema.columns WHERE table_name='curriculum_deployments' AND column_name IN ('prelim_grade','midterm_grade','finals_grade')
UNION ALL
SELECT
  'students'              AS tbl, column_name FROM information_schema.columns WHERE table_name='students'              AND column_name IN ('password')
ORDER BY tbl, column_name;

-- Add submission file URL for student submissions
ALTER TABLE student_activities
  ADD COLUMN IF NOT EXISTS submission_file_url text;

-- Add storage bucket for student submissions
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'student-submissions',
  'student-submissions',
  true,
  20971520,  -- 20 MB
  ARRAY[
    'image/png','image/jpeg','image/gif','image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain','application/zip'
  ]
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read student-submissions"      ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads to student-submissions" ON storage.objects;
DROP POLICY IF EXISTS "Allow deletes from student-submissions" ON storage.objects;

CREATE POLICY "Public read student-submissions"
  ON storage.objects FOR SELECT USING (bucket_id = 'student-submissions');
CREATE POLICY "Allow uploads to student-submissions"
  ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'student-submissions');
CREATE POLICY "Allow deletes from student-submissions"
  ON storage.objects FOR DELETE USING (bucket_id = 'student-submissions');
