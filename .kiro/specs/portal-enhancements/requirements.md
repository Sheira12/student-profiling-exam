# Requirements Document

## Introduction

This feature enhances the CCS Student Profiling System's Adviser Portal (`EmployeePortal.jsx`) and Student Portal (`StudentPortal.jsx`) with six improvements: file/link attachments on activities, a weekly class schedule, subject-based navigation in the student portal, expanded activity types with scoring, dark mode for both portals, and a fix for the broken dark mode CSS that currently makes text invisible in adviser and student portals.

The system uses Supabase as its backend. Activities are stored in the `activities` and `student_activities` tables. Subjects are tracked via `curriculum_deployments`. CSS theming relies on CSS custom properties scoped to `body.dark-mode`.

---

## Glossary

- **Adviser_Portal**: The `EmployeePortal.jsx` page used by employee/adviser accounts.
- **Student_Portal**: The `StudentPortal.jsx` page used by student accounts.
- **Activity_Manager**: The `ActivityManager.jsx` component embedded in the Adviser_Portal's Activities tab.
- **Student_Activities_View**: The `StudentActivitiesView.jsx` component embedded in the Student_Portal's Activities tab.
- **Activity**: A record in the `activities` table with a title, type, optional due date, and optional attachment.
- **Student_Activity**: A record in the `student_activities` table linking an Activity to a specific student with a status and optional score.
- **Attachment**: A URL string (Google Drive share link or any HTTPS URL) stored in the `file_url` column of the `activities` table.
- **Class_Schedule**: A record in the `class_schedules` table representing one weekly class slot (subject name, day, time, room) owned by an adviser.
- **Subject_Detail_View**: An inline view within the Student_Portal's My Subjects tab that shows announcements, activities, and grades filtered to a specific subject code.
- **Subject_Code**: The `subject_code` field on `curriculum_deployments`, `activities`, and `announcements` used to associate records with a subject.
- **Dark_Mode**: A visual theme applied via a CSS class on the portal root element that inverts background and text colors while preserving brand accent colors.
- **localStorage**: Browser-local key-value storage used to persist dark mode preference per portal independently.
- **Admin_Dark_Mode**: The existing dark mode toggle in the admin `TopBar.jsx` that sets `body.dark-mode` and currently breaks adviser/student portal text visibility.

---

## Requirements

### Requirement 1: File and Link Attachments on Activities

**User Story:** As an adviser, I want to attach a Google Drive link or any URL to an activity, so that students can access reference materials or submission instructions directly from the activity card.

#### Acceptance Criteria

1. THE Activity_Manager SHALL display a URL input field labeled "Attachment URL (optional)" in the activity creation form.
2. WHEN an adviser submits the activity creation form with a non-empty attachment URL, THE Activity_Manager SHALL store the URL in the `file_url` column of the `activities` table.
3. WHEN an adviser submits the activity creation form with an empty attachment URL, THE Activity_Manager SHALL store `null` in the `file_url` column.
4. IF the attachment URL does not begin with `http://` or `https://`, THEN THE Activity_Manager SHALL display an inline validation error and prevent form submission.
5. WHEN a student views an activity card in Student_Activities_View that has a non-null `file_url`, THE Student_Activities_View SHALL render a clickable link that opens the URL in a new browser tab.
6. WHEN a student views an activity card in Student_Activities_View that has a null `file_url`, THE Student_Activities_View SHALL not render any attachment link or placeholder.
7. THE `activities` table SHALL contain a `file_url` column of type `text` that is nullable.

---

### Requirement 2: Class Schedule

**User Story:** As an adviser, I want to create and manage a weekly class schedule, so that my assigned students can see when and where each class meets.

#### Acceptance Criteria

