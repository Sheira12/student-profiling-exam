import { useState, useEffect } from 'react'
import { Megaphone, Plus, Edit2, Trash2, Save, X, AlertTriangle, Info } from 'lucide-react'
import { getAllAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../api/rbac'

const EMPTY = { title: '', content: '', target: 'all', priority: 'normal', is_active: true }

const PRIORITY_CFG = {
  normal:    { bg: '#f3f4f6', color: '#6b7280', label: 'Normal',    icon: Info },
  important: { bg: '#dbeafe', color: '#1d4ed8', label: 'Important', icon: Info },
  urgent:    { bg: '#fee2e2', color: '#dc2626', label: 'Urgent',    icon: AlertTriangle },
}

export default function Announcements() {
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
      const { data } = await getAllAnnouncements()
      setAnnouncements(data || [])
    } catch (e) { showToast(e.message, 'error') }
    setLoading(false)
  }

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editId) {
        await updateAnnouncement(editId, form)
        showToast('Announcement updated.')
      } else {
        await createAnnouncement(form)
        showToast('Announcement posted.')
      }
      setShowForm(false); setEditId(null); setForm(EMPTY)
      load()
    } catch (err) { showToast(err.message, 'error') }
    setSaving(false)
  }

  const handleEdit = (a) => {
    setEditId(a.id)
    setForm({ title: a.title, content: a.content, target: a.target, priority: a.priority, is_active: a.is_active })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this announcement?')) return
    await deleteAnnouncement(id)
    showToast('Announcement deleted.')
    load()
  }

  const handleToggle = async (a) => {
    await updateAnnouncement(a.id, { is_active: !a.is_active })
    load()
  }

  return (
    <div className="rq-page">
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      <div className="rq-header">
        <div className="rq-header-left">
          <div className="rq-header-icon-wrap"><Megaphone size={22} /></div>
          <div>
            <h1 className="rq-header-title">Announcements</h1>
            <p className="rq-header-sub">Post announcements to students, employees, or everyone</p>
          </div>
        </div>
        <div className="rq-header-stats">
          <div className="rq-stat-pill"><span className="rq-stat-val">{announcements.filter(a => a.is_active).length}</span><span className="rq-stat-lbl">Active</span></div>
          <div className="rq-stat-pill"><span className="rq-stat-val">{announcements.length}</span><span className="rq-stat-lbl">Total</span></div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="rq-btn-run" onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY) }}>
          <Plus size={15} /> New Announcement
        </button>
      </div>

      {/* Form */}
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
              <textarea
                className="rq-filter-input"
                required
                rows={4}
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                placeholder="Write your announcement here…"
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <div className="rq-filter-field">
                <label className="rq-filter-label">Audience</label>
                <select className="rq-filter-input" value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))}>
                  <option value="all">Everyone</option>
                  <option value="students">Students Only</option>
                  <option value="employees">Employees Only</option>
                </select>
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
                <label className="rq-filter-label">Status</label>
                <select className="rq-filter-input" value={form.is_active ? 'active' : 'inactive'} onChange={e => setForm(f => ({ ...f, is_active: e.target.value === 'active' }))}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, paddingTop: 4, borderTop: '1px solid var(--border)' }}>
              <button type="submit" className="rq-btn-run" disabled={saving}><Save size={14} /> {saving ? 'Posting…' : editId ? 'Update' : 'Post Announcement'}</button>
              <button type="button" className="rq-btn-clear" onClick={() => { setShowForm(false); setEditId(null) }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {loading
        ? <div className="si-loading"><div className="spinner" /> Loading…</div>
        : announcements.length === 0
          ? <div className="rq-empty"><div className="rq-empty-icon"><Megaphone size={36} /></div><h3>No announcements yet</h3><p>Create your first announcement above.</p></div>
          : announcements.map(a => {
              const cfg = PRIORITY_CFG[a.priority] || PRIORITY_CFG.normal
              const Icon = cfg.icon
              return (
                <div key={a.id} className={`ann-card ${!a.is_active ? 'inactive' : ''}`} style={{ borderLeftColor: cfg.color }}>
                  <div className="ann-card-head">
                    <span className="ann-priority-badge" style={{ background: cfg.bg, color: cfg.color }}>
                      <Icon size={12} /> {cfg.label}
                    </span>
                    <span className="ann-target-badge">
                      {a.target === 'all' ? '👥 Everyone' : a.target === 'students' ? '🎓 Students' : '💼 Employees'}
                    </span>
                    {!a.is_active && <span className="ann-inactive-badge">Inactive</span>}
                    <span className="ann-date">{new Date(a.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    <div className="ann-actions">
                      <button className="rq-view-btn" onClick={() => handleEdit(a)} title="Edit"><Edit2 size={13} /></button>
                      <button className="rq-view-btn" style={{ background: a.is_active ? '#fef3c7' : '#dcfce7', color: a.is_active ? '#92400e' : '#166534', borderColor: a.is_active ? '#fde68a' : '#bbf7d0' }} onClick={() => handleToggle(a)} title={a.is_active ? 'Deactivate' : 'Activate'}>
                        {a.is_active ? '⏸' : '▶'}
                      </button>
                      <button className="rq-view-btn" style={{ background: '#fee2e2', color: '#dc2626', borderColor: '#fecaca' }} onClick={() => handleDelete(a.id)} title="Delete"><Trash2 size={13} /></button>
                    </div>
                  </div>
                  <h3 className="ann-title">{a.title}</h3>
                  <p className="ann-content">{a.content}</p>
                  <div className="ann-footer">
                    <span>Posted by {a.author_name}</span>
                  </div>
                </div>
              )
            })}
    </div>
  )
}
