-- ══════════════════════════════════════════════════════════════
-- GENERATE 1000 FICTIONAL STUDENTS WITH DIVERSE PROFILES
-- Run this in Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════

DO $$
DECLARE
  -- Arrays for random data generation
  first_names_male text[] := ARRAY[
    'James', 'John', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Joseph', 'Thomas', 'Christopher',
    'Daniel', 'Matthew', 'Anthony', 'Mark', 'Donald', 'Steven', 'Andrew', 'Paul', 'Joshua', 'Kenneth',
    'Kevin', 'Brian', 'George', 'Timothy', 'Ronald', 'Edward', 'Jason', 'Jeffrey', 'Ryan', 'Jacob',
    'Gary', 'Nicholas', 'Eric', 'Jonathan', 'Stephen', 'Larry', 'Justin', 'Scott', 'Brandon', 'Benjamin',
    'Samuel', 'Raymond', 'Gregory', 'Alexander', 'Patrick', 'Frank', 'Dennis', 'Jerry', 'Tyler', 'Aaron'
  ];
  
  first_names_female text[] := ARRAY[
    'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth', 'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen',
    'Lisa', 'Nancy', 'Betty', 'Margaret', 'Sandra', 'Ashley', 'Kimberly', 'Emily', 'Donna', 'Michelle',
    'Carol', 'Amanda', 'Dorothy', 'Melissa', 'Deborah', 'Stephanie', 'Rebecca', 'Sharon', 'Laura', 'Cynthia',
    'Kathleen', 'Amy', 'Angela', 'Shirley', 'Anna', 'Brenda', 'Pamela', 'Emma', 'Nicole', 'Helen',
    'Samantha', 'Katherine', 'Christine', 'Debra', 'Rachel', 'Carolyn', 'Janet', 'Catherine', 'Maria', 'Heather'
  ];
  
  last_names text[] := ARRAY[
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
    'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
    'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson',
    'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores',
    'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts',
    'Gomez', 'Phillips', 'Evans', 'Turner', 'Diaz', 'Parker', 'Cruz', 'Edwards', 'Collins', 'Reyes'
  ];
  
  courses text[] := ARRAY[
    'Computer Science',
    'Information Technology',
    'Information Systems'
  ];
  
  programming_skills text[] := ARRAY[
    'JavaScript', 'Python', 'Java', 'C++', 'PHP', 'Ruby', 'Swift', 'Kotlin',
    'TypeScript', 'Go', 'Rust', 'C#', 'SQL', 'HTML/CSS', 'React', 'Angular',
    'Vue.js', 'Node.js', 'Django', 'Flask', 'Spring Boot', 'Laravel'
  ];
  
  soft_skills text[] := ARRAY[
    'Leadership', 'Communication', 'Teamwork', 'Problem Solving', 'Critical Thinking',
    'Time Management', 'Adaptability', 'Creativity', 'Public Speaking', 'Project Management',
    'Conflict Resolution', 'Negotiation', 'Emotional Intelligence', 'Decision Making'
  ];
  
  sports_skills text[] := ARRAY[
    'Basketball', 'Volleyball', 'Football', 'Badminton', 'Table Tennis', 'Chess',
    'Swimming', 'Track and Field', 'Baseball', 'Softball', 'Tennis', 'Martial Arts'
  ];
  
  activities text[] := ARRAY[
    'Student Council President', 'Student Council Vice President', 'Student Council Member',
    'Basketball Team Captain', 'Volleyball Team Captain', 'Debate Team Member',
    'Drama Club President', 'Music Club Member', 'Dance Troupe Member',
    'IEEE Student Branch Officer', 'ACM Chapter Member', 'Google Developer Student Club',
    'Robotics Club Member', 'Hackathon Participant', 'Community Service Volunteer',
    'Peer Tutor', 'Research Assistant', 'Campus Journalist', 'Photography Club',
    'Environmental Club Member', 'Red Cross Youth Volunteer', 'ROTC Cadet'
  ];
  
  awards text[] := ARRAY[
    'Dean''s Lister', 'President''s Lister', 'Academic Excellence Award',
    'Best Thesis Award', 'Best Capstone Project', 'Outstanding Student Leader',
    'Hackathon Winner', 'Programming Competition Winner', 'Research Paper Presenter',
    'Scholarship Recipient', 'Honor Student', 'Perfect Attendance Award',
    'Community Service Award', 'Sports Excellence Award', 'Leadership Award'
  ];
  
  violations text[] := ARRAY[
    'Late Submission', 'Dress Code Violation', 'Minor Misconduct',
    'Absence Without Leave', 'Classroom Disruption', 'Parking Violation',
    'Library Fine', 'Academic Warning', 'Behavioral Warning'
  ];
  
  affiliations text[] := ARRAY[
    'IEEE Computer Society', 'ACM Student Chapter', 'Google Developer Student Club',
    'Microsoft Student Partners', 'Student Council', 'ROTC',
    'Red Cross Youth', 'Environmental Club', 'Debate Society',
    'Drama Club', 'Music Club', 'Sports Club', 'Photography Club',
    'Robotics Club', 'Cybersecurity Club', 'AI/ML Study Group'
  ];
  
  streets text[] := ARRAY[
    'Main St', 'Oak Ave', 'Maple Dr', 'Pine Rd', 'Cedar Ln', 'Elm St',
    'Washington Blvd', 'Park Ave', 'Lake Dr', 'Hill Rd', 'River St', 'Forest Ave'
  ];
  
  cities text[] := ARRAY[
    'Manila', 'Quezon City', 'Makati', 'Pasig', 'Taguig', 'Mandaluyong',
    'Caloocan', 'Las Piñas', 'Parañaque', 'Muntinlupa', 'Marikina', 'Valenzuela'
  ];
  
  -- Variables for loop
  i integer;
  gender_val text;
  first_name_val text;
  last_name_val text;
  student_id_val text;
  email_val text;
  phone_val text;
  address_val text;
  dob_val date;
  course_val text;
  year_val integer;
  gpa_val numeric(3,2);
  num_skills integer;
  num_activities integer;
  num_awards integer;
  num_violations integer;
  num_affiliations integer;
  skills_array text[];
  activities_array text[];
  awards_array text[];
  violations_array text[];
  affiliations_array text[];
  
