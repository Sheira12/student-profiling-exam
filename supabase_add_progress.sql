-- If you already have a students table, run this to add the academic_progress column
ALTER TABLE students ADD COLUMN IF NOT EXISTS academic_progress jsonb DEFAULT '{}'::jsonb;