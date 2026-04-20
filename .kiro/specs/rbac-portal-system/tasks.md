# Implementation Plan: RBAC Portal System

## Overview

Migrate the existing toggle-based single-page login into a proper multi-route RBAC application using React Router v6. Implement adviser activity/announcement/grade management and student activities/grades views. Add the two new Supabase tables and all new API functions.

## Tasks

- [x] 1. SQL migration — create `activities` and `student_activities` tables
  - Create `supabase_rbac_activities.sql` with the full DDL from the design: `activities` table, `student_activities` table, RLS policies, and all four indexes
  - Include `IF NOT EXISTS` guards so the script is safe to re-run
  - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5_

- [x] 2. New API functions in `client/src/api/rbac.js`
  - [x] 2.1 Add `isStudentAssignedToAdviser(adviserId, studentId)` helper
    - Query `adviser_assignments` where `employee_id = adviserId AND student_id = studentId`
    - Return boolean; used as a guard before any write that touches a student record
    - _Requirements: 8.3, 7.5, 15.4_

  - [x] 2.2 Add `getActivitiesByAdviser(adviserId)`
    - Select from `activities` where `adviser_id = adviserId AND status = 'active'`
    - Join `student_activities` to include completion counts per activity
    - _Requirements: 7.8, 15.3_

  - [x] 2.3 Add `createActivity(payload, studentIds, adviserId, actorName)`
    - Validate all `studentIds` are assigned to `adviserId` via `isStudentAssignedToAdviser`; throw auth error on any mismatch
    - Insert into `activities`; bulk-insert one `student_activities` row per student with `status = 'pending'`
    - Log to `activity_logs`
    - _Requirements: 7.3, 7.4, 7.5_

  - [x] 2.4 Add `updateActivity(id, payload, actorName)` and `archiveActivity(id, actorName)`
    - `updateActivity`: update `title`, `description`, `due_date`, `type`; refresh `updated_at`
    - `archiveActivity`: set `status = 'archived'`; log action
    - _Requirements: 7.6, 7.7_

  - [x] 2.5 Add `updateStudentActivityStatus(id, { status, submission_note }, actorName)`
    - Update `student_activities` record; refresh `updated_at`
    - _Requirements: 7.6_

  - [x] 2.6 Add `getStudentActivities(studentId)`
    - Select from `student_activities` where `student_id = studentId`; join `activities` for `title`, `description`, `type`, `due_date`
    - _Requirements: 11.1, 14.2_

  - [x] 2.7 Add `getAdviserAnnouncements(adviserId)`
    - Select from `announcements` where `author_id = adviserId OR author_type = 'admin'`; order by `created_at` desc
    - _Requirements: 6.2, 15.3_

  - [x] 2.8 Add `getStudentAnnouncements(studentId, adviserId)`
    - Select active announcements where `target IN ('all','students') AND (author_type = 'admin' OR author_id = adviserId)`
    - _Requirements: 10.1, 10.2, 10.3, 14.3_

  - [ ]* 2.9 Write property tests for new API scope filters (Properties 6, 9, 12, 15, 18)
    - **Property 6: Adviser Announcement Scope Filter** — for any mixed announcement set, `getAdviserAnnouncements` returns only own + admin
    - **Property 9: Activity Student Scope Enforcement** — non-assigned student UUID causes `createActivity` to throw
    - **Property 12: Student Activity Scope Filter** — `getStudentActivities` returns only records matching the given student UUID
    - **Property 15: Student Grade Scope Filter** — `getCurriculumDeployments` returns only records matching the given student UUID
    - **Property 18: Student Announcement Scope Filter** — `getStudentAnnouncements` returns only admin + assigned adviser announcements
    - **Validates: Requirements 6.2, 7.5, 11.1, 12.1, 10.3**

