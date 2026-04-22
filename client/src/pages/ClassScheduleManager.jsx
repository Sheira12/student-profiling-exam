import { useState, useEffect } from 'react'
import { CalendarDays, Plus, Trash2, Save, X, Clock } from 'lucide-react'
import { getClassSchedules, createClassSchedule, deleteClassSchedule } from '../api/rbac'

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
const EMPTY = { subject_name: '', day_of_week: 'Monday', start_time: '', end_time: '', room: '' }

const DAY_COLORS_LIGHT = {
  Monday: '#dbeafe', Tuesday: '#ede9fe', Wednesday: '#d1fae5',
  Thursday: '#fef3c7', Friday: '#fee2e2', Saturday: '#f0fdf4', Sunday: '#fce7f3',
}
const DAY_COLORS_DARK = {
  Monday: '#1e3a5f', Tuesday: '#2e1065', Wednesday: '#064e3b',
  Thursday: '#451a03', Friday: '#450a0a', Saturday: '#052e16', Sunday: '#4a044e',
}

export default function ClassScheduleManager({ employee }) {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const isDark = localStorage.getItem('adviser_dark_mode') === 'dark'

  useEffect(() => { load() }, [])

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await getClassSchedules(employee.id)
      setSchedules(data || [])
    } catch (e) { showToast(e.message, 'error') }
    setLoading(false)
  }

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000) }

  const validate = () => {
    const e = {}
    if (!form.subject_name.trim()) e.subject_name = 'Required'
    if (!form.day_of_week) e.day_of_week = 'Required'
    if (!form.start_time) e.start_time = 'Required'
    if (!form.end_time) e.end_time = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSaving(true)
    try {
      await createClassSchedule({ ...form, adviser_id: employee.id }, `${employee.first_name} ${employee.last_name}`)
      showToast('Schedule entry added.')
      setShowForm(false); setForm(EMPTY); setErrors({})
      load()
    } catch (err) { showToast(err.message, 'error') }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Remove this schedule entry?')) return
    await deleteClassSchedule(id, `${employee.first_name} ${employee.last_name}`)
    showToast('Removed.')
    load()
  }

  // Group by day
  const byDay = {}
  DAYS.forEach(d => { byDay[d] = [] })
  schedules.forEach(s => { if (byDay[s.day_of_week]) byDay[s.day_of_week].push(s) })

  const fmt = (t) => { if (!t) return ''; const [h, m] = t.split(':'); const hr = parseInt(h); return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}` }

  return (
    <div className="sp-section">
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      <div className="sp-section-header">
        <CalendarDays size={18} />
        <h2>Class Schedule</h2>
        <button className="rq-btn-run" style={{ marginLeft: 'auto', padding: '7px 14px', fontSize: '0.82rem' }}
          onClick={() => { setShowForm(true); setForm(EMPTY); setErrors({}) }}>
          <Plus size={14} /> Add Class
        </button>
      </div>

      {showForm && (
        <div className="emp-form-card">
          <div className="emp-form-head">
            <CalendarDays size={16} /><span>Add Class Schedule</span>
            <button className="rq-btn-clear" style={{ marginLeft: 'auto', padding: '4px 8px' }} onClick={() => setShowForm(false)}><X size={14} /></button>
          </div>
          <form onSubmit={handleCreate} style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="rq-filter-field" style={{ gridColumn: '1 / -1' }}>
              <label className="rq-filter-label">Subject Name *</label>
              <input className="rq-filter-input" style={errors.subject_name ? { borderColor: '#ef4444' } : {}} value={form.subject_name} onChange={e => setForm(f => ({ ...f, subject_name: e.target.value }))} placeholder="e.g. Computer Programming 1" />
              {errors.subject_name && <span style={{ fontSize: '0.72rem', color: '#ef4444' }}>{errors.subject_name}</span>}
            </div>
            <div className="rq-filter-field">
              <label className="rq-filter-label">Day *</label>
              <select className="rq-filter-input" style={errors.day_of_week ? { borderColor: '#ef4444' } : {}} value={form.day_of_week} onChange={e => setForm(f => ({ ...f, day_of_week: e.target.value }))}>
                {DAYS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div className="rq-filter-field">
              <label className="rq-filter-label">Room / Location</label>
              <input className="rq-filter-input" value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))} placeholder="e.g. Room 301" />
            </div>
            <div className="rq-filter-field">
              <label className="rq-filter-label">Start Time *</label>
              <input className="rq-filter-input" type="time" style={errors.start_time ? { borderColor: '#ef4444' } : {}} value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} />
              {errors.start_time && <span style={{ fontSize: '0.72rem', color: '#ef4444' }}>{errors.start_time}</span>}
            </div>
            <div className="rq-filter-field">
              <label className="rq-filter-label">End Time *</label>
              <input className="rq-filter-input" type="time" style={errors.end_time ? { borderColor: '#ef4444' } : {}} value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} />
              {errors.end_time && <span style={{ fontSize: '0.72rem', color: '#ef4444' }}>{errors.end_time}</span>}
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, paddingTop: 4, borderTop: '1px solid var(--border)' }}>
              <button type="submit" className="rq-btn-run" disabled={saving}><Save size={14} /> {saving ? 'Saving…' : 'Add to Schedule'}</button>
              <button type="button" className="rq-btn-clear" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading
        ? <div className="si-loading"><div className="spinner" /> Loading…</div>
        : schedules.length === 0 && !showForm
          ? <div className="rq-empty"><div className="rq-empty-icon"><CalendarDays size={36} /></div><h3>No schedule yet</h3><p>Add your first class above.</p></div>
          : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
              {DAYS.map(day => {
                const items = byDay[day]
                if (items.length === 0) return null
                return (
                  <div key={day} className="emp-status-col">
                    <div className="emp-status-col-head" style={{
                      background: isDark ? (DAY_COLORS_DARK[day] || '#1e293b') : (DAY_COLORS_LIGHT[day] || '#f3f4f6'),
                      color: isDark ? '#e2e8f0' : '#374151'
                    }}>
                      <CalendarDays size={14} /> {day}
                      <span className="emp-status-count">{items.length}</span>
                    </div>
                    {items.map(s => (
                      <div key={s.id} className="emp-subj-card" style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <div style={{ flex: 1 }}>
                          <div className="emp-dep-name">{s.subject_name}</div>
                          <div className="emp-dep-code" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={10} /> {fmt(s.start_time)} – {fmt(s.end_time)}
                          </div>
                          {s.room && <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>📍 {s.room}</div>}
                        </div>
                        <button className="rq-view-btn" style={{ background: isDark ? 'rgba(239,68,68,0.15)' : '#fee2e2', color: '#f87171', borderColor: isDark ? '#7f1d1d' : '#fecaca', flexShrink: 0 }} onClick={() => handleDelete(s.id)}><Trash2 size={11} /></button>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          )}
    </div>
  )
}
