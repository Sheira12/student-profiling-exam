-- ══════════════════════════════════════════════════════════════
-- PORTAL ENHANCEMENTS MIGRATION
-- Run in Supabase SQL Editor after supabase_rbac_activities.sql
-- ══════════════════════════════════════════════════════════════

-- 1. activities: add file_url, subject_code, max_score
ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS file_url     text,
  ADD COLUMN IF NOT EXISTS subject_code text,
  ADD COLUMN IF NOT EXISTS max_score    numeric;

-- Update CHECK constraint to include new activity types
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_type_check;
ALTER TABLE activities ADD CONSTRAINT activities_type_check
  CHECK (type IN ('assignment', 'event', 'task', 'laboratory', 'exam', 'quiz'));

-- 2. student_activities: add score
ALTER TABLE student_activities
  ADD COLUMN IF NOT EXISTS score numeric;

-- 3. announcements: add subject_code
ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS subject_code text;

-- 4. class_schedules: new table
CREATE TABLE IF NOT EXISTS class_schedules (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  adviser_id   uuid        NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  subject_name text        NOT NULL,
  day_of_week  text        NOT NULL
                           CHECK (day_of_week IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),
  start_time   time        NOT NULL,
  end_time     time        NOT NULL,
  room         text,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE class_schedules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all class_schedules" ON class_schedules;
CREATE POLICY "Allow all class_schedules" ON class_schedules
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_class_schedules_adviser ON class_schedules(adviser_id);

-- Verify
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('activities','student_activities','announcements','class_schedules')
ORDER BY table_name;

-- ── Supabase Storage bucket for activity file uploads ─────────
-- Run this AFTER the tables above.
-- Creates a public bucket for activity attachments.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'activity-files',
  'activity-files',
  true,
  10485760,  -- 10 MB limit
  ARRAY['image/png','image/jpeg','image/gif','image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'application/zip']
)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access
CREATE POLICY IF NOT EXISTS "Public read activity-files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'activity-files');

-- Allow authenticated/anon uploads
CREATE POLICY IF NOT EXISTS "Allow uploads to activity-files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'activity-files');

-- Allow deletes
CREATE POLICY IF NOT EXISTS "Allow deletes from activity-files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'activity-files');
