-- Fix Supabase permissions for deployment
-- Run this in your Supabase SQL Editor

-- First, let's make sure the table exists with the correct structure
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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all" ON students;
DROP POLICY IF EXISTS "Enable read access for all users" ON students;
DROP POLICY IF EXISTS "Enable insert for all users" ON students;
DROP POLICY IF EXISTS "Enable update for all users" ON students;
DROP POLICY IF EXISTS "Enable delete for all users" ON students;

-- Create permissive policies for all operations
CREATE POLICY "Enable read access for all users" ON students FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON students FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON students FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON students FOR DELETE USING (true);

-- Add some sample data if the table is empty
INSERT INTO students (
  student_id,
  first_name,
  last_name,
  email,
  phone,
  address,
  date_of_birth,
  gender,
  course,
  year_level,
  gpa
) 
SELECT * FROM (VALUES 
  ('2021-00001', 'Juan', 'Dela Cruz', 'juan.delacruz@email.com', '+63-912-345-6789', '123 Main St, Cabuyao, Laguna', '2000-05-15'::date, 'Male', 'Bachelor of Science in Computer Science', 3, 3.25),
  ('2021-00002', 'Maria', 'Santos', 'maria.santos@email.com', '+63-917-123-4567', '456 Oak Ave, Cabuyao, Laguna', '2001-08-22'::date, 'Female', 'Bachelor of Science in Information Technology', 2, 3.75),
  ('2021-00003', 'Pedro', 'Garcia', 'pedro.garcia@email.com', '+63-918-234-5678', '789 Pine St, Cabuyao, Laguna', '1999-12-10'::date, 'Male', 'Bachelor of Science in Information Systems', 4, 3.50),
  ('2022-00001', 'Ana', 'Rodriguez', 'ana.rodriguez@email.com', '+63-919-345-6789', '321 Elm St, Cabuyao, Laguna', '2002-03-25'::date, 'Female', 'Bachelor of Science in Computer Science', 1, 3.80)
) AS v(student_id, first_name, last_name, email, phone, address, date_of_birth, gender, course, year_level, gpa)
WHERE NOT EXISTS (SELECT 1 FROM students WHERE students.student_id = v.student_id);

-- Verify the setup
SELECT 'Table created and populated successfully' as status;
SELECT COUNT(*) as student_count FROM students;