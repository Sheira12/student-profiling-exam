import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, User, BookOpen, Award, AlertTriangle, Users, LogOut, ChevronDown } from 'lucide-react'
import { CURRICULUM } from '../data/curriculum'

function getStatus(grade) {
  if (!grade) return ''
  if (['PASSED','INC','ENROLLED','DROPPED','FAILED'].includes(grade)) return grade
  const g = parseFloat(grade)
  if (isNaN(g)) return ''
  return g <= 3.0 ? 'PASSED' : 'FAILED'
}

function StatusBadge({ status }) {
  const map = {
    PASSED:   'apt-passed',
    FAILED:   'apt-failed',
    INC:      'apt-inc',
    ENROLLED: 'apt-enrolled',
    DROPPED:  'apt-dropped',
  }
  if (!status) return <span style={{color:'#aaa'}}>—</span>
  return <span className={`apt-status ${map[status] || ''}`}>{status}</span>
}

export default function StudentPortal({ student, onLogout }) {
  const [tab, setTab] = useState('profile')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const progress = student.academic_progress || {}

  const allSubjects = CURRICULUM.flatMap(s => s.subjects)
  const totalUnits = allSubjects.reduce((a, s) => a + s.units, 0)
  const passedUnits = allSubjects.filter(s => getStatus(progress[s.code]) === 'PASSED').reduce((a, s) => a + s.units, 0)
  const pct = Math.round((passedUnits / totalUnits) * 100)

  return (
    <div className="sp-root">
      {/* Topbar */}
      <header className="sp-topbar">
        <div className="sp-topbar-brand">
          <img src="/logo.png" alt="CCS" className="sp-topbar-logo" />
          <div>
            <div className="sp-topbar-title">Student Portal</div>
            <div className="sp-topbar-sub">Pamantasan ng Cabuyao — CCS</div>
          </div>
        </div>
        <div className="sp-topbar-right">
          {/* Logged-in student name display */}
          <div className="sp-logged-in-label">
            Logged in as: <strong>{student.first_name} {student.last_name}</strong>
            <span className="sp-logged-in-id">({student.student_id})</span>
          </div>
          <div className="sp-user-wrap">
            <button className="sp-user-btn" onClick={() => setDropdownOpen(o => !o)}>
              <div className="sp-user-avatar">{student.first_name?.[0]}{student.last_name?.[0]}</div>
              <span className="sp-user-name">{student.first_name} {student.last_name}</span>
              <ChevronDown size={14} className={dropdownOpen ? 'rotated' : ''} />
            </button>
            {dropdownOpen && (
              <div className="sp-dropdown">
                <div className="sp-dropdown-info">
                  <div className="sp-dropdown-avatar">{student.first_name?.[0]}{student.last_name?.[0]}</div>
                  <div>
                    <div className="sp-dropdown-name">{student.first_name} {student.last_name}</div>
                    <div className="sp-dropdown-id">ID: {student.student_id}</div>
                  </div>
                </div>
                <div className="dropdown-divider" />
                <button className="dropdown-item logout" onClick={onLogout}>
                  <LogOut size={14} strokeWidth={2} /> Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="sp-body">
        {/* Sidebar */}
        <aside className="sp-sidebar">
          {[
            { id: 'profile',  icon: User,          label: 'My Profile' },
            { id: 'academic', icon: BookOpen,       label: 'Academic Progress' },
            { id: 'skills',   icon: Award,          label: 'Skills & Activities' },
            { id: 'violations', icon: AlertTriangle, label: 'Suspension' },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              className={`sp-nav-btn ${tab === id ? 'active' : ''}`}
              onClick={() => setTab(id)}
            >
              <Icon size={17} strokeWidth={1.8} />
              <span>{label}</span>
            </button>
          ))}
        </aside>

        {/* Main content */}
        <main className="sp-main">

          {/* Profile Tab */}
          {tab === 'profile' && (
            <div className="sp-section">
              <div className="sp-profile-hero">
                <div className="sp-hero-avatar">{student.first_name?.[0]}{student.last_name?.[0]}</div>
                <div>
                  <h1>{student.first_name} {student.last_name}</h1>
                  <p className="sp-hero-id">Student No. {student.student_id}</p>
                  <p className="sp-hero-course">{student.course || '—'}</p>
                  {student.year_level
                    ? <span className="status-badge enrolled">Year {student.year_level} — Enrolled</span>
                    : <span className="status-badge not-enrolled">Not Enrolled</span>
                  }
                </div>
              </div>

              <div className="sp-cards-grid">
                <div className="sp-card">
                  <h3>Personal Information</h3>
                  <table className="info-table">
                    <tbody>
                      <tr><td>Email</td><td>{student.email || '—'}</td></tr>
                      <tr><td>Phone</td><td>{student.phone || '—'}</td></tr>
                      <tr><td>Gender</td><td>{student.gender || '—'}</td></tr>
                      <tr><td>Date of Birth</td><td>{student.date_of_birth || '—'}</td></tr>
                      <tr><td>Address</td><td>{student.address || '—'}</td></tr>
                    </tbody>
                  </table>
                </div>
                <div className="sp-card">
                  <h3>Academic Info</h3>
                  <table className="info-table">
                    <tbody>
                      <tr><td>Course</td><td>{student.course || '—'}</td></tr>
                      <tr><td>Year Level</td><td>{student.year_level ? `${student.year_level}${['st','nd','rd','th'][student.year_level-1]} Year` : '—'}</td></tr>
                      <tr><td>GPA</td><td><strong style={{color:'var(--orange)'}}>{student.gpa || '—'}</strong></td></tr>
                    </tbody>
                  </table>
                  {student.academic_awards?.length > 0 && (
                    <div className="tags" style={{marginTop:'0.75rem'}}>
                      {student.academic_awards.map(a => <span key={a} className="tag skill">{a}</span>)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Academic Progress Tab */}
          {tab === 'academic' && (
            <div className="sp-section">
              <div className="sp-section-header">
                <h2>Academic Progress</h2>
              </div>

              {/* Progress bar */}
              <div className="sp-progress-summary">
                <div className="sp-prog-stat">
                  <div className="sp-prog-val">{passedUnits}<span>/{totalUnits}</span></div>
                  <div className="sp-prog-label">Units Earned</div>
                </div>
                <div className="sp-prog-stat">
                  <div className="sp-prog-val" style={{color:'var(--orange)'}}>{student.gpa || '—'}</div>
                  <div className="sp-prog-label">GPA</div>
                </div>
                <div className="sp-prog-bar-wrap">
                  <div className="sp-prog-bar-label">Overall Completion — {pct}%</div>
                  <div className="apt-progress-track">
                    <div className="apt-progress-fill" style={{width:`${pct}%`}} />
                  </div>
                </div>
              </div>

              {CURRICULUM.map((sem, si) => (
                <div key={si} className="apt-semester">
                  <div className="apt-sem-header">{sem.year} : <em>{sem.semester}</em></div>
                  <table className="apt-table">
                    <thead>
                      <tr>
                        <th>Code</th><th>Subject</th><th>Units</th><th>Grade</th><th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sem.subjects.map(subj => {
                        const grade = progress[subj.code] || ''
                        return (
                          <tr key={subj.code}>
                            <td className="apt-code">{subj.code}</td>
                            <td>{subj.desc}</td>
                            <td className="apt-center">{subj.units}</td>
                            <td className="apt-center">{grade || '—'}</td>
                            <td className="apt-center"><StatusBadge status={getStatus(grade)} /></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          {/* Skills Tab */}
          {tab === 'skills' && (
            <div className="sp-section">
              <div className="sp-section-header"><h2>Skills & Activities</h2></div>
              <div className="sp-cards-grid">
                <div className="sp-card">
                  <h3>Skills</h3>
                  {student.skills?.length > 0
                    ? <div className="tags">{student.skills.map(s => <span key={s} className="tag skill">{s}</span>)}</div>
                    : <p className="sp-empty">No skills recorded.</p>}
                </div>
                <div className="sp-card">
                  <h3>Non-Academic Activities</h3>
                  {student.non_academic_activities?.length > 0
                    ? <div className="tags">{student.non_academic_activities.map(a => <span key={a} className="tag">{a}</span>)}</div>
                    : <p className="sp-empty">No activities recorded.</p>}
                </div>
                <div className="sp-card">
                  <h3>Affiliations</h3>
                  {student.affiliations?.length > 0
                    ? <div className="tags">{student.affiliations.map(a => <span key={a} className="tag affil">{a}</span>)}</div>
                    : <p className="sp-empty">No affiliations recorded.</p>}
                </div>
              </div>
            </div>
          )}

          {/* Suspension Tab */}
          {tab === 'violations' && (
            <div className="sp-section">
              <div className="sp-section-header"><h2>Suspension</h2></div>
              <div className="sp-card">
                {student.violations?.length > 0
                  ? <div className="suspension-entries">
                      {student.violations.map((v, i) => {
                        const match = v.match(/^(.+)\s*\((\d+)\s*days?\)$/i)
                        const reason = match ? match[1].trim() : v
                        const days = match ? match[2] : null
                        return (
                          <div key={i} className="suspension-entry">
                            <span className="suspension-reason">{reason}</span>
                            {days && <span className="suspension-badge">{days} day{days > 1 ? 's' : ''} suspended</span>}
                          </div>
                        )
                      })}
                    </div>
                  : <p className="sp-empty" style={{color:'#22c55e'}}>✓ No suspension on record.</p>}
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
