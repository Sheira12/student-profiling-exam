import { useState, useEffect, useRef } from 'react'
import {
  GraduationCap, User, BookOpen, Award, AlertTriangle, Users,
  LogOut, ChevronDown, Home, TrendingUp, CheckCircle, Clock,
  XCircle, Star, Activity, Shield, Mail, Phone, MapPin,
  Calendar, Hash, ChevronRight, BarChart2, Bell, MessageSquare,
  Send, Briefcase, RefreshCw, Megaphone, Moon, Sun, CalendarDays, ArrowLeft, X
} from 'lucide-react'
import { CURRICULUM } from '../data/curriculum'
import {
  getAssignmentByStudent, getNotifications, markAllNotificationsRead,
  getMessages, sendMessage, getCurriculumDeployments, getStudentAnnouncements,
  getClassSchedules
} from '../api/rbac'
import { getStudent } from '../api/supabase-students'
import { setStudent } from '../hooks/useAuth'
import StudentActivitiesView from './StudentActivitiesView'
import StudentGradesView from './StudentGradesView'

function getStatus(grade) {
  if (!grade) return ''
  if (['PASSED', 'INC', 'ENROLLED', 'DROPPED', 'FAILED'].includes(grade)) return grade
  const g = parseFloat(grade)
  if (isNaN(g)) return ''
  return g <= 3.0 ? 'PASSED' : 'FAILED'
}

function StatusBadge({ status }) {
  const map = {
    PASSED:   { cls: 'apt-passed',   icon: CheckCircle },
    FAILED:   { cls: 'apt-failed',   icon: XCircle },
    INC:      { cls: 'apt-inc',      icon: Clock },
    ENROLLED: { cls: 'apt-enrolled', icon: Clock },
    DROPPED:  { cls: 'apt-dropped',  icon: XCircle },
  }
  if (!status) return <span style={{ color: '#aaa' }}>—</span>
  const { cls } = map[status] || {}
  return <span className={`apt-status ${cls || ''}`}>{status}</span>
}

