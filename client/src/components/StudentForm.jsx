import { useState } from 'react'

const EMPTY_FORM = {
  student_id: '', first_name: '', last_name: '', email: '',
  phone: '', address: '', date_of_birth: '', gender: '',
  course: '', year_level: '', gpa: '',
  enrollment_status: 'enrolled',
  academic_awards: '', skills: '', non_academic_activities: '',
  violations: '', affiliations: ''
}

// Convert array fields to/from comma-separated strings
const ARRAY_FIELDS = ['academic_awards', 'skills', 'non_academic_activities', 'violations', 'affiliations']

export function formToPayload(form) {
  const payload = { ...form }
  ARRAY_FIELDS.forEach(f => {
    payload[f] = form[f] ? form[f].split(',').map(s => s.trim()).filter(Boolean) : []
  })
  if (payload.year_level) payload.year_level = parseInt(payload.year_level)
  if (payload.gpa) payload.gpa = parseFloat(payload.gpa)
  // enrollment_status is UI-only — if not enrolled, clear year_level
  if (payload.enrollment_status === 'not_enrolled') payload.year_level = null
  delete payload.enrollment_status
  return payload
}

export function payloadToForm(student) {
  const form = { ...EMPTY_FORM, ...student }
  ARRAY_FIELDS.forEach(f => {
    form[f] = Array.isArray(student[f]) ? student[f].join(', ') : ''
  })
  // derive enrollment_status from year_level if not set
  if (!form.enrollment_status) {
    form.enrollment_status = student.year_level ? 'enrolled' : 'not_enrolled'
  }
  return form
}

export default function StudentForm({ initialData, onSubmit, loading }) {
  const [form, setForm] = useState(initialData || EMPTY_FORM)

  const handle = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const submit = (e) => {
    e.preventDefault()
    onSubmit(formToPayload(form))
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
        </div>
      </fieldset>

      <fieldset>
        <legend>Academic History</legend>

        {/* Enrollment Status Toggle */}
        <div className="enrollment-toggle-wrap">
          <span className="enrollment-label">Enrollment Status</span>
          <div className="enrollment-toggle">
            <button
              type="button"
              className={`enroll-btn ${form.enrollment_status === 'enrolled' ? 'active-enrolled' : ''}`}
              onClick={() => setForm(p => ({ ...p, enrollment_status: 'enrolled' }))}
            >
              ✓ Enrolled
            </button>
            <button
              type="button"
              className={`enroll-btn ${form.enrollment_status === 'not_enrolled' ? 'active-not-enrolled' : ''}`}
              onClick={() => setForm(p => ({ ...p, enrollment_status: 'not_enrolled' }))}
            >
              ✕ Not Enrolled
            </button>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label>Course / Program</label>
            <input name="course" value={form.course} onChange={handle} />
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
        <legend>Violations</legend>
        <div className="form-group">
          <label>Violations <small>(comma-separated)</small></label>
          <input name="violations" value={form.violations} onChange={handle} placeholder="Late submission, Absences" />
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
