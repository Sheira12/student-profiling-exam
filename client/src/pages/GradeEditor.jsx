import { useState, useEffect } from 'react'
import { Save, X, BookOpen, Users, ChevronDown } from 'lucide-react'
import { updateCurriculumDeployment, getDeploymentsByAdviserSubject } from '../api/rbac'

const STATUS_CFG = {
  Enrolled:  { bg: '#dbeafe', color: '#1d4ed8' },
  Ongoing:   { bg: '#fef3c7', color: '#92400e' },
  Passed:    { bg: '#dcfce7', color: '#166534' },
  Failed:    { bg: '#fee2e2', color: '#991b1b' },
  INC:       { bg: '#f3e8ff', color: '#7c3aed' },
  Dropped:   { bg: '#f3f4f6', color: '#6b7280' },
  Pending:   { bg: '#fff7ed', color: '#c2410c' },
}

function computeFinal(prelim, midterm, finals) {
  const p = parseFloat(prelim), m = parseFloat(midterm), f = parseFloat(finals)
  if (isNaN(p) && isNaN(m) && isNaN(f)) return ''
  const vals = [p, m, f].filter(v => !isNaN(v))
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)
}

export default function GradeEditor({ employee, assignedStudents, deployments: legacyDeps, onRefresh }) {
  const [subjectDeps, setSubjectDeps] = useState([]) // all deps where adviser_id = employee.id
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ status: '', grade: '', remarks: '', prelim_grade: '', midterm_grade: '', finals_grade: '' })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [expandedSubject, setExpandedSubject] = useState(null)
  const [viewMode, setViewMode] = useState('subject') // 'subject' | 'student'
  const [selectedStudentId, setSelectedStudentId] = useState('')

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await getDeploymentsByAdviserSubject(employee.id)
      setSubjectDeps(data || [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => { load() }, [employee.id])

  const startEdit = (dep) => {
    setEditingId(dep.id)
    setEditForm({
      status: dep.status || 'Enrolled',
      grade: dep.grade || '',
      remarks: dep.remarks || '',
      prelim_grade: dep.prelim_grade ?? '',
      midterm_grade: dep.midterm_grade ?? '',
      finals_grade: dep.finals_grade ?? '',
    })
  }

  const handleSave = async (dep) => {
    setSaving(true)
    try {
      const autoGrade = computeFinal(editForm.prelim_grade, editForm.midterm_grade, editForm.finals_grade)
      const finalGrade = editForm.grade || autoGrade || ''
      await updateCurriculumDeployment(dep.id, {
        ...editForm,
        grade: finalGrade,
        prelim_grade:  editForm.prelim_grade  !== '' ? parseFloat(editForm.prelim_grade)  : null,
        midterm_grade: editForm.midterm_grade !== '' ? parseFloat(editForm.midterm_grade) : null,
        finals_grade:  editForm.finals_grade  !== '' ? parseFloat(editForm.finals_grade)  : null,
      }, `${employee.first_name} ${employee.last_name}`)
      setEditingId(null)
      showToast('Grades saved.')
      load()
      onRefresh?.()
    } catch (err) { showToast(err.message, 'error') }
    setSaving(false)
  }

  // Group by subject_code
  const bySubject = {}
  subjectDeps.forEach(d => {
    if (!bySubject[d.subject_code]) bySubject[d.subject_code] = { code: d.subject_code, desc: d.subject_desc, semester: d.semester, year_level: d.year_level, students: [] }
    bySubject[d.subject_code].students.push(d)
  })

  // For student view — unique students from subjectDeps
  const uniqueStudents = []
  const seenIds = new Set()
  subjectDeps.forEach(d => {
    if (d.students && !seenIds.has(d.student_id)) {
      seenIds.add(d.student_id)
      uniqueStudents.push({ id: d.student_id, ...d.students })
    }
  })

  const studentDeps = subjectDeps.filter(d => d.student_id === selectedStudentId)

  const GradeRow = ({ dep }) => {
    const cfg = STATUS_CFG[dep.status] || {}
    const isEditing = editingId === dep.id
    const autoFinal = computeFinal(
      isEditing ? editForm.prelim_grade : dep.prelim_grade,
      isEditing ? editForm.midterm_grade : dep.midterm_grade,
      isEditing ? editForm.finals_grade : dep.finals_grade
    )
    return (
      <tr>
        {viewMode === 'subject' && (
          <td>
            <div className="rq-student-cell">
              <div className="rq-avatar" style={{ width: 28, height: 28, fontSize: '0.65rem' }}>
                {dep.students?.first_name?.[0]}{dep.students?.last_name?.[0]}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{dep.students?.first_name} {dep.students?.last_name}</div>
                <div className="rq-student-id">{dep.students?.student_id}</div>
              </div>
            </div>
          </td>
        )}
        {viewMode === 'student' && (
          <td><span className="rq-student-id">{dep.subject_code}</span><div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{dep.subject_desc}</div></td>
        )}
        <td style={{ background: '#fffbeb' }}>
          {isEditing
            ? <input className="rq-filter-input" type="number" step="0.01" min="0" max="5" style={{ width: 65 }} value={editForm.prelim_grade} onChange={e => setEditForm(f => ({ ...f, prelim_grade: e.target.value }))} />
            : <span style={{ fontWeight: dep.prelim_grade ? 600 : 400, color: dep.prelim_grade ? '#92400e' : 'var(--muted)' }}>{dep.prelim_grade ?? '—'}</span>}
        </td>
        <td style={{ background: '#eff6ff' }}>
          {isEditing
            ? <input className="rq-filter-input" type="number" step="0.01" min="0" max="5" style={{ width: 65 }} value={editForm.midterm_grade} onChange={e => setEditForm(f => ({ ...f, midterm_grade: e.target.value }))} />
            : <span style={{ fontWeight: dep.midterm_grade ? 600 : 400, color: dep.midterm_grade ? '#1d4ed8' : 'var(--muted)' }}>{dep.midterm_grade ?? '—'}</span>}
        </td>
        <td style={{ background: '#f0fdf4' }}>
          {isEditing
            ? <input className="rq-filter-input" type="number" step="0.01" min="0" max="5" style={{ width: 65 }} value={editForm.finals_grade} onChange={e => setEditForm(f => ({ ...f, finals_grade: e.target.value }))} />
            : <span style={{ fontWeight: dep.finals_grade ? 600 : 400, color: dep.finals_grade ? '#065f46' : 'var(--muted)' }}>{dep.finals_grade ?? '—'}</span>}
        </td>
        <td>
          {isEditing
            ? <div><input className="rq-filter-input" style={{ width: 65 }} placeholder={autoFinal || '—'} value={editForm.grade} onChange={e => setEditForm(f => ({ ...f, grade: e.target.value }))} />{autoFinal && !editForm.grade && <div style={{ fontSize: '0.62rem', color: 'var(--muted)' }}>Auto: {autoFinal}</div>}</div>
            : <span style={{ fontWeight: dep.grade ? 700 : 400 }}>{dep.grade || (autoFinal ? `~${autoFinal}` : '—')}</span>}
        </td>
        <td>
          {isEditing
            ? <select className="rq-filter-input" style={{ width: 100 }} value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                {Object.keys(STATUS_CFG).map(s => <option key={s}>{s}</option>)}
              </select>
            : <span className="emp-status-badge" style={{ background: cfg.bg, color: cfg.color }}>{dep.status}</span>}
        </td>
        <td>
          {isEditing
            ? <input className="rq-filter-input" style={{ width: 90 }} placeholder="Remarks" value={editForm.remarks} onChange={e => setEditForm(f => ({ ...f, remarks: e.target.value }))} />
            : <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{dep.remarks || '—'}</span>}
        </td>
        <td>
          {isEditing
            ? <div style={{ display: 'flex', gap: 4 }}>
                <button className="rq-btn-run" style={{ padding: '4px 10px' }} onClick={() => handleSave(dep)} disabled={saving}><Save size={12} /></button>
                <button className="rq-btn-clear" style={{ padding: '4px 8px' }} onClick={() => setEditingId(null)}><X size={12} /></button>
              </div>
            : <button className="rq-view-btn" onClick={() => startEdit(dep)} title="Edit">✏️</button>}
        </td>
      </tr>
    )
  }

  return (
    <div className="sp-section">
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      <div className="sp-section-header">
        <BookOpen size={18} />
        <h2>Grade Editor</h2>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button className={`emp-tab-btn ${viewMode === 'subject' ? 'active' : ''}`} style={{ padding: '5px 12px', fontSize: '0.78rem' }} onClick={() => setViewMode('subject')}>
            <BookOpen size={13} /> By Subject
          </button>
          <button className={`emp-tab-btn ${viewMode === 'student' ? 'active' : ''}`} style={{ padding: '5px 12px', fontSize: '0.78rem' }} onClick={() => setViewMode('student')}>
            <Users size={13} /> By Student
          </button>
          <button className="rq-btn-clear" style={{ padding: '5px 10px', fontSize: '0.78rem' }} onClick={load}>↻</button>
        </div>
      </div>

      {loading && <div className="si-loading"><div className="spinner" /> Loading…</div>}

      {!loading && subjectDeps.length === 0 && (
        <div className="rq-empty">
          <div className="rq-empty-icon"><BookOpen size={36} /></div>
          <h3>No subjects assigned to you</h3>
          <p>Ask admin to assign you as teacher for subjects via Advisers → Subject Advisers tab.</p>
        </div>
      )}

      {/* ── BY SUBJECT VIEW ── */}
      {!loading && viewMode === 'subject' && Object.values(bySubject).map(subj => {
        const isOpen = expandedSubject === subj.code
        const passedCount = subj.students.filter(d => d.status === 'Passed').length
        return (
          <div key={subj.code} className="emp-student-card" style={{ marginBottom: 10 }}>
            <div className="emp-student-card-head" onClick={() => setExpandedSubject(isOpen ? null : subj.code)}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span className="rq-student-id">{subj.code}</span>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{subj.desc}</span>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--muted)', marginTop: 2 }}>{subj.semester} · Year {subj.year_level}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span className="rq-pill year">{subj.students.length} students</span>
                <span className="rq-pill gpa">{passedCount} passed</span>
              </div>
              <ChevronDown size={16} style={{ color: 'var(--muted)', transform: isOpen ? 'rotate(180deg)' : '', transition: 'transform 0.2s', marginLeft: 8 }} />
            </div>
            {isOpen && (
              <div className="emp-student-card-body" style={{ overflowX: 'auto' }}>
                <table className="rq-table" style={{ minWidth: 700 }}>
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th style={{ background: '#fffbeb', color: '#92400e' }}>Prelim</th>
                      <th style={{ background: '#eff6ff', color: '#1d4ed8' }}>Midterm</th>
                      <th style={{ background: '#f0fdf4', color: '#065f46' }}>Finals</th>
                      <th>Final</th><th>Status</th><th>Remarks</th><th></th>
                    </tr>
                  </thead>
                  <tbody>{subj.students.map(dep => <GradeRow key={dep.id} dep={dep} />)}</tbody>
                </table>
              </div>
            )}
          </div>
        )
      })}

      {/* ── BY STUDENT VIEW ── */}
      {!loading && viewMode === 'student' && (
        <>
          <div className="emp-form-card">
            <div className="emp-form-head"><Users size={16} /><span>Select Student</span></div>
            <div style={{ padding: 14 }}>
              {uniqueStudents.length === 0
                ? <p className="sp-empty">No students in your subjects yet.</p>
                : <select className="rq-filter-input" value={selectedStudentId} onChange={e => { setSelectedStudentId(e.target.value); setEditingId(null) }}>
                    <option value="">Select a student…</option>
                    {uniqueStudents.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.student_id})</option>)}
                  </select>}
            </div>
          </div>
          {selectedStudentId && (
            studentDeps.length === 0
              ? <div className="rq-empty"><div className="rq-empty-icon"><BookOpen size={36} /></div><h3>No subjects for this student</h3></div>
              : <div style={{ overflowX: 'auto' }}>
                  <table className="rq-table" style={{ minWidth: 700 }}>
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th style={{ background: '#fffbeb', color: '#92400e' }}>Prelim</th>
                        <th style={{ background: '#eff6ff', color: '#1d4ed8' }}>Midterm</th>
                        <th style={{ background: '#f0fdf4', color: '#065f46' }}>Finals</th>
                        <th>Final</th><th>Status</th><th>Remarks</th><th></th>
                      </tr>
                    </thead>
                    <tbody>{studentDeps.map(dep => <GradeRow key={dep.id} dep={dep} />)}</tbody>
                  </table>
                </div>
          )}
        </>
      )}
    </div>
  )
}
