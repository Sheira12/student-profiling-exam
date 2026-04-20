# Design Document: Portal Enhancements

## Overview

Six targeted enhancements to the Adviser Portal (`EmployeePortal.jsx`) and Student Portal (`StudentPortal.jsx`):

1. **File/link attachments** on activities — `file_url` column on `activities`
2. **Class schedule** — new `class_schedules` table, new adviser and student components
3. **Subject-based navigation** — inline `SubjectDetailView` in `StudentPortal`, `subject_code` columns on `activities` and `announcements`
4. **Activity scoring** — `max_score` on `activities`, `score` on `student_activities`, new activity types
5. **Portal dark mode** — scoped to `.sp-root.dark`, independent per portal, persisted in `localStorage`
6. **Dark mode bug fix** — `.sp-root` override resets CSS variables to light values when `body.dark-mode` is active but portal dark mode is not

All changes are additive (ALTER TABLE / new table / new components). No existing tables are dropped or renamed.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  EmployeePortal.jsx                                     │
│  ├── ActivityManager.jsx  (enhanced: file_url, scoring, │
│  │                          subject_code, new types)    │
│  ├── AdviserAnnouncementManager.jsx (+ subject_code)    │
│  └── ClassScheduleManager.jsx  (NEW)                   │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│  StudentPortal.jsx                                      │
│  ├── StudentActivitiesView.jsx (enhanced: file_url,     │
│  │                               score display)         │
│  ├── SubjectDetailView  (NEW inline component)          │
│  └── ClassScheduleView  (NEW inline component)          │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│  client/src/api/rbac.js  (new API functions)            │
└─────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────┐
│  Supabase (PostgreSQL)                                  │
│  ├── activities  (+ file_url, subject_code, max_score)  │
│  ├── student_activities  (+ score)                      │
│  ├── announcements  (+ subject_code)                    │
│  └── class_schedules  (NEW)                             │
└─────────────────────────────────────────────────────────┘
```

Dark mode is purely CSS + React state — no backend involvement.

---

## Components and Interfaces

### 1. ActivityManager.jsx (enhanced)

New form fields added to the existing creation form:
- `Attachment URL (optional)` — text input, validated as `http://` or `https://` prefix
- `Subject Code (optional)` — text input, populates `subject_code`
- `Max Score (optional)` — number input, populates `max_score`

New activity types added to the type selector: `laboratory`, `exam`, `quiz`.

Student status update row gains a `Score` number input. If `score > max_score`, a non-blocking inline warning is shown (does not prevent save).

`createActivity` payload gains `file_url`, `subject_code`, `max_score`.
`updateStudentActivityStatus` payload gains `score`.

### 2. StudentActivitiesView.jsx (enhanced)

Each activity card gains:
- Attachment link: `<a href={act.file_url} target="_blank" rel="noopener noreferrer">` — only rendered when `file_url` is non-null
- Score display: `{sa.score} / {act.max_score}` — rendered when either is non-null

`getStudentActivities` query updated to also select `file_url`, `subject_code`, `max_score` from `activities`.

### 3. ClassScheduleManager (new, inline in EmployeePortal)

Rendered when `tab === 'schedule'` inside `EmployeePortal.jsx`. No separate file needed — defined as a named function component in the same file or a small separate file.

Props: `{ employee }`

State: `schedules[]`, `showForm`, `form`, `saving`, `toast`

Form fields: `subject_name` (required), `day_of_week` (select: Mon–Sun, required), `start_time` (time input, required), `end_time` (time input, required), `room` (optional text).

API calls: `getClassSchedules(adviserId)`, `createClassSchedule(payload)`, `deleteClassSchedule(id)`.

Display: list of schedule entries, grouped by day of week. Delete button per entry.

### 4. ClassScheduleView (new, inline in StudentPortal)

Rendered when `tab === 'schedule'` inside `StudentPortal.jsx`.

Props: `{ adviser }` (the existing `adviser` state from `loadPortalData`)

Fetches `getClassSchedules(adviser.employees.id)` on mount. Groups results by `day_of_week` and renders in day order (Mon → Sun). Shows empty state when adviser is null or no schedules exist.

### 5. SubjectDetailView (new, inline in StudentPortal)

Rendered inside the `tab === 'subjects'` block when `selectedSubject` state is non-null.

Props: `{ student, deployment, onBack }`

