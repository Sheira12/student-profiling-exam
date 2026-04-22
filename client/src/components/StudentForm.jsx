import { useState } from 'react'

const EMPTY_FORM = {
  student_id: '', first_name: '', last_name: '', email: '',
  phone: '', address: '', date_of_birth: '', gender: '',
  course: '', year_level: '', gpa: '',
  enrollment_status: 'enrolled',
  academic_awards: '', skills: '', non_academic_activities: '',
  affiliations: '', password: ''
}

const ARRAY_FIELDS = ['academic_awards', 'skills', 'non_academic_activities', 'affiliations']

// Parse violations array into structured suspensions: [{reason, days}]
function parseSuspensions(violations) {
  if (!Array.isArray(violations) || !violations.length) return []
  return violations.map(v => {
    const match = v.match(/^(.+)\s*\((\d+)\s*days?\)$/i)
    return match ? { reason: match[1].trim(), days: match[2] } : { reason: v, days: '' }
  })
}

export function formToPayload(form) {
  const payload = { ...form }
  ARRAY_FIELDS.forEach(f => {
    payload[f] = form[f] ? form[f].split(',').map(s => s.trim()).filter(Boolean) : []
  })
  payload.year_level = payload.year_level ? parseInt(payload.year_level) : null
  payload.gpa = payload.gpa !== '' && payload.gpa !== undefined ? parseFloat(payload.gpa) : null

  // If not enrolled, clear year_level so the student shows as not enrolled
  if (payload.enrollment_status === 'not_enrolled') {
    payload.year_level = null
  }
  // If enrolled but no year_level selected, default to 1
  if (payload.enrollment_status === 'enrolled' && !payload.year_level) {
    payload.year_level = 1
  }

  ;['email', 'phone', 'address', 'date_of_birth', 'gender', 'course'].forEach(f => {
    if (payload[f] === '') payload[f] = null
  })
  // Keep password as-is; if empty, don't overwrite
  if (!payload.password) delete payload.password
  delete payload.enrollment_status
  return payload
}

export function payloadToForm(student) {
  const form = { ...EMPTY_FORM, ...student }
  ARRAY_FIELDS.forEach(f => {
    form[f] = Array.isArray(student[f]) ? student[f].join(', ') : ''
  })
  // Derive enrollment status from year_level (source of truth)
  form.enrollment_status = student.year_level ? 'enrolled' : 'not_enrolled'
  form.password = student.password || ''
  return form
}

