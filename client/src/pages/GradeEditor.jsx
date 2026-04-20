import { useState } from 'react'
import { Save, X, BookOpen, Download } from 'lucide-react'
import { updateCurriculumDeployment } from '../api/rbac'

const STATUS_CFG = {
  Enrolled:  { bg: '#dbeafe', color: '#1d4ed8' },
  Ongoing:   { bg: '#fef3c7', color: '#92400e' },
  Passed:    { bg: '#dcfce7', color: '#166534' },
  Failed:    { bg: '#fee2e2', color: '#991b1b' },
  INC:       { bg: '#f3e8ff', color: '#7c3aed' },
  Dropped:   { bg: '#f3f4f6', color: '#6b7280' },
  Pending:   { bg: '#fff7ed', color: '#c2410c' },
}

// Compute final grade from prelim/midterm/finals (40/30/30 weight or simple average)
function computeFinal(prelim, midterm, finals) {
  const p = parseFloat(prelim), m = parseFloat(midterm), f = parseFloat(finals)
  if (isNaN(p) && isNaN(m) && isNaN(f)) return ''
  const vals = [p, m, f].filter(v => !isNaN(v))
  return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)
}

export default function GradeEditor({ employee, assignedStudents, deployments, onRefresh }) {
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ status: '', grade: '', remarks: '', prelim_grade: '', midterm_grade: '', finals_grade: '' })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [selectedStudentId, setSelectedStudentId] = useState('')

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  const assignedIds = assignedStudents.map(a => a.student_id)

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
    if (!assignedIds.includes(dep.student_id)) {
      showToast('Unauthorized: this student is not assigned to you.', 'error'); return
    }
    setSaving(true)
    try {
      // Auto-compute final grade if all three are filled
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
      onRefresh()
    } catch (err) { showToast(err.message, 'error') }
    setSaving(false)
  }

  const studentDeps = deployments.filter(d => d.student_id === selectedStudentId)
  const selectedStudent = assignedStudents.find(a => a.student_id === selectedStudentId)

  // Export grades as CSV for selected student
  const exportCSV = () => {
    if (!studentDeps.length) return
    const s = selectedStudent?.students
    const rows = [
      ['Code','Subject','Units','Semester','Prelim','Midterm','Finals','Final Grade','Status','Remarks'],
      ...studentDeps.map(d => [
        d.subject_code, `"${d.subject_desc}"`, d.units, `"${d.semester}"`,
        d.prelim_grade ?? '', d.midterm_grade ?? '', d.finals_grade ?? '',
        d.grade ?? '', d.status ?? '', `"${d.remarks ?? ''}"`
      ])
    ].map(r => r.join(',')).join('\n')
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([rows], { type: 'text/csv' }))
    a.download = `grades_${s?.student_id || 'student'}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  return (
    <div className="sp-section">
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      <div className="sp-section-header">
        <BookOpen size={18} />
        <h2>Grade Editor</h2>
        {selectedStudentId && studentDeps.length > 0 && (
          <button className="rq-btn-export" style={{ marginLeft: 'auto', padding: '6px 14px', fontSize: '0.8rem' }} onClick={exportCSV}>
            <Download size={13} /> Export CSV
          </button>
        )}
      </div>

      {/* Student selector */}
      <div className="emp-form-card">
        <div className="emp-form-head"><BookOpen size={16} /><span>Select Student</span></div>
        <div style={{ padding: 16 }}>
          {assignedStudents.length === 0 ? (
            <div style={{ padding: '16px 0', textAlign: 'center', color: 'var(--muted)', fontSize: '0.875rem' }}>
              <BookOpen size={32} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.4 }} />
              <strong style={{ display: 'block', marginBottom: 4, color: 'var(--text)' }}>No students assigned yet</strong>
              Ask your admin to assign students to you via the <em>Advisers → Assignments</em> page.
            </div>
          ) : (
            <select className="rq-filter-input" value={selectedStudentId} onChange={e => { setSelectedStudentId(e.target.value); setEditingId(null) }}>
              <option value="">Select a student to edit grades…</option>
              {assignedStudents.map(a => {
                const s = a.students
                const depCount = deployments.filter(d => d.student_id === a.student_id).length
                return <option key={a.student_id} value={a.student_id}>{s?.first_name} {s?.last_name} ({s?.student_id}) — {depCount} subjects</option>
              })}
            </select>
          )}
        </div>
      </div>

      {selectedStudentId && (
        studentDeps.length === 0
          ? <div className="rq-empty"><div className="rq-empty-icon"><BookOpen size={36} /></div><h3>No subjects deployed</h3><p>Deploy subjects to this student first.</p></div>
          : (
            <div className="rq-section">
              <div className="rq-table-wrap">
                <table className="rq-table">
                  <thead>
                    <tr>
                      <th>Code</th><th>Subject</th><th>Units</th>
                      <th style={{ background: '#fef3c7', color: '#92400e' }}>Prelim</th>
                      <th style={{ background: '#dbeafe', color: '#1d4ed8' }}>Midterm</th>
                      <th style={{ background: '#d1fae5', color: '#065f46' }}>Finals</th>
                      <th>Final Grade</th><th>Status</th><th>Remarks</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentDeps.map(dep => {
                      const cfg = STATUS_CFG[dep.status] || {}
                      const isEditing = editingId === dep.id
                      const autoFinal = computeFinal(
                        isEditing ? editForm.prelim_grade : dep.prelim_grade,
                        isEditing ? editForm.midterm_grade : dep.midterm_grade,
                        isEditing ? editForm.finals_grade : dep.finals_grade
                      )
                      return (
                        <tr key={dep.id}>
                          <td><span className="rq-student-id">{dep.subject_code}</span></td>
                          <td><span style={{ fontSize: '0.82rem' }}>{dep.subject_desc}</span></td>
                          <td><span className="rq-pill year">{dep.units}</span></td>

                          {/* Prelim */}
                          <td style={{ background: '#fffbeb' }}>
                            {isEditing
                              ? <input className="rq-filter-input" type="number" step="0.01" min="0" max="5" style={{ width: 70 }} placeholder="—" value={editForm.prelim_grade} onChange={e => setEditForm(f => ({ ...f, prelim_grade: e.target.value }))} />
                              : <span style={{ fontWeight: dep.prelim_grade ? 600 : 400, color: dep.prelim_grade ? '#92400e' : 'var(--muted)' }}>{dep.prelim_grade ?? '—'}</span>}
                          </td>

                          {/* Midterm */}
                          <td style={{ background: '#eff6ff' }}>
                            {isEditing
                              ? <input className="rq-filter-input" type="number" step="0.01" min="0" max="5" style={{ width: 70 }} placeholder="—" value={editForm.midterm_grade} onChange={e => setEditForm(f => ({ ...f, midterm_grade: e.target.value }))} />
                              : <span style={{ fontWeight: dep.midterm_grade ? 600 : 400, color: dep.midterm_grade ? '#1d4ed8' : 'var(--muted)' }}>{dep.midterm_grade ?? '—'}</span>}
                          </td>

                          {/* Finals */}
                          <td style={{ background: '#f0fdf4' }}>
                            {isEditing
                              ? <input className="rq-filter-input" type="number" step="0.01" min="0" max="5" style={{ width: 70 }} placeholder="—" value={editForm.finals_grade} onChange={e => setEditForm(f => ({ ...f, finals_grade: e.target.value }))} />
                              : <span style={{ fontWeight: dep.finals_grade ? 600 : 400, color: dep.finals_grade ? '#065f46' : 'var(--muted)' }}>{dep.finals_grade ?? '—'}</span>}
                          </td>

                          {/* Final Grade */}
                          <td>
                            {isEditing
                              ? <div>
                                  <input className="rq-filter-input" style={{ width: 70 }} placeholder={autoFinal || 'e.g. 1.5'} value={editForm.grade} onChange={e => setEditForm(f => ({ ...f, grade: e.target.value }))} />
                                  {autoFinal && !editForm.grade && <div style={{ fontSize: '0.65rem', color: 'var(--muted)', marginTop: 1 }}>Auto: {autoFinal}</div>}
                                </div>
                              : <span style={{ fontSize: '0.9rem', fontWeight: dep.grade ? 700 : 400, color: dep.grade ? 'var(--text)' : 'var(--muted)' }}>{dep.grade || (autoFinal ? `~${autoFinal}` : '—')}</span>}
                          </td>

                          {/* Status */}
                          <td>
                            {isEditing
                              ? <select className="rq-filter-input" style={{ width: 110 }} value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}>
                                  {Object.keys(STATUS_CFG).map(s => <option key={s}>{s}</option>)}
                                </select>
                              : <span className="emp-status-badge" style={{ background: cfg.bg, color: cfg.color }}>{dep.status}</span>}
                          </td>

                          {/* Remarks */}
                          <td>
                            {isEditing
                              ? <input className="rq-filter-input" style={{ width: 110 }} placeholder="Remarks" value={editForm.remarks} onChange={e => setEditForm(f => ({ ...f, remarks: e.target.value }))} />
                              : <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{dep.remarks || '—'}</span>}
                          </td>

                          {/* Actions */}
                          <td>
                            {isEditing
                              ? <div style={{ display: 'flex', gap: 4 }}>
                                  <button className="rq-btn-run" style={{ padding: '4px 10px' }} onClick={() => handleSave(dep)} disabled={saving}><Save size={12} /></button>
                                  <button className="rq-btn-clear" style={{ padding: '4px 8px' }} onClick={() => setEditingId(null)}><X size={12} /></button>
                                </div>
                              : <button className="rq-view-btn" onClick={() => startEdit(dep)} title="Edit grades">✏️</button>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
      )}
    </div>
  )
}
