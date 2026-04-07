-- Run this in your Supabase SQL Editor to create the students table

create table students (
  id uuid default gen_random_uuid() primary key,
  student_id text not null unique,
  first_name text not null,
  last_name text not null,
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
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable Row Level Security (optional but recommended)
alter table students enable row level security;

-- Allow all operations for now (adjust for production)
create policy "Allow all" on students for all using (true);