- [x] 3. Rewrite `ProtectedRoute` and add `useAuth` hook
  - [x] 3.1 Create `client/src/hooks/useAuth.js`
    - Read/write `ccs_role`, `ccs_student`, `ccs_employee` from `sessionStorage`
    - Export `{ role, studentData, employeeData, setAdmin, setEmployee, setStudent, logout }`
    - Handle corrupted JSON in sessionStorage by clearing all keys and returning `role = null`
    - _Requirements: 5.5_

  - [x] 3.2 Rewrite `client/src/components/ProtectedRoute.jsx`
    - Accept `allowedRoles[]` and `redirectTo` props
    - Read `ccs_role` from sessionStorage on every render (no prop drilling)
    - Cross-role redirect map: admin → `/admin/dashboard`, employee → `/adviser/portal`, student → `/student/portal`
    - If no session → redirect to `redirectTo` (the role's login page)
    - _Requirements: 1.5, 1.6, 1.7, 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 3.3 Write property tests for `ProtectedRoute` (Properties 1, 2)
    - **Property 1: Route Guard Cross-Role Redirect** — for any protected path + wrong role, redirects to own home
    - **Property 2: Unauthenticated Route Rejection** — for any protected path with no session, redirects to login
    - **Validates: Requirements 1.5, 1.6, 1.7, 5.1, 5.2, 5.3, 5.4**

- [x] 4. Rewrite `App.jsx` with React Router route tree
  - Replace role-state conditional render with the full `<Routes>` tree from the design
  - Add `AdminLoginGuard`, `AdviserLoginGuard`, `StudentLoginGuard` inline wrappers: if matching role already in session → redirect to portal; else render login form
  - Wire `useAuth` hook for login/logout handlers
  - Admin logout → navigate to `/admin`; adviser logout → `/adviser`; student logout → `/student`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.8_

- [x] 5. Update login pages to standalone routes
  - [x] 5.1 Update `Login.jsx` (`/admin`)
    - Remove toggle buttons ("Are you a student?" / "Are you an adviser?") and the `onSwitchToStudent` / `onSwitchToEmployee` props
    - On successful login call `useAuth.setAdmin()` then `navigate('/admin/dashboard')`
    - _Requirements: 2.1, 2.2, 2.3_

  - [x] 5.2 Update `EmployeeLogin.jsx` (`/adviser`)
    - Remove "Back to Login" button and `onBack` prop
    - On successful login call `useAuth.setEmployee(data)` then `navigate('/adviser/portal')`
    - Log login event to `activity_logs` (actor_type `employee`, actor_id = employee UUID)
    - _Requirements: 3.1, 3.2, 3.3, 3.4_

  - [x] 5.3 Update `StudentLogin.jsx` (`/student`)
    - Remove "Back to Admin Login" button and `onBackToAdmin` prop
    - On successful login call `useAuth.setStudent(data)` then `navigate('/student/portal')`
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 6. Update `Sidebar.jsx` NavLink paths
  - Change all `to` values from short paths to `/admin/*` prefixed paths:
    - `/dashboard` → `/admin/dashboard`
    - `/users` → `/admin/students`
    - `/reports` → `/admin/reports`
    - `/reports-query` → `/admin/reports-query`
    - `/add` → `/admin/add`
    - `/subjects` → `/admin/subjects`
    - `/advisers` → `/admin/advisers`
    - `/progress` → `/admin/progress`
    - `/announcements` → `/admin/announcements`
    - `/logs` → `/admin/logs`
  - _Requirements: 1.1, 16.1_

- [ ] 7. Checkpoint — verify routing works end-to-end
  - Ensure all tests pass, ask the user if questions arise.
  - Confirm `/admin` shows admin login, `/adviser` shows adviser login, `/student` shows student login
  - Confirm visiting `/advisers` while logged in as admin reaches `AdviserManagement` (not a login page)
  - Confirm cross-role redirect: logged-in student visiting `/admin/dashboard` → redirected to `/student/portal`

- [x] 8. New component: `AdviserAnnouncementManager`
  - Create `client/src/pages/AdviserAnnouncementManager.jsx`
  - Props: `{ employee }`
  - On mount: call `getAdviserAnnouncements(employee.id)` to load announcements
  - Display list; show Create/Edit/Delete controls only for announcements where `author_id === employee.id`
  - Create form: title, content, priority (`normal`/`important`/`urgent`); hardcode `target = 'students'`, `author_type = 'employee'`, `author_id = employee.id`
  - On delete of own announcement: call `deleteAnnouncement(id)`; show error toast if `author_id !== employee.id`
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [ ]* 8.1 Write property test for announcement authorship invariant (Property 5)
    - **Property 5: Adviser Announcement Authorship Invariant** — any announcement created via the component has `author_type='employee'`, `author_id=employee.id`, `target='students'`
    - **Validates: Requirements 6.1**

  - [ ]* 8.2 Write property test for announcement ownership enforcement (Property 7)
    - **Property 7: Announcement Ownership Enforcement** — edit/delete controls are not rendered for announcements where `author_id !== employee.id`
    - **Validates: Requirements 6.4**

- [x] 9. New component: `ActivityManager`
  - Create `client/src/pages/ActivityManager.jsx`
  - Props: `{ employee, assignedStudents }`
  - On mount: call `getActivitiesByAdviser(employee.id)`
  - Display activities grouped by `type` (`assignment`, `event`, `task`) with due date and per-student completion count
  - Create form: title, description, type, due_date, multi-select of assigned students
  - On create: call `createActivity(payload, selectedStudentIds, employee.id, actorName)`; handle auth error if a student is not assigned
  - Archive button: call `archiveActivity(id)`; archived activities disappear from the active list
  - Student status column: call `updateStudentActivityStatus` to mark `submitted` or `done`
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

  - [ ]* 9.1 Write property test for activity creation scope (Property 8)
    - **Property 8: Activity Creation Scope** — for any N targeted students, exactly N `student_activities` records are created with `status='pending'`
    - **Validates: Requirements 7.3, 7.4**

- [x] 10. New component: `GradeEditor`
  - Create `client/src/pages/GradeEditor.jsx`
  - Props: `{ employee, assignedStudents, deployments, onRefresh }`
  - Render a table of deployments for a selected student; each row has status dropdown and grade input
  - Before calling `updateCurriculumDeployment`, verify `deployment.student_id` is in `assignedStudents`; throw and show error toast if not
  - Accept numeric grades `1.0`–`5.0` and text values `INC`, `DROPPED`
  - On successful save: call `onRefresh()` to reload deployments in parent
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

  - [ ]* 10.1 Write property test for grade update authorization (Property 11)
    - **Property 11: Grade Update Authorization** — for any deployment where `student_id` is not in `assignedStudents`, the save action is rejected and no API call is made
    - **Validates: Requirements 8.3, 15.4**

  - [ ]* 10.2 Write property test for grade dual-write consistency (Property 10)
    - **Property 10: Grade Update Dual-Write Consistency** — for any grade update, both `curriculum_deployments.grade` and `students.academic_progress[subject_code]` reflect the same value
    - **Validates: Requirements 8.2**

- [x] 11. Wire new components into `EmployeePortal`
  - Add `AdviserAnnouncementManager` as a new "Manage Announcements" tab (replace the read-only announcements tab)
  - Add `ActivityManager` as a new "Activities" tab; pass `employee` and `students` (the loaded assignments array)
  - Replace the inline grade edit rows in the "My Students" tab with `GradeEditor`; pass `onRefresh={loadAll}`
  - Update `loadAll` to also call `getActivitiesByAdviser` and `getAdviserAnnouncements` instead of the generic `getAnnouncements`
  - _Requirements: 6.1–6.7, 7.1–7.8, 8.1–8.6, 9.1–9.5_

- [x] 12. New component: `StudentActivitiesView`
  - Create `client/src/pages/StudentActivitiesView.jsx`
  - Props: `{ student }`
  - On mount: call `getStudentActivities(student.id)`
  - Sort: overdue-pending items first (where `due_date < now && status === 'pending'`), then ascending `due_date`
  - Show overdue badge/highlight for overdue-pending items
  - Display: activity title, description, type badge, due date, current status
  - Read-only — no status update controls for the student
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ]* 12.1 Write property test for overdue detection (Property 13)
    - **Property 13: Overdue Activity Detection** — for any activity record, `isOverdue` is `true` iff `due_date < now && status === 'pending'`
    - **Validates: Requirements 11.3**

  - [ ]* 12.2 Write property test for activity sort order (Property 14)
    - **Property 14: Activity Sort Order** — for any activity list, sort produces overdue-pending first, then ascending `due_date`
    - **Validates: Requirements 11.5**

