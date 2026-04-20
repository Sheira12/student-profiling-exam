import { useState, useEffect } from 'react'
import { Users, UserPlus, Trash2, Search, Plus, Edit2, Save, X, Briefcase, BookOpen, Send, ChevronDown, ChevronRight, CheckCircle, Clock, RefreshCw, XCircle, GraduationCap } from 'lucide-react'
import { getEmployees, createEmployee, updateEmployee, deleteEmployee, getAssignments, assignAdviser, removeAssignment, deploySemesterSubjects, getCurriculumDeploymentsByEmployee, deleteCurriculumDeployment, updateCurriculumDeployment, getAdviserSubjects, assignAdviserToSubject, getStudentDeploymentsWithAdvisers } from '../api/rbac'
import { getStudents } from '../api/supabase-students'
import { CURRICULUM } from '../data/curriculum'

const EMP_EMPTY = { employee_id: '', first_name: '', last_name: '', email: '', phone: '', department: 'CCS', position: 'Adviser', password_hash: 'adviser123' }

const STATUS_CFG = {
  Enrolled: { bg: '#dbeafe', color: '#1d4ed8', icon: Clock },
  Ongoing:  { bg: '#fef3c7', color: '#92400e', icon: RefreshCw },
  Passed:   { bg: '#dcfce7', color: '#166534', icon: CheckCircle },
  Failed:   { bg: '#fee2e2', color: '#991b1b', icon: XCircle },
  INC:      { bg: '#f3e8ff', color: '#7c3aed', icon: Clock },
  Dropped:  { bg: '#f3f4f6', color: '#6b7280', icon: XCircle },
  Pending:  { bg: '#fff7ed', color: '#c2410c', icon: Clock },
}

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || { bg: '#f3f4f6', color: '#6b7280', icon: Clock }
  const Icon = cfg.icon
  return <span className="emp-status-badge" style={{ background: cfg.bg, color: cfg.color }}><Icon size={11} /> {status}</span>
}