BEGIN
  -- Generate 1000 students
  FOR i IN 1..1000 LOOP
    -- Random gender
    gender_val := CASE WHEN random() < 0.5 THEN 'Male' ELSE 'Female' END;
    
    -- Random name based on gender
    IF gender_val = 'Male' THEN
      first_name_val := first_names_male[1 + floor(random() * array_length(first_names_male, 1))];
    ELSE
      first_name_val := first_names_female[1 + floor(random() * array_length(first_names_female, 1))];
    END IF;
    
    last_name_val := last_names[1 + floor(random() * array_length(last_names, 1))];
    
    -- Generate student ID (format: 2020-2024 + 5 digits)
    student_id_val := (2020 + floor(random() * 5))::text || '-' || lpad(floor(random() * 100000)::text, 5, '0');
    
    -- Generate email
    email_val := lower(first_name_val || '.' || last_name_val || floor(random() * 100)::text || '@student.edu.ph');
    
    -- Generate phone (09XX-XXX-XXXX format)
    phone_val := '09' || floor(random() * 100)::text || '-' || 
                 lpad(floor(random() * 1000)::text, 3, '0') || '-' || 
                 lpad(floor(random() * 10000)::text, 4, '0');
    
    -- Generate address
    address_val := floor(1 + random() * 999)::text || ' ' || 
                   streets[1 + floor(random() * array_length(streets, 1))] || ', ' ||
                   cities[1 + floor(random() * array_length(cities, 1))];
    
    -- Generate date of birth (18-25 years old)
    dob_val := CURRENT_DATE - (6570 + floor(random() * 2555))::integer;
    
    -- Random course
    course_val := courses[1 + floor(random() * array_length(courses, 1))];
    
    -- Random year level (1-4, with some NULL for not enrolled)
    IF random() < 0.95 THEN
      year_val := 1 + floor(random() * 4);
    ELSE
      year_val := NULL;
    END IF;
    
    -- Random GPA (1.00 to 4.00, weighted towards higher GPAs)
    gpa_val := ROUND((1.0 + (random() * random() * 3.0))::numeric, 2);
    
    -- Generate skills (2-8 skills per student)
    num_skills := 2 + floor(random() * 7);
    skills_array := ARRAY[]::text[];
    FOR j IN 1..num_skills LOOP
      -- Mix of programming, soft, and sports skills
      IF random() < 0.5 THEN
        skills_array := array_append(skills_array, 
          programming_skills[1 + floor(random() * array_length(programming_skills, 1))]);
      ELSIF random() < 0.7 THEN
        skills_array := array_append(skills_array, 
          soft_skills[1 + floor(random() * array_length(soft_skills, 1))]);
      ELSE
        skills_array := array_append(skills_array, 
          sports_skills[1 + floor(random() * array_length(sports_skills, 1))]);
      END IF;
    END LOOP;
    -- Remove duplicates
    SELECT ARRAY(SELECT DISTINCT unnest(skills_array)) INTO skills_array;
    
    -- Generate activities (0-5 activities, 70% have at least one)
    IF random() < 0.7 THEN
      num_activities := 1 + floor(random() * 5);
      activities_array := ARRAY[]::text[];
      FOR j IN 1..num_activities LOOP
        activities_array := array_append(activities_array, 
          activities[1 + floor(random() * array_length(activities, 1))]);
      END LOOP;
      SELECT ARRAY(SELECT DISTINCT unnest(activities_array)) INTO activities_array;
    ELSE
      activities_array := ARRAY[]::text[];
    END IF;
    
    -- Generate awards (0-4 awards, 50% have at least one)
    IF random() < 0.5 THEN
      num_awards := 1 + floor(random() * 4);
      awards_array := ARRAY[]::text[];
      FOR j IN 1..num_awards LOOP
        awards_array := array_append(awards_array, 
          awards[1 + floor(random() * array_length(awards, 1))]);
      END LOOP;
      SELECT ARRAY(SELECT DISTINCT unnest(awards_array)) INTO awards_array;
    ELSE
      awards_array := ARRAY[]::text[];
    END IF;
    
    -- Generate violations (0-3 violations, 20% have violations)
    IF random() < 0.2 THEN
      num_violations := 1 + floor(random() * 3);
      violations_array := ARRAY[]::text[];
      FOR j IN 1..num_violations LOOP
        violations_array := array_append(violations_array, 
          violations[1 + floor(random() * array_length(violations, 1))]);
      END LOOP;
      SELECT ARRAY(SELECT DISTINCT unnest(violations_array)) INTO violations_array;
    ELSE
      violations_array := ARRAY[]::text[];
    END IF;
    
    -- Generate affiliations (0-4 affiliations, 60% have at least one)
    IF random() < 0.6 THEN
      num_affiliations := 1 + floor(random() * 4);
      affiliations_array := ARRAY[]::text[];
      FOR j IN 1..num_affiliations LOOP
        affiliations_array := array_append(affiliations_array, 
          affiliations[1 + floor(random() * array_length(affiliations, 1))]);
      END LOOP;
      SELECT ARRAY(SELECT DISTINCT unnest(affiliations_array)) INTO affiliations_array;
    ELSE
      affiliations_array := ARRAY[]::text[];
    END IF;
    
    -- Insert student record
    INSERT INTO students (
      student_id, first_name, last_name, email, phone, address,
      date_of_birth, gender, course, year_level, gpa,
      academic_awards, skills, non_academic_activities, violations, affiliations
    ) VALUES (
      student_id_val, first_name_val, last_name_val, email_val, phone_val, address_val,
      dob_val, gender_val, course_val, year_val, gpa_val,
      awards_array, skills_array, activities_array, violations_array, affiliations_array
    );
    
    -- Progress indicator every 100 students
    IF i % 100 = 0 THEN
      RAISE NOTICE 'Generated % students...', i;
    END IF;
  END LOOP;
  
  RAISE NOTICE 'Successfully generated 1000 students!';
END $$;

-- Display summary statistics
SELECT 
  COUNT(*) as total_students,
  COUNT(*) FILTER (WHERE year_level IS NOT NULL) as enrolled,
  COUNT(*) FILTER (WHERE year_level IS NULL) as not_enrolled,
  ROUND(AVG(gpa), 2) as avg_gpa,
  COUNT(*) FILTER (WHERE array_length(academic_awards, 1) > 0) as students_with_awards,
  COUNT(*) FILTER (WHERE array_length(violations, 1) > 0) as students_with_violations,
  COUNT(*) FILTER (WHERE array_length(non_academic_activities, 1) > 0) as students_with_activities
FROM students;

-- Display course distribution
SELECT 
  course,
  COUNT(*) as student_count,
  ROUND(AVG(gpa), 2) as avg_gpa
FROM students
WHERE course IS NOT NULL
GROUP BY course
ORDER BY student_count DESC;

-- Display year level distribution
SELECT 
  year_level,
  COUNT(*) as student_count
FROM students
WHERE year_level IS NOT NULL
GROUP BY year_level
ORDER BY year_level;
