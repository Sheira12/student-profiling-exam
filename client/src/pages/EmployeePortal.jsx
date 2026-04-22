import { useState, useEffect, useRef } from 'react'
import {
  Home, Users, BookOpen, MessageSquare, Bell, LogOut,
  ChevronDown, ChevronRight, Search, CheckCircle, Clock,
  XCircle, AlertCircle, Send, RefreshCw, Award,
  User, Briefcase, Edit2, Save, X, Megaphone, Moon, Sun, CalendarDays
} from 'lucide-react'
import {
  getAssignmentsByEmployee, getCurriculumDeploymentsByEmployee,
  updateCurriculumDeployment, getNotifications, markAllNotificationsRead,
  getMessages, sendMessage, getAdviserAnnouncements, getActivitiesByAdviser,
  getDeploymentsByAdviserSubject
} from '../api/rbac'
import AdviserAnnouncementManager from './AdviserAnnouncementManager'
import ActivityManager from './ActivityManager'
import GradeEditor from './GradeEditor'
import ClassScheduleManager from './ClassScheduleManager'

const STATUS_COLORS = {
  Pending:   { bg: '#fff7ed', color: '#c2410c', icon: Clock },
  Enrolled:  { bg: '#dbeafe', color: '#1d4ed8', icon: Clock },
  Ongoing:   { bg: '#fef3c7', color: '#92400e', icon: RefreshCw },
  Passed:    { bg: '#dcfce7', color: '#166534', icon: CheckCircle },
  Completed: { bg: '#dcfce7', color: '#166534', icon: CheckCircle },
  Failed:    { bg: '#fee2e2', color: '#991b1b', icon: XCircle },
  INC:       { bg: '#f3e8ff', color: '#7c3aed', icon: Clock },
  Dropped:   { bg: '#f3f4f6', color: '#6b7280', icon: XCircle },
}

function StatusBadge({ status }) {
  const cfg = STATUS_COLORS[status] || { bg: '#f3f4f6', color: '#6b7280', icon: AlertCircle }
  const Icon = cfg.icon
  return (
    <span className="emp-status-badge" style={{ background: cfg.bg, color: cfg.color }}>
      <Icon size={11} /> {status}
    </span>
  )
}

