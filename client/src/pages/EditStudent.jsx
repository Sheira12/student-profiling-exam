import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import StudentForm, { payloadToForm } from '../components/StudentForm'
import { getStudent, updateStudent } from '../api/supabase-students'

export default function EditStudent() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [initialData, setInitialData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    getStudent(id).then(({ data }) => setInitialData(payloadToForm(data)))
  }, [id])

  const handleSubmit = async (payload) => {
    setLoading(true)
    setError(null)
    try {
      await updateStudent(id, payload)
      navigate(`/admin/students/${id}`)
    } catch (e) {
      setError(e.response?.data?.error || e.message)
      setLoading(false)
    }
  }

  if (!initialData) return <div className="loading">Loading...</div>

  return (
    <div className="form-page">
      <div className="form-page-header">
        <h1>Edit Student</h1>
        <p>Update the student's profile information.</p>
      </div>
      {error && <div className="error-msg">{error}</div>}
      <StudentForm initialData={initialData} onSubmit={handleSubmit} loading={loading} />
    </div>
  )
}
