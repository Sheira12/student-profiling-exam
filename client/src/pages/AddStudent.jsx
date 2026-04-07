import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import StudentForm from '../components/StudentForm'
import { createStudent } from '../api/students'

export default function AddStudent() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (payload) => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await createStudent(payload)
      navigate(`/students/${data.id}`)
    } catch (e) {
      const msg = e.response?.data?.error || e.message
      if (msg.includes('duplicate key') || msg.includes('unique constraint')) {
        setError(`Student ID "${payload.student_id}" already exists. Please use a different Student ID.`)
      } else {
        setError(msg)
      }
      setLoading(false)
    }
  }

  return (
    <div className="form-page">
      <div className="form-page-header">
        <h1>Add New Student</h1>
        <p>Fill in the student's complete profile information.</p>
      </div>
      {error && <div className="error-msg">{error}</div>}
      <StudentForm onSubmit={handleSubmit} loading={loading} />
    </div>
  )
}
