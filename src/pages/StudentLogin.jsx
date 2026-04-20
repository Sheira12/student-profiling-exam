import { useState, useRef } from 'react'
import { GraduationCap, Hash, User, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { getStudents } from '../api/supabase-students'

export default function StudentLogin({ onStudentLogin, onBackToAdmin }) {
  const [form, setForm] = useState({ student_id: '', last_name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const cardRef = useRef(null)

  const handle = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data } = await getStudents({ search: form.student_id.trim() })
      const match = data.find(s =>
        s.student_id === form.student_id.trim() &&
        s.last_name.toLowerCase() === form.last_name.trim().toLowerCase()
      )
      if (match) {
        onStudentLogin(match)
      } else {
        setError('Student ID or Last Name is incorrect.')
      }
    } catch {
      setError('Connection error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleMouseMove = (e) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const rotateX = ((e.clientY - rect.top - rect.height / 2) / rect.height) * -8
    const rotateY = ((e.clientX - rect.left - rect.width / 2) / rect.width) * 8
    card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02,1.02,1.02)`
  }
  const handleMouseLeave = () => {
    if (cardRef.current)
      cardRef.current.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)'
  }

  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i, size: Math.random() * 12 + 4,
    left: Math.random() * 100, delay: Math.random() * 8, duration: Math.random() * 10 + 10,
  }))

  return (
    <div className="lp-root">
      <div className="lp-bg" />
      <div className="lp-bg-glow lp-glow-1" />
      <div className="lp-bg-glow lp-glow-2" />
      <div className="lp-bg-glow lp-glow-3" />
      {particles.map(p => (
        <div key={p.id} className="lp-particle" style={{
          width: p.size, height: p.size, left: `${p.left}%`,
          animationDelay: `${p.delay}s`, animationDuration: `${p.duration}s`,
        }} />
      ))}

      <div className="lp-layout">
        <div className="lp-left">
          <div className="lp-logo-ring">
            <img src="/logo.png" alt="CCS Logo" className="lp-logo-img" />
          </div>
          <h1 className="lp-school">College of Computing Studies</h1>
          <p className="lp-school-sub">Pamantasan ng Cabuyao</p>
          <div className="lp-tagline">Student Portal</div>
          <div className="sl-info-cards">
            <div className="sl-info-card"><GraduationCap size={18}/><span>View your profile</span></div>
            <div className="sl-info-card"><GraduationCap size={18}/><span>Check academic progress</span></div>
            <div className="sl-info-card"><GraduationCap size={18}/><span>See your grades & status</span></div>
          </div>
        </div>

        <div className="lp-divider-v" />

        <div className="lp-right">
          <div className="lp-card" ref={cardRef} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
            <div className="lp-card-bar" />

            <div className="lp-card-icon" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.1))', border: '1px solid rgba(34,197,94,0.3)', color: '#22c55e' }}>
              <GraduationCap size={26} strokeWidth={1.6} />
            </div>

            <h2 className="lp-card-title">Student Portal</h2>
            <p className="lp-card-sub">Enter your Student ID and Last Name</p>

            {error && <div className="lp-error"><span>⚠</span> {error}</div>}

            <form onSubmit={handleSubmit} className="lp-form">
              <div className="lp-field">
                <label>Student ID</label>
                <div className="lp-input">
                  <Hash size={15} strokeWidth={2} className="lp-input-icon" />
                  <input
                    name="student_id"
                    value={form.student_id}
                    onChange={handle}
                    placeholder="e.g. 2102069"
                    required
                  />
                </div>
              </div>

              <div className="lp-field">
                <label>Last Name</label>
                <div className="lp-input">
                  <User size={15} strokeWidth={2} className="lp-input-icon" />
                  <input
                    name="last_name"
                    value={form.last_name}
                    onChange={handle}
                    placeholder="e.g. Bernal"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="lp-btn sl-btn" disabled={loading}>
                {loading ? <><span className="spinner" /> Verifying...</> : 'Access My Profile'}
              </button>
            </form>

            <button className="sl-back-btn" onClick={onBackToAdmin}>
              <ArrowLeft size={14} strokeWidth={2} /> Back to Admin Login
            </button>

            <p className="lp-footer">CCS Student Profiling System &copy; {new Date().getFullYear()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
