import { useState, useEffect } from 'react'
import { ClipboardList, Clock, CheckCircle, AlertCircle, AlertTriangle, ExternalLink, Send, ChevronDown, ChevronUp, Upload, Link, FileText, Image } from 'lucide-react'
import { getStudentActivities, submitStudentActivity } from '../api/rbac'
import { supabase } from '../lib/supabase'
import { TYPE_CFG } from './ActivityManager'

const STATUS_CFG = {
  pending:   { bg: '#f3f4f6', color: '#6b7280', icon: Clock,         label: 'Pending' },
  submitted: { bg: '#dbeafe', color: '#1d4ed8', icon: AlertCircle,   label: 'Submitted' },
  done:      { bg: '#dcfce7', color: '#166534', icon: CheckCircle,   label: 'Done' },
}

function isOverdue(sa) {
  if (!sa.activities?.due_date) return false
  return new Date(sa.activities.due_date) < new Date() && sa.status === 'pending'
}

function sortActivities(list) {
  return [...list].sort((a, b) => {
    const aOver = isOverdue(a) ? 0 : 1
    const bOver = isOverdue(b) ? 0 : 1
    if (aOver !== bOver) return aOver - bOver
    const aDate = a.activities?.due_date ? new Date(a.activities.due_date) : Infinity
    const bDate = b.activities?.due_date ? new Date(b.activities.due_date) : Infinity
    return aDate - bDate
  })
}

