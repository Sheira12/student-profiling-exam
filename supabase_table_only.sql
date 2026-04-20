-- Run this in your Supabase SQL Editor to create the students table
-- This version only creates the table without sample data

CREATE TABLE IF NOT EXISTS students (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id text NOT NULL UNIQUE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  address text,
  date_of_birth date,
  gender text,
  course text,
  year_level integer,
  gpa numeric(3,2),
  academic_awards text[],
  skills text[],
  non_academic_activities text[],
  violations text[],
  affiliations text[],
  academic_progress jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow all operations (adjust for production)
CREATE POLICY "Allow all operations" ON students FOR ALL USING (true);