export default function StudentPortal({ student: initialStudent, onLogout }) {
  const [student, setStudentInfo] = useState(initialStudent)
  const [tab, setTab] = useState('overview')
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('student_dark_mode') === 'dark')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Refresh student data from DB on mount — session storage may be stale
  useEffect(() => {
    getStudent(initialStudent.id)
      .then(({ data }) => {
        if (data) {
          setStudentInfo(data)
          setStudent(data) // keep session storage in sync
        }
      })
      .catch(() => {}) // silently fail — use cached data
  }, [initialStudent.id])
  const [deployments, setDeployments] = useState([])
  const [adviser, setAdviser] = useState(null)
  const [notifications, setNotifications] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [messages, setMessages] = useState([])
  const [schedules, setSchedules] = useState([])
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [msgInput, setMsgInput] = useState('')
  const msgEndRef = useRef(null)
  const progress = student.academic_progress || {}

  const toggleDark = () => setDarkMode(d => {
    const next = !d
    localStorage.setItem('student_dark_mode', next ? 'dark' : 'light')
    return next
  })

  const unreadCount = notifications.filter(n => !n.is_read).length

  useEffect(() => { loadPortalData() }, [])
  useEffect(() => { if (tab === 'messages' && adviser) loadMessages() }, [tab, adviser])
  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // Poll messages every 5s when on messages tab
  useEffect(() => {
    if (tab !== 'messages' || !adviser) return
    const interval = setInterval(loadMessages, 5000)
    return () => clearInterval(interval)
  }, [tab, adviser])

  // Poll notifications every 15s
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const { data } = await getNotifications('student', student.id)
        setNotifications(data || [])
      } catch {}
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  const loadPortalData = async () => {
    const safe = (fn) => fn.catch(() => ({ data: null }))

    // Refresh student data from DB
    try {
      const { data: freshStudent } = await getStudent(student.id)
      if (freshStudent) {
        setStudentInfo(freshStudent)
        setStudent(freshStudent)
      }
    } catch {}

    const asgnResult = await safe(getAssignmentByStudent(student.id))
    const adviserData = asgnResult.data || null
    setAdviser(adviserData)

    const adviserUUID = adviserData?.employees?.id || null

    const [deps, notifs, anns, scheds] = await Promise.all([
      safe(getCurriculumDeployments(student.id)),
      safe(getNotifications('student', student.id)),
      safe(getStudentAnnouncements(student.id, adviserUUID)),
      adviserUUID ? safe(getClassSchedules(adviserUUID)) : Promise.resolve({ data: [] }),
    ])
    setDeployments(deps.data || [])
    setNotifications(notifs.data || [])
    setAnnouncements(anns.data || [])
    setSchedules(scheds.data || [])
  }

  const loadMessages = async () => {
    if (!adviser?.employees?.id) return
    try {
      const { data } = await getMessages('student', student.id, 'employee', adviser.employees.id)
      setMessages(data || [])
    } catch {}
  }

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead('student', student.id)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!msgInput.trim() || !adviser?.employees?.id) return
    await sendMessage({ sender_type: 'student', sender_id: student.id, receiver_type: 'employee', receiver_id: adviser.employees.id, content: msgInput.trim() })
    setMsgInput('')
    loadMessages()
  }

  const allSubjects = CURRICULUM.flatMap(s => s.subjects)
  const totalUnits = allSubjects.reduce((a, s) => a + s.units, 0)
  const passedSubjects = allSubjects.filter(s => getStatus(progress[s.code]) === 'PASSED')
  const passedUnits = passedSubjects.reduce((a, s) => a + s.units, 0)
  const failedSubjects = allSubjects.filter(s => getStatus(progress[s.code]) === 'FAILED')
  const enrolledSubjects = allSubjects.filter(s => getStatus(progress[s.code]) === 'ENROLLED')
  const pct = Math.round((passedUnits / totalUnits) * 100)

  const navItems = [
    { id: 'overview',    icon: Home,           label: 'Overview' },
    { id: 'profile',     icon: User,           label: 'My Profile' },
    { id: 'academic',    icon: BookOpen,       label: 'Academic Progress' },
    { id: 'grades',      icon: BarChart2,      label: 'My Grades' },
    { id: 'subjects',    icon: GraduationCap,  label: 'My Subjects' },
    { id: 'activities',  icon: CheckCircle,    label: 'Activities' },
    { id: 'schedule',    icon: CalendarDays,   label: 'Schedule' },
    { id: 'skills',      icon: Award,          label: 'Skills & Activities' },
    { id: 'violations',  icon: Shield,         label: 'Disciplinary' },
    { id: 'messages',    icon: MessageSquare,  label: 'Messages' },
    { id: 'notifs',      icon: Bell,           label: 'Notifications', badge: unreadCount },
    { id: 'announce',    icon: Megaphone,      label: 'Announcements' },
  ]

  return (
    <div className={`sp-root student-portal${darkMode ? ' dark' : ''}`}>

      {/* ── Topbar ── */}
      <header className="sp-topbar">
        <div className="sp-topbar-brand">
          {/* Hamburger — shown on mobile via inline style */}
          <button
            onClick={() => setMobileMenuOpen(o => !o)}
            title="Toggle menu"
            type="button"
            style={{
              display: isMobile ? 'flex' : 'none',
              alignItems: 'center',
              justifyContent: 'center',
              width: 40,
              height: 40,
              background: 'var(--orange-light)',
              border: '1px solid var(--orange)',
              borderRadius: 8,
              cursor: 'pointer',
              color: 'var(--orange)',
              flexShrink: 0,
              marginRight: 4,
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <img src="/logo.png" alt="CCS" className="sp-topbar-logo" />
          <div>
            <div className="sp-topbar-title">Student Portal</div>
            <div className="sp-topbar-sub">Pamantasan ng Cabuyao — CCS</div>
          </div>
        </div>
        <div className="sp-topbar-right">
          <button className="icon-btn" onClick={toggleDark} title={darkMode ? 'Light mode' : 'Dark mode'}>
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
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

        {/* Mobile overlay */}
        {isMobile && mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen(false)}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 9998,
            }}
          />
        )}

        {/* ── Sidebar ── */}
        <aside
          style={{
            width: isMobile ? 270 : 220,
            flexShrink: 0,
            background: darkMode ? '#1e293b' : 'white',
            borderRight: `1px solid ${darkMode ? '#334155' : 'var(--border)'}`,
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            ...(isMobile ? {
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              height: '100vh',
              zIndex: 9999,
              transform: mobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
              transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
              boxShadow: '4px 0 24px rgba(0,0,0,0.18)',
              overflowY: 'auto',
            } : {
              position: 'sticky',
              top: 58,
              height: 'calc(100vh - 58px)',
              overflowY: 'auto',
            }),
          }}
        >
          {/* Close button (mobile only) */}
          {isMobile && (
            <button
              onClick={() => setMobileMenuOpen(false)}
              style={{
                position: 'absolute', top: 12, right: 12,
                background: 'rgba(0,0,0,0.08)', border: 'none',
                borderRadius: 6, cursor: 'pointer',
                color: 'var(--text)', padding: 6,
                width: 32, height: 32,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 10,
              }}
            >
              <X size={18} />
            </button>
          )}
          <div className="sp-sidebar-profile">
            <div className="sp-sidebar-avatar">{student.first_name?.[0]}{student.last_name?.[0]}</div>
            <div className="sp-sidebar-name">{student.first_name} {student.last_name}</div>
            <div className="sp-sidebar-id">{student.student_id}</div>
            <span className={`sp-sidebar-status ${student.year_level ? 'enrolled' : 'not-enrolled'}`}>
              {student.year_level ? `Year ${student.year_level} · Enrolled` : 'Not Enrolled'}
            </span>
          </div>

          <nav className="sp-sidebar-nav">
            {navItems.map(({ id, icon: Icon, label, badge }) => (
              <button
                key={id}
                className={`sp-nav-btn ${tab === id ? 'active' : ''}`}
                onClick={() => { setTab(id); setMobileMenuOpen(false) }}
              >
                <Icon size={17} strokeWidth={1.8} />
                <span>{label}</span>
                {badge > 0 && <span className="emp-nav-badge">{badge}</span>}
                {tab === id && <ChevronRight size={14} className="sp-nav-arrow" />}
              </button>
            ))}
          </nav>

          <button className="sp-logout-btn" style={{ color: '#16a34a', borderColor: '#bbf7d0' }} onClick={loadPortalData}>
            <RefreshCw size={15} /><span>Refresh</span>
          </button>
        </aside>

        {/* ── Main ── */}
        <main className="sp-main">

          {/* ══ OVERVIEW TAB ══ */}
          {tab === 'overview' && (
            <div className="sp-section">
              {/* Welcome banner */}
              <div className="sp-welcome-banner">
                <div className="sp-welcome-left">
                  <div className="sp-welcome-avatar">{student.first_name?.[0]}{student.last_name?.[0]}</div>
                  <div>
                    <p className="sp-welcome-greeting">Welcome back,</p>
                    <h1 className="sp-welcome-name">{student.first_name} {student.last_name}</h1>
                    <div className="sp-welcome-meta">
                      <span><Hash size={13} /> {student.student_id}</span>
                      <span><GraduationCap size={13} /> {student.course || '—'}</span>
                      {student.year_level && <span><BookOpen size={13} /> Year {student.year_level}</span>}
                    </div>
                  </div>
                </div>
                <div className="sp-welcome-gpa">
                  <div className="sp-gpa-ring">
                    <span className="sp-gpa-val">{student.gpa || '—'}</span>
                    <span className="sp-gpa-lbl">GPA</span>
                  </div>
                </div>
              </div>

              {/* Quick stats */}
              <div className="sp-overview-stats">
                {[
                  { icon: CheckCircle, color: '#10b981', bg: '#d1fae5', val: passedSubjects.length,  lbl: 'Subjects Passed' },
                  { icon: Clock,       color: '#3b82f6', bg: '#dbeafe', val: enrolledSubjects.length, lbl: 'Currently Enrolled' },
                  { icon: XCircle,     color: '#ef4444', bg: '#fee2e2', val: failedSubjects.length,  lbl: 'Subjects Failed' },
                  { icon: BarChart2,   color: '#f59e0b', bg: '#fef3c7', val: `${pct}%`,              lbl: 'Completion' },
                ].map(({ icon: Icon, color, bg, val, lbl }) => (
                  <div key={lbl} className="sp-overview-stat">
                    <div className="sp-overview-stat-icon" style={{ background: bg, color }}>
                      <Icon size={20} />
                    </div>
                    <div className="sp-overview-stat-val">{val}</div>
                    <div className="sp-overview-stat-lbl">{lbl}</div>
                  </div>
                ))}
              </div>

              {/* Progress bar */}
              <div className="sp-overview-progress-card">
                <div className="sp-overview-progress-head">
                  <span className="sp-overview-progress-title">
                    <TrendingUp size={16} /> Degree Completion
                  </span>
                  <span className="sp-overview-progress-pct">{passedUnits} / {totalUnits} units</span>
                </div>
                <div className="sp-prog-track">
                  <div className="sp-prog-fill" style={{ width: `${pct}%` }} />
                </div>
                <div className="sp-overview-progress-foot">{pct}% complete</div>
              </div>

              {/* Quick info cards */}
              <div className="sp-overview-grid">
                <div className="sp-overview-card" onClick={() => setTab('profile')}>
                  <div className="sp-overview-card-icon" style={{ background: '#ede9fe', color: '#7c3aed' }}>
                    <User size={18} />
                  </div>
                  <div>
                    <div className="sp-overview-card-title">Personal Info</div>
                    <div className="sp-overview-card-sub">{student.email || 'View details'}</div>
                  </div>
                  <ChevronRight size={16} className="sp-overview-card-arrow" />
                </div>

                <div className="sp-overview-card" onClick={() => setTab('skills')}>
                  <div className="sp-overview-card-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                    <Star size={18} />
                  </div>
                  <div>
                    <div className="sp-overview-card-title">Skills & Activities</div>
                    <div className="sp-overview-card-sub">
                      {student.skills?.length > 0 ? `${student.skills.length} skills recorded` : 'No skills yet'}
                    </div>
                  </div>
                  <ChevronRight size={16} className="sp-overview-card-arrow" />
                </div>

                <div className="sp-overview-card" onClick={() => setTab('academic')}>
                  <div className="sp-overview-card-icon" style={{ background: '#d1fae5', color: '#059669' }}>
                    <BookOpen size={18} />
                  </div>
                  <div>
                    <div className="sp-overview-card-title">Academic Progress</div>
                    <div className="sp-overview-card-sub">{passedSubjects.length} of {allSubjects.length} subjects passed</div>
                  </div>
                  <ChevronRight size={16} className="sp-overview-card-arrow" />
                </div>

                <div className="sp-overview-card" onClick={() => setTab('violations')}>
                  <div className="sp-overview-card-icon" style={{ background: student.violations?.length > 0 ? '#fee2e2' : '#f0fdf4', color: student.violations?.length > 0 ? '#dc2626' : '#16a34a' }}>
                    <Shield size={18} />
                  </div>
                  <div>
                    <div className="sp-overview-card-title">Disciplinary Record</div>
                    <div className="sp-overview-card-sub">
                      {student.violations?.length > 0 ? `${student.violations.length} record(s) on file` : 'Clean record ✓'}
                    </div>
                  </div>
                  <ChevronRight size={16} className="sp-overview-card-arrow" />
                </div>
              </div>

              {/* Awards */}
              {student.academic_awards?.length > 0 && (
                <div className="sp-overview-awards">
                  <div className="sp-overview-awards-title"><Award size={15} /> Academic Awards</div>
                  <div className="tags">
                    {student.academic_awards.map(a => <span key={a} className="tag skill">{a}</span>)}
                  </div>
                </div>
              )}

              {/* Adviser card */}
              {adviser?.employees && (
                <div className="sp-overview-awards" style={{
                  borderColor: darkMode ? '#334155' : '#bfdbfe',
                  background: darkMode ? '#1e293b' : '#eff6ff'
                }}>
                  <div className="sp-overview-awards-title" style={{ color: darkMode ? '#60a5fa' : '#1d4ed8' }}>
                    <Briefcase size={15} /> Your Assigned Adviser
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
                    <div className="rq-avatar" style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', width: 40, height: 40, fontSize: '0.85rem' }}>
                      {adviser.employees.first_name?.[0]}{adviser.employees.last_name?.[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: darkMode ? '#f1f5f9' : 'var(--text)' }}>
                        {adviser.employees.first_name} {adviser.employees.last_name}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: darkMode ? '#94a3b8' : 'var(--muted)' }}>
                        {adviser.employees.position} · {adviser.employees.department}
                      </div>
                      {adviser.employees.email && (
                        <div style={{ fontSize: '0.75rem', color: '#60a5fa' }}>{adviser.employees.email}</div>
                      )}
                    </div>
                    <button className="rq-btn-run" style={{ marginLeft: 'auto', padding: '7px 14px', fontSize: '0.8rem' }} onClick={() => setTab('messages')}>
                      <MessageSquare size={13} /> Message
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ PROFILE TAB ══ */}
          {tab === 'profile' && (
            <div className="sp-section">
              <div className="sp-section-header">
                <User size={18} />
                <h2>My Profile</h2>
              </div>

              <div className="sp-profile-hero">
                <div className="sp-hero-avatar">{student.first_name?.[0]}{student.last_name?.[0]}</div>
                <div className="sp-hero-info">
                  <h1>{student.first_name} {student.last_name}</h1>
                  <p className="sp-hero-id">Student No. {student.student_id}</p>
                  <p className="sp-hero-course">{student.course || '—'}</p>
                  <span className={`status-badge ${student.year_level ? 'enrolled' : 'not-enrolled'}`}>
                    {student.year_level ? `Year ${student.year_level} — Enrolled` : 'Not Enrolled'}
                  </span>
                </div>
              </div>

              <div className="sp-cards-grid">
                <div className="sp-card">
                  <h3><Mail size={14} /> Personal Information</h3>
                  <div className="sp-info-list">
                    {[
                      { icon: Mail,     label: 'Email',         val: student.email },
                      { icon: Phone,    label: 'Phone',         val: student.phone },
                      { icon: User,     label: 'Gender',        val: student.gender },
                      { icon: Calendar, label: 'Date of Birth', val: student.date_of_birth },
                      { icon: MapPin,   label: 'Address',       val: student.address },
                    ].map(({ icon: Icon, label, val }) => (
                      <div key={label} className="sp-info-row">
                        <span className="sp-info-label"><Icon size={13} /> {label}</span>
                        <span className="sp-info-val">{val || '—'}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="sp-card">
                  <h3><GraduationCap size={14} /> Academic Information</h3>
                  <div className="sp-info-list">
                    {[
                      { label: 'Course',     val: student.course },
                      { label: 'Year Level', val: student.year_level ? `${student.year_level}${['st','nd','rd','th'][student.year_level-1]} Year` : null },
                      { label: 'GPA',        val: student.gpa, highlight: true },
                    ].map(({ label, val, highlight }) => (
                      <div key={label} className="sp-info-row">
                        <span className="sp-info-label">{label}</span>
                        <span className="sp-info-val" style={highlight ? { color: '#16a34a', fontWeight: 700 } : {}}>
                          {val || '—'}
                        </span>
                      </div>
                    ))}
                  </div>
                  {student.academic_awards?.length > 0 && (
                    <>
                      <div className="sp-card-divider" />
                      <div className="sp-card-sub-title"><Award size={13} /> Awards</div>
                      <div className="tags">
                        {student.academic_awards.map(a => <span key={a} className="tag skill">{a}</span>)}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ══ ACADEMIC PROGRESS TAB ══ */}
          {tab === 'academic' && (
            <div className="sp-section">
              <div className="sp-section-header">
                <BookOpen size={18} />
                <h2>Academic Progress</h2>
              </div>

              <div className="sp-progress-summary">
                <div className="sp-prog-stat">
                  <div className="sp-prog-val">{passedUnits}<span>/{totalUnits}</span></div>
                  <div className="sp-prog-label">Units Earned</div>
                </div>
                <div className="sp-prog-stat">
                  <div className="sp-prog-val" style={{ color: '#10b981' }}>{passedSubjects.length}</div>
                  <div className="sp-prog-label">Passed</div>
                </div>
                <div className="sp-prog-stat">
                  <div className="sp-prog-val" style={{ color: '#ef4444' }}>{failedSubjects.length}</div>
                  <div className="sp-prog-label">Failed</div>
                </div>
                <div className="sp-prog-stat">
                  <div className="sp-prog-val" style={{ color: '#16a34a' }}>{student.gpa || '—'}</div>
                  <div className="sp-prog-label">GPA</div>
                </div>
                <div className="sp-prog-bar-wrap">
                  <div className="sp-prog-bar-label">Overall Completion — {pct}%</div>
                  <div className="sp-prog-track">
                    <div className="sp-prog-fill" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>

              {CURRICULUM.map((sem, si) => (
                <div key={si} className="apt-semester">
                  <div className="apt-sem-header">
                    {sem.year} <span className="apt-sem-divider">·</span> <em>{sem.semester}</em>
                  </div>
                  <table className="apt-table">
                    <thead>
                      <tr>
                        <th>Code</th><th>Subject</th><th>Units</th><th>Grade</th><th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sem.subjects.map(subj => {
                        const grade = progress[subj.code] || ''
                        const status = getStatus(grade)
                        return (
                          <tr key={subj.code} className={status === 'PASSED' ? 'apt-row-passed' : status === 'FAILED' ? 'apt-row-failed' : ''}>
                            <td className="apt-code">{subj.code}</td>
                            <td>{subj.desc}</td>
                            <td className="apt-center">{subj.units}</td>
                            <td className="apt-center">{grade || '—'}</td>
                            <td className="apt-center"><StatusBadge status={status} /></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}

          {/* ══ SCHEDULE TAB ══ */}
          {tab === 'schedule' && (
            <div className="sp-section">
              <div className="sp-section-header"><CalendarDays size={18} /><h2>Class Schedule</h2></div>
              {!adviser?.employees ? (
                <div className="sp-clean-record"><div className="sp-clean-icon" style={{ background: darkMode ? '#1e293b' : '#e0e7ff', color: '#4f46e5' }}><CalendarDays size={32} /></div><h3 style={{ color: '#4f46e5' }}>No schedule available</h3><p>No adviser assigned yet.</p></div>
              ) : schedules.length === 0 ? (
                <div className="sp-clean-record"><div className="sp-clean-icon" style={{ background: darkMode ? '#1e293b' : '#e0e7ff', color: '#4f46e5' }}><CalendarDays size={32} /></div><h3 style={{ color: '#4f46e5' }}>No schedule posted</h3><p>Your adviser hasn't posted a schedule yet.</p></div>
              ) : (() => {
                const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
                const DAY_COLORS_LIGHT = { Monday: '#dbeafe', Tuesday: '#ede9fe', Wednesday: '#d1fae5', Thursday: '#fef3c7', Friday: '#fee2e2', Saturday: '#f0fdf4', Sunday: '#fce7f3' }
                const DAY_COLORS_DARK  = { Monday: '#1e3a5f', Tuesday: '#2e1065', Wednesday: '#064e3b', Thursday: '#451a03', Friday: '#450a0a', Saturday: '#052e16', Sunday: '#4a044e' }
                const byDay = {}; DAYS.forEach(d => { byDay[d] = [] }); schedules.forEach(s => { if (byDay[s.day_of_week]) byDay[s.day_of_week].push(s) })
                const fmt = (t) => { if (!t) return ''; const [h, m] = t.split(':'); const hr = parseInt(h); return `${hr > 12 ? hr - 12 : hr || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}` }
                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                    {DAYS.map(day => {
                      const items = byDay[day]; if (!items?.length) return null
                      const headBg = darkMode ? (DAY_COLORS_DARK[day] || '#1e293b') : (DAY_COLORS_LIGHT[day] || '#f3f4f6')
                      return (
                        <div key={day} className="emp-status-col">
                          <div className="emp-status-col-head" style={{ background: headBg, color: darkMode ? '#e2e8f0' : '#374151' }}>
                            <CalendarDays size={14} /> {day}
                          </div>
                          {items.map(s => (
                            <div key={s.id} className="emp-subj-card">
                              <div className="emp-dep-name">{s.subject_name}</div>
                              <div className="emp-dep-code">🕐 {fmt(s.start_time)} – {fmt(s.end_time)}</div>
                              {s.room && <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>📍 {s.room}</div>}
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          )}

          {/* ══ MY GRADES TAB ══ */}
          {tab === 'grades' && (
            <div className="sp-section">
              <div className="sp-section-header"><BarChart2 size={18} /><h2>My Grades</h2></div>
              <StudentGradesView student={student} />
            </div>
          )}

          {/* ══ ACTIVITIES TAB ══ */}
          {tab === 'activities' && (
            <div className="sp-section">
              <div className="sp-section-header"><CheckCircle size={18} /><h2>My Activities</h2></div>
              <StudentActivitiesView student={student} />
            </div>
          )}

          {/* ══ SKILLS TAB ══ */}
          {tab === 'skills' && (
            <div className="sp-section">
              <div className="sp-section-header">
                <Award size={18} />
                <h2>Skills & Activities</h2>
              </div>

              <div className="sp-skills-grid">
                <div className="sp-card sp-skills-card">
                  <div className="sp-skills-card-head">
                    <div className="sp-skills-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                      <Star size={18} />
                    </div>
                    <div>
                      <h3>Skills & Abilities</h3>
                      <p>{student.skills?.length || 0} recorded</p>
                    </div>
                  </div>
                  {student.skills?.length > 0
                    ? <div className="tags sp-tags-wrap">
                        {student.skills.map(s => <span key={s} className="tag skill">{s}</span>)}
                      </div>
                    : <p className="sp-empty">No skills recorded yet.</p>}
                </div>

                <div className="sp-card sp-skills-card">
                  <div className="sp-skills-card-head">
                    <div className="sp-skills-icon" style={{ background: '#d1fae5', color: '#059669' }}>
                      <Activity size={18} />
                    </div>
                    <div>
                      <h3>Non-Academic Activities</h3>
                      <p>{student.non_academic_activities?.length || 0} recorded</p>
                    </div>
                  </div>
                  {student.non_academic_activities?.length > 0
                    ? <div className="tags sp-tags-wrap">
                        {student.non_academic_activities.map(a => <span key={a} className="tag">{a}</span>)}
                      </div>
                    : <p className="sp-empty">No activities recorded yet.</p>}
                </div>

                <div className="sp-card sp-skills-card">
                  <div className="sp-skills-card-head">
                    <div className="sp-skills-icon" style={{ background: '#dbeafe', color: '#1d4ed8' }}>
                      <Users size={18} />
                    </div>
                    <div>
                      <h3>Organizations & Affiliations</h3>
                      <p>{student.affiliations?.length || 0} recorded</p>
                    </div>
                  </div>
                  {student.affiliations?.length > 0
                    ? <div className="tags sp-tags-wrap">
                        {student.affiliations.map(a => <span key={a} className="tag affil">{a}</span>)}
                      </div>
                    : <p className="sp-empty">No affiliations recorded yet.</p>}
                </div>

                {student.academic_awards?.length > 0 && (
                  <div className="sp-card sp-skills-card">
                    <div className="sp-skills-card-head">
                      <div className="sp-skills-icon" style={{ background: '#ede9fe', color: '#7c3aed' }}>
                        <Award size={18} />
                      </div>
                      <div>
                        <h3>Academic Awards</h3>
                        <p>{student.academic_awards.length} recorded</p>
                      </div>
                    </div>
                    <div className="tags sp-tags-wrap">
                      {student.academic_awards.map(a => <span key={a} className="tag skill">{a}</span>)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ MY SUBJECTS TAB ══ */}
          {tab === 'subjects' && (
            <div className="sp-section">
              <div className="sp-section-header">
                <GraduationCap size={18} />
                <h2>{selectedSubject ? selectedSubject.subject_desc || selectedSubject.subject_code : 'My Subjects'}</h2>
                {selectedSubject && (
                  <button className="rq-btn-clear" style={{ marginLeft: 'auto', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => setSelectedSubject(null)}>
                    <ArrowLeft size={14} /> Back to Subjects
                  </button>
                )}
              </div>

              {selectedSubject ? (
                /* ── Subject Detail View ── */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Grade card */}
                  <div className="sp-card" style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{selectedSubject.subject_desc}</div>
                      <div style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>{selectedSubject.subject_code} · {selectedSubject.units} units · {selectedSubject.semester}</div>
                      {selectedSubject.employees && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                          <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#e8650a,#c45200)', color: 'white', fontSize: '0.62rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {selectedSubject.employees.first_name?.[0]}{selectedSubject.employees.last_name?.[0]}
                          </div>
                          <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                            {selectedSubject.employees.first_name} {selectedSubject.employees.last_name}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{selectedSubject.employees.position}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, color: darkMode ? '#34d399' : '#16a34a' }}>{selectedSubject.grade || '—'}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Grade</div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '1rem', fontWeight: 600, color: darkMode ? '#f1f5f9' : 'var(--text)' }}>{selectedSubject.status || '—'}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>Status</div>
                      </div>
                    </div>
                  </div>

                  {/* Subject announcements */}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Megaphone size={15} style={{ color: 'var(--orange)' }} /> Announcements
                    </div>
                    {announcements.filter(a => a.subject_code === selectedSubject.subject_code).length === 0
                      ? <p className="sp-empty">No announcements for this subject.</p>
                      : announcements.filter(a => a.subject_code === selectedSubject.subject_code).map(a => (
                          <div key={a.id} className="ann-card" style={{ borderLeftColor: '#3b82f6', marginBottom: 8 }}>
                            <h3 className="ann-title">{a.title}</h3>
                            <p className="ann-content">{a.content}</p>
                            <div className="ann-footer"><span>Posted by {a.author_name}</span></div>
                          </div>
                        ))}
                  </div>

                  {/* Subject activities */}
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle size={15} style={{ color: '#16a34a' }} /> Activities
                    </div>
                    <StudentActivitiesView student={student} filterSubjectCode={selectedSubject.subject_code} />
                  </div>
                </div>
              ) : (
                /* ── Subject Grid ── */
                deployments.length === 0
                  ? <div className="sp-clean-record" style={{ borderColor: '#e0e7ff' }}>
                      <div className="sp-clean-icon" style={{ background: '#e0e7ff', color: '#4f46e5' }}><BookOpen size={32} /></div>
                      <h3 style={{ color: '#4f46e5' }}>No subjects deployed yet</h3>
                      <p>Your admin will deploy subjects to you soon.</p>
                    </div>
                  : (
                    <>
                      <div className="sp-progress-summary">
                        {[
                          { label: 'Total', val: deployments.length, color: 'var(--text)' },
                          { label: 'Passed', val: deployments.filter(d => d.status === 'Passed').length, color: '#10b981' },
                          { label: 'Ongoing', val: deployments.filter(d => d.status === 'Ongoing').length, color: '#f59e0b' },
                          { label: 'Enrolled', val: deployments.filter(d => d.status === 'Enrolled').length, color: '#3b82f6' },
                          { label: 'Failed', val: deployments.filter(d => d.status === 'Failed').length, color: '#ef4444' },
                        ].map(({ label, val, color }) => (
                          <div key={label} className="sp-prog-stat">
                            <div className="sp-prog-val" style={{ color }}>{val}</div>
                            <div className="sp-prog-label">{label}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                        {deployments.map(dep => {
                          const statusColors = darkMode
                            ? { Enrolled: '#1e3a5f', Ongoing: '#451a03', Passed: '#064e3b', Failed: '#450a0a', INC: '#2e1065', Dropped: '#1e293b', Pending: '#431407' }
                            : { Enrolled: '#dbeafe', Ongoing: '#fef3c7', Passed: '#dcfce7', Failed: '#fee2e2', INC: '#f3e8ff', Dropped: '#f3f4f6', Pending: '#fff7ed' }
                          const statusText = darkMode
                            ? { Enrolled: '#60a5fa', Ongoing: '#fbbf24', Passed: '#34d399', Failed: '#f87171', INC: '#a78bfa', Dropped: '#94a3b8', Pending: '#fb923c' }
                            : { Enrolled: '#1d4ed8', Ongoing: '#92400e', Passed: '#166534', Failed: '#991b1b', INC: '#7c3aed', Dropped: '#6b7280', Pending: '#c2410c' }
                          const bg = statusColors[dep.status] || (darkMode ? '#1e293b' : '#f3f4f6')
                          const tc = statusText[dep.status] || (darkMode ? '#94a3b8' : '#6b7280')
                          return (
                            <div key={dep.id} className="sp-overview-card" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8, cursor: 'pointer' }}
                              onClick={() => setSelectedSubject(dep)}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'flex-start' }}>
                                <span style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--muted)', fontFamily: 'monospace' }}>{dep.subject_code}</span>
                                <span style={{ fontSize: '0.68rem', background: bg, color: tc, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>{dep.status || '—'}</span>
                              </div>
                              <div style={{ fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.3, color: darkMode ? '#f1f5f9' : 'var(--text)' }}>{dep.subject_desc}</div>
                              <div style={{ display: 'flex', gap: 8, fontSize: '0.75rem', color: 'var(--muted)' }}>
                                <span>{dep.units} units</span>
                                {dep.grade && <span style={{ fontWeight: 700, color: darkMode ? '#34d399' : '#16a34a' }}>Grade: {dep.grade}</span>}
                                {dep.employees && (
                                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'var(--orange)' }}>
                                    👤 {dep.employees.first_name} {dep.employees.last_name}
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: darkMode ? '#60a5fa' : '#3b82f6', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                                <ChevronRight size={12} /> View details
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </>
                  )
              )}
            </div>
          )}

          {/* ══ MESSAGES TAB ══ */}
          {tab === 'messages' && (
            <div className="sp-section">
              <div className="sp-section-header"><MessageSquare size={18} /><h2>Messages</h2></div>
              {!adviser?.employees
                ? <div className="sp-clean-record"><div className="sp-clean-icon" style={{ background: '#e0e7ff', color: '#4f46e5' }}><MessageSquare size={32} /></div><h3 style={{ color: '#4f46e5' }}>No adviser assigned</h3><p>You'll be able to message your adviser once one is assigned.</p></div>
                : (
                  <div className="emp-msg-layout" style={{ height: 480 }}>
                    <div className="emp-msg-sidebar">
                      <div className="emp-msg-sidebar-title">Adviser</div>
                      <div className="emp-msg-contact active">
                        <div className="rq-avatar" style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', width: 32, height: 32, fontSize: '0.7rem' }}>
                          {adviser.employees.first_name?.[0]}{adviser.employees.last_name?.[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{adviser.employees.first_name} {adviser.employees.last_name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{adviser.employees.position}</div>
                        </div>
                      </div>
                    </div>
                    <div className="emp-msg-main">
                      <div className="emp-msg-header">
                        <div className="rq-avatar" style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)', width: 32, height: 32, fontSize: '0.7rem' }}>
                          {adviser.employees.first_name?.[0]}{adviser.employees.last_name?.[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{adviser.employees.first_name} {adviser.employees.last_name}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{adviser.employees.position} · {adviser.employees.department}</div>
                        </div>
                      </div>
                      <div className="emp-msg-body">
                        {messages.length === 0 && <p className="sp-empty" style={{ textAlign: 'center', padding: 24 }}>No messages yet. Say hello!</p>}
                        {messages.map(m => (
                          <div key={m.id} className={`emp-msg-bubble ${m.sender_type === 'student' ? 'mine' : 'theirs'}`}>
                            <div className="emp-msg-text">{m.content}</div>
                            <div className="emp-msg-time">{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                          </div>
                        ))}
                        <div ref={msgEndRef} />
                      </div>
                      <form className="emp-msg-input-row" onSubmit={handleSendMessage}>
                        <input className="rq-filter-input" placeholder="Type a message…" value={msgInput} onChange={e => setMsgInput(e.target.value)} />
                        <button type="submit" className="rq-btn-run" style={{ padding: '9px 16px' }} disabled={!msgInput.trim()}><Send size={15} /></button>
                      </form>
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* ══ NOTIFICATIONS TAB ══ */}
          {tab === 'notifs' && (
            <div className="sp-section">
              <div className="sp-section-header">
                <Bell size={18} /><h2>Notifications</h2>
                {unreadCount > 0 && <button className="rq-btn-clear" style={{ marginLeft: 'auto', padding: '5px 12px' }} onClick={handleMarkAllRead}>Mark all read</button>}
              </div>
              {notifications.length === 0
                ? <div className="sp-clean-record"><div className="sp-clean-icon"><Bell size={32} /></div><h3>No notifications</h3><p>You're all caught up!</p></div>
                : notifications.map(n => (
                    <div key={n.id} className={`emp-notif-item ${!n.is_read ? 'unread' : ''}`}>
                      <div className="emp-notif-dot" style={{ background: n.type === 'success' ? '#10b981' : n.type === 'warning' ? '#f59e0b' : '#3b82f6' }} />
                      <div className="emp-notif-body">
                        <div className="emp-notif-title">{n.title}</div>
                        <div className="emp-notif-msg">{n.message}</div>
                        <div className="emp-notif-time">{new Date(n.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
            </div>
          )}

          {/* ══ ANNOUNCEMENTS TAB ══ */}
          {tab === 'announce' && (
            <div className="sp-section">
              <div className="sp-section-header"><Megaphone size={18} /><h2>Announcements</h2></div>
              {announcements.length === 0
                ? <div className="sp-clean-record"><div className="sp-clean-icon" style={{ background: '#fef3c7', color: '#d97706' }}><Megaphone size={32} /></div><h3 style={{ color: '#d97706' }}>No announcements</h3><p>Check back later for updates.</p></div>
                : announcements.map(a => {
                    const priorityCfg = { normal: { bg: '#f3f4f6', color: '#6b7280' }, important: { bg: '#dbeafe', color: '#1d4ed8' }, urgent: { bg: '#fee2e2', color: '#dc2626' } }
                    const cfg = priorityCfg[a.priority] || priorityCfg.normal
                    return (
                      <div key={a.id} className="ann-card" style={{ borderLeftColor: cfg.color }}>
                        <div className="ann-card-head">
                          <span className="ann-priority-badge" style={{ background: cfg.bg, color: cfg.color }}>{a.priority}</span>
                          <span className="ann-date">{new Date(a.created_at).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        </div>
                        <h3 className="ann-title">{a.title}</h3>
                        <p className="ann-content">{a.content}</p>
                        <div className="ann-footer"><span>Posted by {a.author_name}</span></div>
                      </div>
                    )
                  })}
            </div>
          )}

          {/* ══ DISCIPLINARY TAB ══ */}
          {tab === 'violations' && (
            <div className="sp-section">
              <div className="sp-section-header">
                <Shield size={18} />
                <h2>Disciplinary Record</h2>
              </div>

              {student.violations?.length > 0 ? (
                <div className="sp-violations-wrap">
                  <div className="sp-violations-alert">
                    <AlertTriangle size={18} />
                    <span>{student.violations.length} disciplinary record{student.violations.length > 1 ? 's' : ''} on file</span>
                  </div>
                  <div className="sp-violations-list">
                    {student.violations.map((v, i) => {
                      // Parse structured violation format
                      const parseViolation = (violationString) => {
                        const dateMatch = violationString.match(/\[(.*?)\]/)
                        const severityMatch = violationString.match(/\((.*?)\)/)
                        const actionMatch = violationString.match(/Action: (.*?)(?:\s*\||$)/)
                        const durationMatch = violationString.match(/Duration: (.*?)(?:\s*\||$)/)
                        const statusMatch = violationString.match(/Status: (.*)$/)
                        
                        const parts = violationString.split(' - ')
                        const typePart = parts[0]?.split('] ')[1]?.split(' (')[0] || ''
                        const descPart = parts[1]?.split(' | ')[0] || violationString

                        return {
                          date: dateMatch ? dateMatch[1] : 'Not specified',
                          type: typePart || 'Violation',
                          severity: severityMatch ? severityMatch[1] : 'Minor',
                          description: descPart,
                          action: actionMatch ? actionMatch[1].trim() : null,
                          duration: durationMatch ? durationMatch[1].trim() : null,
                          status: statusMatch ? statusMatch[1].trim() : 'Active'
                        }
                      }

                      const getSeverityColor = (severity) => {
                        switch (severity) {
                          case 'Minor': return '#10b981'
                          case 'Moderate': return '#f59e0b'
                          case 'Major': return '#ef4444'
                          case 'Severe': return '#dc2626'
                          default: return '#6b7280'
                        }
                      }

                      const getStatusColor = (status) => {
                        switch (status) {
                          case 'Resolved': return { bg: '#d1fae5', color: '#10b981' }
                          case 'Active': return { bg: '#fee2e2', color: '#dc2626' }
                          case 'Under Review': return { bg: '#fef3c7', color: '#f59e0b' }
                          case 'Appealed': return { bg: '#dbeafe', color: '#3b82f6' }
                          default: return { bg: '#f3f4f6', color: '#6b7280' }
                        }
                      }

                      const parsed = parseViolation(v)
                      const severityColor = getSeverityColor(parsed.severity)
                      const statusColors = getStatusColor(parsed.status)

                      return (
                        <div key={i} className="sp-violation-card">
                          <div className="sp-violation-header">
                            <div className="sp-violation-num">#{i + 1}</div>
                            <div className="sp-violation-badges">
                              <span 
                                className="sp-severity-badge"
                                style={{ 
                                  background: severityColor + '20', 
                                  color: severityColor,
                                  border: `1px solid ${severityColor}40`
                                }}
                              >
                                {parsed.severity}
                              </span>
                              <span 
                                className="sp-status-badge"
                                style={{ 
                                  background: statusColors.bg, 
                                  color: statusColors.color 
                                }}
                              >
                                {parsed.status}
                              </span>
                            </div>
                          </div>
                          <div className="sp-violation-type">{parsed.type}</div>
                          <div className="sp-violation-desc">{parsed.description}</div>
                          <div className="sp-violation-meta">
                            <div className="sp-violation-meta-item">
                              <Calendar size={14} />
                              <span>{parsed.date}</span>
                            </div>
                            {parsed.duration && (
                              <div className="sp-violation-meta-item">
                                <Clock size={14} />
                                <span>{parsed.duration}</span>
                              </div>
                            )}
                          </div>
                          {parsed.action && (
                            <div className="sp-violation-action">
                              <strong>Action Taken:</strong> {parsed.action}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="sp-clean-record">
                  <div className="sp-clean-icon">
                    <CheckCircle size={40} />
                  </div>
                  <h3>Clean Record</h3>
                  <p>You have no disciplinary records on file. Keep it up!</p>
                </div>
              )}
            </div>
          )}

        </main>
      </div>
    </div>
  )
}
