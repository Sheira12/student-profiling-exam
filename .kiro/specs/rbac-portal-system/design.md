# Design Document — RBAC Portal System

## Overview

This design extends the existing CCS Student Profiling System (React 19 + Supabase + Vite) from a single-page, toggle-based login into a proper multi-route RBAC application. The current `App.jsx` uses a `role` state variable and conditional rendering to switch between portals; this design replaces that with React Router v6 nested routes, dedicated login pages per role, and a rewritten `ProtectedRoute` that enforces role boundaries on every navigation.

Two new Supabase tables (`activities`, `student_activities`) are introduced. Three new React components are added to the Adviser portal (`AdviserAnnouncementManager`, `ActivityManager`, `GradeEditor`) and two to the Student portal (`StudentActivitiesView`, `StudentGradesView`). All new API functions are added to the existing `client/src/api/rbac.js` file.

The design preserves all existing UI styling (`.sp-*`, `.emp-*`, `.lp-*` CSS classes) and does not require any new npm packages beyond what is already installed.

---

## Architecture

### Current vs. Target Structure

```
CURRENT                              TARGET
──────────────────────────────────   ──────────────────────────────────────────
App.jsx                              main.jsx → BrowserRouter
  role state (admin/student/employee)  App.jsx (auth context + route tree)
  conditional render                     /admin          → AdminLogin
  <StudentPortal>                        /admin/*        → AdminLayout (Sidebar+TopBar)
  <EmployeePortal>                         /admin/dashboard
  <AdminLayout>                            /admin/students, /admin/...
                                       /adviser        → AdviserLogin
                                       /adviser/portal → AdviserPortal (nested tabs)
                                       /student        → StudentLogin
                                       /student/portal → StudentPortal (nested tabs)
                                       /               → redirect → /admin
```

### Auth State Management

Session state stays in `sessionStorage` (existing keys: `ccs_role`, `ccs_student`, `ccs_employee`). A lightweight `useAuth` hook reads and writes these keys and is consumed by `App.jsx` and `ProtectedRoute`. No external auth library is needed.

```
sessionStorage
  ccs_role      → "admin" | "employee" | "student"
  ccs_student   → JSON student record
  ccs_employee  → JSON employee record
```

### Route Guard Logic

`ProtectedRoute` is rewritten to accept `allowedRoles[]` and a `redirectTo` string. It reads `ccs_role` from sessionStorage on every render (React Router re-renders on every navigation), so it evaluates on every route change.

```
ProtectedRoute({ allowedRoles, redirectTo, children })
  role = sessionStorage.getItem('ccs_role')
  if role not in allowedRoles → <Navigate to={redirectTo} replace />
  else → children
```

Cross-role redirect targets:
- Admin visiting `/adviser/*` or `/student/*` → `/admin/dashboard`
- Adviser visiting `/admin/*` or `/student/*` → `/adviser/portal`
- Student visiting `/admin/*` or `/adviser/*` → `/student/portal`
- No session visiting any protected route → role-appropriate login page

---

## Components and Interfaces

### Route Tree (App.jsx)

```jsx
<Routes>
  {/* Root redirect */}
  <Route path="/" element={<Navigate to="/admin" replace />} />

  {/* Admin */}
  <Route path="/admin" element={<AdminLoginGuard />} />
  <Route path="/admin/*" element={
    <ProtectedRoute allowedRoles={['admin']} redirectTo="/admin">
      <AdminLayout />
    </ProtectedRoute>
  }>
    <Route index element={<Navigate to="dashboard" replace />} />
    <Route path="dashboard"    element={<Dashboard />} />
    <Route path="students"     element={<StudentInformation />} />
    <Route path="students/:id" element={<StudentProfile />} />
    <Route path="add"          element={<AddStudent />} />
    <Route path="edit/:id"     element={<EditStudent />} />
    <Route path="reports"      element={<QueryStudents />} />
    <Route path="reports-query" element={<ReportsQuery />} />
    <Route path="subjects"     element={<SubjectManagement />} />
    <Route path="advisers"     element={<AdviserManagement />} />
    <Route path="logs"         element={<ActivityLogs />} />
    <Route path="announcements" element={<Announcements />} />
    <Route path="progress"     element={<AcademicTrackerPicker />} />
    <Route path="progress/:id" element={<AcademicProgress />} />
  </Route>

  {/* Adviser */}
  <Route path="/adviser" element={<AdviserLoginGuard />} />
  <Route path="/adviser/portal" element={
    <ProtectedRoute allowedRoles={['employee']} redirectTo="/adviser">
      <EmployeePortal />
    </ProtectedRoute>
  } />

  {/* Student */}
  <Route path="/student" element={<StudentLoginGuard />} />
  <Route path="/student/portal" element={
    <ProtectedRoute allowedRoles={['student']} redirectTo="/student">
      <StudentPortal />
    </ProtectedRoute>
  } />

  {/* Catch-all */}
  <Route path="*" element={<Navigate to="/" replace />} />
</Routes>
```

