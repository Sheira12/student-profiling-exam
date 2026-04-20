import { Link } from 'react-router-dom'

export default function StudentCard({ student, onDelete }) {
  return (
    <div className="student-card">
      <div className="card-header">
        <div className="avatar">{student.first_name?.[0]}{student.last_name?.[0]}</div>
        <div>
          <h3>{student.first_name} {student.last_name}</h3>
          <span className="student-id">{student.student_id}</span>
        </div>
      </div>
      <div className="card-body">
        <p><strong>Course:</strong> {student.course || '—'}</p>
        <p><strong>Year:</strong> {student.year_level ? `${student.year_level}${['st','nd','rd','th'][student.year_level-1] || 'th'} Year` : '—'}</p>
        <p><strong>GPA:</strong> {student.gpa || '—'}</p>
        {student.skills?.length > 0 && (
          <div className="tags">
            {student.skills.map(s => <span key={s} className="tag skill">{s}</span>)}
          </div>
        )}
        {student.affiliations?.length > 0 && (
          <div className="tags">
            {student.affiliations.map(a => <span key={a} className="tag affil">{a}</span>)}
          </div>
        )}
      </div>
      <div className="card-actions">
        <Link to={`/students/${student.id}`} className="btn btn-view">View</Link>
        <Link to={`/edit/${student.id}`} className="btn btn-edit">Edit</Link>
        <button className="btn btn-delete" onClick={() => onDelete(student.id)}>Delete</button>
      </div>
    </div>
  )
}
