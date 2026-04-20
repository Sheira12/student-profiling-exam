import { useState, useEffect } from 'react'
import { BookOpen, Download, FileText, GraduationCap } from 'lucide-react'
import { getCurriculumDeployments } from '../api/rbac'
import { CURRICULUM } from '../data/curriculum'

const STATUS_CFG = {
  Enrolled:  { bg: '#dbeafe', color: '#1d4ed8' },
  Ongoing:   { bg: '#fef3c7', color: '#92400e' },
  Passed:    { bg: '#dcfce7', color: '#166534' },
  Failed:    { bg: '#fee2e2', color: '#991b1b' },
  INC:       { bg: '#f3e8ff', color: '#7c3aed' },
  Dropped:   { bg: '#f3f4f6', color: '#6b7280' },
  Pending:   { bg: '#fff7ed', color: '#c2410c' },
}

// ── Download helpers ──────────────────────────────────────────

function downloadGradesCSV(student, deployments) {
  const rows = [
    ['Code','Subject','Units','Semester','Prelim','Midterm','Finals','Final Grade','Status','Remarks'],
    ...deployments.map(d => [
      d.subject_code, `"${d.subject_desc}"`, d.units, `"${d.semester}"`,
      d.prelim_grade ?? '', d.midterm_grade ?? '', d.finals_grade ?? '',
      d.grade ?? '', d.status ?? '', `"${d.remarks ?? ''}"`
    ])
  ].map(r => r.join(',')).join('\n')
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([rows], { type: 'text/csv' }))
  a.download = `grades_${student.student_id}_${new Date().toISOString().split('T')[0]}.csv`
  a.click()
}