1. THE Adviser_Portal SHALL include a "Schedule" navigation tab in the sidebar.
2. WHEN an adviser opens the Schedule tab, THE Adviser_Portal SHALL display a schedule management view listing all class schedule entries owned by the adviser.
3. THE schedule management view SHALL provide a form to create a new schedule entry with fields: subject name (required), day of week (required, one of Monday–Sunday), start time (required), end time (required), and room/location (optional).
4. WHEN an adviser submits a valid schedule entry form, THE Adviser_Portal SHALL insert a row into the `class_schedules` table with the adviser's UUID as `adviser_id`.
5. WHEN an adviser submits a schedule entry form with a missing required field, THE Adviser_Portal SHALL display an inline validation error and prevent submission.
6. WHEN an adviser clicks a delete button on a schedule entry, THE Adviser_Portal SHALL remove that row from the `class_schedules` table.
7. THE Student_Portal SHALL include a "Schedule" navigation tab in the sidebar.
8. WHEN a student opens the Schedule tab, THE Student_Portal SHALL query the `class_schedules` table filtered by the student's assigned adviser's UUID and display the results grouped by day of week.
9. WHEN a student has no assigned adviser, THE Student_Portal SHALL display an empty-state message in the Schedule tab indicating no schedule is available.
10. THE `class_schedules` table SHALL contain columns: `id` (uuid, primary key), `adviser_id` (uuid, foreign key to `employees`), `subject_name` (text, not null), `day_of_week` (text, not null), `start_time` (time, not null), `end_time` (time, not null), `room` (text, nullable), `created_at` (timestamptz, default now()).

---

### Requirement 3: Subject-Based Navigation

**User Story:** As a student, I want to click on a subject card in My Subjects and see all announcements, activities, and grades related to that subject, so that I can manage my coursework in one place.

#### Acceptance Criteria

1. WHEN a student clicks a subject card in the My Subjects tab, THE Student_Portal SHALL render a Subject_Detail_View for that subject in place of the subject grid.
2. THE Subject_Detail_View SHALL display a back button that returns the student to the subject grid.
3. THE Subject_Detail_View SHALL display a list of announcements whose `subject_code` column matches the selected subject's code.
4. THE Subject_Detail_View SHALL display a list of activities (from `student_activities` joined to `activities`) whose `subject_code` column matches the selected subject's code.
5. THE Subject_Detail_View SHALL display the student's grade and status for the selected subject from the `curriculum_deployments` table.
6. WHEN no announcements exist for the selected subject, THE Subject_Detail_View SHALL display an empty-state message in the announcements section.
7. WHEN no activities exist for the selected subject, THE Subject_Detail_View SHALL display an empty-state message in the activities section.
8. THE `activities` table SHALL contain a nullable `subject_code` column of type `text`.
9. THE `announcements` table SHALL contain a nullable `subject_code` column of type `text`.
10. WHEN an adviser creates an activity, THE Activity_Manager SHALL display an optional "Subject Code" input field that populates the `subject_code` column.
11. WHEN an adviser creates an announcement in the Adviser_Portal, THE Adviser_Portal announcement form SHALL display an optional "Subject Code" input field that populates the `subject_code` column.

---

### Requirement 4: Activity Types Expansion and Scoring

**User Story:** As an adviser, I want to create laboratory, exam, and quiz activities with a maximum score, and record a student's score when marking their submission, so that I can track academic performance through activities.

#### Acceptance Criteria

1. THE Activity_Manager type selector SHALL include options: `assignment`, `event`, `task`, `laboratory`, `exam`, `quiz`.
2. THE `activities` table `type` column CHECK constraint SHALL accept `'laboratory'`, `'exam'`, and `'quiz'` in addition to the existing values.
3. THE Activity_Manager creation form SHALL include an optional "Max Score" numeric input field that stores its value in a `max_score` column on the `activities` table.
4. WHEN an adviser updates a student's activity status in the Activity_Manager, THE Activity_Manager SHALL display a "Score" numeric input field that stores its value in a `score` column on the `student_activities` table.
5. IF an adviser enters a score greater than the activity's `max_score`, THEN THE Activity_Manager SHALL display an inline validation warning (non-blocking) indicating the score exceeds the maximum.
6. WHEN a student views an activity card in Student_Activities_View that has a non-null `score`, THE Student_Activities_View SHALL display the score alongside the activity status.
7. WHEN a student views an activity card in Student_Activities_View that has a non-null `max_score`, THE Student_Activities_View SHALL display the max score alongside the score (e.g., "12 / 20").
8. THE `activities` table SHALL contain a nullable `max_score` column of type `numeric`.
9. THE `student_activities` table SHALL contain a nullable `score` column of type `numeric`.