- [x] 13. New component: `StudentGradesView`
  - Create `client/src/pages/StudentGradesView.jsx`
  - Props: `{ student }`
  - On mount: call `getCurriculumDeployments(student.id)`
  - Render a read-only table: subject code, description, units, semester, year level, grade (dash if null/empty), status badge
  - No input or edit controls rendered anywhere in this component
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 14. Wire new components into `StudentPortal`
  - Add "Activities" tab using `StudentActivitiesView`; pass `student`
  - Add "Grades" tab using `StudentGradesView`; pass `student`
  - Update `loadPortalData` to call `getStudentAnnouncements(student.id, adviser?.employees?.id)` instead of `getAnnouncements('students')` — requires adviser UUID from `getAssignmentByStudent` result
  - Update the overview tab to show pending activity count from `student_activities` where `status = 'pending'`
  - _Requirements: 10.1–10.5, 11.1–11.5, 12.1–12.5, 13.5_

  - [ ]* 14.1 Write property test for degree completion calculation (Property 16)
    - **Property 16: Degree Completion Calculation** — for any `academic_progress` object, completion % = (passed units / total units) × 100 rounded to nearest integer
    - **Validates: Requirements 13.2**

  - [ ]* 14.2 Write property test for dashboard summary count consistency (Property 17)
    - **Property 17: Dashboard Summary Count Consistency** — for any `academic_progress` object, passed/enrolled/failed counts match actual status distribution
    - **Validates: Requirements 13.3**

- [x] 15. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
  - Verify: `/advisers` route loads `AdviserManagement` (not a login page) when logged in as admin
  - Verify: student portal "Announcements" tab shows only admin + assigned adviser announcements
  - Verify: adviser portal "Activities" tab rejects targeting a student not in the assigned list

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- The `safe()` wrapper pattern is already established in the codebase — use it for all new portal data loads
- The `isStudentAssignedToAdviser` helper must be called before every write that touches student data from the adviser portal
- Property tests use `fast-check` (add as dev dependency: `npm install -D fast-check` in `client/`)
- The SQL migration file (`supabase_rbac_activities.sql`) must be run in Supabase before testing activity/student-activity features
