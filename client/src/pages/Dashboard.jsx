import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getStudents } from '../api/students'
import {
  GraduationCap, UserCheck, UserX, AlertTriangle,
  UserPlus, Users, Search, ClipboardList, ArrowRight,
  TrendingUp, Award, Building2, Zap
} from 'lucide-react'

export default function Dashboard() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    getStudents().then(({ data }) => {
      setStudents(data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const stats = {
    total: students.length,
    enrolled: students.filter(s => s.year_level).length,
    notEnrolled: students.filter(s => !s.year_level).length,
    withViolations: students.filter(s => s.violations?.length > 0).length,
  }

  // Top skills across all students
  const skillCount = {}
  students.forEach(s => (s.skills || []).forEach(sk => { skillCount[sk] = (skillCount[sk] || 0) + 1 }))
  const topSkills = Object.entries(skillCount).sort((a, b) => b[1] - a[1]).slice(0, 6)

  // Top affiliations
  const affCount = {}
  students.forEach(s => (s.affiliations || []).forEach(a => { affCount[a] = (affCount[a] || 0) + 1 }))
  const topAffiliations = Object.entries(affCount).sort((a, b) => b[1] - a[1]).slice(0, 5)

  // Year level distribution
  const yearDist = { 1: 0, 2: 0, 3: 0, 4: 0 }
  students.forEach(s => { if (s.year_level) yearDist[s.year_level]++ })
  const maxYear = Math.max(...Object.values(yearDist), 1)

  // Recent students (last 5)
  const recent = [...students].slice(0, 5)

  // Course distribution
  const courseCount = {}
  students.forEach(s => { if (s.course) courseCount[s.course] = (courseCount[s.course] || 0) + 1 })
  const topCourses = Object.entries(courseCount).sort((a, b) => b[1] - a[1]).slice(0, 4)

  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening'

  return (
    <div className="dash-page">

      {/* Welcome Banner */}
      <div className="dash-banner">
        <div className="dash-banner-left">
          <div className="dash-banner-logo">
            <img src="/logo.png" alt="CCS Logo" className="banner-logo-img" />
          </div>
          <div>
            <h1 className="dash-title">College of Computing Studies</h1>
            <p className="dash-subtitle">Pamantasan ng Cabuyao — Student Profiling System</p>
          </div>
        </div>
        <div className="dash-banner-right">
          <div className="dash-date">
            {now.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          <button className="btn-add-student" onClick={() => navigate('/add')}>+ Add Student</button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="dash-stats">
        <div className="dash-stat-card orange" onClick={() => navigate('/students')}>
          <div className="dsc-icon"><GraduationCap size={28} strokeWidth={1.6} /></div>
          <div className="dsc-body">
            <div className="dsc-value">{loading ? '—' : stats.total}</div>
            <div className="dsc-label">Total Students</div>
          </div>
          <ArrowRight size={16} className="dsc-arrow" strokeWidth={2} />
        </div>
        <div className="dash-stat-card green" onClick={() => navigate('/students')}>
          <div className="dsc-icon"><UserCheck size={28} strokeWidth={1.6} /></div>
          <div className="dsc-body">
            <div className="dsc-value">{loading ? '—' : stats.enrolled}</div>
            <div className="dsc-label">Enrolled</div>
          </div>
          <ArrowRight size={16} className="dsc-arrow" strokeWidth={2} />
        </div>
        <div className="dash-stat-card red" onClick={() => navigate('/students')}>
          <div className="dsc-icon"><UserX size={28} strokeWidth={1.6} /></div>
          <div className="dsc-body">
            <div className="dsc-value">{loading ? '—' : stats.notEnrolled}</div>
            <div className="dsc-label">Not Enrolled</div>
          </div>
          <ArrowRight size={16} className="dsc-arrow" strokeWidth={2} />
        </div>
        <div className="dash-stat-card yellow">
          <div className="dsc-icon"><AlertTriangle size={28} strokeWidth={1.6} /></div>
          <div className="dsc-body">
            <div className="dsc-value">{loading ? '—' : stats.withViolations}</div>
            <div className="dsc-label">With Violations</div>
          </div>
          <ArrowRight size={16} className="dsc-arrow" strokeWidth={2} />
        </div>
      </div>

      <div className="dash-grid">

        {/* Recent Students */}
        <div className="dash-card span-2">
          <div className="dash-card-header">
            <h2><Users size={15} style={{display:'inline',marginRight:'6px',verticalAlign:'middle'}}/>Recent Students</h2>
            <Link to="/students" className="dash-see-all">See all →</Link>
          </div>
          {loading && <div className="si-loading"><span className="spinner" />Loading...</div>}
          {!loading && recent.length === 0 && (
            <div className="dash-empty">
              <div>No students yet.</div>
              <button className="btn-add-student" onClick={() => navigate('/add')}>+ Add your first student</button>
            </div>
          )}
          {!loading && recent.map(s => (
            <div key={s.id} className="dash-student-row">
              <div className="row-avatar">{s.first_name?.[0]}{s.last_name?.[0]}</div>
              <div className="row-info">
                <div className="row-name">{s.first_name} {s.last_name}</div>
                <div className="row-sub">{s.course || 'No course'}{s.year_level ? ` · Year ${s.year_level}` : ''}</div>
              </div>
              <div className="dash-row-right">
                {s.year_level
                  ? <span className="status-badge enrolled">Enrolled</span>
                  : <span className="status-badge not-enrolled">Not Enrolled</span>
                }
                <Link to={`/students/${s.id}`} className="row-btn view">View</Link>
              </div>
            </div>
          ))}
        </div>

        {/* Year Level Distribution */}
        <div className="dash-card">
          <div className="dash-card-header"><h2><TrendingUp size={15} style={{display:'inline',marginRight:'6px',verticalAlign:'middle'}}/>Year Level Distribution</h2></div>
          <div className="year-bars">
            {[1,2,3,4].map(yr => (
              <div key={yr} className="year-bar-row">
                <span className="year-bar-label">{yr}{['st','nd','rd','th'][yr-1]} Year</span>
                <div className="year-bar-track">
                  <div
                    className="year-bar-fill"
                    style={{ width: `${(yearDist[yr] / maxYear) * 100}%` }}
                  />
                </div>
                <span className="year-bar-count">{yearDist[yr]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Skills */}
        <div className="dash-card">
          <div className="dash-card-header">
            <h2><Award size={15} style={{display:'inline',marginRight:'6px',verticalAlign:'middle'}}/>Top Skills</h2>
            <Link to="/query" className="dash-see-all">Query →</Link>
          </div>
          {topSkills.length === 0 && <div className="dash-empty-sm">No skills data yet.</div>}
          <div className="skill-chips">
            {topSkills.map(([skill, count]) => (
              <div key={skill} className="skill-chip-row">
                <span className="skill-chip">{skill}</span>
                <span className="skill-chip-count">{count} student{count !== 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Course Distribution */}
        <div className="dash-card">
          <div className="dash-card-header"><h2><Building2 size={15} style={{display:'inline',marginRight:'6px',verticalAlign:'middle'}}/>By Course</h2></div>
          {topCourses.length === 0 && <div className="dash-empty-sm">No course data yet.</div>}
          <div className="course-list">
            {topCourses.map(([course, count]) => (
              <div key={course} className="course-row">
                <div className="course-dot" />
                <span className="course-name">{course}</span>
                <span className="course-count">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Affiliations */}
        <div className="dash-card">
          <div className="dash-card-header"><h2><ClipboardList size={15} style={{display:'inline',marginRight:'6px',verticalAlign:'middle'}}/>Top Affiliations</h2></div>
          {topAffiliations.length === 0 && <div className="dash-empty-sm">No affiliation data yet.</div>}
          <div className="affil-list">
            {topAffiliations.map(([aff, count], i) => (
              <div key={aff} className="affil-row">
                <span className="affil-rank">{i + 1}</span>
                <span className="affil-name">{aff}</span>
                <span className="affil-count">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dash-card">
          <div className="dash-card-header"><h2><Zap size={15} style={{display:'inline',marginRight:'6px',verticalAlign:'middle'}}/>Quick Actions</h2></div>
          <div className="quick-actions">
            <button className="qa-btn" onClick={() => navigate('/add')}>
              <UserPlus size={22} strokeWidth={1.6} className="qa-icon-svg" />
              <span>Add Student</span>
            </button>
            <button className="qa-btn" onClick={() => navigate('/students')}>
              <Users size={22} strokeWidth={1.6} className="qa-icon-svg" />
              <span>View All Students</span>
            </button>
            <button className="qa-btn" onClick={() => navigate('/query')}>
              <Search size={22} strokeWidth={1.6} className="qa-icon-svg" />
              <span>Query / Filter</span>
            </button>
            <button className="qa-btn" onClick={() => navigate('/students')}>
              <ClipboardList size={22} strokeWidth={1.6} className="qa-icon-svg" />
              <span>Personal Details</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
