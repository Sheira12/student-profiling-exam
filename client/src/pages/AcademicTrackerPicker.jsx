import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getStudents } from '../api/students'
import { BookOpen, Search } from 'lucide-react'

export default function AcademicTrackerPicker() {
  const [students, setStudents] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    getStudents().then(({ data }) => { setStudents(data); setLoading(false) })
  }, [])

  const filtered = students.filter(s => {
    const q = search.toLowerCase()
    return `${s.first_name} ${s.last_name}`.toLowerCase().includes(q) ||
      (s.student_id || '').toLowerCase().includes(q)
  })

  return (
    <div className="atp-page">
      <div className="atp-header">
        <div className="atp-header-icon"><BookOpen size={22} strokeWidth={1.6} /></div>
        <div>
          <h1>Academic Progress Tracker</h1>
          <p>Select a student to view or update their academic progress.</p>
        </div>
      </div>

      <div className="atp-search-wrap">
        <Search size={15} strokeWidth={2} className="atp-search-icon" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search student name or ID..."
          className="atp-search-input"
        />
      </div>

      {loading && <div className="si-loading"><span className="spinner" />Loading students...</div>}

      {!loading && filtered.length === 0 && (
        <div className="si-empty">No students found.</div>
      )}

      <div className="atp-grid">
        {filtered.map(s => (
          <div
            key={s.id}
            className="atp-card"
            onClick={() => navigate(`/progress/${s.id}`)}
          >
            <div className="atp-card-avatar">{s.first_name?.[0]}{s.last_name?.[0]}</div>
            <div className="atp-card-info">
              <div className="atp-card-name">{s.first_name} {s.last_name}</div>
              <div className="atp-card-sub">{s.course || 'No course'}</div>
              <div className="atp-card-id">No. {s.student_id}</div>
            </div>
            <div className="atp-card-arrow">
              {s.year_level
                ? <span className="status-badge enrolled">Year {s.year_level}</span>
                : <span className="status-badge not-enrolled">Not Enrolled</span>
              }
              <span className="atp-view">View →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
