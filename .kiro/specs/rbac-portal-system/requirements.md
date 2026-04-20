# Requirements Document

## Introduction

This document defines the requirements for enhancing the CCS Student Profiling System (React + Supabase) with a full Role-Based Access Control (RBAC) portal system. The existing system has a single login page with toggle buttons for three roles (admin, student, adviser). This enhancement introduces separate login routes per role, expands the Adviser Panel with announcement, activity, and grade management capabilities, enriches the Student Portal with a personal dashboard and read-only access to grades and activities, and enforces strict data privacy so each role can only access data within its scope. Two new database tables (`activities` and `student_activities`) are also required.

---

## Glossary

- **Admin**: The system administrator who logs in at `/admin` with hardcoded credentials and has full access to all data and audit logs.
- **Adviser**: A faculty employee who logs in at `/adviser` using employee ID and password. An Adviser can only manage students assigned to them via `adviser_assignments`.
- **Student**: A learner who logs in at `/student` using student ID and last name. A Student can only view their own data.
- **RBAC_Router**: The React Router configuration that maps `/admin`, `/adviser`, and `/student` to their respective login and portal pages.
- **Route_Guard**: A React component (currently `ProtectedRoute`) that checks the session role and redirects unauthorized access.
- **Activity**: A task, assignment, or event created by an Adviser and targeted at one or more assigned students, stored in the `activities` table.
- **Student_Activity**: A join record in `student_activities` that tracks each student's status and submission note for a given Activity.
- **Announcement**: A record in the `announcements` table with a `target` field (`all`, `students`, `employees`) and an optional `adviser_id` for adviser-scoped announcements.
- **Curriculum_Deployment**: An existing record in `curriculum_deployments` that holds per-student, per-subject enrollment status and grade.
- **Session**: Browser `sessionStorage` entries (`ccs_role`, `ccs_student`, `ccs_employee`) used to persist login state across page refreshes.
- **Audit_Log**: A record in `activity_logs` capturing who did what and when, used for admin oversight.

---

## Requirements

### Requirement 1: Separate Login Routes

**User Story:** As a user of the system, I want to navigate directly to a role-specific login URL, so that I do not have to toggle between login modes on a shared page.

#### Acceptance Criteria

1. THE RBAC_Router SHALL expose `/admin` as the login route for the Admin role.
2. THE RBAC_Router SHALL expose `/adviser` as the login route for the Adviser role.
3. THE RBAC_Router SHALL expose `/student` as the login route for the Student role.
4. WHEN an unauthenticated user visits `/`, THE RBAC_Router SHALL redirect the user to `/admin`.
5. WHEN an authenticated Admin visits `/adviser` or `/student`, THE Route_Guard SHALL redirect the Admin to the Admin dashboard at `/admin/dashboard`.
6. WHEN an authenticated Adviser visits `/admin` or `/student`, THE Route_Guard SHALL redirect the Adviser to the Adviser portal at `/adviser/portal`.
7. WHEN an authenticated Student visits `/admin` or `/adviser`, THE Route_Guard SHALL redirect the Student to the Student portal at `/student/portal`.
8. WHEN a user logs out from any portal, THE RBAC_Router SHALL redirect the user to the login route corresponding to their previous role.

---

### Requirement 2: Admin Login

**User Story:** As an Admin, I want to log in at `/admin` with my username and password, so that I can access the full administration dashboard.

#### Acceptance Criteria

1. WHEN the Admin submits the login form at `/admin` with username `admin` and password `admin123`, THE Admin SHALL be granted access to the Admin dashboard.
2. IF the Admin submits incorrect credentials, THEN THE Admin login page SHALL display the error message "Invalid username or password." without revealing which field is wrong.
3. THE Admin login page SHALL NOT expose the hardcoded credentials in client-side source code visible to non-admin users.
4. WHEN the Admin is authenticated, THE Audit_Log SHALL record a login event with actor type `admin`, actor ID `admin`, and a timestamp.

---

### Requirement 3: Adviser Login

**User Story:** As an Adviser, I want to log in at `/adviser` with my employee ID and password, so that I can access my assigned students and manage their academic records.

#### Acceptance Criteria

1. WHEN an Adviser submits a valid employee ID and matching `password_hash` from the `employees` table, THE Adviser SHALL be granted access to the Adviser portal.
2. IF the Adviser submits an employee ID that does not exist or a non-matching password, THEN THE Adviser login page SHALL display the error message "Invalid Employee ID or password."
3. WHEN the Adviser is authenticated, THE Session SHALL store the full employee record under `ccs_employee` and set `ccs_role` to `employee`.
4. WHEN the Adviser is authenticated, THE Audit_Log SHALL record a login event with actor type `employee`, actor ID equal to the employee's UUID, and a timestamp.