Sections:
- Grade/status from `deployment` (already in local state)
- Announcements: filtered from existing `announcements` state by `subject_code === deployment.subject_code`
- Activities: filtered from a local fetch of `getStudentActivities(student.id)` by `activities.subject_code === deployment.subject_code`

Back button sets `selectedSubject` to `null`.

Subject cards in the grid become clickable (`onClick={() => setSelectedSubject(dep)}`).

### 6. AdviserAnnouncementManager.jsx (enhanced)

Form gains `Subject Code (optional)` text input. Passed in the `createAnnouncement` / `updateAnnouncement` payload as `subject_code`.

### 7. Dark Mode (EmployeePortal + StudentPortal)

Each portal manages its own `darkMode` boolean state, initialized from `localStorage` on mount.

```js
// EmployeePortal
const [darkMode, setDarkMode] = useState(() => localStorage.getItem('adviser_dark_mode') === 'dark')
const toggleDark = () => setDarkMode(d => {
  const next = !d
  localStorage.setItem('adviser_dark_mode', next ? 'dark' : 'light')
  return next
})

// StudentPortal
const [darkMode, setDarkMode] = useState(() => localStorage.getItem('student_dark_mode') === 'dark')
```

The portal root `<div>` receives `className={`sp-root${darkMode ? ' dark' : ''}`}`.

Toggle button (Moon/Sun icon) placed in the topbar right section.

CSS dark theme is scoped to `.sp-root.dark { ... }` — no `body` class changes.

### 8. Dark Mode Bug Fix (index.css)

The existing `body.dark-mode` rule sets `--orange-light: #1e293b` which is used as a background in portal components while text remains light-colored, making text invisible.

Fix: add a `.sp-root` override block that resets all CSS variables to their light-theme values, preventing `body.dark-mode` from affecting portal components when portal dark mode is not active:

```css
/* Prevent admin dark mode from breaking portal light theme */
.sp-root {
  --bg: #f4f5f7;
  --surface: #ffffff;
  --border: #e8e8e8;
  --text: #1a1a1a;
  --muted: #6b7280;
  --orange-light: #fff4ec;
}
```

When `.sp-root.dark` is active, these are overridden again with dark values.

---

## Data Models

### SQL Migration (new file: `supabase_portal_enhancements.sql`)

```sql
-- 1. activities: add file_url, subject_code, max_score
ALTER TABLE activities
  ADD COLUMN IF NOT EXISTS file_url     text,
  ADD COLUMN IF NOT EXISTS subject_code text,
  ADD COLUMN IF NOT EXISTS max_score    numeric;

-- Update CHECK constraint to include new types
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_type_check;
ALTER TABLE activities ADD CONSTRAINT activities_type_check
  CHECK (type IN ('assignment', 'event', 'task', 'laboratory', 'exam', 'quiz'));

-- 2. student_activities: add score
ALTER TABLE student_activities
  ADD COLUMN IF NOT EXISTS score numeric;

-- 3. announcements: add subject_code
ALTER TABLE announcements
  ADD COLUMN IF NOT EXISTS subject_code text;

-- 4. class_schedules: new table
CREATE TABLE IF NOT EXISTS class_schedules (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  adviser_id   uuid        NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  subject_name text        NOT NULL,
  day_of_week  text        NOT NULL CHECK (day_of_week IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')),
  start_time   time        NOT NULL,
  end_time     time        NOT NULL,
  room         text,
  created_at   timestamptz DEFAULT now()
);

ALTER TABLE class_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all class_schedules" ON class_schedules
  FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_class_schedules_adviser ON class_schedules(adviser_id);
```

### API additions to `rbac.js`

```js
// Class schedules
export const getClassSchedules = async (adviserId) => { ... }
export const createClassSchedule = async (payload, actorName) => { ... }
export const deleteClassSchedule = async (id, actorName) => { ... }
```

`getStudentActivities` query updated to select `file_url`, `subject_code`, `max_score` from the joined `activities` row.

`updateStudentActivityStatus` updated to accept and persist `score`.

`createActivity` updated to pass `file_url`, `subject_code`, `max_score` in the insert payload.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: URL validation rejects non-HTTP strings

*For any* string that does not begin with `http://` or `https://`, submitting the activity creation form with that string as the attachment URL SHALL be rejected with an inline error and the form SHALL NOT call `createActivity`.

**Validates: Requirements 1.4**

### Property 2: Valid URL is stored and rendered as a link