function downloadAcademicTracker(student, deployments) {
  // Build a printable HTML page
  const depMap = {}
  deployments.forEach(d => { depMap[d.subject_code] = d })

  const semRows = CURRICULUM.map(sem => {
    const rows = sem.subjects.map(subj => {
      const dep = depMap[subj.code]
      return `<tr>
        <td>${subj.code}</td>
        <td>${subj.desc}</td>
        <td style="text-align:center">${subj.units}</td>
        <td style="text-align:center">${dep?.prelim_grade ?? '—'}</td>
        <td style="text-align:center">${dep?.midterm_grade ?? '—'}</td>
        <td style="text-align:center">${dep?.finals_grade ?? '—'}</td>
        <td style="text-align:center;font-weight:bold">${dep?.grade ?? '—'}</td>
        <td style="text-align:center">${dep?.status ?? '—'}</td>
      </tr>`
    }).join('')
    return `<div style="margin-bottom:20px">
      <div style="background:#f3f4f6;padding:6px 10px;font-weight:bold;border-left:4px solid #e8650a">${sem.year} — ${sem.semester}</div>
      <table style="width:100%;border-collapse:collapse;font-size:12px">
        <thead><tr style="background:#fafafa">
          <th style="border:1px solid #ddd;padding:5px">Code</th>
          <th style="border:1px solid #ddd;padding:5px">Subject</th>
          <th style="border:1px solid #ddd;padding:5px">Units</th>
          <th style="border:1px solid #ddd;padding:5px;background:#fffbeb">Prelim</th>
          <th style="border:1px solid #ddd;padding:5px;background:#eff6ff">Midterm</th>
          <th style="border:1px solid #ddd;padding:5px;background:#f0fdf4">Finals</th>
          <th style="border:1px solid #ddd;padding:5px">Final Grade</th>
          <th style="border:1px solid #ddd;padding:5px">Status</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`
  }).join('')

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>Academic Tracker — ${student.first_name} ${student.last_name}</title>
  <style>body{font-family:Arial,sans-serif;padding:20px;color:#111}
  td,th{border:1px solid #ddd;padding:5px}
  @media print{button{display:none}}</style>
  </head><body>
  <div style="text-align:center;margin-bottom:20px">
    <h2 style="margin:0">Pamantasan ng Cabuyao — College of Computing Studies</h2>
    <h3 style="margin:4px 0">ACADEMIC PROGRESS TRACKER</h3>
    <p style="margin:2px 0"><strong>Name:</strong> ${student.last_name?.toUpperCase()}, ${student.first_name?.toUpperCase()} &nbsp;&nbsp; <strong>Student No.:</strong> ${student.student_id}</p>
    <p style="margin:2px 0"><strong>Program:</strong> ${student.course || '—'} &nbsp;&nbsp; <strong>GPA:</strong> ${student.gpa || '—'}</p>
  </div>
  ${semRows}
  <div style="margin-top:40px;display:flex;justify-content:space-around">
    <div style="text-align:center"><div style="border-top:1px solid #000;width:200px;margin:0 auto"></div><p>Student Signature</p></div>
    <div style="text-align:center"><div style="border-top:1px solid #000;width:200px;margin:0 auto"></div><p>Adviser / Registrar</p></div>
    <div style="text-align:center"><div style="border-top:1px solid #000;width:200px;margin:0 auto"></div><p>Date</p></div>
  </div>
  <script>window.print()</script>
  </body></html>`

  const w = window.open('', '_blank')
  w.document.write(html)
  w.document.close()
}

function downloadRegistrationForm(student) {
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>Registration Form — ${student.first_name} ${student.last_name}</title>
  <style>body{font-family:Arial,sans-serif;padding:30px;color:#111;max-width:800px;margin:0 auto}
  .field{border-bottom:1px solid #000;min-height:24px;margin-bottom:4px;padding:2px 4px}
  .label{font-size:11px;color:#555;margin-top:10px}
  .row{display:flex;gap:20px;margin-bottom:8px}
  .col{flex:1}
  h2,h3{text-align:center;margin:4px 0}
  @media print{button{display:none}}</style>
  </head><body>
  <h2>Pamantasan ng Cabuyao</h2>
  <h3>College of Computing Studies</h3>
  <h3 style="border:2px solid #000;padding:4px;display:inline-block;width:100%;text-align:center;box-sizing:border-box">REGISTRATION FORM</h3>
  <div class="row">
    <div class="col"><div class="label">Student No.</div><div class="field">${student.student_id}</div></div>
    <div class="col"><div class="label">Academic Year</div><div class="field">&nbsp;</div></div>
    <div class="col"><div class="label">Semester</div><div class="field">&nbsp;</div></div>
  </div>
  <div class="row">
    <div class="col"><div class="label">Last Name</div><div class="field">${student.last_name?.toUpperCase()}</div></div>
    <div class="col"><div class="label">First Name</div><div class="field">${student.first_name?.toUpperCase()}</div></div>
    <div class="col"><div class="label">Middle Name</div><div class="field">&nbsp;</div></div>
  </div>
  <div class="row">
    <div class="col"><div class="label">Program</div><div class="field">${student.course || '—'}</div></div>
    <div class="col"><div class="label">Year Level</div><div class="field">${student.year_level ? `${student.year_level}${['st','nd','rd','th'][student.year_level-1]} Year` : '—'}</div></div>
    <div class="col"><div class="label">GPA</div><div class="field">${student.gpa || '—'}</div></div>
  </div>
  <div class="row">
    <div class="col"><div class="label">Email</div><div class="field">${student.email || '—'}</div></div>
    <div class="col"><div class="label">Phone</div><div class="field">${student.phone || '—'}</div></div>
  </div>
  <div class="label">Address</div><div class="field">${student.address || '—'}</div>
  <br>
  <table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:10px">
    <thead><tr style="background:#f3f4f6">
      <th style="border:1px solid #000;padding:5px">Course Code</th>
      <th style="border:1px solid #000;padding:5px">Course Description</th>
      <th style="border:1px solid #000;padding:5px">Units</th>
      <th style="border:1px solid #000;padding:5px">Schedule</th>
      <th style="border:1px solid #000;padding:5px">Instructor</th>
    </tr></thead>
    <tbody>
      ${Array(8).fill(0).map(() => `<tr><td style="border:1px solid #000;padding:8px">&nbsp;</td><td style="border:1px solid #000;padding:8px">&nbsp;</td><td style="border:1px solid #000;padding:8px">&nbsp;</td><td style="border:1px solid #000;padding:8px">&nbsp;</td><td style="border:1px solid #000;padding:8px">&nbsp;</td></tr>`).join('')}
    </tbody>
  </table>
  <div style="margin-top:40px;display:flex;justify-content:space-around">
    <div style="text-align:center"><div style="border-top:1px solid #000;width:180px;margin:0 auto"></div><p style="font-size:12px">Student Signature / Date</p></div>
    <div style="text-align:center"><div style="border-top:1px solid #000;width:180px;margin:0 auto"></div><p style="font-size:12px">Adviser</p></div>
    <div style="text-align:center"><div style="border-top:1px solid #000;width:180px;margin:0 auto"></div><p style="font-size:12px">Registrar</p></div>
  </div>
  <script>window.print()</script>
  </body></html>`

  const w = window.open('', '_blank')
  w.document.write(html)
  w.document.close()
}

// ── Component ─────────────────────────────────────────────────

export default function StudentGradesView({ student }) {
  const [deployments, setDeployments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const safe = (fn) => fn.catch(() => ({ data: [] }))
    safe(getCurriculumDeployments(student.id)).then(({ data }) => {
      setDeployments(data || [])
      setLoading(false)
    })
  }, [student.id])

  if (loading) return <div className="si-loading"><div className="spinner" /> Loading grades…</div>

  const bySemester = {}
  deployments.forEach(d => {
    const key = d.semester || 'Unassigned'
    if (!bySemester[key]) bySemester[key] = []
    bySemester[key].push(d)
  })

  const passed = deployments.filter(d => d.status === 'Passed').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Download buttons */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button className="rq-btn-run" style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', padding: '9px 16px' }}
          onClick={() => downloadAcademicTracker(student, deployments)}>
          <FileText size={14} /> Academic Tracker
        </button>
        <button className="rq-btn-run" style={{ background: 'linear-gradient(135deg,#3b82f6,#2563eb)', padding: '9px 16px' }}
          onClick={() => downloadRegistrationForm(student)}>
          <GraduationCap size={14} /> Registration Form
        </button>
        {deployments.length > 0 && (
          <button className="rq-btn-export" style={{ padding: '9px 16px' }}
            onClick={() => downloadGradesCSV(student, deployments)}>
            <Download size={14} /> Grades CSV
          </button>
        )}
      </div>

      {deployments.length === 0 ? (
        <div className="sp-clean-record" style={{ borderColor: '#e0e7ff' }}>
          <div className="sp-clean-icon" style={{ background: '#e0e7ff', color: '#4f46e5' }}><BookOpen size={32} /></div>
          <h3 style={{ color: '#4f46e5' }}>No grades available yet</h3>
          <p>Your adviser will input grades once subjects are deployed.</p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="sp-progress-summary">
            {[
              { val: passed,                                                          lbl: 'Passed',   color: '#10b981' },
              { val: deployments.filter(d => d.status === 'Enrolled').length,        lbl: 'Enrolled', color: '#3b82f6' },
              { val: deployments.filter(d => d.status === 'Failed').length,          lbl: 'Failed',   color: '#ef4444' },
              { val: deployments.filter(d => d.status === 'INC').length,             lbl: 'INC',      color: '#7c3aed' },
              { val: deployments.length,                                              lbl: 'Total',    color: 'var(--text)' },
            ].map(({ val, lbl, color }) => (
              <div key={lbl} className="sp-prog-stat">
                <div className="sp-prog-val" style={{ color }}>{val}</div>
                <div className="sp-prog-label">{lbl}</div>
              </div>
            ))}
          </div>

          {/* Per-semester tables */}
          {Object.entries(bySemester).map(([semester, deps]) => (
            <div key={semester} className="apt-semester">
              <div className="apt-sem-header">{semester}</div>
              <div className="rq-table-wrap">
                <table className="rq-table">
                  <thead>
                    <tr>
                      <th>Code</th><th>Subject</th><th>Units</th>
                      <th style={{ background: '#fffbeb', color: '#92400e' }}>Prelim</th>
                      <th style={{ background: '#eff6ff', color: '#1d4ed8' }}>Midterm</th>
                      <th style={{ background: '#f0fdf4', color: '#065f46' }}>Finals</th>
                      <th>Final Grade</th><th>Status</th><th>Teacher</th><th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deps.map(dep => {
                      const cfg = STATUS_CFG[dep.status] || {}
                      return (
                        <tr key={dep.id}>
                          <td><span className="rq-student-id">{dep.subject_code}</span></td>
                          <td><span style={{ fontSize: '0.82rem' }}>{dep.subject_desc}</span></td>
                          <td><span className="rq-pill year">{dep.units}</span></td>
                          <td style={{ background: '#fffbeb', textAlign: 'center' }}>
                            <span style={{ fontWeight: dep.prelim_grade ? 600 : 400, color: dep.prelim_grade ? '#92400e' : 'var(--muted)' }}>
                              {dep.prelim_grade ?? '—'}
                            </span>
                          </td>
                          <td style={{ background: '#eff6ff', textAlign: 'center' }}>
                            <span style={{ fontWeight: dep.midterm_grade ? 600 : 400, color: dep.midterm_grade ? '#1d4ed8' : 'var(--muted)' }}>
                              {dep.midterm_grade ?? '—'}
                            </span>
                          </td>
                          <td style={{ background: '#f0fdf4', textAlign: 'center' }}>
                            <span style={{ fontWeight: dep.finals_grade ? 600 : 400, color: dep.finals_grade ? '#065f46' : 'var(--muted)' }}>
                              {dep.finals_grade ?? '—'}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.9rem', fontWeight: dep.grade ? 700 : 400, color: dep.grade ? 'var(--text)' : 'var(--muted)' }}>
                              {dep.grade || '—'}
                            </span>
                          </td>
                          <td>
                            {dep.status
                              ? <span className="emp-status-badge" style={{ background: cfg.bg, color: cfg.color }}>{dep.status}</span>
                              : <span style={{ color: 'var(--muted)' }}>—</span>}
                          </td>
                          <td>
                            {dep.employees
                              ? <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'linear-gradient(135deg,#e8650a,#c45200)', color: 'white', fontSize: '0.58rem', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    {dep.employees.first_name?.[0]}{dep.employees.last_name?.[0]}
                                  </div>
                                  <span style={{ fontSize: '0.78rem', fontWeight: 500, whiteSpace: 'nowrap' }}>
                                    {dep.employees.first_name} {dep.employees.last_name}
                                  </span>
                                </div>
                              : <span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>—</span>}
                          </td>
                          <td><span style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{dep.remarks || '—'}</span></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  )
}
