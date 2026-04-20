# Tasks

## Task List

- [x] 1. Database migration
  - [x] 1.1 Create `supabase_portal_enhancements.sql` with ALTER TABLE statements for `activities` (add `file_url`, `subject_code`, `max_score`; update type CHECK constraint), `student_activities` (add `score`), `announcements` (add `subject_code`), and CREATE TABLE for `class_schedules` with RLS policy and index
- [x] 2. API layer (`client/src/api/rbac.js`)
  - [x] 2.1 Add `getClassSchedules(adviserId)`, `createClassSchedule(payload, actorName)`, `deleteClassSchedule(id, actorName)` functions
  - [x] 2.2 Update `getStudentActivities` select to include `file_url`, `subject_code`, `max_score` from joined `activities`
  - [x] 2.3 Update `updateStudentActivityStatus` to accept and persist `score` field
  - [x] 2.4 Update `createActivity` to pass `file_url`, `subject_code`, `max_score` in insert payload
- [-] 3. ActivityManager enhancements (`client/src/pages/ActivityManager.jsx`)
  - [x] 3.1 Add `laboratory`, `exam`, `quiz` to the type selector options and `TYPE_CFG` map
  - [x] 3.2 Add "Attachment URL (optional)" text input to creation form with `http://`/`https://` prefix validation (inline error, blocks submit)
  - [x] 3.3 Add "Subject Code (optional)" text input to creation form
  - [x] 3.4 Add "Max Score (optional)" number input to creation form
  - [x] 3.5 Add "Score" number input to the student status update row; show non-blocking inline warning when `score > max_score`
- [-] 4. StudentActivitiesView enhancements (`client/src/pages/StudentActivitiesView.jsx`)
  - [x] 4.1 Render attachment link (`<a target="_blank">`) on activity card when `file_url` is non-null; render nothing when null
  - [x] 4.2 Render score display as `"{score} / {max_score}"` when either is non-null
- [ ] 5. AdviserAnnouncementManager enhancement (`client/src/pages/AdviserAnnouncementManager.jsx`)
  - [x] 5.1 Add "Subject Code (optional)" text input to create/edit form; include `subject_code` in create and update payloads
- [ ] 6. ClassScheduleManager component
  - [x] 6.1 Create `ClassScheduleManager` component (in `client/src/pages/ClassScheduleManager.jsx`) with form (subject_name, day_of_week select, start_time, end_time, room), list view grouped by day, delete per entry, required-field validation
  - [x] 6.2 Add "Schedule" nav tab to `EmployeePortal.jsx` sidebar and render `<ClassScheduleManager employee={employee} />` for `tab === 'schedule'`
- [ ] 7. ClassScheduleView component
  - [x] 7.1 Create `ClassScheduleView` component (inline in `StudentPortal.jsx` or separate file) that fetches schedules by adviser UUID, groups by day of week, shows empty state when no adviser or no schedules
  - [x] 7.2 Add "Schedule" nav tab to `StudentPortal.jsx` sidebar and render `<ClassScheduleView adviser={adviser} />` for `tab === 'schedule'`
- [ ] 8. SubjectDetailView component
  - [x] 8.1 Add `selectedSubject` state to `StudentPortal.jsx`; make subject cards in the My Subjects grid clickable (`onClick={() => setSelectedSubject(dep)}`)
  - [x] 8.2 Create inline `SubjectDetailView` component inside `StudentPortal.jsx` that renders: back button, grade/status from deployment, filtered announcements by `subject_code`, filtered activities by `subject_code`, empty states for each section
  - [x] 8.3 Render `SubjectDetailView` instead of the subject grid when `selectedSubject` is non-null
- [ ] 9. Dark mode — portal implementation
  - [x] 9.1 Add `darkMode` state to `EmployeePortal.jsx` initialized from `localStorage.getItem('adviser_dark_mode') === 'dark'`; apply `dark` class to `.sp-root` div; add Moon/Sun toggle button to topbar; persist to `localStorage` on toggle
  - [x] 9.2 Add `darkMode` state to `StudentPortal.jsx` initialized from `localStorage.getItem('student_dark_mode') === 'dark'`; apply `dark` class to `.sp-root` div; add Moon/Sun toggle button to topbar; persist to `localStorage` on toggle
- [-] 10. Dark mode — CSS
  - [x] 10.1 Add `.sp-root { --bg: ...; --surface: ...; --border: ...; --text: ...; --muted: ...; --orange-light: ...; }` override block in `index.css` to reset variables to light values, preventing `body.dark-mode` from affecting portal components
  - [x] 10.2 Add `.sp-root.dark { ... }` block in `index.css` with dark theme variable overrides (dark backgrounds, light text, preserved accent colors: `#3b82f6` for adviser, `#10b981` for student)
  - [x] 10.3 Add `.sp-root.dark` scoped rules for form inputs, selects, cards, tables, and other portal elements that need explicit dark styling
