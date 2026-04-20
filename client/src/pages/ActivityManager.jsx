import { useState, useEffect } from 'react'
import { ClipboardList, Plus, Archive, Save, X, Clock, CheckCircle, AlertCircle, Users, Link, BookOpen, Hash, Upload, FileText, Image, ExternalLink } from 'lucide-react'
import { getActivitiesByAdviser, createActivity, archiveActivity, updateStudentActivityStatus } from '../api/rbac'
import { supabase } from '../lib/supabase'

export const TYPE_CFG = {
  assignment: { bg: '#dbeafe', color: '#1d4ed8',  label: 'Assignment',  emoji: '📝' },
  laboratory: { bg: '#d1fae5', color: '#065f46',  label: 'Laboratory',  emoji: '🔬' },
  exam:       { bg: '#fee2e2', color: '#991b1b',  label: 'Exam',        emoji: '📋' },
  quiz:       { bg: '#fef3c7', color: '#92400e',  label: 'Quiz',        emoji: '❓' },
  event:      { bg: '#ede9fe', color: '#7c3aed',  label: 'Event',       emoji: '📅' },
  task:       { bg: '#f0fdf4', color: '#166534',  label: 'Task',        emoji: '✅' },
}
const STATUS_CFG = {
  pending:   { bg: '#f3f4f6', color: '#6b7280', icon: Clock,         label: 'Pending' },
  submitted: { bg: '#dbeafe', color: '#1d4ed8', icon: AlertCircle,   label: 'Submitted' },
  done:      { bg: '#dcfce7', color: '#166534', icon: CheckCircle,   label: 'Done' },
}

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

const EMPTY_FORM = { title: '', description: '', type: 'assignment', due_date: '', file_url: '', subject_code: '', max_score: '' }

function validateUrl(url) {
  if (!url) return null
  if (!url.startsWith('http://') && !url.startsWith('https://')) return 'URL must start with http:// or https://'
  return null
}

