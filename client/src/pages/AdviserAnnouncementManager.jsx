import { useState, useEffect } from 'react'
import { Megaphone, Plus, Edit2, Trash2, Save, X, AlertTriangle, Info } from 'lucide-react'
import { getAdviserAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../api/rbac'

const EMPTY = { title: '', content: '', priority: 'normal', subject_code: '' }

const PRIORITY_CFG = {
  normal:    { bg: '#f3f4f6', color: '#6b7280', label: 'Normal',    icon: Info },
  important: { bg: '#dbeafe', color: '#1d4ed8', label: 'Important', icon: Info },
  urgent:    { bg: '#fee2e2', color: '#dc2626', label: 'Urgent',    icon: AlertTriangle },
}

export default function AdviserAnnouncementManager({ employee }) {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await getAdviserAnnouncements(employee.id)
      setAnnouncements(data || [])
    } catch (e) { showToast(e.message, 'error') }
    setLoading(false)
  }

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  const isOwn = (a) => a.author_id === employee.id

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editId) {
        await updateAnnouncement(editId, form, `${employee.first_name} ${employee.last_name}`)
        showToast('Announcement updated.')
      } else {
        await createAnnouncement(
          { ...form, target: 'students', author_type: 'employee', author_id: employee.id, is_active: true, subject_code: form.subject_code || null },
          `${employee.first_name} ${employee.last_name}`
        )
        showToast('Announcement posted.')
      }
      setShowForm(false); setEditId(null); setForm(EMPTY)
      load()
    } catch (err) { showToast(err.message, 'error') }
    setSaving(false)
  }

  const handleEdit = (a) => {
    if (!isOwn(a)) { showToast('You can only edit your own announcements.', 'error'); return }
    setEditId(a.id)
    setForm({ title: a.title, content: a.content, priority: a.priority, subject_code: a.subject_code || '' })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (a) => {
    if (!isOwn(a)) { showToast('You can only delete your own announcements.', 'error'); return }
    if (!confirm('Delete this announcement?')) return
    await deleteAnnouncement(a.id, `${employee.first_name} ${employee.last_name}`)
    showToast('Deleted.')
    load()
  }

  const handleToggle = async (a) => {
    if (!isOwn(a)) { showToast('You can only toggle your own announcements.', 'error'); return }
    await updateAnnouncement(a.id, { is_active: !a.is_active })
    load()
  }

  return (
    <div className="sp-section">
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      <div className="sp-section-header">
        <Megaphone size={18} />
        <h2>Announcements</h2>
        <button className="rq-btn-run" style={{ marginLeft: 'auto', padding: '7px 14px', fontSize: '0.82rem' }}
          onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY) }}>
          <Plus size={14} /> New Announcement
        </button>
      </div>

      {showForm && (
        <div className="emp-form-card">
          <div className="emp-form-head">
            <Megaphone size={16} />
            <span>{editId ? 'Edit Announcement' : 'New Announcement'}</span>
            <button className="rq-btn-clear" style={{ marginLeft: 'auto', padding: '4px 8px' }} onClick={() => { setShowForm(false); setEditId(null) }}><X size={14} /></button>
          </div>
          <form onSubmit={handleSubmit} style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="rq-filter-field">
              <label className="rq-filter-label">Title *</label>
              <input className="rq-filter-input" required value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Announcement title" />
            </div>
            <div className="rq-filter-field">
              <label className="rq-filter-label">Content *</label>
              <textarea className="rq-filter-input" required rows={4} style={{ resize: 'vertical', fontFamily: 'inherit' }}
                value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Write your announcement…" />
            </div>
            <div className="rq-filter-field">
              <label className="rq-filter-label">Priority</label>
              <select className="rq-filter-input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                <option value="normal">Normal</option>
                <option value="important">Important</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="rq-filter-field">
              <label className="rq-filter-label">Subject Code (optional)</label>
              <input className="rq-filter-input" value={form.subject_code || ''} onChange={e => setForm(f => ({ ...f, subject_code: e.target.value }))} placeholder="e.g. CCS101" />
            </div>
            <div style={{ display: 'flex', gap: 8, paddingTop: 4, borderTop: '1px solid var(--border)' }}>
              <button type="submit" className="rq-btn-run" disabled={saving}><Save size={14} /> {saving ? 'Posting…' : editId ? 'Update' : 'Post'}</button>
              <button type="button" className="rq-btn-clear" onClick={() => { setShowForm(false); setEditId(null) }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading
        ? <div className="si-loading"><div className="spinner" /> Loading…</div>
        : announcements.length === 0
          ? <div className="rq-empty"><div className="rq-empty-icon"><Megaphone size={36} /></div><h3>No announcements yet</h3><p>Post your first announcement above.</p></div>
          : announcements.map(a => {
              const cfg = PRIORITY_CFG[a.priority] || PRIORITY_CFG.normal
              const Icon = cfg.icon
              const own = isOwn(a)
              return (
                <div key={a.id} className={`ann-card ${!a.is_active ? 'inactive' : ''}`} style={{ borderLeftColor: cfg.color }}>
                  <div className="ann-card-head">
                    <span className="ann-priority-badge" style={{ background: cfg.bg, color: cfg.color }}>
                      <Icon size={12} /> {cfg.label}
                    </span>
                    {!own && <span className="ann-target-badge">🛡 Admin</span>}
                    {own && !a.is_active && <span className="ann-inactive-badge">Inactive</span>}
                    <span className="ann-date">{new Date(a.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    {own && (
                      <div className="ann-actions">
                        <button className="rq-view-btn" onClick={() => handleEdit(a)} title="Edit"><Edit2 size={13} /></button>
                        <button className="rq-view-btn" style={{ background: a.is_active ? '#fef3c7' : '#dcfce7', color: a.is_active ? '#92400e' : '#166534', borderColor: a.is_active ? '#fde68a' : '#bbf7d0' }} onClick={() => handleToggle(a)} title={a.is_active ? 'Deactivate' : 'Activate'}>
                          {a.is_active ? '⏸' : '▶'}
                        </button>
                        <button className="rq-view-btn" style={{ background: '#fee2e2', color: '#dc2626', borderColor: '#fecaca' }} onClick={() => handleDelete(a)} title="Delete"><Trash2 size={13} /></button>
                      </div>
                    )}
                  </div>
                  <h3 className="ann-title">{a.title}</h3>
                  <p className="ann-content">{a.content}</p>
                  <div className="ann-footer"><span>Posted by {a.author_name}</span></div>
                </div>
              )
            })}
    </div>
  )
}
