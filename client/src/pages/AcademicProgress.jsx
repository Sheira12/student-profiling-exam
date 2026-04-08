import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getStudent, updateStudent } from '../api/students'
import { CURRICULUM } from '../data/curriculum'
import { Save, Printer, ArrowLeft, GraduationCap } from 'lucide-react'

const STATUS_OPTIONS = ['', 'PASSED', 'FAILED', 'INC', 'ENROLLED', 'DROPPED']

function getStatus(grade) {
  if (!grade && grade !== 0) return ''
  if (grade === 'PASSED') return 'PASSED'
  if (grade === 'INC') return 'INC'
  if (grade === 'ENROLLED') return 'ENROLLED'
  if (grade === 'DROPPED') return 'DROPPED'
  const g = parseFloat(grade)
  if (isNaN(g)) return ''
  return g <= 3.0 ? 'PASSED' : 'FAILED'
}

function getStatusClass(status) {
  switch (status) {
    case 'PASSED':   return 'apt-passed'
    case 'FAILED':   return 'apt-failed'
    case 'INC':      return 'apt-inc'
    case 'ENROLLED': return 'apt-enrolled'
    case 'DROPPED':  return 'apt-dropped'
    default:         return ''
  }
}

export default function AcademicProgress() {
  const { id } = useParams()
  const [student, setStudent] = useState(null)
  const [progress, setProgress] = useState({})
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getStudent(id).then(({ data }) => {
      setStudent(data)
      setProgress(data.academic_progress || {})
      setLoading(false)
    })
  }, [id])

  const setGrade = (code, value) => {
    setProgress(p => ({ ...p, [code]: value }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateStudent(id, { academic_progress: progress })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e) {
      const msg = e.response?.data?.error || e.message
      if (msg.includes('academic_progress') || msg.includes('column')) {
        alert('⚠️ Setup required: Run this SQL in your Supabase SQL Editor first:\n\nALTER TABLE students ADD COLUMN IF NOT EXISTS academic_progress jsonb DEFAULT \'{}\'::jsonb;')
      } else {
        alert('Failed to save: ' + msg)
      }
    } finally {
      setSaving(false)
    }
  }

  const handlePrint = () => window.print()

  if (loading) return <div className="si-loading"><span className="spinner" />Loading...</div>
  if (!student) return <div className="error-msg">Student not found.</div>

  // Summary stats
  const allSubjects = CURRICULUM.flatMap(s => s.subjects)
  const totalUnits = allSubjects.reduce((a, s) => a + s.units, 0)
  const passedSubjects = allSubjects.filter(s => getStatus(progress[s.code]) === 'PASSED')
  const passedUnits = passedSubjects.reduce((a, s) => a + s.units, 0)
  const failedCount = allSubjects.filter(s => getStatus(progress[s.code]) === 'FAILED').length
  const incCount = allSubjects.filter(s => getStatus(progress[s.code]) === 'INC').length
  const pct = Math.round((passedUnits / totalUnits) * 100)

  return (
    <div className="apt-page">
      {/* Header */}
      <div className="apt-topbar no-print">
        <Link to={`/students/${id}`} className="apt-back">
          <ArrowLeft size={16} strokeWidth={2} /> Back to Profile
        </Link>
        <div className="apt-topbar-actions">
          <button className="apt-btn-save" onClick={handleSave} disabled={saving}>
            <Save size={15} strokeWidth={2} />
            {saving ? 'Saving...' : saved ? '✓ Saved' : 'Save Progress'}
          </button>
          <button className="apt-btn-print" onClick={handlePrint}>
            <Printer size={15} strokeWidth={2} /> Print
          </button>
        </div>
      </div>

      {/* Document */}
      <div className="apt-doc">
        {/* Doc Header */}
        <div className="apt-doc-header">
          <div className="apt-doc-logo">
            <img src="/logo.png" alt="CCS" />
          </div>
          <div className="apt-doc-title-block">
            <div className="apt-doc-school">Pamantasan ng Cabuyao</div>
            <div className="apt-doc-college">College of Computing Studies</div>
            <div className="apt-doc-tracker-title">ACADEMIC PROGRESS TRACKER</div>
          </div>
        </div>

        {/* Student Info */}
        <div className="apt-student-info">
          <div className="apt-info-row">
            <div><span>Name:</span> <strong>{student.last_name?.toUpperCase()}, {student.first_name?.toUpperCase()}</strong></div>
            <div><span>Student No.:</span> <strong>{student.student_id}</strong></div>
          </div>
          <div className="apt-info-row">
            <div><span>Program:</span> <strong>{student.course || '—'}</strong></div>
            <div><span>Curriculum:</span> <strong>2018</strong></div>
          </div>
        </div>

        {/* Progress Summary */}
        <div className="apt-summary no-print">
          <div className="apt-sum-item">
            <div className="apt-sum-val">{passedUnits}<span>/{totalUnits}</span></div>
            <div className="apt-sum-label">Units Earned</div>
          </div>
          <div className="apt-sum-item">
            <div className="apt-sum-val">{passedSubjects.length}<span>/{allSubjects.length}</span></div>
            <div className="apt-sum-label">Subjects Passed</div>
          </div>
          <div className="apt-sum-item red">
            <div className="apt-sum-val">{failedCount}</div>
            <div className="apt-sum-label">Failed</div>
          </div>
          <div className="apt-sum-item yellow">
            <div className="apt-sum-val">{incCount}</div>
            <div className="apt-sum-label">Incomplete</div>
          </div>
          <div className="apt-sum-item">
            <div className="apt-sum-val">{student.gpa || '—'}</div>
            <div className="apt-sum-label">GPA</div>
          </div>
          <div className="apt-progress-bar-wrap">
            <div className="apt-progress-label">Overall Progress — {pct}%</div>
            <div className="apt-progress-track">
              <div className="apt-progress-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        </div>

        {/* Semester Tables */}
        {CURRICULUM.map((sem, si) => {
          const semUnits = sem.subjects.reduce((a, s) => a + s.units, 0)
          return (
            <div key={si} className="apt-semester">
              <div className="apt-sem-header">
                {sem.year} : <em>{sem.semester}</em>
              </div>
              <table className="apt-table">
                <thead>
                  <tr>
                    <th>Course Code</th>
                    <th>Course Description</th>
                    <th>Units</th>
                    <th>Prerequisites</th>
                    <th>Grade</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sem.subjects.map(subj => {
                    const grade = progress[subj.code] || ''
                    const status = getStatus(grade)
                    return (
                      <tr key={subj.code}>
                        <td className="apt-code">{subj.code}</td>
                        <td>{subj.desc}</td>
                        <td className="apt-center">{subj.units}</td>
                        <td className="apt-prereq">{subj.prereq}</td>
                        <td className="apt-center apt-grade-cell no-print">
                          <input
                            className="apt-grade-input"
                            value={grade}
                            onChange={e => setGrade(subj.code, e.target.value)}
                            placeholder="—"
                          />
                        </td>
                        <td className="apt-center print-only">{grade || '—'}</td>
                        <td className="apt-center">
                          <span className={`apt-status ${getStatusClass(status)}`}>
                            {status || '—'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                  <tr className="apt-total-row">
                    <td colSpan={2} className="apt-total-label">Total No. of Units</td>
                    <td className="apt-center apt-total-val">{semUnits}</td>
                    <td colSpan={3} />
                  </tr>
                </tbody>
              </table>
            </div>
          )
        })}

        {/* Signature area */}
        <div className="apt-signatures">
          <div className="apt-sig-block">
            <div className="apt-sig-line" />
            <div className="apt-sig-label">Student Signature</div>
          </div>
          <div className="apt-sig-block">
            <div className="apt-sig-line" />
            <div className="apt-sig-label">Registrar / Adviser</div>
          </div>
          <div className="apt-sig-block">
            <div className="apt-sig-line" />
            <div className="apt-sig-label">Date</div>
          </div>
        </div>
      </div>
    </div>
  )
}
