import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getStudents, getStudentCount } from '../api/supabase-students'
import {
  GraduationCap, UserCheck, UserX, AlertTriangle,
  UserPlus, Users, Search, ClipboardList, ArrowRight,
  TrendingUp, Award, Building2, Zap, Calendar, BarChart3
} from 'lucide-react'

export default function Dashboard() {
  const [students, setStudents] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    Promise.all([
      getStudents().then(({ data }) => data),
      getStudentCount()
    ]).then(([data, count]) => {
      setStudents(data)
      setTotalCount(count)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const stats = {
    total: totalCount,
    enrolled: students.filter(s => s.year_level).length,
    notEnrolled: students.filter(s => !s.year_level).length,
    withViolations: students.filter(s => s.violations?.length > 0).length,
    highPerformers: students.filter(s => s.gpa >= 3.5).length,
    withSkills: students.filter(s => s.skills?.length > 0).length,
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
    <div className="dashboard-page">
      {/* Enhanced Welcome Banner */}
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <div className="header-logo">
              <img src="/logo.png" alt="CCS Logo" className="logo-image" />
            </div>
            <div className="header-text">
              <h1 className="dashboard-title">
                <BarChart3 className="title-icon" />
                College of Computing Studies
              </h1>
              <p className="dashboard-subtitle">
                {greeting}! Welcome to the Student Profiling System
              </p>
              <div className="dashboard-date">
                <Calendar className="date-icon" />
                {now.toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          </div>
          <div className="header-actions">
            <button className="primary-action-btn" onClick={() => navigate('/add')}>
              <UserPlus className="btn-icon" />
              Add New Student
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Stat Cards */}
      <div className="stats-grid">
        <div className="stat-card total" onClick={() => navigate('/students')}>
          <div className="stat-icon">
            <GraduationCap className="icon" />
          </div>
          <div className="stat-content">
            <div className="stat-number">{loading ? '—' : stats.total}</div>
            <div className="stat-label">Total Students</div>
            <div className="stat-sublabel">All registered students</div>
          </div>
          <div className="stat-trend">
            <ArrowRight className="trend-icon" />
          </div>
        </div>

        <div className="stat-card enrolled" onClick={() => navigate('/students')}>
          <div className="stat-icon">
            <UserCheck className="icon" />
          </div>
          <div className="stat-content">
            <div className="stat-number">{loading ? '—' : stats.enrolled}</div>
            <div className="stat-label">Enrolled</div>
            <div className="stat-sublabel">Currently active students</div>
          </div>
          <div className="stat-trend">
            <ArrowRight className="trend-icon" />
          </div>
        </div>

        <div className="stat-card high-performers" onClick={() => navigate('/reports-query')}>
          <div className="stat-icon">
            <Award className="icon" />
          </div>
          <div className="stat-content">
            <div className="stat-number">{loading ? '—' : stats.highPerformers}</div>
            <div className="stat-label">High Performers</div>
            <div className="stat-sublabel">GPA 3.5 and above</div>
          </div>
          <div className="stat-trend">
            <ArrowRight className="trend-icon" />
          </div>
        </div>

        <div className="stat-card violations" onClick={() => navigate('/reports-query')}>
          <div className="stat-icon">
            <AlertTriangle className="icon" />
          </div>
          <div className="stat-content">
            <div className="stat-number">{loading ? '—' : stats.withViolations}</div>
            <div className="stat-label">With Records</div>
            <div className="stat-sublabel">Disciplinary actions</div>
          </div>
          <div className="stat-trend">
            <ArrowRight className="trend-icon" />
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Enhanced Recent Students */}
        <div className="dashboard-card recent-students">
          <div className="card-header">
            <div className="card-title">
              <Users className="card-icon" />
              <h2>Recent Students</h2>
            </div>
            <Link to="/students" className="card-action">View All</Link>
          </div>
          <div className="card-content">
            {loading && (
              <div className="loading-state">
                <div className="loading-spinner"></div>
                <span>Loading students...</span>
              </div>
            )}
            {!loading && recent.length === 0 && (
              <div className="empty-state">
                <Users className="empty-icon" />
                <h3>No students yet</h3>
                <p>Start by adding your first student to the system</p>
                <button className="empty-action-btn" onClick={() => navigate('/add')}>
                  <UserPlus className="btn-icon" />
                  Add First Student
                </button>
              </div>
            )}
            {!loading && recent.map(s => (
              <div key={s.id} className="student-row">
                <div className="student-avatar">
                  {s.first_name?.[0]}{s.last_name?.[0]}
                </div>
                <div className="student-info">
                  <div className="student-name">{s.first_name} {s.last_name}</div>
                  <div className="student-details">
                    <span className="student-id">{s.student_id}</span>
                    <span className="student-course">{s.course || 'No course'}</span>
                    {s.year_level && <span className="student-year">Year {s.year_level}</span>}
                  </div>
                </div>
                <div className="student-actions">
                  <span className={`status-badge ${s.year_level ? 'enrolled' : 'not-enrolled'}`}>
                    {s.year_level ? 'Enrolled' : 'Not Enrolled'}
                  </span>
                  <Link to={`/admin/students/${s.id}`} className="view-btn">
                    <ArrowRight className="btn-icon" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Enhanced Year Level Distribution */}
        <div className="dashboard-card year-distribution">
          <div className="card-header">
            <div className="card-title">
              <TrendingUp className="card-icon" />
              <h2>Year Level Distribution</h2>
            </div>
          </div>
          <div className="card-content">
            <div className="year-chart">
              {[1,2,3,4].map(yr => (
                <div key={yr} className="year-bar">
                  <div className="year-info">
                    <span className="year-label">{yr}{['st','nd','rd','th'][yr-1]} Year</span>
                    <span className="year-count">{yearDist[yr]}</span>
                  </div>
                  <div className="year-progress">
                    <div
                      className={`year-fill year-${yr}`}
                      style={{ width: `${(yearDist[yr] / maxYear) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Enhanced Top Skills */}
        <div className="dashboard-card top-skills">
          <div className="card-header">
            <div className="card-title">
              <Award className="card-icon" />
              <h2>Popular Skills</h2>
            </div>
            <Link to="/reports-query" className="card-action">Query Skills</Link>
          </div>
          <div className="card-content">
            {topSkills.length === 0 ? (
              <div className="empty-state-small">
                <Award className="empty-icon" />
                <p>No skills data available yet</p>
              </div>
            ) : (
              <div className="skills-list">
                {topSkills.map(([skill, count]) => (
                  <div key={skill} className="skill-item">
                    <div className="skill-info">
                      <span className="skill-name">{skill}</span>
                      <span className="skill-count">{count} student{count !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="skill-bar">
                      <div 
                        className="skill-fill" 
                        style={{ width: `${(count / topSkills[0][1]) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Course Distribution */}
        <div className="dashboard-card course-distribution">
          <div className="card-header">
            <div className="card-title">
              <Building2 className="card-icon" />
              <h2>Course Programs</h2>
            </div>
          </div>
          <div className="card-content">
            {topCourses.length === 0 ? (
              <div className="empty-state-small">
                <Building2 className="empty-icon" />
                <p>No course data available yet</p>
              </div>
            ) : (
              <div className="courses-list">
                {topCourses.map(([course, count], index) => (
                  <div key={course} className="course-item">
                    <div className={`course-indicator course-${index + 1}`} />
                    <div className="course-info">
                      <span className="course-name">{course}</span>
                      <span className="course-count">{count} students</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Quick Actions */}
        <div className="dashboard-card quick-actions">
          <div className="card-header">
            <div className="card-title">
              <Zap className="card-icon" />
              <h2>Quick Actions</h2>
            </div>
          </div>
          <div className="card-content">
            <div className="actions-grid">
              <button className="action-btn primary" onClick={() => navigate('/add')}>
                <UserPlus className="action-icon" />
                <span className="action-label">Add Student</span>
                <span className="action-desc">Register new student</span>
              </button>
              <button className="action-btn secondary" onClick={() => navigate('/students')}>
                <Users className="action-icon" />
                <span className="action-label">View Students</span>
                <span className="action-desc">Browse all records</span>
              </button>
              <button className="action-btn tertiary" onClick={() => navigate('/reports-query')}>
                <Search className="action-icon" />
                <span className="action-label">Search & Filter</span>
                <span className="action-desc">Find specific students</span>
              </button>
              <button className="action-btn quaternary" onClick={() => navigate('/reports')}>
                <BarChart3 className="action-icon" />
                <span className="action-label">View Reports</span>
                <span className="action-desc">Analytics & insights</span>
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Top Affiliations */}
        <div className="dashboard-card top-affiliations">
          <div className="card-header">
            <div className="card-title">
              <ClipboardList className="card-icon" />
              <h2>Top Organizations</h2>
            </div>
          </div>
          <div className="card-content">
            {topAffiliations.length === 0 ? (
              <div className="empty-state-small">
                <ClipboardList className="empty-icon" />
                <p>No organization data available yet</p>
              </div>
            ) : (
              <div className="affiliations-list">
                {topAffiliations.map(([aff, count], index) => (
                  <div key={aff} className="affiliation-item">
                    <div className="affiliation-rank">#{index + 1}</div>
                    <div className="affiliation-info">
                      <span className="affiliation-name">{aff}</span>
                      <span className="affiliation-count">{count} members</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