---

### Requirement 4: Student Login

**User Story:** As a Student, I want to log in at `/student` with my student ID and last name, so that I can access my personal academic portal.

#### Acceptance Criteria

1. WHEN a Student submits a valid student ID and a case-insensitive matching last name from the `students` table, THE Student SHALL be granted access to the Student portal.
2. IF the Student submits a student ID or last name that does not match any record, THEN THE Student login page SHALL display the error message "Student ID or Last Name is incorrect."
3. WHEN the Student is authenticated, THE Session SHALL store the full student record under `ccs_student` and set `ccs_role` to `student`.

---

### Requirement 5: Route Protection

**User Story:** As a system administrator, I want all portal routes to be protected by role, so that no user can access another role's data by manipulating the URL.

#### Acceptance Criteria

1. WHILE a user has no valid Session, THE Route_Guard SHALL redirect any request to a protected portal route back to the appropriate login page.
2. WHILE a Student session is active, THE Route_Guard SHALL deny access to all Admin and Adviser portal routes and redirect to `/student/portal`.
3. WHILE an Adviser session is active, THE Route_Guard SHALL deny access to all Admin and Student portal routes and redirect to `/adviser/portal`.
4. WHILE an Admin session is active, THE Route_Guard SHALL deny access to Student and Adviser portal routes and redirect to `/admin/dashboard`.
5. THE Route_Guard SHALL evaluate role on every route change, not only on initial page load.

---

### Requirement 6: Adviser — Announcement Management

**User Story:** As an Adviser, I want to create and manage announcements targeted to my assigned students, so that I can communicate important information directly to them.

#### Acceptance Criteria

1. WHEN an Adviser creates an announcement, THE Announcement SHALL be stored in the `announcements` table with `author_type` set to `employee`, `author_id` set to the Adviser's UUID, and `target` set to `students`.
2. THE Adviser portal SHALL display only announcements where `author_id` equals the Adviser's UUID or `author_type` equals `admin` in the announcement management view.
3. WHEN an Adviser edits an announcement they authored, THE Announcement record SHALL be updated and `updated_at` SHALL reflect the edit timestamp.
4. WHEN an Adviser attempts to edit or delete an announcement authored by a different Adviser or by Admin, THE Adviser portal SHALL deny the action and display an error message.
5. WHEN an Adviser deletes an announcement they authored, THE Announcement record SHALL be removed from the `announcements` table.
6. THE Adviser portal SHALL allow setting announcement priority as `normal`, `important`, or `urgent`.
7. WHEN an Adviser posts an announcement, THE Audit_Log SHALL record the action with actor type `employee` and the announcement ID.

---

### Requirement 7: Adviser — Activity Management

**User Story:** As an Adviser, I want to create and manage activities (assignments, events, tasks) for my assigned students, so that I can track their academic workload and deadlines.

#### Acceptance Criteria

1. THE System SHALL provide an `activities` table with columns: `id`, `title`, `description`, `type` (values: `assignment`, `event`, `task`), `due_date`, `adviser_id`, `status` (values: `active`, `archived`), and `created_at`.
2. THE System SHALL provide a `student_activities` table with columns: `id`, `activity_id`, `student_id`, `status` (values: `pending`, `submitted`, `done`), `submission_note`, and `updated_at`.
3. WHEN an Adviser creates an Activity, THE Activity record SHALL be inserted into `activities` with `adviser_id` set to the Adviser's UUID.
4. WHEN an Adviser creates an Activity, THE System SHALL insert one `student_activities` record per targeted student with initial `status` of `pending`.
5. WHEN an Adviser targets an Activity at a student who is not in the Adviser's assigned student list, THE System SHALL reject the insertion and return an error.
6. WHEN an Adviser updates the status of a `student_activities` record, THE record SHALL reflect the new status and `updated_at` SHALL be refreshed.
7. WHEN an Adviser archives an Activity, THE Activity `status` SHALL be set to `archived` and the Activity SHALL no longer appear in the active activities list.
8. THE Adviser portal SHALL display activities grouped by type (`assignment`, `event`, `task`) with due dates and student completion counts.

---

### Requirement 8: Adviser — Grade Management

