-- ══════════════════════════════════════════════════════════════
-- GRADES (Prelim/Midterm/Finals) + STORAGE BUCKET FIX
-- Run in Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════

-- 1. Add prelim, midterm, finals columns to curriculum_deployments
ALTER TABLE curriculum_deployments
  ADD COLUMN IF NOT EXISTS prelim_grade  numeric,
  ADD COLUMN IF NOT EXISTS midterm_grade numeric,
  ADD COLUMN IF NOT EXISTS finals_grade  numeric;

-- 2. Create Supabase Storage bucket for activity file uploads
-- (IF NOT EXISTS is not supported for policies — use DO block)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'activity-files',
  'activity-files',
  true,
  10485760,
  ARRAY[
    'image/png','image/jpeg','image/gif','image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (drop first to avoid duplicates)
DROP POLICY IF EXISTS "Public read activity-files"        ON storage.objects;
DROP POLICY IF EXISTS "Allow uploads to activity-files"   ON storage.objects;
DROP POLICY IF EXISTS "Allow deletes from activity-files" ON storage.objects;

CREATE POLICY "Public read activity-files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'activity-files');

CREATE POLICY "Allow uploads to activity-files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'activity-files');

CREATE POLICY "Allow deletes from activity-files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'activity-files');

-- Verify
SELECT column_name FROM information_schema.columns
WHERE table_name = 'curriculum_deployments'
  AND column_name IN ('prelim_grade','midterm_grade','finals_grade')
ORDER BY column_name;