`AdminLoginGuard`, `AdviserLoginGuard`, `StudentLoginGuard` are thin wrappers: if the matching role is already in session, they redirect to the portal; otherwise they render the login form.

### New Components

#### `AdviserAnnouncementManager`
- Location: `client/src/pages/AdviserAnnouncementManager.jsx`
- Props: `{ employee }` (the logged-in adviser record)
- Renders inside the Adviser portal as a tab
- Fetches announcements filtered to `author_id = employee.id OR author_type = 'admin'`
- Create/edit/delete only for announcements where `author_id === employee.id`
- Uses existing `createAnnouncement`, `updateAnnouncement`, `deleteAnnouncement` from `rbac.js`

#### `ActivityManager`
- Location: `client/src/pages/ActivityManager.jsx`
- Props: `{ employee, assignedStudents }`
- Renders inside the Adviser portal as a tab
- CRUD for `activities` table (scoped to `adviser_id = employee.id`)
- Manages `student_activities` records for targeted students
- Displays activities grouped by type with completion counts

#### `GradeEditor`
- Location: `client/src/pages/GradeEditor.jsx`
- Props: `{ employee, assignedStudents, deployments, onRefresh }`
- Renders inside the Adviser portal's "My Students" tab (replaces inline edit)
- Validates that the deployment's `student_id` is in `assignedStudents` before calling update
- Accepts numeric grades `1.0`–`5.0` and text values `INC`, `DROPPED`

#### `StudentActivitiesView`
- Location: `client/src/pages/StudentActivitiesView.jsx`
- Props: `{ student }`
- Renders inside the Student portal as a tab
- Fetches `student_activities` joined with `activities` filtered by `student_id = student.id`
- Sorts: overdue pending items first, then ascending `due_date`
- Visual overdue indicator when `due_date < now && status === 'pending'`

#### `StudentGradesView`
- Location: `client/src/pages/StudentGradesView.jsx`
- Props: `{ student }`
- Renders inside the Student portal as a tab (replaces/supplements existing "My Subjects" tab)
- Fetches `curriculum_deployments` filtered by `student_id = student.id`
- Read-only — no edit controls rendered
- Displays dash (`—`) when grade is null/empty

### Modified Components

| Component | Change |
|---|---|
| `App.jsx` | Replace role-state conditional render with React Router route tree; add `useAuth` hook |
| `ProtectedRoute.jsx` | Rewrite to support `allowedRoles[]` and cross-role redirects |
| `Login.jsx` | Remove toggle buttons; becomes standalone page at `/admin` |
| `StudentLogin.jsx` | Remove "Back to Admin" button; becomes standalone page at `/student` |
| `EmployeeLogin.jsx` | Remove "Back" button; becomes standalone page at `/adviser` |
| `EmployeePortal.jsx` | Add "Announcements (Manage)" tab using `AdviserAnnouncementManager`; add "Activities" tab using `ActivityManager`; replace inline grade edit with `GradeEditor` |
| `StudentPortal.jsx` | Add "Activities" tab using `StudentActivitiesView`; add "Grades" tab using `StudentGradesView`; update "Skills & Activities" tab label |
| `Sidebar.jsx` | Update `NavLink` paths from `/dashboard` → `/admin/dashboard`, etc. |

---

## Data Models

