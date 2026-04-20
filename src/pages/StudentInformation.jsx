import { useEffect, useState, useCallback } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { getStudents, deleteStudent } from '../api/supabase-students'
import { LayoutGrid, List, AlignJustify, Download, UserPlus, Eye, Pencil, Trash2, GraduationCap, UserCheck, UserX } from 'lucide-react'
import SearchBar from '../components/SearchBar'

const COURSES = ['All Courses', 'Information Technology', 'Computer Science', 'Information Systems']
const AFFILIATIONS = ['All Affiliations', 'Student Council', 'ROTC', 'IEEE', 'Sports Club']
const YEARS = ['All Years', '1st Year', '2nd Year', '3rd Year', '4th Year']
const SKILLS = ['All Skills', 'Programming', 'Basketball', 'Leadership', 'Volleyball', 'Design']

// ── Part 5: Parent passes search value + handler down (one-way data flow)
export default function StudentInformation({ role = 'admin' }) {
  const [allStudents, setAllStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState({ skill: 'All Skills', course: 'All Courses', affiliation: 'All Affiliations', year: 'All Years' })
  const [tab, setTab] = useState('overview')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewMode, setViewMode] = useState('list')
  const [toast, setToast] = useState(null)
  const navigate = useNavigate()
  const location = useLocation()

  // Listen for topbar search via URL param
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const q = params.get('search') || ''
    setSearch(q)
  }, [location.search])

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getStudents()
      setAllStudents(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchStudents() }, [fetchStudents])

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this student? This cannot be undone.')) return
    try {
      await deleteStudent(id)
      setAllStudents(prev => prev.filter(s => s.id !== id))
      showToast('Student deleted successfully.')
    } catch {
      showToast('Failed to delete student.', 'error')
    }
  }

  const handleExport = () => {
    const rows = [
      ['Student ID', 'First Name', 'Last Name', 'Course', 'Year', 'GPA', 'Skills', 'Affiliations'],
      ...allStudents.map(s => [
        s.student_id, s.first_name, s.last_name, s.course || '',
        s.year_level || '', s.gpa || '',
        (s.skills || []).join('; '),
        (s.affiliations || []).join('; ')
      ])
    ].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob([rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'students.csv'; a.click()
    URL.revokeObjectURL(url)
    showToast('Exported successfully.')
  }

  // Client-side filtering — fast, no extra API calls
  const filtered = allStudents.filter(s => {
    const fullName = `${s.first_name} ${s.last_name}`.toLowerCase()
    const id = (s.student_id || '').toLowerCase()
    const q = search.toLowerCase()

    if (q && !fullName.includes(q) && !id.includes(q)) return false

    if (statusFilter === 'enrolled' && !s.year_level) return false
    if (statusFilter === 'not-enrolled' && s.year_level) return false

    if (filter.skill !== 'All Skills' && !(s.skills || []).includes(filter.skill)) return false
    if (filter.affiliation !== 'All Affiliations' && !(s.affiliations || []).includes(filter.affiliation)) return false
    if (filter.course !== 'All Courses' && s.course !== filter.course) return false
    if (filter.year !== 'All Years') {
      const yr = parseInt(filter.year)
      if (s.year_level !== yr) return false
    }

    return true
  })

  const stats = {
    total: allStudents.length,
    enrolled: allStudents.filter(s => s.year_level).length,
    notEnrolled: allStudents.filter(s => !s.year_level).length,
  }

  const clearFilters = () => {
    setSearch('')
    setFilter({ skill: 'All Skills', course: 'All Courses', affiliation: 'All Affiliations', year: 'All Years' })
    setStatusFilter('all')
    navigate('/')
  }

  const hasActiveFilters = search || filter.skill !== 'All Skills' || filter.course !== 'All Courses' ||
    filter.affiliation !== 'All Affiliations' || filter.year !== 'All Years' || statusFilter !== 'all'

  return (
    <div className="si-page">
      {/* Toast */}
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      {/* Page Header */}
      <div className="si-header">
        <div>
          <h1>Student Information</h1>
          <p>Manage student profiles, academic records, and personal histories.</p>
        </div>
        <div className="si-header-actions">
          {role === 'admin' && (
            <button className="btn-export" onClick={handleExport} title="Export to CSV">
              <Download size={14} strokeWidth={2} /> Export
            </button>
          )}
          {role === 'admin' && (
            <button className="btn-add-student" onClick={() => navigate('/add')}>
              <UserPlus size={15} strokeWidth={2} /> Add Student
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="si-tabs">
        <button className={`si-tab ${tab === 'overview' ? 'active' : ''}`} onClick={() => setTab('overview')}>Overview</button>
        <button className={`si-tab ${tab === 'personal' ? 'active' : ''}`} onClick={() => setTab('personal')}>Personal Details</button>
      </div>

      <div className="si-content">
        {/* Left: Student List */}
        <div className="si-list-panel">
          <div className="list-header">
            <h2>Student List</h2>
            <div className="list-header-right">
              <span className="total-count">{filtered.length} total</span>
              <button className={`view-btn ${viewMode === 'cards' ? 'active' : ''}`} title="Card view" onClick={() => setViewMode('cards')}><LayoutGrid size={14} strokeWidth={2}/></button>
              <button className={`view-btn ${viewMode === 'compact' ? 'active' : ''}`} title="Compact view" onClick={() => setViewMode('compact')}><AlignJustify size={14} strokeWidth={2}/></button>
              <button className={`view-btn ${viewMode === 'list' ? 'active' : ''}`} title="List view" onClick={() => setViewMode('list')}><List size={14} strokeWidth={2}/></button>
            </div>
          </div>

          {/* Search + Status Filter — Part 5: controlled input via SearchBar component */}
          <div className="list-search-row">
            {/* SearchBar receives value from parent state (one-way data flow) */}
            <SearchBar
              value={search}
              onChange={val => setSearch(val)}
              onClear={() => { setSearch(''); navigate('/students') }}
              placeholder="Search name or student number..."
            />
            <div className="status-filters">
              <button className={`status-btn ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>All</button>
              <button className={`status-btn ${statusFilter === 'enrolled' ? 'active' : ''}`} onClick={() => setStatusFilter('enrolled')}>Enrolled</button>
              <button className={`status-btn ${statusFilter === 'not-enrolled' ? 'active' : ''}`} onClick={() => setStatusFilter('not-enrolled')}>Not Enrolled</button>
            </div>
          </div>

          {/* Dropdown Filters */}
          <div className="list-filters">
            <select value={filter.skill} onChange={e => setFilter(p => ({ ...p, skill: e.target.value }))}>
              {SKILLS.map(s => <option key={s}>{s}</option>)}
            </select>
            <select value={filter.course} onChange={e => setFilter(p => ({ ...p, course: e.target.value }))}>
              {COURSES.map(c => <option key={c}>{c}</option>)}
            </select>
            <select value={filter.affiliation} onChange={e => setFilter(p => ({ ...p, affiliation: e.target.value }))}>
              {AFFILIATIONS.map(a => <option key={a}>{a}</option>)}
            </select>
            <select value={filter.year} onChange={e => setFilter(p => ({ ...p, year: e.target.value }))}>
              {YEARS.map(y => <option key={y}>{y}</option>)}
            </select>
            {hasActiveFilters && (
              <button className="btn-clear-filters" onClick={clearFilters} title="Clear all filters">✕ Clear</button>
            )}
          </div>

          {/* Student Rows */}
          {loading && <div className="si-loading"><span className="spinner" />Loading students...</div>}

          {!loading && filtered.length === 0 && (
            <div className="si-empty">
              <div className="empty-icon">🔍</div>
              <div>No students found.</div>
              {hasActiveFilters && <button className="btn-clear-filters" onClick={clearFilters}>Clear filters</button>}
            </div>
          )}

          {!loading && filtered.length > 0 && (
            <>
              {/* Overview tab: list/compact/cards */}
              {tab === 'overview' && (
                <div className={`student-rows ${viewMode}`}>
                  {filtered.map(s => (
                    <div key={s.id} className="student-row">
                      <div className="row-avatar">{s.first_name?.[0]}{s.last_name?.[0]}</div>
                      <div className="row-info">
                        <div className="row-name">{s.first_name} {s.last_name}</div>
                        <div className="row-sub">
                          {s.course || 'No course'}
                          {s.year_level ? ` · ${s.year_level}${['st','nd','rd','th'][s.year_level-1]||'th'} Year` : ''}
                        </div>
                        <div className="row-id">No. {s.student_id}</div>
                      </div>
                      <div className="row-right">
                        {s.year_level
                          ? <span className="status-badge enrolled">Enrolled</span>
                          : <span className="status-badge not-enrolled">Not Enrolled</span>
                        }
                        <div className="row-actions">
                          <Link to={`/students/${s.id}`} className="row-btn view"><Eye size={12} strokeWidth={2}/> View</Link>
                          {role === 'admin' && <Link to={`/edit/${s.id}`} className="row-btn edit"><Pencil size={12} strokeWidth={2}/> Edit</Link>}
                          {role === 'admin' && <button className="row-btn delete" onClick={() => handleDelete(s.id)}><Trash2 size={12} strokeWidth={2}/> Delete</button>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Personal Details tab: table view */}
              {tab === 'personal' && (
                <div className="personal-table-wrap">
                  <table className="personal-table">
                    <thead>
                      <tr>
                        <th>Student ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Gender</th>
                        <th>Date of Birth</th>
                        <th>Address</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(s => (
                        <tr key={s.id}>
                          <td><span className="row-id">{s.student_id}</span></td>
                          <td>
                            <div className="table-name-cell">
                              <div className="row-avatar small">{s.first_name?.[0]}{s.last_name?.[0]}</div>
                              {s.first_name} {s.last_name}
                            </div>
                          </td>
                          <td>{s.email || '—'}</td>
                          <td>{s.phone || '—'}</td>
                          <td>{s.gender || '—'}</td>
                          <td>{s.date_of_birth || '—'}</td>
                          <td className="address-cell">{s.address || '—'}</td>
                          <td>
                            <div className="row-actions">
                              <Link to={`/students/${s.id}`} className="row-btn view"><Eye size={12} strokeWidth={2}/> View</Link>
                              {role === 'admin' && <Link to={`/edit/${s.id}`} className="row-btn edit"><Pencil size={12} strokeWidth={2}/> Edit</Link>}
                              {role === 'admin' && <button className="row-btn delete" onClick={() => handleDelete(s.id)}><Trash2 size={12} strokeWidth={2}/> Delete</button>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right: Quick Stats */}
        <div className="si-stats-panel">
          <div className="stats-title">QUICK STATS</div>
          <div className="stat-row clickable" onClick={() => { setStatusFilter('all'); clearFilters() }}>
            <span className="stat-icon orange"><GraduationCap size={16} strokeWidth={1.8}/></span>
            <span className="stat-label">Total Students</span>
            <span className="stat-value">{stats.total}</span>
          </div>
          <div className="stat-row clickable" onClick={() => setStatusFilter('enrolled')}>
            <span className="stat-icon green"><UserCheck size={16} strokeWidth={1.8}/></span>
            <span className="stat-label">Currently Enrolled</span>
            <span className="stat-value">{stats.enrolled}</span>
          </div>
          <div className="stat-row clickable" onClick={() => setStatusFilter('not-enrolled')}>
            <span className="stat-icon gray"><UserX size={16} strokeWidth={1.8}/></span>
            <span className="stat-label">Not Enrolled</span>
            <span className="stat-value">{stats.notEnrolled}</span>
          </div>

          <div className="stats-divider" />
          <div className="stats-title" style={{marginTop:'0.5rem'}}>FILTER ACTIVE</div>
          <div className="active-filters-list">
            {!hasActiveFilters && <span className="no-filter">None</span>}
            {search && <span className="filter-chip">Search: "{search}"</span>}
            {statusFilter !== 'all' && <span className="filter-chip">{statusFilter}</span>}
            {filter.skill !== 'All Skills' && <span className="filter-chip">{filter.skill}</span>}
            {filter.course !== 'All Courses' && <span className="filter-chip">{filter.course}</span>}
            {filter.affiliation !== 'All Affiliations' && <span className="filter-chip">{filter.affiliation}</span>}
            {filter.year !== 'All Years' && <span className="filter-chip">{filter.year}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}