async function uploadSubmissionFile(file, studentId) {
  const ext = file.name.split('.').pop()
  const path = `submissions/${studentId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  const { error } = await supabase.storage.from('student-submissions').upload(path, file, { cacheControl: '3600', upsert: false })
  if (error) throw error
  const { data } = supabase.storage.from('student-submissions').getPublicUrl(path)
  return data.publicUrl
}

export default function StudentActivitiesView({ student, filterSubjectCode }) {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState(null)
  const [submissionData, setSubmissionData] = useState({}) // { [sa.id]: { note, linkUrl, file, fileUrl, uploading } }
  const [submitting, setSubmitting] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  const load = () => {
    const safe = (fn) => fn.catch(() => ({ data: [] }))
    safe(getStudentActivities(student.id)).then(({ data }) => {
      let list = data || []
      if (filterSubjectCode) list = list.filter(sa => sa.activities?.subject_code === filterSubjectCode)
      setActivities(sortActivities(list))
      setLoading(false)
    })
  }

  useEffect(() => { load() }, [student.id, filterSubjectCode])

  const getSub = (id) => submissionData[id] || {}
  const setSub = (id, patch) => setSubmissionData(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }))

  const handleFileChange = async (saId, file) => {
    if (!file) return
    setSub(saId, { file, uploading: true, fileUrl: null })
    try {
      const url = await uploadSubmissionFile(file, student.id)
      setSub(saId, { fileUrl: url, uploading: false })
      showToast('File uploaded. Click "Confirm Submit" to submit.')
    } catch (err) {
      setSub(saId, { uploading: false, file: null })
      showToast('Upload failed: ' + err.message + '. Try a URL instead.', 'error')
    }
  }

  const handleSubmit = async (sa) => {
    if (sa.status !== 'pending') return
    const sub = getSub(sa.id)
    const fileUrl = sub.fileUrl || sub.linkUrl || null
    if (!fileUrl && !sub.note) {
      showToast('Add a note, file, or link before submitting.', 'error')
      return
    }
    setSubmitting(sa.id)
    try {
      await submitStudentActivity(sa.id, sub.note || '', student.id, fileUrl)
      showToast('Activity submitted successfully!')
      setExpandedId(null)
      setSubmissionData(prev => { const n = { ...prev }; delete n[sa.id]; return n })
      load()
    } catch (err) {
      showToast('Failed to submit: ' + err.message, 'error')
    }
    setSubmitting(null)
  }

  if (loading) return <div className="si-loading"><div className="spinner" /> Loading activities…</div>

  if (activities.length === 0) {
    return (
      <div className="sp-clean-record" style={{ borderColor: '#e0e7ff' }}>
        <div className="sp-clean-icon" style={{ background: '#e0e7ff', color: '#4f46e5' }}><ClipboardList size={32} /></div>
        <h3 style={{ color: '#4f46e5' }}>{filterSubjectCode ? `No activities for ${filterSubjectCode}` : 'No activities assigned yet'}</h3>
        <p>{filterSubjectCode ? 'Your adviser has not assigned activities for this subject yet.' : 'Your adviser will assign activities to you soon.'}</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      {activities.map(sa => {
        const act = sa.activities
        if (!act) return null
        const overdue = isOverdue(sa)
        const typeCfg = TYPE_CFG[act.type] || { bg: '#f3f4f6', color: '#6b7280', emoji: '📌', label: act.type }
        const statusCfg = STATUS_CFG[sa.status] || STATUS_CFG.pending
        const StatusIcon = statusCfg.icon
        const hasScore = sa.score !== null && sa.score !== undefined
        const hasMaxScore = act.max_score !== null && act.max_score !== undefined
        const canSubmit = sa.status === 'pending'
        const isExpanded = expandedId === sa.id
        const sub = getSub(sa.id)

        return (
          <div key={sa.id} className="act-card" style={{ borderLeft: overdue ? '3px solid #ef4444' : `3px solid ${typeCfg.color}` }}>
            {/* Header */}
            <div className="act-card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1.1rem' }}>{typeCfg.emoji}</span>
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{act.title}</span>
                <span className="ann-priority-badge" style={{ background: typeCfg.bg, color: typeCfg.color, fontSize: '0.68rem' }}>{typeCfg.label}</span>
                {act.subject_code && <span style={{ fontSize: '0.68rem', background: '#e0e7ff', color: '#4338ca', padding: '1px 7px', borderRadius: 10, fontWeight: 600 }}>{act.subject_code}</span>}
                {overdue && <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.68rem', background: '#fee2e2', color: '#dc2626', padding: '1px 7px', borderRadius: 10, fontWeight: 700 }}><AlertTriangle size={10} /> OVERDUE</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span className="emp-status-badge" style={{ background: statusCfg.bg, color: statusCfg.color }}>
                  <StatusIcon size={11} /> {statusCfg.label}
                </span>
                {canSubmit && (
                  <button
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', background: 'var(--orange)', color: 'white', border: 'none', borderRadius: 8, fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }}
                    onClick={() => setExpandedId(isExpanded ? null : sa.id)}
                  >
                    <Send size={12} /> Submit {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                )}
              </div>
            </div>

            {act.description && <p className="act-card-desc">{act.description}</p>}

            {/* Meta */}
            <div className="act-card-meta">
              {act.due_date && (
                <span style={{ color: overdue ? '#dc2626' : 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Clock size={12} /> Due: {new Date(act.due_date).toLocaleString()}
                </span>
              )}
              {(hasScore || hasMaxScore) && (
                <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                  🎯 Score: {hasScore ? sa.score : '—'}{hasMaxScore ? ` / ${act.max_score}` : ''}
                </span>
              )}
              {act.file_url && (
                <a href={act.file_url} target="_blank" rel="noopener noreferrer" className="act-attachment-link">
                  <ExternalLink size={12} /> View Attachment
                </a>
              )}
              {sa.submission_file_url && sa.status !== 'pending' && (
                <a href={sa.submission_file_url} target="_blank" rel="noopener noreferrer" className="act-attachment-link" style={{ background: '#dcfce7', color: '#166534', borderColor: '#bbf7d0' }}>
                  <FileText size={12} /> My Submission
                </a>
              )}
              {sa.submission_note && sa.status !== 'pending' && (
                <span style={{ color: 'var(--muted)', fontStyle: 'italic', fontSize: '0.78rem' }}>📝 "{sa.submission_note}"</span>
              )}
            </div>

            {/* Submission panel */}
            {isExpanded && canSubmit && (
              <div style={{ marginTop: 10, padding: '14px 16px', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 10, color: 'var(--text)' }}>
                  📤 Submit Your Work
                </div>

                {/* Option 1: Upload file */}
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 5 }}>
                    <Upload size={12} style={{ display: 'inline', marginRight: 4 }} /> Upload File (image, PDF, DOCX, etc.)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', border: '1.5px dashed var(--border)', borderRadius: 8, cursor: 'pointer', background: 'var(--surface)', transition: 'border-color 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--orange)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                    <Upload size={15} style={{ color: 'var(--orange)', flexShrink: 0 }} />
                    <span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                      {sub.uploading ? '⏳ Uploading…' : sub.fileUrl ? `✓ ${sub.file?.name || 'File ready'}` : 'Click to choose file'}
                    </span>
                    <input type="file" style={{ display: 'none' }}
                      accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip"
                      onChange={e => handleFileChange(sa.id, e.target.files?.[0])} />
                  </label>
                  {sub.fileUrl && (
                    <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.72rem', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                      <ExternalLink size={10} /> Preview uploaded file
                    </a>
                  )}
                </div>

                {/* Option 2: Paste link */}
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 5 }}>
                    <Link size={12} style={{ display: 'inline', marginRight: 4 }} /> Or paste a link (Google Drive, GitHub, etc.)
                  </label>
                  <input className="rq-filter-input"
                    placeholder="https://drive.google.com/…"
                    value={sub.linkUrl || ''}
                    onChange={e => setSub(sa.id, { linkUrl: e.target.value, fileUrl: null, file: null })}
                    disabled={!!sub.fileUrl}
                    style={sub.fileUrl ? { opacity: 0.5 } : {}}
                  />
                </div>

                {/* Note */}
                <div style={{ marginBottom: 10 }}>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)', display: 'block', marginBottom: 5 }}>
                    📝 Note (optional)
                  </label>
                  <textarea className="rq-filter-input" rows={2} style={{ resize: 'vertical', fontFamily: 'inherit' }}
                    placeholder="Add any notes for your adviser…"
                    value={sub.note || ''}
                    onChange={e => setSub(sa.id, { note: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="rq-btn-run" style={{ padding: '8px 18px' }}
                    disabled={submitting === sa.id || sub.uploading}
                    onClick={() => handleSubmit(sa)}>
                    <Send size={13} /> {submitting === sa.id ? 'Submitting…' : 'Confirm Submit'}
                  </button>
                  <button className="rq-btn-clear" style={{ padding: '8px 14px' }} onClick={() => setExpandedId(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