async function uploadFile(file) {
  const ext = file.name.split('.').pop()
  const path = `activities/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  const { data, error } = await supabase.storage
    .from('activity-files')
    .upload(path, file, { cacheControl: '3600', upsert: false })
  if (error) throw error
  const { data: urlData } = supabase.storage.from('activity-files').getPublicUrl(path)
  return urlData.publicUrl
}

export default function ActivityManager({ employee, assignedStudents }) {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [urlError, setUrlError] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [selectedStudents, setSelectedStudents] = useState([])
  const [expandedId, setExpandedId] = useState(null)
  const [editSA, setEditSA] = useState({}) // { [sa.id]: { status, score } }
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await getActivitiesByAdviser(employee.id)
      setActivities(data || [])
    } catch (e) { showToast(e.message, 'error') }
    setLoading(false)
  }

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  const handleCreate = async (e) => {
    e.preventDefault()
    // Only validate URL format if user typed a URL (not an uploaded file)
    if (form.file_url && !form.file_url.includes('supabase')) {
      const urlErr = validateUrl(form.file_url)
      if (urlErr) { setUrlError(urlErr); return }
    }
    if (selectedStudents.length === 0) { showToast('Select at least one student.', 'error'); return }
    setSaving(true)
    try {
      await createActivity(
        {
          title: form.title,
          description: form.description || null,
          type: form.type,
          due_date: form.due_date || null,
          file_url: form.file_url || null,
          subject_code: form.subject_code || null,
          max_score: form.max_score ? parseFloat(form.max_score) : null,
        },
        selectedStudents,
        employee.id,
        `${employee.first_name} ${employee.last_name}`
      )
      showToast(`Activity created for ${selectedStudents.length} student(s).`)
      setShowForm(false); setForm(EMPTY_FORM); setSelectedStudents([]); setUrlError(null)
      load()
    } catch (err) { showToast(err.message, 'error') }
    setSaving(false)
  }

  const handleArchive = async (id) => {
    if (!confirm('Archive this activity?')) return
    await archiveActivity(id, `${employee.first_name} ${employee.last_name}`)
    showToast('Activity archived.')
    load()
  }

  const handleSAUpdate = async (sa, actMaxScore) => {
    const edit = editSA[sa.id] || {}
    const score = edit.score !== undefined ? edit.score : sa.score
    const status = edit.status || sa.status
    await updateStudentActivityStatus(sa.id, { status, submission_note: sa.submission_note, score: score !== '' ? parseFloat(score) : null }, `${employee.first_name} ${employee.last_name}`)
    setEditSA(prev => { const n = { ...prev }; delete n[sa.id]; return n })
    load()
  }

  const toggleStudent = (id) => setSelectedStudents(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  const selectAll = () => setSelectedStudents(assignedStudents.map(a => a.student_id))
  const clearAll = () => setSelectedStudents([])

  const byType = Object.fromEntries(Object.keys(TYPE_CFG).map(t => [t, []]))
  activities.forEach(a => { if (byType[a.type]) byType[a.type].push(a) })

  const isOverdue = (a) => a.due_date && new Date(a.due_date) < new Date()

  return (
    <div className="sp-section">
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      <div className="sp-section-header">
        <ClipboardList size={18} />
        <h2>Activities</h2>
        <button className="rq-btn-run" style={{ marginLeft: 'auto', padding: '7px 14px', fontSize: '0.82rem' }}
          onClick={() => { setShowForm(true); setForm(EMPTY_FORM); setSelectedStudents([]); setUrlError(null) }}>
          <Plus size={14} /> New Activity
        </button>
      </div>

      {showForm && (
        <div className="emp-form-card">
          <div className="emp-form-head">
            <ClipboardList size={16} /><span>Create Activity</span>
            <button className="rq-btn-clear" style={{ marginLeft: 'auto', padding: '4px 8px' }} onClick={() => setShowForm(false)}><X size={14} /></button>
          </div>
          <form onSubmit={handleCreate} style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="rq-filter-field">
                <label className="rq-filter-label">Title *</label>
                <input className="rq-filter-input" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Activity title" />
              </div>
              <div className="rq-filter-field">
                <label className="rq-filter-label">Type</label>
                <select className="rq-filter-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {Object.entries(TYPE_CFG).map(([val, cfg]) => (
                    <option key={val} value={val}>{cfg.emoji} {cfg.label}</option>
                  ))}
                </select>
              </div>
              <div className="rq-filter-field">
                <label className="rq-filter-label">Due Date</label>
                <input className="rq-filter-input" type="datetime-local" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
              </div>
              <div className="rq-filter-field">
                <label className="rq-filter-label"><Hash size={12} /> Subject Code (optional)</label>
                <input className="rq-filter-input" value={form.subject_code} onChange={e => setForm(f => ({ ...f, subject_code: e.target.value }))} placeholder="e.g. CCS101" />
              </div>
              <div className="rq-filter-field">
                <label className="rq-filter-label"><Link size={12} /> Attachment (File or URL)</label>
                {/* File upload */}
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: '1.5px dashed var(--border)', borderRadius: 8, cursor: 'pointer', background: 'var(--bg)', marginBottom: 6, transition: 'border-color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                  <Upload size={15} style={{ color: '#3b82f6', flexShrink: 0 }} />
                  <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                    {uploading ? 'Uploading…' : form.file_url && !form.file_url.startsWith('http') ? '✓ File ready' : 'Upload file (PNG, PDF, DOCX, etc.)'}
                  </span>
                  <input type="file" style={{ display: 'none' }} accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setUploading(true)
                      try {
                        const url = await uploadFile(file)
                        setForm(f => ({ ...f, file_url: url }))
                        setUrlError(null)
                      } catch (err) {
                        setUrlError('Upload failed: ' + err.message + '. Use a URL instead.')
                      }
                      setUploading(false)
                    }} />
                </label>
                {/* OR URL input */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--muted)', whiteSpace: 'nowrap' }}>or paste URL:</span>
                  <input className={`rq-filter-input ${urlError ? 'has-value' : ''}`}
                    style={{ ...(urlError ? { borderColor: '#ef4444' } : {}), flex: 1 }}
                    value={form.file_url}
                    onChange={e => { setForm(f => ({ ...f, file_url: e.target.value })); setUrlError(null) }}
                    placeholder="https://drive.google.com/…" />
                </div>
                {form.file_url && !urlError && (
                  <div style={{ fontSize: '0.72rem', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ExternalLink size={10} />
                    <a href={form.file_url} target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6' }}>Preview attachment</a>
                  </div>
                )}
                {urlError && <span style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: 2 }}>{urlError}</span>}
              </div>
              <div className="rq-filter-field">
                <label className="rq-filter-label">Max Score (optional)</label>
                <input className="rq-filter-input" type="number" min="0" step="0.5" value={form.max_score} onChange={e => setForm(f => ({ ...f, max_score: e.target.value }))} placeholder="e.g. 100" />
              </div>
              <div className="rq-filter-field" style={{ gridColumn: '1 / -1' }}>
                <label className="rq-filter-label">Description</label>
                <textarea className="rq-filter-input" rows={2} style={{ resize: 'vertical', fontFamily: 'inherit' }}
                  value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional instructions or description" />
              </div>
            </div>

            {/* Student selector */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <label className="rq-filter-label"><Users size={13} /> Assign to Students *</label>
                <button type="button" className="rq-btn-clear" style={{ padding: '3px 8px', fontSize: '0.75rem' }} onClick={selectAll}>All</button>
                <button type="button" className="rq-btn-clear" style={{ padding: '3px 8px', fontSize: '0.75rem' }} onClick={clearAll}>None</button>
              </div>
              {assignedStudents.length === 0 ? (
                <p style={{ fontSize: '0.82rem', color: 'var(--muted)', fontStyle: 'italic' }}>No students assigned. Ask admin to assign students to you first.</p>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {assignedStudents.map(a => {
                    const s = a.students
                    const checked = selectedStudents.includes(a.student_id)
                    return (
                      <button key={a.student_id} type="button"
                        style={{ padding: '5px 12px', fontSize: '0.78rem', borderRadius: 20, border: `1.5px solid ${checked ? '#bbf7d0' : '#e5e7eb'}`, background: checked ? '#dcfce7' : 'var(--bg)', color: checked ? '#166534' : 'var(--muted)', cursor: 'pointer', transition: 'all 0.15s' }}
                        onClick={() => toggleStudent(a.student_id)}>
                        {checked ? '✓ ' : ''}{s?.first_name} {s?.last_name}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8, paddingTop: 4, borderTop: '1px solid var(--border)' }}>
              <button type="submit" className="rq-btn-run" disabled={saving}><Save size={14} /> {saving ? 'Creating…' : 'Create Activity'}</button>
              <button type="button" className="rq-btn-clear" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading
        ? <div className="si-loading"><div className="spinner" /> Loading…</div>
        : activities.length === 0
          ? <div className="rq-empty"><div className="rq-empty-icon"><ClipboardList size={36} /></div><h3>No activities yet</h3><p>Create your first activity above.</p></div>
          : Object.entries(byType).map(([type, items]) => {
              if (items.length === 0) return null
              const cfg = TYPE_CFG[type]
              return (
                <div key={type} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0 6px', borderBottom: '2px solid var(--border)', marginBottom: 8 }}>
                    <span style={{ fontSize: '1rem' }}>{cfg.emoji}</span>
                    <span className="ann-priority-badge" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}s</span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{items.length} active</span>
                  </div>                  {items.map(act => {
                    const overdue = isOverdue(act)
                    const isOpen = expandedId === act.id
                    const doneCount = act.student_activities?.filter(sa => sa.status === 'done').length || 0
                    const total = act.student_activities?.length || 0
                    return (
                      <div key={act.id} className="emp-student-card" style={{ marginBottom: 8, border: overdue ? '1px solid #fecaca' : undefined }}>
                        <div className="emp-student-card-head" onClick={() => setExpandedId(isOpen ? null : act.id)}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{act.title}</span>
                              {act.subject_code && <span style={{ fontSize: '0.68rem', background: '#e0e7ff', color: '#4338ca', padding: '1px 7px', borderRadius: 10, fontWeight: 600 }}>{act.subject_code}</span>}
                              {overdue && <span style={{ fontSize: '0.68rem', background: '#fee2e2', color: '#dc2626', padding: '1px 6px', borderRadius: 10, fontWeight: 700 }}>OVERDUE</span>}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginTop: 2, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                              {act.due_date && <span>📅 {new Date(act.due_date).toLocaleString()}</span>}
                              {act.max_score && <span>🎯 Max: {act.max_score}</span>}
                              {act.file_url && <a href={act.file_url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 3 }}><Link size={11} /> Attachment</a>}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            <span className="rq-pill gpa">{doneCount}/{total} done</span>
                            {(() => {
                              const submittedCount = act.student_activities?.filter(sa => sa.status === 'submitted').length || 0
                              return submittedCount > 0 ? <span className="rq-pill" style={{ background: '#dbeafe', color: '#1d4ed8' }}>{submittedCount} submitted</span> : null
                            })()}
                            <button className="rq-view-btn" style={{ background: '#fef3c7', color: '#92400e', borderColor: '#fde68a' }} onClick={e => { e.stopPropagation(); handleArchive(act.id) }} title="Archive">
                              <Archive size={13} />
                            </button>
                          </div>
                        </div>

                        {isOpen && act.student_activities?.length > 0 && (
                          <div className="emp-student-card-body">
                            <table className="rq-table">
                              <thead><tr><th>Student</th><th>Status</th><th>Submission</th><th>Score</th><th>Update</th></tr></thead>
                              <tbody>
                                {act.student_activities.map(sa => {
                                  const scfg = STATUS_CFG[sa.status] || STATUS_CFG.pending
                                  const Icon = scfg.icon
                                  const edit = editSA[sa.id] || {}
                                  const curScore = edit.score !== undefined ? edit.score : (sa.score ?? '')
                                  const curStatus = edit.status || sa.status
                                  const scoreWarn = act.max_score && curScore !== '' && parseFloat(curScore) > act.max_score
                                  const stu = sa.students
                                  return (
                                    <tr key={sa.id}>
                                      <td>
                                        <div className="rq-student-cell">
                                          <div className="rq-avatar" style={{ width: 28, height: 28, fontSize: '0.65rem' }}>
                                            {stu?.first_name?.[0]}{stu?.last_name?.[0]}
                                          </div>
                                          <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>
                                              {stu ? `${stu.first_name} ${stu.last_name}` : sa.student_id}
                                            </div>
                                            {stu?.student_id && <div className="rq-student-id">{stu.student_id}</div>}
                                          </div>
                                        </div>
                                      </td>
                                      <td>
                                        <select className="rq-filter-input" style={{ width: 110, padding: '4px 6px', fontSize: '0.78rem' }}
                                          value={curStatus}
                                          onChange={e => setEditSA(prev => ({ ...prev, [sa.id]: { ...prev[sa.id], status: e.target.value } }))}>
                                          <option value="pending">Pending</option>
                                          <option value="submitted">Submitted</option>
                                          <option value="done">Done</option>
                                        </select>
                                      </td>
                                      <td>
                                        {sa.submission_file_url
                                          ? <a href={sa.submission_file_url} target="_blank" rel="noopener noreferrer"
                                              style={{ fontSize: '0.75rem', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                                              📎 View File
                                            </a>
                                          : sa.submission_note
                                            ? <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontStyle: 'italic' }}>
                                                📝 {sa.submission_note.slice(0, 25)}{sa.submission_note.length > 25 ? '…' : ''}
                                              </span>
                                            : <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>—</span>}
                                      </td>
                                      <td>
                                        <div>
                                          <input className="rq-filter-input" type="number" step="0.5" min="0"
                                            style={{ width: 75, padding: '4px 6px', fontSize: '0.78rem', borderColor: scoreWarn ? '#f59e0b' : undefined }}
                                            placeholder={act.max_score ? `/ ${act.max_score}` : 'Score'}
                                            value={curScore}
                                            onChange={e => setEditSA(prev => ({ ...prev, [sa.id]: { ...prev[sa.id], score: e.target.value } }))} />
                                          {scoreWarn && <div style={{ fontSize: '0.65rem', color: '#d97706', marginTop: 1 }}>⚠ Exceeds max</div>}
                                        </div>
                                      </td>
                                      <td>
                                        <button className="rq-btn-run" style={{ padding: '5px 12px', fontSize: '0.75rem', whiteSpace: 'nowrap' }}
                                          onClick={() => handleSAUpdate(sa, act.max_score)}>
                                          <Save size={11} /> Save
                                        </button>
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
    </div>
  )
}