*For any* valid URL string (beginning with `http://` or `https://`), after an activity is created with that URL, the student's activity card SHALL render an anchor element whose `href` equals that URL.

**Validates: Requirements 1.2, 1.5**

### Property 3: Subject code filtering shows only matching records

*For any* selected subject code and any list of announcements or activities, the Subject_Detail_View SHALL display only those records whose `subject_code` column equals the selected code.

**Validates: Requirements 3.3, 3.4**

### Property 4: Score display format

*For any* student activity with a non-null `score` and non-null `max_score`, the rendered activity card SHALL contain the string `"{score} / {max_score}"`.

**Validates: Requirements 4.6, 4.7**

### Property 5: Score-exceeds-max warning

*For any* numeric score value strictly greater than the activity's `max_score`, the Activity_Manager SHALL display an inline warning message in the student status update row.

**Validates: Requirements 4.5**

### Property 6: Dark mode class toggle

*For any* portal (adviser or student), toggling dark mode SHALL add the `dark` CSS class to the `.sp-root` element, and toggling it again SHALL remove it.

**Validates: Requirements 5.3, 5.4**

### Property 7: Dark mode localStorage persistence

*For any* dark mode state set in a portal, reading the corresponding `localStorage` key immediately after SHALL return the matching value (`"dark"` or `"light"`).

**Validates: Requirements 5.5, 5.6**

### Property 8: Schedule entries grouped by day

*For any* list of class schedule entries belonging to an adviser, the ClassScheduleView SHALL group and display them such that all entries with the same `day_of_week` appear together under that day's heading.

**Validates: Requirements 2.8**

### Property 9: Required field validation blocks schedule submission

*For any* schedule entry form submission where at least one required field (`subject_name`, `day_of_week`, `start_time`, `end_time`) is empty, the form SHALL display an inline validation error and SHALL NOT call `createClassSchedule`.

**Validates: Requirements 2.5**

---

## Error Handling

| Scenario | Handling |
|---|---|
| `file_url` fails URL prefix check | Inline error below input, form submit blocked |
| Schedule form missing required field | Inline error per field, submit blocked |
| `score > max_score` | Non-blocking inline warning, save still allowed |
| Supabase insert/update error | Toast notification with error message (existing pattern) |
| Student has no adviser (schedule tab) | Empty state: "No schedule available — no adviser assigned" |
| No schedules for adviser | Empty state in ClassScheduleManager |
| No announcements/activities for subject | Empty state per section in SubjectDetailView |
| `getClassSchedules` network error | Caught, empty array used, no crash |

---

## Testing Strategy

### Unit / Example Tests

- ActivityManager renders "Attachment URL" input field
- ActivityManager renders new type options (laboratory, exam, quiz)
- ActivityManager renders "Max Score" input
- Submitting with empty `file_url` calls `createActivity` with `file_url: null`
- StudentActivitiesView renders no attachment link when `file_url` is null
- SubjectDetailView renders back button
- SubjectDetailView renders grade/status from deployment
- EmployeePortal renders "Schedule" nav tab
- StudentPortal renders "Schedule" nav tab
- Dark mode toggle button renders in topbar (moon/sun icon)
- Portal reads `localStorage` on mount and applies dark class

### Property-Based Tests

Using [fast-check](https://github.com/dubzzz/fast-check) (JavaScript). Each test runs minimum 100 iterations.

- **Feature: portal-enhancements, Property 1**: Generate arbitrary strings not starting with `http://`/`https://`, verify form rejects them
- **Feature: portal-enhancements, Property 2**: Generate valid URLs, verify round-trip storage → render produces matching `href`
- **Feature: portal-enhancements, Property 3**: Generate arbitrary subject codes and mixed announcement/activity arrays, verify filter returns only matching records
- **Feature: portal-enhancements, Property 4**: Generate arbitrary numeric score/max_score pairs, verify rendered string format
- **Feature: portal-enhancements, Property 5**: Generate score > max_score pairs, verify warning is shown
- **Feature: portal-enhancements, Property 6**: Simulate toggle sequence, verify class presence/absence on `.sp-root`
- **Feature: portal-enhancements, Property 7**: Generate dark/light states, verify localStorage read-back matches
- **Feature: portal-enhancements, Property 8**: Generate arbitrary schedule entry arrays with random days, verify grouping correctness
- **Feature: portal-enhancements, Property 9**: Generate forms with one or more required fields empty, verify submission is blocked
