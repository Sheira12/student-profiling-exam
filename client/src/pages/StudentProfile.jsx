import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { getStudent, deleteStudent } from '../api/students'

const Section = ({ title, items }) => {
  if (!items?.length) return null
  return (
    <div className="profile-section">
      <h3>{title}</h3>
      <div className="tags">
        {items.map(item => <span key={item} className="tag">{item}</span>)}
      </div>
    </div>
  )
}

export default function StudentProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getStudent(id).then(({ data }) => {
      setStudent(data)
      setLoading(false)
    })
  }, [id])

  const handleDelete = async () => {
    if (!confirm('Delete this student?')) return
    await deleteStudent(id)
    navigate('/')
  }

  if (loading) return <div className="loading">Loading...</div>
  if (!student) return <div className="error">Student not found.</div>

  return (
    <div className="profile-page">
      <div className="profile-hero">
        <div className="avatar large">{student.first_name?.[0]}{student.last_name?.[0]}</div>
        <div>
          <h1>{student.first_name} {student.last_name}</h1>
          <p className="student-id">{student.student_id}</p>
          <p>{student.course} — {student.year_level ? `Year ${student.year_level}` : ''}</p>
        </div>
        <div className="profile-actions">
          <Link to={`/progress/${id}`} className="btn btn-primary">📊 Academic Progress</Link>
          <Link to={`/edit/${id}`} className="btn btn-edit">Edit</Link>
          <button className="btn btn-delete" onClick={handleDelete}>Delete</button>
          <Link to="/students" className="btn">Back</Link>
        </div>
      </div>

      <div className="profile-grid">
        <div className="profile-card">
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

        <div className="profile-card">
          <h3>Academic History</h3>
          <table className="info-table">
            <tbody>
              <tr><td>Course</td><td>{student.course || '—'}</td></tr>
              <tr><td>Year Level</td><td>{student.year_level || '—'}</td></tr>
              <tr><td>GPA</td><td>{student.gpa || '—'}</td></tr>
            </tbody>
          </table>
          <Section title="Academic Awards" items={student.academic_awards} />
        </div>
      </div>

      <div className="profile-grid">
        <Section title="Skills" items={student.skills} />
        <Section title="Non-Academic Activities" items={student.non_academic_activities} />
        <Section title="Affiliations" items={student.affiliations} />
        {student.violations?.length > 0 && (
          <div className="profile-section violations">
            <h3>Violations</h3>
            <div className="tags">
              {student.violations.map(v => <span key={v} className="tag violation">{v}</span>)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
