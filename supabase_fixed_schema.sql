-- Run this in your Supabase SQL Editor to create the students table

CREATE TABLE students (
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

-- Enable Row Level Security (optional but recommended)
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (adjust for production)
CREATE POLICY "Allow all" ON students FOR ALL USING (true);

-- Sample data insertion (fix the syntax error)
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
) VALUES 
(
  '2021-00001',
  'Juan',
  'Dela Cruz',
  'juan.delacruz@email.com',
  '+63-912-345-6789',
  '123 Main St, Cabuyao, Laguna',
  '2000-05-15',
  'Male',
  'Bachelor of Science in Computer Science',
  3,
  3.25
),
(
  '2021-00002',
  'Maria',
  'Santos',
  'maria.santos@email.com',
  '+63-917-123-4567',
  '456 Oak Ave, Cabuyao, Laguna',
  '2001-08-22',
  'Female',
  'Bachelor of Science in Information Technology',
  2,
  3.75
);