export default function StudentForm({ initialData, onSubmit, loading }) {
  const [form, setForm] = useState(initialData || EMPTY_FORM)
  const [suspensions, setSuspensions] = useState(() => parseSuspensions(initialData?.violations))

  const handle = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const addSuspension = () => setSuspensions(s => [...s, { reason: '', days: '' }])
  const removeSuspension = (i) => setSuspensions(s => s.filter((_, idx) => idx !== i))
  const updateSuspension = (i, field, val) =>
    setSuspensions(s => s.map((item, idx) => idx === i ? { ...item, [field]: val } : item))

  const submit = (e) => {
    e.preventDefault()
    const payload = formToPayload(form)
    payload.violations = suspensions
      .filter(s => s.reason.trim())
      .map(s => s.days ? `${s.reason.trim()} (${s.days} days)` : s.reason.trim())
    onSubmit(payload)
  }

  return (
    <form className="student-form" onSubmit={submit}>
      <fieldset>
        <legend>Personal Information</legend>
        <div className="form-grid">
          <div className="form-group">
            <label>Student ID *</label>
            <input name="student_id" value={form.student_id} onChange={handle} required />
          </div>
          <div className="form-group">
            <label>First Name *</label>
            <input name="first_name" value={form.first_name} onChange={handle} required />
          </div>
          <div className="form-group">
            <label>Last Name *</label>
            <input name="last_name" value={form.last_name} onChange={handle} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input name="email" type="email" value={form.email} onChange={handle} />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input name="phone" value={form.phone} onChange={handle} />
          </div>
          <div className="form-group">
            <label>Date of Birth</label>
            <input name="date_of_birth" type="date" value={form.date_of_birth} onChange={handle} />
          </div>
          <div className="form-group">
            <label>Gender</label>
            <select name="gender" value={form.gender} onChange={handle}>
              <option value="">Select</option>
              <option>Male</option>
              <option>Female</option>
              <option>Other</option>
            </select>
          </div>
          <div className="form-group full-width">
            <label>Address</label>
            <input name="address" value={form.address} onChange={handle} />
          </div>
          <div className="form-group">
            <label>Portal Password <small>(leave blank to keep current)</small></label>
            <input name="password" type="text" value={form.password} onChange={handle} placeholder="Set student login password" />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Academic History</legend>
        <div className="enrollment-toggle-wrap">
          <span className="enrollment-label">Enrollment Status</span>
          <div className="enrollment-toggle">
            <button
              type="button"
              className={`enroll-btn ${form.enrollment_status === 'enrolled' ? 'active-enrolled' : ''}`}
              onClick={() => setForm(p => ({ ...p, enrollment_status: 'enrolled' }))}
            >✓ Enrolled</button>
            <button
              type="button"
              className={`enroll-btn ${form.enrollment_status === 'not_enrolled' ? 'active-not-enrolled' : ''}`}
              onClick={() => setForm(p => ({ ...p, enrollment_status: 'not_enrolled' }))}
            >✕ Not Enrolled</button>
          </div>
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label>Course / Program</label>
            <select name="course" value={form.course} onChange={handle}>
              <option value="">Select Course</option>
              <option value="Bachelor of Science in Information Technology">Bachelor of Science in Information Technology</option>
              <option value="Bachelor of Science in Computer Science">Bachelor of Science in Computer Science</option>
              <option value="Bachelor of Science in Information System">Bachelor of Science in Information System</option>
            </select>
          </div>
          <div className="form-group">
            <label>Year Level</label>
            <select name="year_level" value={form.year_level} onChange={handle}>
              <option value="">Select</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>
          <div className="form-group">
            <label>GPA</label>
            <input name="gpa" type="number" step="0.01" min="0" max="4" value={form.gpa} onChange={handle} />
          </div>
          <div className="form-group full-width">
            <label>Academic Awards <small>(comma-separated)</small></label>
            <input name="academic_awards" value={form.academic_awards} onChange={handle} placeholder="Dean's List, Cum Laude" />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Activities, Skills & Affiliations</legend>
        <div className="form-grid">
          <div className="form-group full-width">
            <label>Skills <small>(comma-separated)</small></label>
            <input name="skills" value={form.skills} onChange={handle} placeholder="Programming, Basketball, Leadership" />
          </div>
          <div className="form-group full-width">
            <label>Non-Academic Activities <small>(comma-separated)</small></label>
            <input name="non_academic_activities" value={form.non_academic_activities} onChange={handle} placeholder="Volleyball, Chess Club, Debate" />
          </div>
          <div className="form-group full-width">
            <label>Affiliations <small>(comma-separated)</small></label>
            <input name="affiliations" value={form.affiliations} onChange={handle} placeholder="ROTC, Student Council, IEEE" />
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend>Disciplinary Records</legend>
        <div className="suspension-list">
          {suspensions.map((s, i) => (
            <div key={i} className="suspension-row">
              <select
                className="suspension-input"
                value={s.reason}
                onChange={e => updateSuspension(i, 'reason', e.target.value)}
              >
                <option value="">Select Sanction Type</option>
                <option value="Academic Dishonesty">Academic Dishonesty</option>
                <option value="Plagiarism">Plagiarism</option>
                <option value="Cheating in Examination">Cheating in Examination</option>
                <option value="Violation of Code of Conduct">Violation of Code of Conduct</option>
                <option value="Disruptive Behavior">Disruptive Behavior</option>
                <option value="Attendance Violation">Attendance Violation</option>
                <option value="Substance Abuse">Substance Abuse</option>
                <option value="Harassment">Harassment</option>
                <option value="Vandalism">Vandalism</option>
                <option value="Unauthorized Access">Unauthorized Access</option>
                <option value="Fighting/Physical Altercation">Fighting/Physical Altercation</option>
                <option value="Dress Code Violation">Dress Code Violation</option>
                <option value="Late Submission of Requirements">Late Submission of Requirements</option>
                <option value="Other">Other</option>
              </select>
              <select
                className="suspension-input suspension-days"
                value={s.days}
                onChange={e => updateSuspension(i, 'days', e.target.value)}
              >
                <option value="">Select Duration</option>
                <option value="1">1 Day</option>
                <option value="3">3 Days</option>
                <option value="5">5 Days</option>
                <option value="7">1 Week</option>
                <option value="14">2 Weeks</option>
                <option value="30">1 Month</option>
                <option value="60">2 Months</option>
                <option value="90">1 Semester</option>
                <option value="180">1 Academic Year</option>
                <option value="365">Indefinite</option>
              </select>
              <button type="button" className="suspension-remove" onClick={() => removeSuspension(i)}>✕</button>
            </div>
          ))}
          <button type="button" className="suspension-add" onClick={addSuspension}>+ Add Disciplinary Record</button>
        </div>
      </fieldset>

      <div className="form-actions">
        <button type="submit" className="btn-save" disabled={loading}>
          {loading ? 'Saving...' : 'Save Student'}
        </button>
        <button type="button" className="btn-cancel" onClick={() => window.history.back()}>
          Cancel
        </button>
      </div>
    </form>
  )
}
