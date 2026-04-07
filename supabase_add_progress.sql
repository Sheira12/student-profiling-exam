-- Run this in your Supabase SQL Editor to add academic progress tracking
ALTER TABLE students ADD COLUMN IF NOT EXISTS academic_progress jsonb DEFAULT '{}'::jsonb;