### Existing Tables (unchanged schema)

| Table | Key columns used |
|---|---|
| `students` | `id`, `student_id`, `last_name`, `academic_progress` (jsonb) |
| `employees` | `id`, `employee_id`, `password_hash` |
| `adviser_assignments` | `employee_id`, `student_id` |
| `curriculum_deployments` | `student_id`, `subject_code`, `grade`, `status`, `adviser_id` |
| `announcements` | `author_type`, `author_id`, `target`, `is_active` |
| `activity_logs` | `actor_type`, `actor_id`, `action`, `entity_type` |
| `notifications` | `recipient_type`, `recipient_id` |

### New Table: `activities`

```sql
CREATE TABLE IF NOT EXISTS activities (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  title       text        NOT NULL,
  description text,
  type        text        NOT NULL CHECK (type IN ('assignment', 'event', 'task')),
  due_date    timestamptz,
  adviser_id  uuid        NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  status      text        DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all activities" ON activities
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_activities_adviser ON activities(adviser_id);
CREATE INDEX IF NOT EXISTS idx_activities_status  ON activities(status);
```

### New Table: `student_activities`

```sql
CREATE TABLE IF NOT EXISTS student_activities (
  id               uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_id      uuid        NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  student_id       uuid        NOT NULL REFERENCES students(id)  ON DELETE CASCADE,
  status           text        DEFAULT 'pending'
                               CHECK (status IN ('pending', 'submitted', 'done')),
  submission_note  text,
  updated_at       timestamptz DEFAULT now(),
  UNIQUE(activity_id, student_id)
);

ALTER TABLE student_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all student_activities" ON student_activities
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_student_activities_student  ON student_activities(student_id);
CREATE INDEX IF NOT EXISTS idx_student_activities_activity ON student_activities(activity_id);
```

### `announcements` table — adviser scope

No schema change. The existing `author_id` and `author_type` columns are used to scope adviser announcements. The adviser portal filters on `author_id = employee.id OR author_type = 'admin'`.

---

## Data Flow Diagrams

### Admin Data Flow

```
Browser /admin/dashboard
  └─ AdminLayout (Sidebar + TopBar)
       └─ Dashboard, StudentInformation, etc.
            └─ supabase-students.js / rbac.js
                 └─ Supabase (all tables, no scope filter)
```

### Adviser Data Flow

```
Browser /adviser/portal
  └─ ProtectedRoute (role=employee)
       └─ EmployeePortal (employee record from sessionStorage)
            ├─ getAssignmentsByEmployee(employee.id)
            │    └─ adviser_assignments WHERE employee_id = ?
            │         └─ students (joined)
            ├─ getCurriculumDeploymentsByEmployee(employee.id)
            │    └─ curriculum_deployments WHERE student_id IN (assigned students)
            ├─ getActivitiesByAdviser(employee.id)
            │    └─ activities WHERE adviser_id = ?
            │         └─ student_activities (joined, counts)
            ├─ getAdviserAnnouncements(employee.id)
            │    └─ announcements WHERE author_id = ? OR author_type = 'admin'
            └─ getNotifications('employee', employee.id)
```

### Student Data Flow

```
Browser /student/portal
  └─ ProtectedRoute (role=student)
       └─ StudentPortal (student record from sessionStorage)
            ├─ getCurriculumDeployments(student.id)
            │    └─ curriculum_deployments WHERE student_id = ?
            ├─ getStudentActivities(student.id)
            │    └─ student_activities WHERE student_id = ?
            │         └─ activities (joined for title/type/due_date)
            ├─ getStudentAnnouncements(student.id, adviserUUID)
            │    └─ announcements WHERE is_active=true
            │         AND target IN ('all','students')
            │         AND (author_type='admin' OR author_id=adviserUUID)
            ├─ getAssignmentByStudent(student.id)
            │    └─ adviser_assignments WHERE student_id = ?
            │         └─ employees (joined)
            └─ getNotifications('student', student.id)
```

---

## New API Functions (`client/src/api/rbac.js`)

### Activities

