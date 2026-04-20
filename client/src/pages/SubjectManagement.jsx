import { useState, useEffect } from 'react'
import { BookOpen, Plus, Edit2, Trash2, Save, X, Search, ChevronDown } from 'lucide-react'
import { getSubjects, createSubject, updateSubject, deleteSubject } from '../api/rbac'

const EMPTY = { code: '', name: '', description: '', units: 3, semester: 'First Semester', year_level: 1 }

export default function SubjectManagement() {
  const [subjects, setSubjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    const { data } = await getSubjects()
    setSubjects(data || [])
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
        await updateSubject(editId, form)
        showToast('Subject updated.')
      } else {
        await createSubject(form)
        showToast('Subject created.')
      }
      setShowForm(false); setEditId(null); setForm(EMPTY)
      load()
    } catch (err) { showToast(err.message, 'error') }
    setSaving(false)
  }

  const handleEdit = (s) => {
    setEditId(s.id)
    setForm({ code: s.code, name: s.name, description: s.description || '', units: s.units, semester: s.semester || 'First Semester', year_level: s.year_level || 1 })
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this subject?')) return
    await deleteSubject(id)
    showToast('Subject deleted.')
    load()
  }

  const filtered = subjects.filter(s => {
    const q = search.toLowerCase()
    return !q || s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
  })

  return (
    <div className="rq-page">
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      <div className="rq-header">
        <div className="rq-header-left">
          <div className="rq-header-icon-wrap"><BookOpen size={22} /></div>
          <div>
            <h1 className="rq-header-title">Subject Management</h1>
            <p className="rq-header-sub">Create, edit, and manage subjects for deployment</p>
          </div>
        </div>
        <div className="rq-header-stats">
          <div className="rq-stat-pill"><span className="rq-stat-val">{subjects.length}</span><span className="rq-stat-lbl">Total</span></div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="emp-toolbar">
        <div className="emp-search-wrap">
          <Search size={15} className="emp-search-icon" />
          <input className="emp-search-input" placeholder="Search subjects…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="rq-btn-run" onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY) }}>
          <Plus size={15} /> Add Subject
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="emp-form-card">
          <div className="emp-form-head">
            <BookOpen size={16} />
            <span>{editId ? 'Edit Subject' : 'New Subject'}</span>
            <button className="rq-btn-clear" style={{ marginLeft: 'auto', padding: '4px 8px' }} onClick={() => { setShowForm(false); setEditId(null) }}><X size={14} /></button>
          </div>
          <form className="emp-form-grid" onSubmit={handleSubmit}>
            <div className="rq-filter-field">
              <label className="rq-filter-label">Code *</label>
              <input className="rq-filter-input" required value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g. CS101" />
            </div>
            <div className="rq-filter-field">
              <label className="rq-filter-label">Subject Name *</label>
              <input className="rq-filter-input" required value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Introduction to Computing" />
            </div>
            <div className="rq-filter-field">
              <label className="rq-filter-label">Units</label>
              <input className="rq-filter-input" type="number" min="1" max="9" value={form.units} onChange={e => setForm(f => ({ ...f, units: parseInt(e.target.value) }))} />
            </div>
            <div className="rq-filter-field">
              <label className="rq-filter-label">Year Level</label>
              <select className="rq-filter-input" value={form.year_level} onChange={e => setForm(f => ({ ...f, year_level: parseInt(e.target.value) }))}>
                {[1,2,3,4].map(y => <option key={y} value={y}>{y}{['st','nd','rd','th'][y-1]} Year</option>)}
              </select>
            </div>
            <div className="rq-filter-field">
              <label className="rq-filter-label">Semester</label>
              <select className="rq-filter-input" value={form.semester} onChange={e => setForm(f => ({ ...f, semester: e.target.value }))}>
                <option>First Semester</option>
                <option>Second Semester</option>
                <option>Summer</option>
              </select>
            </div>
            <div className="rq-filter-field" style={{ gridColumn: '1 / -1' }}>
              <label className="rq-filter-label">Description</label>
              <input className="rq-filter-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description of the subject" />
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, paddingTop: 4, borderTop: '1px solid var(--border)' }}>
              <button type="submit" className="rq-btn-run" disabled={saving}><Save size={14} /> {saving ? 'Saving…' : 'Save Subject'}</button>
              <button type="button" className="rq-btn-clear" onClick={() => { setShowForm(false); setEditId(null) }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      <div className="rq-section">
        <div className="rq-table-wrap">
          {loading ? <div className="si-loading"><div className="spinner" /> Loading…</div> : (
            <table className="rq-table">
              <thead>
                <tr>
                  <th>Code</th><th>Subject Name</th><th>Units</th><th>Year</th><th>Semester</th><th>Description</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0
                  ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>No subjects found.</td></tr>
                  : filtered.map(s => (
                      <tr key={s.id}>
                        <td><span className="rq-student-id">{s.code}</span></td>
                        <td><span className="rq-student-name">{s.name}</span></td>
                        <td><span className="rq-pill year">{s.units} units</span></td>
                        <td><span className="rq-pill year">Year {s.year_level}</span></td>
                        <td><span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{s.semester}</span></td>
                        <td><span style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{s.description || '—'}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="rq-view-btn" onClick={() => handleEdit(s)} title="Edit"><Edit2 size={13} /></button>
                            <button className="rq-view-btn" style={{ background: '#fee2e2', color: '#dc2626', borderColor: '#fecaca' }} onClick={() => handleDelete(s.id)} title="Delete"><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