---

### Requirement 5: Dark Mode for Adviser and Student Portals

**User Story:** As an adviser or student, I want to toggle dark mode within my portal, so that I can use the system comfortably in low-light environments without affecting other portals.

#### Acceptance Criteria

1. THE Adviser_Portal topbar SHALL include a dark mode toggle button (moon/sun icon).
2. THE Student_Portal topbar SHALL include a dark mode toggle button (moon/sun icon).
3. WHEN a user activates dark mode in the Adviser_Portal, THE Adviser_Portal SHALL add a `dark` CSS class to the Adviser_Portal root element (`.sp-root`).
4. WHEN a user activates dark mode in the Student_Portal, THE Student_Portal SHALL add a `dark` CSS class to the Student_Portal root element (`.sp-root`).
5. WHEN a user activates dark mode in the Adviser_Portal, THE Adviser_Portal SHALL store the value `"dark"` under the key `adviser_dark_mode` in `localStorage`.
6. WHEN a user activates dark mode in the Student_Portal, THE Student_Portal SHALL store the value `"dark"` under the key `student_dark_mode` in `localStorage`.
7. WHEN the Adviser_Portal mounts, THE Adviser_Portal SHALL read `adviser_dark_mode` from `localStorage` and apply dark mode if the stored value is `"dark"`.
8. WHEN the Student_Portal mounts, THE Student_Portal SHALL read `student_dark_mode` from `localStorage` and apply dark mode if the stored value is `"dark"`.
9. WHILE dark mode is active in the Adviser_Portal, THE Adviser_Portal SHALL maintain the blue accent color (`#3b82f6`) for interactive elements and active states.
10. WHILE dark mode is active in the Student_Portal, THE Student_Portal SHALL maintain the green accent color (`#10b981`) for interactive elements and active states.
11. WHILE dark mode is active in either portal, all body text, labels, headings, and input values SHALL have a contrast ratio of at least 4.5:1 against their background color.
12. THE dark mode CSS for the Adviser_Portal and Student_Portal SHALL be scoped to `.sp-root.dark` so that it does not affect the admin portal or any other page.

---

### Requirement 6: Fix Dark Mode Text Visibility Bug

**User Story:** As an administrator, I want toggling dark mode in the admin panel to not break text visibility in the adviser and student portals, so that all portals remain usable simultaneously.

#### Acceptance Criteria

1. WHEN `body.dark-mode` is active (admin dark mode), text in the Adviser_Portal and Student_Portal SHALL remain readable with a contrast ratio of at least 4.5:1.
2. THE `body.dark-mode` CSS rule SHALL NOT override `--orange-light` with a dark color that is used as a background in adviser or student portal components.
3. THE `body.dark-mode` CSS rule SHALL be scoped or overridden so that `.sp-root` descendant elements retain readable foreground and background colors when `body.dark-mode` is active but portal-level dark mode is not active.
4. WHERE the adviser or student portal uses `var(--orange-light)` as a background color, THE portal CSS SHALL define a local override within `.sp-root` that prevents the admin dark mode from making that background dark while the text color remains light.
5. WHEN `body.dark-mode` is active and portal dark mode is not active, THE Adviser_Portal and Student_Portal SHALL display with their default light-theme backgrounds and text colors.