```js
// Fetch all active activities for an adviser
export const getActivitiesByAdviser = async (adviserId) => { ... }

// Fetch a single activity with its student_activities records
export const getActivityWithStudents = async (activityId) => { ... }

// Create an activity and insert student_activities for targeted students
// Validates all studentIds are in adviser's assigned list
export const createActivity = async (payload, studentIds, adviserId, actorName) => { ... }

// Update activity fields (title, description, due_date, type)
export const updateActivity = async (id, payload, actorName) => { ... }

// Archive an activity (status → 'archived')
export const archiveActivity = async (id, actorName) => { ... }

// Update a student_activities record status
export const updateStudentActivityStatus = async (id, { status, submission_note }, actorName) => { ... }
```

### Student Activities (student-scoped)

```js
// Fetch student_activities joined with activities for a student
export const getStudentActivities = async (studentId) => { ... }
```

### Announcements (adviser-scoped)

```js
// Fetch announcements visible to an adviser (own + admin's)
export const getAdviserAnnouncements = async (adviserId) => { ... }

// Fetch announcements visible to a student (admin + assigned adviser)
export const getStudentAnnouncements = async (studentId, adviserId) => { ... }
```

### Scope Validation Helper

```js
// Returns true if studentId is in adviser's assigned list
// Used by createActivity and updateCurriculumDeployment before writes
const isStudentAssignedToAdviser = async (adviserId, studentId) => { ... }
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Route Guard Cross-Role Redirect

*For any* protected route path and any authenticated session with role R, if that route does not belong to role R's allowed set, the Route_Guard should redirect to role R's home route — regardless of which specific protected path was requested.

**Validates: Requirements 1.5, 1.6, 1.7, 5.2, 5.3, 5.4**

### Property 2: Unauthenticated Route Rejection

*For any* protected route path, a browser with no valid session (no `ccs_role` in sessionStorage) should be redirected to the login page corresponding to that route's role, never rendering the protected content.

**Validates: Requirements 5.1**

### Property 3: Session Round-Trip Fidelity

*For any* valid employee or student record, successfully logging in should result in sessionStorage containing a JSON representation of that exact record — no fields dropped, no fields added.

**Validates: Requirements 3.3, 4.3**

### Property 4: Invalid Credential Rejection

*For any* (identifier, secret) pair that does not match a record in the corresponding database table, the login attempt should fail and display the role-appropriate error message, never granting portal access.

**Validates: Requirements 2.2, 3.2, 4.2**

### Property 5: Adviser Announcement Authorship Invariant

*For any* announcement created through the Adviser portal, the stored record should have `author_type = 'employee'`, `author_id` equal to the creating adviser's UUID, and `target = 'students'`.

**Validates: Requirements 6.1**

### Property 6: Adviser Announcement Scope Filter

*For any* collection of announcements in the database with mixed authors, the set returned by `getAdviserAnnouncements(adviserId)` should contain only announcements where `author_id = adviserId` OR `author_type = 'admin'` — no announcements from other advisers should appear.

**Validates: Requirements 6.2, 15.3**

### Property 7: Announcement Ownership Enforcement

*For any* announcement where `author_id` does not equal the current adviser's UUID, an edit or delete attempt by that adviser should be rejected and the record should remain unchanged.

**Validates: Requirements 6.4**

### Property 8: Activity Creation Scope

*For any* activity created by an adviser targeting N students, exactly N `student_activities` records should be created, each with `status = 'pending'` and `activity_id` matching the new activity's id.

**Validates: Requirements 7.3, 7.4**

### Property 9: Activity Student Scope Enforcement

*For any* student UUID that is not present in `adviser_assignments` for the current adviser, attempting to create a `student_activities` record targeting that student should be rejected and no record should be inserted.

**Validates: Requirements 7.5, 15.1**

### Property 10: Grade Update Dual-Write Consistency

*For any* grade update on a `curriculum_deployments` record, the corresponding entry in `students.academic_progress` (keyed by `subject_code`) should reflect the same grade value after the update completes.

**Validates: Requirements 8.2**

### Property 11: Grade Update Authorization

*For any* `curriculum_deployments` record where `student_id` is not in the updating adviser's assigned student list, the grade update should be rejected and the record's `grade` and `updated_at` fields should remain unchanged.

**Validates: Requirements 8.3, 15.4**

### Property 12: Student Activity Scope Filter

*For any* student UUID, the result of `getStudentActivities(studentId)` should contain only records where `student_id` equals that UUID — no records belonging to other students should appear.

**Validates: Requirements 11.1, 11.4, 14.2**

### Property 13: Overdue Activity Detection

*For any* `student_activities` record where `due_date` is before the current timestamp and `status = 'pending'`, the `isOverdue` computed flag should be `true`; for all other records it should be `false`.

**Validates: Requirements 11.3**

### Property 14: Activity Sort Order

*For any* collection of student activities, the sort function should produce a list where all overdue-pending items appear before non-overdue items, and within each group items are ordered by `due_date` ascending.

**Validates: Requirements 11.5**

### Property 15: Student Grade Scope Filter

*For any* student UUID, the result of `getCurriculumDeployments(studentId)` should contain only records where `student_id` equals that UUID — no records belonging to other students should appear.

**Validates: Requirements 12.1, 12.4, 14.1**

### Property 16: Degree Completion Calculation

*For any* student's `academic_progress` object and the fixed curriculum definition, the computed completion percentage should equal `(sum of units for subjects with status PASSED / total curriculum units) × 100`, rounded to the nearest integer.

**Validates: Requirements 13.2**

### Property 17: Dashboard Summary Count Consistency

*For any* student's `academic_progress` object, the computed summary counts (passed, enrolled, failed) should each equal the exact count of subjects in the curriculum whose status matches that category in the progress object.

**Validates: Requirements 13.3**

### Property 18: Student Announcement Scope Filter

*For any* student with an assigned adviser UUID, the result of `getStudentAnnouncements(studentId, adviserUUID)` should contain only announcements where `(author_type = 'admin' OR author_id = adviserUUID) AND target IN ('all', 'students') AND is_active = true` — no announcements from other advisers should appear.

**Validates: Requirements 10.3, 14.3**

---

## Error Handling

### Login Errors

| Scenario | Behavior |
|---|---|
| Admin wrong credentials | Display "Invalid username or password." — no redirect |
| Adviser wrong credentials | Display "Invalid Employee ID or password." — no redirect |
| Student wrong credentials | Display "Student ID or Last Name is incorrect." — no redirect |
| Supabase connection error | Display "Connection error: [message]" — no redirect |

### Route Guard Errors

| Scenario | Behavior |
|---|---|
| No session, protected route | Redirect to role-appropriate login |
| Wrong role, protected route | Redirect to own portal home |
| Session corrupted/invalid JSON | Clear sessionStorage, redirect to `/admin` |

### API Errors

| Scenario | Behavior |
|---|---|
| Grade update on non-assigned student | Throw authorization error; caller shows toast |
| Activity targeting non-assigned student | Throw authorization error; no DB write |
| Announcement edit/delete by non-author | UI disables controls; API call not made |
| Supabase RLS violation | Catch error, show toast, log to console |
| Missing `activities` / `student_activities` tables | `safe()` wrapper returns `{ data: [] }` — portal degrades gracefully |

All portal data loads use the existing `safe()` pattern:
```js
const safe = (fn) => fn.catch(() => ({ data: null }))
```
This ensures a missing table or network error does not crash the portal.

---

## Testing Strategy

### Unit Tests

Focus on pure functions and component rendering with mock data:

- `ProtectedRoute` — render with each role/route combination, assert correct redirect or render
- `isOverdue(activity)` — test with past/future/null due dates and various statuses
- `sortActivities(activities)` — test sort order with mixed overdue/non-overdue items
- `computeCompletion(progress, curriculum)` — test percentage calculation with various progress states
- `computeSummaryCounts(progress, curriculum)` — test count accuracy
- `isStudentAssignedToAdviser(adviserId, studentId)` — mock Supabase, test true/false cases
- Grade display in `StudentGradesView` — assert dash rendered when grade is null

### Property-Based Tests

Use [fast-check](https://github.com/dubzzz/fast-check) (add as dev dependency). Each property test runs a minimum of 100 iterations.

**Tag format: `Feature: rbac-portal-system, Property {N}: {property_text}`**

| Property | Test Description | Generator |
|---|---|---|
| P1: Route Guard Cross-Role Redirect | For any protected path + role, wrong-role session redirects to own home | `fc.constantFrom(...adminPaths, ...adviserPaths, ...studentPaths)` × `fc.constantFrom('admin','employee','student')` |
| P2: Unauthenticated Route Rejection | For any protected path, no session → login redirect | `fc.constantFrom(...allProtectedPaths)` |
| P3: Session Round-Trip Fidelity | For any employee/student record, login stores exact record | `fc.record({ id: fc.uuid(), employee_id: fc.string(), ... })` |
| P4: Invalid Credential Rejection | For any non-matching credential pair, login fails | `fc.tuple(fc.string(), fc.string()).filter(([u,p]) => !(u==='admin'&&p==='admin123'))` |
| P5: Adviser Announcement Authorship | For any announcement payload, stored record has correct author fields | `fc.record({ title: fc.string(), content: fc.string(), priority: fc.constantFrom(...) })` |
| P6: Adviser Announcement Scope Filter | For any mixed announcement set, filter returns only own + admin | `fc.array(fc.record({ author_id: fc.uuid(), author_type: fc.string() }))` |
| P7: Announcement Ownership Enforcement | For any announcement with different author_id, edit/delete rejected | `fc.record({ author_id: fc.uuid() }).filter(a => a.author_id !== currentAdviserUUID)` |
| P8: Activity Creation Scope | For any N targeted students, exactly N student_activities created | `fc.array(fc.uuid(), { minLength: 1, maxLength: 20 })` |
| P9: Activity Student Scope Enforcement | For any non-assigned student UUID, insertion rejected | `fc.uuid().filter(id => !assignedIds.includes(id))` |
| P10: Grade Dual-Write Consistency | For any grade update, both tables reflect same value | `fc.record({ grade: fc.oneof(fc.float({min:1,max:5}), fc.constantFrom('INC','DROPPED')) })` |
| P11: Grade Update Authorization | For any non-assigned deployment, update rejected | `fc.uuid().filter(id => !assignedStudentIds.includes(id))` |
| P12: Student Activity Scope Filter | For any student UUID, fetch returns only own records | `fc.uuid()` |
| P13: Overdue Activity Detection | For any activity, isOverdue matches due_date < now && pending | `fc.record({ due_date: fc.date(), status: fc.constantFrom('pending','submitted','done') })` |
| P14: Activity Sort Order | For any activity list, sort produces overdue-first then asc due_date | `fc.array(fc.record({ due_date: fc.date(), status: fc.constantFrom(...) }))` |
| P15: Student Grade Scope Filter | For any student UUID, fetch returns only own records | `fc.uuid()` |
| P16: Degree Completion Calculation | For any progress object, percentage = passed_units/total_units×100 | `fc.dictionary(fc.string(), fc.constantFrom('PASSED','FAILED','ENROLLED',''))` |
| P17: Dashboard Summary Count Consistency | For any progress object, counts match actual status distribution | Same generator as P16 |
| P18: Student Announcement Scope Filter | For any mixed announcement set, filter returns only admin + own adviser | `fc.array(fc.record({ author_id: fc.uuid(), author_type: fc.string(), target: fc.string(), is_active: fc.boolean() }))` |

### Integration Tests

Run against a Supabase test project (or local Supabase CLI):

- Admin login flow end-to-end: submit credentials → session set → audit log entry exists
- Adviser login flow end-to-end: submit credentials → session set → audit log entry exists
- Grade update end-to-end: update grade → verify `curriculum_deployments` and `students.academic_progress` both updated → verify notification created
- Activity creation end-to-end: create activity with 2 students → verify 2 `student_activities` records with `status=pending`
- Unauthorized grade update: adviser attempts update on non-assigned student → verify rejection and no DB change

### Smoke Tests

- `activities` table exists with correct columns and RLS enabled
- `student_activities` table exists with correct columns, UNIQUE constraint, and RLS enabled
- Admin credentials (`admin` / `admin123`) are not present in any client-side JS bundle (checked via `grep` on build output)