**User Story:** As an Adviser, I want to input and update grades for my assigned students per subject, so that students can view their academic performance.

#### Acceptance Criteria

1. WHEN an Adviser updates a grade for a `curriculum_deployments` record, THE record's `grade` field SHALL be updated and `updated_at` SHALL reflect the change timestamp.
2. WHEN an Adviser updates a grade, THE System SHALL also update the corresponding entry in `students.academic_progress` JSONB field to keep both sources in sync.
3. WHEN an Adviser attempts to update a grade for a student not in their assigned list, THE System SHALL reject the update and return an authorization error.
4. THE Adviser portal grade editor SHALL accept numeric grades (e.g., `1.0` to `5.0`) and text grades (`INC`, `DROPPED`).
5. WHEN a grade is updated, THE System SHALL push a notification to the affected Student with the subject code, new grade, and updated status.
6. WHEN a grade is updated, THE Audit_Log SHALL record the action with actor type `employee`, the deployment ID, and the new grade value.

---

### Requirement 9: Adviser — Assigned Students Dashboard

**User Story:** As an Adviser, I want to view a dashboard of all my assigned students and their performance, so that I can quickly identify students who need attention.

#### Acceptance Criteria

1. THE Adviser portal SHALL display a list of all students assigned to the Adviser via `adviser_assignments`.
2. FOR each assigned student, THE Adviser portal SHALL show the student's name, student ID, course, year level, number of subjects passed, and current GPA.
3. THE Adviser portal SHALL provide a search field that filters the student list by name or student ID in real time.
4. WHEN an Adviser selects a student, THE Adviser portal SHALL display that student's full subject list with grades and statuses from `curriculum_deployments`.
5. THE Adviser portal SHALL NOT display students assigned to other advisers.

---

### Requirement 10: Student — Announcements View

**User Story:** As a Student, I want to view announcements from my adviser and from admin, so that I stay informed about important updates.

#### Acceptance Criteria

1. THE Student portal SHALL display all active announcements where `target` is `all` or `students`.
2. THE Student portal SHALL display announcements from the Admin (where `author_type` is `admin`) and from the Student's assigned Adviser (where `author_id` matches the Adviser's UUID from `adviser_assignments`).
3. THE Student portal SHALL NOT display announcements authored by other advisers who are not assigned to the Student.
4. THE Student portal SHALL display each announcement's title, content, priority badge, author name, and creation date.
5. WHEN a new announcement is posted by the Student's assigned Adviser or by Admin, THE Student portal SHALL reflect the new announcement on the next data load without requiring a full page refresh.

---

### Requirement 11: Student — Activities View

**User Story:** As a Student, I want to view activities assigned to me with their deadlines and my current status, so that I can manage my academic tasks.

#### Acceptance Criteria

1. THE Student portal SHALL display all `student_activities` records where `student_id` matches the authenticated Student's UUID.
2. FOR each activity, THE Student portal SHALL show the activity title, description, type, due date, and the Student's current status (`pending`, `submitted`, `done`).
3. THE Student portal SHALL visually distinguish overdue activities (where `due_date` is before the current date and status is `pending`).
4. THE Student portal SHALL NOT display activities belonging to other students.
5. THE Student portal SHALL display activities sorted by `due_date` in ascending order, with overdue items shown first.

---

### Requirement 12: Student — Grades View

**User Story:** As a Student, I want to view my grades per subject in read-only mode, so that I can monitor my academic performance.

#### Acceptance Criteria

1. THE Student portal SHALL display grades from `curriculum_deployments` where `student_id` matches the authenticated Student's UUID.
2. THE Student portal grades view SHALL be read-only; THE Student portal SHALL NOT provide any input or edit controls for grade fields.
3. FOR each subject, THE Student portal SHALL display the subject code, subject description, units, semester, year level, grade, and status.
4. THE Student portal SHALL NOT display grade records belonging to other students.
5. WHEN no grade has been entered for a subject, THE Student portal SHALL display a dash (`—`) in the grade column.

---

### Requirement 13: Student — Personal Dashboard

**User Story:** As a Student, I want a personal dashboard showing my profile, enrolled subjects, and academic progress, so that I have a single view of my academic standing.

#### Acceptance Criteria