export default function AdviserManagement() {
  const [tab, setTab] = useState('employees')
  const [employees, setEmployees] = useState([])
  const [students, setStudents] = useState([])
  const [assignments, setAssignments] = useState([])
  const [currDeps, setCurrDeps] = useState([])
  const [adviserSubjects, setAdviserSubjects] = useState({}) // { [employeeId]: [subjects] }
  const [expandedAdviser, setExpandedAdviser] = useState(null)
  const [subjectAdviserStudent, setSubjectAdviserStudent] = useState('')
  const [subjectAdviserDeps, setSubjectAdviserDeps] = useState([])
  const [loadingSubjDeps, setLoadingSubjDeps] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showEmpForm, setShowEmpForm] = useState(false)
  const [editEmpId, setEditEmpId] = useState(null)
  const [empForm, setEmpForm] = useState(EMP_EMPTY)
  const [assignForm, setAssignForm] = useState({ employee_id: '', student_id: '', notes: '' })
  const [deployTarget, setDeployTarget] = useState({ student_id: '', semester_idx: '' })
  const [expandedStudent, setExpandedStudent] = useState(null)
  const [editingDep, setEditingDep] = useState(null)
  const [editDepForm, setEditDepForm] = useState({})
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [emps, studs, asgns, deps] = await Promise.all([
        getEmployees(), getStudents(), getAssignments(), getCurriculumDeploymentsByEmployee('all')
      ])
      setEmployees(emps.data || [])
      setStudents(studs.data || [])
      setAssignments(asgns.data || [])
      setCurrDeps(deps.data || [])
      // Load subjects per adviser
      const subjMap = {}
      for (const emp of (emps.data || [])) {
        const { data } = await getAdviserSubjects(emp.id).catch(() => ({ data: [] }))
        if (data?.length) subjMap[emp.id] = data
      }
      setAdviserSubjects(subjMap)
    } catch (err) { showToast('Failed to load: ' + err.message, 'error') }
    setLoading(false)
  }

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3500) }

  // ── Employees CRUD ──
  const handleEmpSubmit = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      if (editEmpId) { await updateEmployee(editEmpId, empForm); showToast('Employee updated.') }
      else { await createEmployee(empForm); showToast('Employee created.') }
      setShowEmpForm(false); setEditEmpId(null); setEmpForm(EMP_EMPTY); loadAll()
    } catch (err) { showToast(err.message, 'error') }
    setSaving(false)
  }

  const handleEmpEdit = (emp) => {
    setEditEmpId(emp.id)
    setEmpForm({ employee_id: emp.employee_id, first_name: emp.first_name, last_name: emp.last_name, email: emp.email || '', phone: emp.phone || '', department: emp.department || 'CCS', position: emp.position || 'Adviser', password_hash: emp.password_hash || 'adviser123' })
    setShowEmpForm(true)
  }

  const handleEmpDelete = async (id) => {
    if (!confirm('Delete this employee?')) return
    await deleteEmployee(id); showToast('Employee deleted.'); loadAll()
  }

  // ── Assignments ──
  const handleAssign = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await assignAdviser(assignForm); showToast('Adviser assigned.')
      setAssignForm({ employee_id: '', student_id: '', notes: '' }); loadAll()
    } catch (err) { showToast(err.message, 'error') }
    setSaving(false)
  }

  const handleRemoveAssignment = async (id) => {
    if (!confirm('Remove this assignment?')) return
    await removeAssignment(id); showToast('Assignment removed.'); loadAll()
  }

  // ── Curriculum Deployment ──
  const handleDeploySemester = async () => {
    if (!deployTarget.student_id || deployTarget.semester_idx === '') return
    const sem = CURRICULUM[parseInt(deployTarget.semester_idx)]
    if (!sem) return
    setSaving(true)
    try {
      const assignment = assignments.find(a => a.student_id === deployTarget.student_id)
      await deploySemesterSubjects(
        deployTarget.student_id, sem.subjects,
        `${sem.year} - ${sem.semester}`, sem.subjects[0]?.year_level || null,
        'Admin', assignment?.employee_id || null
      )
      showToast(`Deployed ${sem.subjects.length} subjects for ${sem.year} ${sem.semester}`)
      loadAll()
    } catch (err) { showToast(err.message, 'error') }
    setSaving(false)
  }

  const handleUpdateDep = async (id) => {
    setSaving(true)
    try {
      await updateCurriculumDeployment(id, editDepForm, 'Admin')
      setEditingDep(null); showToast('Updated.'); loadAll()
    } catch (err) { showToast(err.message, 'error') }
    setSaving(false)
  }

  const handleDeleteDep = async (id) => {
    if (!confirm('Remove this subject deployment?')) return
    await deleteCurriculumDeployment(id, 'Admin'); showToast('Removed.'); loadAll()
  }

  const filteredEmps = employees.filter(e => {
    const q = search.toLowerCase()
    return !q || `${e.first_name} ${e.last_name} ${e.employee_id}`.toLowerCase().includes(q)
  })

  const studentDeps = (sid) => currDeps.filter(d => d.student_id === sid)

  const tabs = [
    { id: 'employees',      label: 'Employees',        icon: Briefcase },
    { id: 'assignments',    label: 'Assignments',       icon: Users },
    { id: 'subject-adviser',label: 'Subject Advisers',  icon: GraduationCap },
    { id: 'deployments',    label: 'Curriculum Deploy', icon: BookOpen },
  ]

  return (
    <div className="rq-page">
      {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

      <div className="rq-header">
        <div className="rq-header-left">
          <div className="rq-header-icon-wrap"><Users size={22} /></div>
          <div>
            <h1 className="rq-header-title">Adviser & Deployment Management</h1>
            <p className="rq-header-sub">Manage employees, assign advisers, and deploy curriculum subjects</p>
          </div>
        </div>
        <div className="rq-header-stats">
          {[{ val: employees.length, lbl: 'Employees' }, { val: assignments.length, lbl: 'Assignments' }, { val: currDeps.length, lbl: 'Deployed' }].map(({ val, lbl }) => (
            <div key={lbl} className="rq-stat-pill"><span className="rq-stat-val">{val}</span><span className="rq-stat-lbl">{lbl}</span></div>
          ))}
        </div>
      </div>

      <div className="emp-tab-bar">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button key={id} className={`emp-tab-btn ${tab === id ? 'active' : ''}`} onClick={() => setTab(id)}>
            <Icon size={15} /> {label}
          </button>
        ))}
        <button className="rq-btn-clear" style={{ marginLeft: 'auto', padding: '6px 12px' }} onClick={loadAll} disabled={loading}>
          {loading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '↻'} Refresh
        </button>
      </div>

      {/* ── EMPLOYEES TAB ── */}
      {tab === 'employees' && (
        <div className="sp-section">
          <div className="emp-toolbar">
            <div className="emp-search-wrap">
              <Search size={15} className="emp-search-icon" />
              <input className="emp-search-input" placeholder="Search employees…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <button className="rq-btn-run" onClick={() => { setShowEmpForm(true); setEditEmpId(null); setEmpForm(EMP_EMPTY) }}>
              <Plus size={15} /> Add Employee
            </button>
          </div>

          {showEmpForm && (
            <div className="emp-form-card">
              <div className="emp-form-head">
                <Briefcase size={16} /><span>{editEmpId ? 'Edit Employee' : 'New Employee'}</span>
                <button className="rq-btn-clear" style={{ marginLeft: 'auto', padding: '4px 8px' }} onClick={() => { setShowEmpForm(false); setEditEmpId(null) }}><X size={14} /></button>
              </div>
              <form className="emp-form-grid" onSubmit={handleEmpSubmit}>
                {[
                  { key: 'employee_id',  label: 'Employee ID *', placeholder: 'e.g. EMP-004', required: true },
                  { key: 'first_name',   label: 'First Name *',  placeholder: 'First name',   required: true },
                  { key: 'last_name',    label: 'Last Name *',   placeholder: 'Last name',    required: true },
                  { key: 'email',        label: 'Email',         placeholder: 'email@pnc.edu.ph' },
                  { key: 'phone',        label: 'Phone',         placeholder: 'Phone number' },
                  { key: 'department',   label: 'Department',    placeholder: 'e.g. CCS' },
                  { key: 'position',     label: 'Position',      placeholder: 'e.g. Adviser' },
                  { key: 'password_hash',label: 'Password',      placeholder: 'Default: adviser123' },
                ].map(({ key, label, placeholder, required }) => (
                  <div key={key} className="rq-filter-field">
                    <label className="rq-filter-label">{label}</label>
                    <input className="rq-filter-input" required={required} placeholder={placeholder} value={empForm[key]} onChange={e => setEmpForm(f => ({ ...f, [key]: e.target.value }))} />
                  </div>
                ))}
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8, paddingTop: 4, borderTop: '1px solid var(--border)' }}>
                  <button type="submit" className="rq-btn-run" disabled={saving}><Save size={14} /> {saving ? 'Saving…' : 'Save'}</button>
                  <button type="button" className="rq-btn-clear" onClick={() => { setShowEmpForm(false); setEditEmpId(null) }}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div className="rq-section">
            <div className="rq-table-wrap">
              <table className="rq-table">
                <thead><tr><th>Employee</th><th>ID</th><th>Dept</th><th>Position</th><th>Email</th><th>Students</th><th>Actions</th></tr></thead>
                <tbody>
                  {filteredEmps.length === 0
                    ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>{loading ? 'Loading…' : 'No employees found.'}</td></tr>
                    : filteredEmps.map(emp => {
                        const count = assignments.filter(a => a.employee_id === emp.id).length
                        return (
                          <tr key={emp.id}>
                            <td><div className="rq-student-cell"><div className="rq-avatar" style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>{emp.first_name?.[0]}{emp.last_name?.[0]}</div><div className="rq-student-name">{emp.first_name} {emp.last_name}</div></div></td>
                            <td><span className="rq-student-id">{emp.employee_id}</span></td>
                            <td><span style={{ fontSize: '0.82rem' }}>{emp.department}</span></td>
                            <td><span className="rq-pill year">{emp.position}</span></td>
                            <td><span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{emp.email || '—'}</span></td>
                            <td><span className="rq-pill gpa">{count} students</span></td>
                            <td><div style={{ display: 'flex', gap: 6 }}>
                              <button className="rq-view-btn" onClick={() => handleEmpEdit(emp)}><Edit2 size={13} /></button>
                              <button className="rq-view-btn" style={{ background: '#fee2e2', color: '#dc2626', borderColor: '#fecaca' }} onClick={() => handleEmpDelete(emp.id)}><Trash2 size={13} /></button>
                            </div></td>
                          </tr>
                        )
                      })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── ASSIGNMENTS TAB ── */}
      {tab === 'assignments' && (
        <div className="sp-section">
          <div className="emp-form-card">
            <div className="emp-form-head"><UserPlus size={16} /><span>Assign Adviser to Student</span></div>
            <form className="emp-form-grid" onSubmit={handleAssign} style={{ gridTemplateColumns: '1fr 1fr 1fr auto' }}>
              <div className="rq-filter-field">
                <label className="rq-filter-label">Adviser</label>
                <select className="rq-filter-input" required value={assignForm.employee_id} onChange={e => setAssignForm(f => ({ ...f, employee_id: e.target.value }))}>
                  <option value="">Select adviser…</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.employee_id})</option>)}
                </select>
              </div>
              <div className="rq-filter-field">
                <label className="rq-filter-label">Student</label>
                <select className="rq-filter-input" required value={assignForm.student_id} onChange={e => setAssignForm(f => ({ ...f, student_id: e.target.value }))}>
                  <option value="">Select student…</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.student_id})</option>)}
                </select>
              </div>
              <div className="rq-filter-field">
                <label className="rq-filter-label">Notes</label>
                <input className="rq-filter-input" placeholder="Optional notes…" value={assignForm.notes} onChange={e => setAssignForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
              <div className="rq-filter-field" style={{ justifyContent: 'flex-end' }}>
                <label className="rq-filter-label">&nbsp;</label>
                <button type="submit" className="rq-btn-run" disabled={saving}><Send size={14} /> Assign</button>
              </div>
            </form>
          </div>

          {/* Assignments list */}
          <div className="rq-section">
            <div className="rq-table-wrap">
              <table className="rq-table">
                <thead><tr><th>Adviser</th><th>Student</th><th>Course</th><th>Assigned By</th><th>Date</th><th>Notes</th><th></th></tr></thead>
                <tbody>
                  {assignments.length === 0
                    ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--muted)' }}>No assignments yet.</td></tr>
                    : assignments.map(a => (
                        <tr key={a.id}>
                          <td><div className="rq-student-cell"><div className="rq-avatar" style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>{a.employees?.first_name?.[0]}{a.employees?.last_name?.[0]}</div><div><div className="rq-student-name">{a.employees?.first_name} {a.employees?.last_name}</div><div className="rq-student-id">{a.employees?.employee_id}</div></div></div></td>
                          <td><div className="rq-student-cell"><div className="rq-avatar">{a.students?.first_name?.[0]}{a.students?.last_name?.[0]}</div><div><div className="rq-student-name">{a.students?.first_name} {a.students?.last_name}</div><div className="rq-student-id">{a.students?.student_id}</div></div></div></td>
                          <td><span style={{ fontSize: '0.82rem' }}>{a.students?.course}</span></td>
                          <td><span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{a.assigned_by}</span></td>
                          <td><span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{new Date(a.assigned_at).toLocaleDateString()}</span></td>
                          <td><span style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>{a.notes || '—'}</span></td>
                          <td><button className="rq-view-btn" style={{ background: '#fee2e2', color: '#dc2626', borderColor: '#fecaca' }} onClick={() => handleRemoveAssignment(a.id)}><Trash2 size={13} /></button></td>
                        </tr>
                      ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Adviser subject summary */}
          {employees.filter(e => assignments.some(a => a.employee_id === e.id)).length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <BookOpen size={15} style={{ color: 'var(--orange)' }} /> Subjects Handled per Adviser
              </div>
              {employees.filter(e => assignments.some(a => a.employee_id === e.id)).map(emp => {
                const subjects = adviserSubjects[emp.id] || []
                const studentCount = assignments.filter(a => a.employee_id === emp.id).length
                const isOpen = expandedAdviser === emp.id
                return (
                  <div key={emp.id} className="emp-student-card" style={{ marginBottom: 8 }}>
                    <div className="emp-student-card-head" onClick={() => setExpandedAdviser(isOpen ? null : emp.id)}>
                      <div className="rq-avatar" style={{ background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>{emp.first_name?.[0]}{emp.last_name?.[0]}</div>
                      <div className="emp-student-info">
                        <div className="emp-student-name">{emp.first_name} {emp.last_name}</div>
                        <div className="emp-student-meta">{emp.employee_id} · {emp.position}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', alignItems: 'center' }}>
                        <span className="rq-pill year">{studentCount} students</span>
                        <span className="rq-pill gpa">{subjects.length} subjects</span>
                      </div>
                      <ChevronDown size={16} style={{ color: 'var(--muted)', transform: isOpen ? 'rotate(180deg)' : '', transition: 'transform 0.2s', marginLeft: 8 }} />
                    </div>
                    {isOpen && (
                      <div className="emp-student-card-body">
                        {subjects.length === 0
                          ? <p className="sp-empty">No subjects deployed to this adviser's students yet.</p>
                          : (
                            <div className="rq-table-wrap">
                              <table className="rq-table">
                                <thead><tr><th>Code</th><th>Subject</th><th>Units</th><th>Semester</th><th>Year</th></tr></thead>
                                <tbody>
                                  {subjects.map(s => (
                                    <tr key={s.subject_code}>
                                      <td><span className="rq-student-id">{s.subject_code}</span></td>
                                      <td><span style={{ fontSize: '0.82rem' }}>{s.subject_desc}</span></td>
                                      <td><span className="rq-pill year">{s.units}</span></td>
                                      <td><span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{s.semester}</span></td>
                                      <td><span className="rq-pill gpa">Year {s.year_level}</span></td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── SUBJECT ADVISERS TAB ── */}
      {tab === 'subject-adviser' && (
        <div className="sp-section">
          <div className="emp-form-card">
            <div className="emp-form-head"><GraduationCap size={16} /><span>Assign Adviser per Subject (by Student)</span></div>
            <div style={{ padding: 16 }}>
              <div className="rq-filter-field" style={{ marginBottom: 12 }}>
                <label className="rq-filter-label">Select Student</label>
                <select className="rq-filter-input" value={subjectAdviserStudent}
                  onChange={async e => {
                    const sid = e.target.value
                    setSubjectAdviserStudent(sid)
                    if (!sid) { setSubjectAdviserDeps([]); return }
                    setLoadingSubjDeps(true)
                    const { data } = await getStudentDeploymentsWithAdvisers(sid).catch(() => ({ data: [] }))
                    setSubjectAdviserDeps(data || [])
                    setLoadingSubjDeps(false)
                  }}>
                  <option value="">Select a student…</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.student_id})</option>)}
                </select>
              </div>

              {loadingSubjDeps && <div className="si-loading"><div className="spinner" /> Loading…</div>}

              {subjectAdviserStudent && !loadingSubjDeps && subjectAdviserDeps.length === 0 && (
                <div className="rq-empty"><div className="rq-empty-icon"><BookOpen size={32} /></div><h3>No subjects deployed</h3><p>Deploy subjects to this student first.</p></div>
              )}

              {subjectAdviserDeps.length > 0 && (() => {
                // Group by semester
                const bySem = {}
                subjectAdviserDeps.forEach(d => {
                  const key = d.semester || 'Unassigned'
                  if (!bySem[key]) bySem[key] = []
                  bySem[key].push(d)
                })
                return Object.entries(bySem).map(([sem, deps]) => (
                  <div key={sem} style={{ marginBottom: 16 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: 'var(--muted)', padding: '6px 0', borderBottom: '2px solid var(--border)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <BookOpen size={13} style={{ color: 'var(--orange)' }} /> {sem}
                    </div>
                    <div className="rq-table-wrap">
                      <table className="rq-table">
                        <thead><tr><th>Code</th><th>Subject</th><th>Units</th><th>Status</th><th>Assigned Adviser</th><th>Change Adviser</th></tr></thead>
                        <tbody>
                          {deps.map(dep => (
                            <tr key={dep.id}>
                              <td><span className="rq-student-id">{dep.subject_code}</span></td>
                              <td><span style={{ fontSize: '0.82rem' }}>{dep.subject_desc}</span></td>
                              <td><span className="rq-pill year">{dep.units}</span></td>
                              <td>
                                {dep.status && (() => {
                                  const cfg = { Enrolled: { bg: '#dbeafe', color: '#1d4ed8' }, Passed: { bg: '#dcfce7', color: '#166534' }, Failed: { bg: '#fee2e2', color: '#991b1b' }, Ongoing: { bg: '#fef3c7', color: '#92400e' } }[dep.status] || { bg: '#f3f4f6', color: '#6b7280' }
                                  return <span className="emp-status-badge" style={{ background: cfg.bg, color: cfg.color }}>{dep.status}</span>
                                })()}
                              </td>
                              <td>
                                {dep.employees
                                  ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                      <div className="rq-avatar" style={{ width: 24, height: 24, fontSize: '0.6rem', background: 'linear-gradient(135deg,#3b82f6,#6366f1)' }}>{dep.employees.first_name?.[0]}{dep.employees.last_name?.[0]}</div>
                                      <span style={{ fontSize: '0.78rem' }}>{dep.employees.first_name} {dep.employees.last_name}</span>
                                    </div>
                                  : <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>Not assigned</span>}
                              </td>
                              <td>
                                <select className="rq-filter-input" style={{ width: 160, padding: '4px 6px', fontSize: '0.78rem' }}
                                  value={dep.adviser_id || ''}
                                  onChange={async e => {
                                    const advId = e.target.value
                                    await assignAdviserToSubject(subjectAdviserStudent, dep.subject_code, advId || null, 'Admin').catch(err => showToast(err.message, 'error'))
                                    const { data } = await getStudentDeploymentsWithAdvisers(subjectAdviserStudent).catch(() => ({ data: [] }))
                                    setSubjectAdviserDeps(data || [])
                                    showToast(`Adviser updated for ${dep.subject_code}`)
                                  }}>
                                  <option value="">No adviser</option>
                                  {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name} ({e.employee_id})</option>)}
                                </select>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── CURRICULUM DEPLOYMENT TAB ── */}
      {tab === 'deployments' && (
        <div className="sp-section">
          {/* Deploy form */}
          <div className="emp-form-card">
            <div className="emp-form-head"><BookOpen size={16} /><span>Deploy Semester Subjects to Student</span></div>
            <div className="emp-form-grid" style={{ gridTemplateColumns: '1fr 1fr auto', padding: 16 }}>
              <div className="rq-filter-field">
                <label className="rq-filter-label">Student</label>
                <select className="rq-filter-input" value={deployTarget.student_id} onChange={e => setDeployTarget(f => ({ ...f, student_id: e.target.value }))}>
                  <option value="">Select student…</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name} ({s.student_id})</option>)}
                </select>
              </div>
              <div className="rq-filter-field">
                <label className="rq-filter-label">Semester</label>
                <select className="rq-filter-input" value={deployTarget.semester_idx} onChange={e => setDeployTarget(f => ({ ...f, semester_idx: e.target.value }))}>
                  <option value="">Select semester…</option>
                  {CURRICULUM.map((sem, i) => (
                    <option key={i} value={i}>{sem.year} — {sem.semester} ({sem.subjects.length} subjects)</option>
                  ))}
                </select>
              </div>
              <div className="rq-filter-field" style={{ justifyContent: 'flex-end' }}>
                <label className="rq-filter-label">&nbsp;</label>
                <button className="rq-btn-run" onClick={handleDeploySemester} disabled={saving || !deployTarget.student_id || deployTarget.semester_idx === ''}>
                  <BookOpen size={14} /> {saving ? 'Deploying…' : 'Deploy Semester'}
                </button>
              </div>
            </div>
            {deployTarget.semester_idx !== '' && (
              <div style={{ padding: '0 16px 14px', fontSize: '0.8rem', color: 'var(--muted)' }}>
                Preview: {CURRICULUM[parseInt(deployTarget.semester_idx)]?.subjects.map(s => s.code).join(', ')}
              </div>
            )}
          </div>

          {/* Student deployment list */}
          {students.filter(s => studentDeps(s.id).length > 0).map(stu => {
            const deps = studentDeps(stu.id)
            const isOpen = expandedStudent === stu.id
            const passed = deps.filter(d => d.status === 'Passed').length
            const adviser = assignments.find(a => a.student_id === stu.id)
            return (
              <div key={stu.id} className="emp-student-card">
                <div className="emp-student-card-head" onClick={() => setExpandedStudent(isOpen ? null : stu.id)}>
                  <div className="rq-avatar">{stu.first_name?.[0]}{stu.last_name?.[0]}</div>
                  <div className="emp-student-info">
                    <div className="emp-student-name">{stu.first_name} {stu.last_name}</div>
                    <div className="emp-student-meta">{stu.student_id} · {stu.course} · Year {stu.year_level}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', alignItems: 'center' }}>
                    <span className="rq-pill year">{deps.length} subjects</span>
                    <span className="rq-pill gpa">{passed} passed</span>
                    {adviser?.employees && <span className="rq-pill" style={{ background: '#dbeafe', color: '#1d4ed8' }}>Adviser: {adviser.employees.first_name} {adviser.employees.last_name}</span>}
                  </div>
                  <ChevronDown size={16} style={{ color: 'var(--muted)', transform: isOpen ? 'rotate(180deg)' : '', transition: 'transform 0.2s', marginLeft: 8 }} />
                </div>

                {isOpen && (
                  <div className="emp-student-card-body">
                    <div className="rq-table-wrap">
                      <table className="rq-table">
                        <thead><tr><th>Code</th><th>Subject</th><th>Units</th><th>Semester</th><th>Status</th><th>Grade</th><th>Remarks</th><th>Actions</th></tr></thead>
                        <tbody>
                          {deps.map(dep => (
                            <tr key={dep.id}>
                              <td><span className="rq-student-id">{dep.subject_code}</span></td>
                              <td><span style={{ fontSize: '0.82rem' }}>{dep.subject_desc}</span></td>
                              <td><span className="rq-pill year">{dep.units}</span></td>
                              <td><span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{dep.semester}</span></td>
                              <td>
                                {editingDep === dep.id
                                  ? <select className="rq-filter-input" style={{ width: 110 }} value={editDepForm.status} onChange={e => setEditDepForm(f => ({ ...f, status: e.target.value }))}>
                                      {Object.keys(STATUS_CFG).map(s => <option key={s}>{s}</option>)}
                                    </select>
                                  : <StatusBadge status={dep.status} />}
                              </td>
                              <td>
                                {editingDep === dep.id
                                  ? <input className="rq-filter-input" style={{ width: 70 }} placeholder="Grade" value={editDepForm.grade} onChange={e => setEditDepForm(f => ({ ...f, grade: e.target.value }))} />
                                  : <span style={{ fontSize: '0.82rem' }}>{dep.grade || '—'}</span>}
                              </td>
                              <td>
                                {editingDep === dep.id
                                  ? <input className="rq-filter-input" style={{ width: 120 }} placeholder="Remarks" value={editDepForm.remarks} onChange={e => setEditDepForm(f => ({ ...f, remarks: e.target.value }))} />
                                  : <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{dep.remarks || '—'}</span>}
                              </td>
                              <td>
                                {editingDep === dep.id
                                  ? <div style={{ display: 'flex', gap: 4 }}>
                                      <button className="rq-btn-run" style={{ padding: '4px 10px' }} onClick={() => handleUpdateDep(dep.id)} disabled={saving}><Save size={12} /></button>
                                      <button className="rq-btn-clear" style={{ padding: '4px 8px' }} onClick={() => setEditingDep(null)}><X size={12} /></button>
                                    </div>
                                  : <div style={{ display: 'flex', gap: 4 }}>
                                      <button className="rq-view-btn" onClick={() => { setEditingDep(dep.id); setEditDepForm({ status: dep.status, grade: dep.grade || '', remarks: dep.remarks || '' }) }}><Edit2 size={12} /></button>
                                      <button className="rq-view-btn" style={{ background: '#fee2e2', color: '#dc2626', borderColor: '#fecaca' }} onClick={() => handleDeleteDep(dep.id)}><Trash2 size={12} /></button>
                                    </div>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )
          })}

          {students.filter(s => studentDeps(s.id).length > 0).length === 0 && (
            <div className="rq-empty"><div className="rq-empty-icon"><BookOpen size={36} /></div><h3>No curriculum deployments yet</h3><p>Select a student and semester above to deploy subjects.</p></div>
          )}
        </div>
      )}
    </div>
  )
}