export default function EmployeePortal({ employee, onLogout }) {
  const [tab, setTab] = useState('overview')
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('adviser_dark_mode') === 'dark')
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])
  const [students, setStudents] = useState([])
  const [deployments, setDeployments] = useState([])
  const [notifications, setNotifications] = useState([])
  const [announcements, setAnnouncements] = useState([])
  const [messages, setMessages] = useState([])
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [msgInput, setMsgInput] = useState('')
  const [search, setSearch] = useState('')
  const [editingDep, setEditingDep] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const msgEndRef = useRef(null)

  const toggleDark = () => setDarkMode(d => {
    const next = !d
    localStorage.setItem('adviser_dark_mode', next ? 'dark' : 'light')
    return next
  })

  const unreadCount = notifications.filter(n => !n.is_read).length

  useEffect(() => { loadAll() }, [employee.id])
  useEffect(() => { if (tab === 'messages' && selectedStudent) loadMessages() }, [tab, selectedStudent])
  useEffect(() => { msgEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // Re-fetch when window regains focus (handles stale data after admin assigns students)
  useEffect(() => {
    const onFocus = () => loadAll()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  // Poll messages every 5s when on messages tab
  useEffect(() => {
    if (tab !== 'messages' || !selectedStudent) return
    const interval = setInterval(loadMessages, 5000)
    return () => clearInterval(interval)
  }, [tab, selectedStudent])

  // Poll notifications every 15s
  useEffect(() => {
    const interval = setInterval(async () => {
      const { data } = await getNotifications('employee', employee.id)
      setNotifications(data || [])
    }, 15000)
    return () => clearInterval(interval)
  }, [])

  const loadAll = async () => {
    const safe = (fn) => fn.catch(e => { console.error('loadAll error:', e); return { data: null } })
    const [asgn, deps, notifs, anns] = await Promise.all([
      safe(getAssignmentsByEmployee(employee.id)),
      safe(getCurriculumDeploymentsByEmployee(employee.id)),
      safe(getNotifications('employee', employee.id)),
      safe(getAdviserAnnouncements(employee.id)),
    ])
    console.log('Assignments loaded:', asgn.data?.length, 'for employee.id:', employee.id)
    setStudents(asgn.data || [])
    setDeployments(deps.data || [])
    setNotifications(notifs.data || [])
    setAnnouncements(anns.data || [])
  }

  const loadMessages = async () => {
    if (!selectedStudent) return
    const { data } = await getMessages('employee', employee.id, 'student', selectedStudent.students?.id)
    setMessages(data || [])
  }

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead('employee', employee.id)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!msgInput.trim() || !selectedStudent) return
    await sendMessage({ sender_type: 'employee', sender_id: employee.id, receiver_type: 'student', receiver_id: selectedStudent.students?.id, content: msgInput.trim() })
    setMsgInput('')
    loadMessages()
  }

  const startEdit = (dep) => {
    setEditingDep(dep.id)
    setEditForm({ status: dep.status, grade: dep.grade || '', remarks: dep.remarks || '' })
  }

  const saveEdit = async (dep) => {
    setSaving(true)
    try {
      await updateCurriculumDeployment(dep.id, editForm, `${employee.first_name} ${employee.last_name}`)
      setEditingDep(null)
      loadAll()
    } catch (e) { console.error(e) }
    setSaving(false)
  }

  const filteredStudents = students.filter(a => {
    const s = a.students
    if (!s) return false
    const q = search.toLowerCase()
    return !q || `${s.first_name} ${s.last_name} ${s.student_id}`.toLowerCase().includes(q)
  })

  const myDeployments = (studentId) => deployments.filter(d => d.student_id === studentId)

  const stats = {
    students: students.length,
    subjects: deployments.length,
    completed: deployments.filter(d => d.status === 'Completed').length,
    ongoing: deployments.filter(d => d.status === 'Ongoing').length,
  }

  const navItems = [
    { id: 'overview',   icon: Home,           label: 'Overview' },
    { id: 'students',   icon: Users,          label: 'My Students' },
    { id: 'grades',     icon: BookOpen,       label: 'Grade Editor' },
    { id: 'activities', icon: CheckCircle,    label: 'Activities' },
    { id: 'schedule',   icon: CalendarDays,   label: 'Schedule' },
    { id: 'subjects',   icon: BookOpen,       label: 'Subjects' },
    { id: 'announce',   icon: Megaphone,      label: 'Announcements' },
    { id: 'messages',   icon: MessageSquare,  label: 'Messages' },
    { id: 'notifs',     icon: Bell,           label: 'Notifications', badge: unreadCount },
  ]

  return (
    <div className={`sp-root${darkMode ? ' dark' : ''}`}>
      {/* Topbar */}
      <header className="sp-topbar">
        <div className="sp-topbar-brand">
          {/* Hamburger — always rendered, shown via inline style on mobile */}
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
            <div className="sp-topbar-title">Adviser Portal</div>
            <div className="sp-topbar-sub">Pamantasan ng Cabuyao — CCS</div>
          </div>
        </div>
        <div className="sp-topbar-right">
          <button className="icon-btn" onClick={toggleDark} title={darkMode ? 'Light mode' : 'Dark mode'}>
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div className="sp-user-wrap">
            <button className="sp-user-btn" onClick={() => setDropdownOpen(o => !o)}>
              <div className="sp-user-avatar" style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
                {employee.first_name?.[0]}{employee.last_name?.[0]}
              </div>
              <span className="sp-user-name">{employee.first_name} {employee.last_name}</span>
              <ChevronDown size={14} />
            </button>
            {dropdownOpen && (
              <div className="sp-dropdown">
                <div className="sp-dropdown-info">
                  <div className="sp-dropdown-avatar" style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
                    {employee.first_name?.[0]}{employee.last_name?.[0]}
                  </div>
                  <div>
                    <div className="sp-dropdown-name">{employee.first_name} {employee.last_name}</div>
                    <div className="sp-dropdown-id">{employee.employee_id} · {employee.position}</div>
                  </div>
                </div>
                <div className="dropdown-divider" />
                <button className="dropdown-item logout" onClick={onLogout}><LogOut size={14} /> Log Out</button>
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

        {/* Sidebar */}
        <aside
          style={{
            width: isMobile ? 270 : 220,
            flexShrink: 0,
            background: darkMode ? '#1e293b' : 'white',
            borderRight: `1px solid ${darkMode ? '#334155' : 'var(--border)'}`,
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            // Mobile: fixed drawer
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
            <div className="sp-sidebar-avatar" style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>
              {employee.first_name?.[0]}{employee.last_name?.[0]}
            </div>
            <div className="sp-sidebar-name">{employee.first_name} {employee.last_name}</div>
            <div className="sp-sidebar-id">{employee.employee_id}</div>
            <span className="sp-sidebar-status enrolled">{employee.position || 'Adviser'}</span>
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
          <button className="sp-logout-btn" style={{ color: '#3b82f6', borderColor: '#bfdbfe', marginBottom: 4 }} onClick={loadAll}>
            <RefreshCw size={15} /><span>Refresh Data</span>
          </button>
        </aside>

        <main className="sp-main">

          {/* ══ OVERVIEW ══ */}
          {tab === 'overview' && (
            <div className="sp-section">
              <div className="emp-welcome-banner">
                <div className="sp-welcome-left">
                  <div className="sp-welcome-avatar" style={{ background: 'rgba(255,255,255,0.2)' }}>
                    {employee.first_name?.[0]}{employee.last_name?.[0]}
                  </div>
                  <div>
                    <p className="sp-welcome-greeting">Welcome back,</p>
                    <h1 className="sp-welcome-name">{employee.first_name} {employee.last_name}</h1>
                    <div className="sp-welcome-meta">
                      <span><Briefcase size={13} /> {employee.employee_id}</span>
                      <span><User size={13} /> {employee.position}</span>
                      <span><Award size={13} /> {employee.department}</span>
                    </div>
                  </div>
                </div>
                <div className="emp-overview-quick">
                  <div className="emp-quick-stat"><span>{stats.students}</span><small>Students</small></div>
                  <div className="emp-quick-stat"><span>{stats.subjects}</span><small>Subjects</small></div>
                </div>
              </div>

              <div className="sp-overview-stats">
                {[
                  { icon: Users,       color: '#3b82f6', bg: '#dbeafe', val: stats.students,  lbl: 'Assigned Students' },
                  { icon: BookOpen,    color: '#8b5cf6', bg: '#ede9fe', val: stats.subjects,  lbl: 'Total Subjects' },
                  { icon: CheckCircle, color: '#10b981', bg: '#d1fae5', val: stats.completed, lbl: 'Completed' },
                  { icon: RefreshCw,   color: '#f59e0b', bg: '#fef3c7', val: stats.ongoing,   lbl: 'Ongoing' },
                ].map(({ icon: Icon, color, bg, val, lbl }) => (
                  <div key={lbl} className="sp-overview-stat">
                    <div className="sp-overview-stat-icon" style={{ background: bg, color }}><Icon size={20} /></div>
                    <div className="sp-overview-stat-val">{val}</div>
                    <div className="sp-overview-stat-lbl">{lbl}</div>
                  </div>
                ))}
              </div>

              {/* Recent students */}
              <div className="emp-card">
                <div className="emp-card-head"><Users size={16} /><span>Assigned Students</span></div>
                {students.length === 0
                  ? (
                    <div style={{ padding: '20px 16px', textAlign: 'center' }}>
                      <Users size={32} style={{ margin: '0 auto 10px', display: 'block', color: 'var(--muted)', opacity: 0.5 }} />
                      <p style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>No students assigned yet</p>
                      <p style={{ fontSize: '0.82rem', color: 'var(--muted)', marginBottom: 12 }}>
                        An admin needs to assign students to you via <strong>Admin → Advisers → Assignments</strong>.
                      </p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--muted)', background: '#fef3c7', padding: '8px 12px', borderRadius: 8, display: 'inline-block' }}>
                        💡 Ask your admin to go to <strong>/admin/advisers</strong> → Assignments tab → assign you to students.
                      </p>
                    </div>
                  )
                  : students.slice(0, 5).map(a => {
                      const s = a.students
                      const deps = myDeployments(a.student_id)
                      return (
                        <div key={a.id} className="emp-student-row" onClick={() => { setSelectedStudent(a); setTab('students') }}>
                          <div className="rq-avatar">{s?.first_name?.[0]}{s?.last_name?.[0]}</div>
                          <div className="emp-student-info">
                            <div className="emp-student-name">{s?.first_name} {s?.last_name}</div>
                            <div className="emp-student-meta">{s?.student_id} · {s?.course} · Year {s?.year_level}</div>
                          </div>
                          <div className="emp-student-deps">
                            <span className="rq-pill year">{deps.length} subjects</span>
                            <span className="rq-pill gpa">{deps.filter(d => d.status === 'Completed').length} done</span>
                          </div>
                          <ChevronRight size={16} style={{ color: 'var(--muted)' }} />
                        </div>
                      )
                    })}
              </div>
            </div>
          )}

          {/* ══ MY STUDENTS ══ */}
          {tab === 'students' && (
            <div className="sp-section">
              <div className="sp-section-header"><Users size={18} /><h2>My Students</h2></div>
              <div className="emp-search-row">
                <div className="emp-search-wrap">
                  <Search size={15} className="emp-search-icon" />
                  <input className="emp-search-input" placeholder="Search by name or ID…" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
              </div>

              {filteredStudents.length === 0
                ? <div className="rq-empty"><div className="rq-empty-icon"><Users size={36} /></div><h3>No students found</h3></div>
                : filteredStudents.map(a => {
                    const s = a.students
                    const deps = myDeployments(a.student_id)
                    const isOpen = selectedStudent?.id === a.id
                    return (
                      <div key={a.id} className="emp-student-card">
                        <div className="emp-student-card-head" onClick={() => setSelectedStudent(isOpen ? null : a)}>
                          <div className="rq-avatar">{s?.first_name?.[0]}{s?.last_name?.[0]}</div>
                          <div className="emp-student-info">
                            <div className="emp-student-name">{s?.first_name} {s?.last_name}</div>
                            <div className="emp-student-meta">{s?.student_id} · {s?.course} · Year {s?.year_level}</div>
                          </div>
                          <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                            <span className="rq-pill year">{deps.length} subjects</span>
                            <span className="rq-pill gpa">{deps.filter(d => d.status === 'Completed').length} done</span>
                          </div>
                          <ChevronDown size={16} style={{ color: 'var(--muted)', transform: isOpen ? 'rotate(180deg)' : '', transition: 'transform 0.2s' }} />
                        </div>

                        {isOpen && (
                          <div className="emp-student-card-body">
                            {deps.length === 0
                              ? <p className="sp-empty">No subjects deployed to this student.</p>
                              : deps.map(dep => (
                                  <div key={dep.id} className="emp-dep-row">
                                    <div className="emp-dep-info">
                                      <div className="emp-dep-name">{dep.subject_desc || dep.subject_code}</div>
                                      <div className="emp-dep-code">{dep.subject_code} · {dep.units} units · {dep.semester}</div>
                                    </div>
                                    {editingDep === dep.id ? (
                                      <div className="emp-dep-edit">
                                        <select value={editForm.status} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))} className="rq-filter-input" style={{ width: 120 }}>
                                          {['Enrolled','Ongoing','Passed','Failed','INC','Dropped'].map(s => <option key={s}>{s}</option>)}
                                        </select>
                                        <input className="rq-filter-input" style={{ width: 80 }} placeholder="Grade" value={editForm.grade} onChange={e => setEditForm(f => ({ ...f, grade: e.target.value }))} />
                                        <input className="rq-filter-input" style={{ flex: 1 }} placeholder="Remarks" value={editForm.remarks} onChange={e => setEditForm(f => ({ ...f, remarks: e.target.value }))} />
                                        <button className="rq-btn-run" style={{ padding: '6px 12px' }} onClick={() => saveEdit(dep)} disabled={saving}><Save size={13} /></button>
                                        <button className="rq-btn-clear" style={{ padding: '6px 10px' }} onClick={() => setEditingDep(null)}><X size={13} /></button>
                                      </div>
                                    ) : (
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <StatusBadge status={dep.status} />
                                        {dep.grade && <span className="rq-pill gpa">Grade: {dep.grade}</span>}
                                        {dep.remarks && <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{dep.remarks}</span>}
                                        <button className="rq-view-btn" onClick={() => startEdit(dep)} title="Edit status"><Edit2 size={13} /></button>
                                      </div>
                                    )}
                                  </div>
                                ))}
                            <button className="emp-msg-btn" onClick={() => { setSelectedStudent(a); setTab('messages') }}>
                              <MessageSquare size={14} /> Message Student
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
            </div>
          )}

          {/* ══ SCHEDULE ══ */}
          {tab === 'schedule' && (
            <ClassScheduleManager employee={employee} />
          )}

          {/* ══ GRADE EDITOR ══ */}
          {tab === 'grades' && (
            <GradeEditor
              employee={employee}
              assignedStudents={students}
              deployments={deployments}
              onRefresh={loadAll}
            />
          )}

          {/* ══ ACTIVITIES ══ */}
          {tab === 'activities' && (
            <ActivityManager employee={employee} assignedStudents={students} />
          )}

          {/* ══ ANNOUNCEMENTS (MANAGE) ══ */}
          {tab === 'announce' && (
            <AdviserAnnouncementManager employee={employee} />
          )}

          {/* ══ SUBJECTS ══ */}
          {tab === 'subjects' && (
            <div className="sp-section">
              <div className="sp-section-header"><BookOpen size={18} /><h2>Subject Overview</h2></div>
              <div className="emp-subjects-grid">
                {['Enrolled','Ongoing','Passed','Failed','INC','Dropped'].map(status => {
                  const cfg = STATUS_COLORS[status] || STATUS_COLORS.Pending
                  const Icon = cfg.icon
                  const items = deployments.filter(d => d.status === status)
                  return (
                    <div key={status} className="emp-status-col">
                      <div className="emp-status-col-head" style={{ background: cfg.bg, color: cfg.color }}>
                        <Icon size={15} /> {status} <span className="emp-status-count">{items.length}</span>
                      </div>
                      {items.length === 0
                        ? <p className="sp-empty" style={{ padding: '12px 14px' }}>None</p>
                        : items.map(dep => (
                            <div key={dep.id} className="emp-subj-card">
                              <div className="emp-dep-name">{dep.subject_desc || dep.subject_code}</div>
                              <div className="emp-dep-code">{dep.subject_code} · {dep.units} units</div>
                              <div className="emp-dep-student">
                                <User size={11} /> {dep.students?.first_name} {dep.students?.last_name}
                              </div>
                              {dep.grade && <span className="rq-pill gpa" style={{ marginTop: 4 }}>Grade: {dep.grade}</span>}
                            </div>
                          ))}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ══ MESSAGES ══ */}
          {tab === 'messages' && (
            <div className="sp-section">
              <div className="sp-section-header"><MessageSquare size={18} /><h2>Messages</h2></div>
              <div className="emp-msg-layout">
                <div className="emp-msg-sidebar">
                  <div className="emp-msg-sidebar-title">Students</div>
                  {students.length === 0
                    ? <p className="sp-empty" style={{ padding: 12 }}>No students assigned.</p>
                    : students.map(a => {
                        const s = a.students
                        const isActive = selectedStudent?.id === a.id
                        return (
                          <button key={a.id} className={`emp-msg-contact ${isActive ? 'active' : ''}`} onClick={() => { setSelectedStudent(a); loadMessages() }}>
                            <div className="rq-avatar" style={{ width: 32, height: 32, fontSize: '0.7rem' }}>{s?.first_name?.[0]}{s?.last_name?.[0]}</div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{s?.first_name} {s?.last_name}</div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{s?.student_id}</div>
                            </div>
                          </button>
                        )
                      })}
                </div>
                <div className="emp-msg-main">
                  {!selectedStudent
                    ? <div className="rq-empty"><div className="rq-empty-icon"><MessageSquare size={36} /></div><h3>Select a student to chat</h3></div>
                    : <>
                        <div className="emp-msg-header">
                          <div className="rq-avatar" style={{ width: 32, height: 32, fontSize: '0.7rem' }}>
                            {selectedStudent.students?.first_name?.[0]}{selectedStudent.students?.last_name?.[0]}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{selectedStudent.students?.first_name} {selectedStudent.students?.last_name}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>{selectedStudent.students?.student_id}</div>
                          </div>
                        </div>
                        <div className="emp-msg-body">
                          {messages.length === 0 && <p className="sp-empty" style={{ textAlign: 'center', padding: 24 }}>No messages yet. Say hello!</p>}
                          {messages.map(m => (
                            <div key={m.id} className={`emp-msg-bubble ${m.sender_type === 'employee' ? 'mine' : 'theirs'}`}>
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
                      </>}
                </div>
              </div>
            </div>
          )}

          {/* ══ NOTIFICATIONS ══ */}
          {tab === 'notifs' && (
            <div className="sp-section">
              <div className="sp-section-header">
                <Bell size={18} /><h2>Notifications</h2>
                {unreadCount > 0 && <button className="rq-btn-clear" style={{ marginLeft: 'auto', padding: '5px 12px' }} onClick={handleMarkAllRead}>Mark all read</button>}
              </div>
              {notifications.length === 0
                ? <div className="rq-empty"><div className="rq-empty-icon"><Bell size={36} /></div><h3>No notifications</h3></div>
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


        </main>
      </div>
    </div>
  )
}