1. THE Student portal dashboard SHALL display the Student's full name, student ID, course, year level, and GPA.
2. THE Student portal dashboard SHALL display a degree completion progress bar calculated as (passed units / total curriculum units) × 100.
3. THE Student portal dashboard SHALL display summary counts for: subjects passed, subjects currently enrolled, subjects failed, and overall completion percentage.
4. THE Student portal dashboard SHALL display the Student's assigned Adviser name, position, and department if an assignment exists in `adviser_assignments`.
5. THE Student portal dashboard SHALL display the count of pending activities from `student_activities` where `status` is `pending`.

---

### Requirement 14: Data Privacy — Student Scope Enforcement

**User Story:** As a system administrator, I want students to only access their own data, so that no student can view another student's grades, activities, or personal information.

#### Acceptance Criteria

1. WHEN the Student portal fetches `curriculum_deployments`, THE query SHALL include a `student_id` filter equal to the authenticated Student's UUID.
2. WHEN the Student portal fetches `student_activities`, THE query SHALL include a `student_id` filter equal to the authenticated Student's UUID.
3. WHEN the Student portal fetches `announcements`, THE query SHALL filter by `target` in (`all`, `students`) and by `author_id` in (admin, assigned adviser UUID).
4. IF a Student manually constructs a request with a different student ID, THEN THE System SHALL return no data for that student's records due to query-level filtering.
5. THE Student portal SHALL NOT render any UI element that exposes another student's name, ID, grade, or activity.

---

### Requirement 15: Data Privacy — Adviser Scope Enforcement

**User Story:** As a system administrator, I want advisers to only manage students assigned to them, so that no adviser can view or modify another adviser's students.

#### Acceptance Criteria

1. WHEN the Adviser portal fetches student data, THE query SHALL join through `adviser_assignments` and filter by `employee_id` equal to the authenticated Adviser's UUID.
2. WHEN the Adviser portal fetches `curriculum_deployments`, THE query SHALL restrict results to students in the Adviser's assigned list.
3. WHEN the Adviser portal fetches `activities`, THE query SHALL filter by `adviser_id` equal to the authenticated Adviser's UUID.
4. IF an Adviser attempts a grade update on a deployment not belonging to their assigned students, THEN THE System SHALL reject the request and log the unauthorized attempt.
5. THE Adviser portal SHALL NOT display student records, grades, or activities belonging to students assigned to other advisers.

---

### Requirement 16: Admin — Full Access and Audit Tracking

**User Story:** As an Admin, I want full access to all system data and a complete audit trail, so that I can oversee all operations and investigate issues.

#### Acceptance Criteria

1. THE Admin dashboard SHALL have access to all students, employees, announcements, subjects, adviser assignments, and curriculum deployments without scope restrictions.
2. WHEN any Admin action creates, updates, or deletes a record, THE Audit_Log SHALL record the action with actor type `admin`, the entity type, entity ID, and a details payload.
3. THE Admin dashboard SHALL display the `activity_logs` table with filters for actor type, date range, and action keyword.
4. WHEN an Adviser updates a grade or posts an announcement, THE Audit_Log SHALL record the action with actor type `employee` so the Admin can review adviser activity.
5. THE Admin dashboard SHALL display a count of total audit log entries and allow export or pagination of log records.

---

### Requirement 17: New Database Tables

**User Story:** As a developer, I want the `activities` and `student_activities` tables created in Supabase, so that the activity management feature has a proper data foundation.

#### Acceptance Criteria

1. THE System SHALL create an `activities` table with columns: `id` (uuid, PK), `title` (text, NOT NULL), `description` (text), `type` (text, CHECK IN (`assignment`, `event`, `task`)), `due_date` (timestamptz), `adviser_id` (uuid, FK → employees.id), `status` (text, DEFAULT `active`, CHECK IN (`active`, `archived`)), `created_at` (timestamptz, DEFAULT now()).
2. THE System SHALL create a `student_activities` table with columns: `id` (uuid, PK), `activity_id` (uuid, FK → activities.id ON DELETE CASCADE), `student_id` (uuid, FK → students.id ON DELETE CASCADE), `status` (text, DEFAULT `pending`, CHECK IN (`pending`, `submitted`, `done`)), `submission_note` (text), `updated_at` (timestamptz, DEFAULT now()), with a UNIQUE constraint on (`activity_id`, `student_id`).
3. THE System SHALL enable Row Level Security on both `activities` and `student_activities` tables.
4. THE System SHALL create an index on `activities(adviser_id)` and on `student_activities(student_id)` for query performance.
5. WHEN the `activities` table is created, THE System SHALL add a permissive RLS policy allowing all operations (consistent with existing table policies) until Supabase Auth is integrated.
