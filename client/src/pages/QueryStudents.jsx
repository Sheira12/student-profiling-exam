import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getStudents } from '../api/students'

const PRESET_QUERIES = [
  { label: 'Has Basketball skill', params: { skill: 'Basketball' } },
  { label: 'Has Programming skill', params: { skill: 'Programming' } },
  { label: 'Has Leadership skill', params: { skill: 'Leadership' } },
  { label: 'Member of Student Council', params: { affiliation: 'Student Council' } },
  { label: 'Has Volleyball activity', params: { activity: 'Volleyball' } },
  { label: 'Has Violations', params: { violation: 'Late submission' } },
]

export default function QueryStudents() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeQuery, setActiveQuery] = useState(null)
  const [custom, setCustom] = useState({ skill: '', activity: '', affiliation: '', violation: '' })
  const [searched, setSearched] = useState(false)

  const runQuery = async (params, label) => {
    setLoading(true)
    setActiveQuery(label)
    setSearched(true)
    try {
      const { data } = await getStudents(params)
      setResults(data)
    } finally {
      setLoading(false)
    }
  }

  const handleCustom = (e) => {
    e.preventDefault()
    const params = {}
    if (custom.skill) params.skill = custom.skill
    if (custom.activity) params.activity = custom.activity
    if (custom.affiliation) params.affiliation = custom.affiliation
    if (custom.violation) params.violation = custom.violation
    runQuery(params, 'Custom Query')
  }

  return (
    <div className="query-page">
      <div className="query-page-header">
        <h1>Query / Filter Students</h1>
        <p>Search students by skill, activity, affiliation, or violation.</p>
      </div>

      <div className="query-panel">
        <h2>Preset Queries</h2>
        <div className="preset-buttons">
          {PRESET_QUERIES.map(q => (
            <button
              key={q.label}
              className={`preset-btn ${activeQuery === q.label ? 'active' : ''}`}
              onClick={() => runQuery(q.params, q.label)}
            >
              {q.label}
            </button>
          ))}
        </div>
      </div>

      <div className="query-panel">
        <h2>Custom Query</h2>
        <form className="custom-query-form" onSubmit={handleCustom}>
          <div className="form-grid">
            <div className="form-group">
              <label>Skill</label>
              <input value={custom.skill} onChange={e => setCustom(p => ({ ...p, skill: e.target.value }))} placeholder="e.g. Programming" />
            </div>
            <div className="form-group">
              <label>Activity</label>
              <input value={custom.activity} onChange={e => setCustom(p => ({ ...p, activity: e.target.value }))} placeholder="e.g. Chess Club" />
            </div>
            <div className="form-group">
              <label>Affiliation</label>
              <input value={custom.affiliation} onChange={e => setCustom(p => ({ ...p, affiliation: e.target.value }))} placeholder="e.g. ROTC" />
            </div>
            <div className="form-group">
              <label>Violation</label>
              <input value={custom.violation} onChange={e => setCustom(p => ({ ...p, violation: e.target.value }))} placeholder="e.g. Absences" />
            </div>
          </div>
          <div className="form-actions" style={{marginTop:'0.75rem'}}>
            <button type="submit" className="btn-save">Run Query</button>
          </div>
        </form>
      </div>

      {searched && (
        <div className="query-panel">
          <div className="query-results-header">
            <h2>Results: {activeQuery}</h2>
            <span className="badge">{results.length} found</span>
          </div>
          {loading && <div className="si-loading">Searching...</div>}
          {!loading && results.length === 0 && <div className="si-empty">No students match this query.</div>}
          <div className="student-rows">
            {results.map(s => (
              <div key={s.id} className="student-row">
                <div className="row-avatar">{s.first_name?.[0]}{s.last_name?.[0]}</div>
                <div className="row-info">
                  <div className="row-name">{s.first_name} {s.last_name}</div>
                  <div className="row-sub">{s.course} {s.year_level ? `· Year ${s.year_level}` : ''}</div>
                  <div className="row-id">No. {s.student_id}</div>
                </div>
                <div className="row-right">
                  {s.year_level ? <span className="status-badge enrolled">Enrolled</span> : <span className="status-badge not-enrolled">Not Enrolled</span>}
                  <div className="row-actions">
                    <Link to={`/students/${s.id}`} className="row-btn view">View</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
