import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, Hash, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { setStudent } from '../hooks/useAuth'

export default function StudentLogin() {
  const [form, setForm] = useState({ student_id: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const cardRef = useRef(null)
  const navigate = useNavigate()

  const handle = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data, error: dbError } = await supabase
        .from('students')
        .select('*')
        .eq('student_id', form.student_id.trim())
        .eq('password', form.password)
        .maybeSingle()

      if (dbError) throw dbError

      if (data) {
        setStudent(data)
        navigate('/student/portal', { replace: true })
      } else {
        setError('Invalid Student ID or password.')
      }
    } catch (err) {
      console.error('Student login error:', err)
      setError('Connection error: ' + (err.message || 'Please try again.'))
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
          <div className="lp-logo-ring"><img src="/logo.png" alt="CCS Logo" className="lp-logo-img" /></div>
          <h1 className="lp-school">College of Computing Studies</h1>
          <p className="lp-school-sub">Pamantasan ng Cabuyao</p>
          <div className="lp-tagline">Student Portal</div>
          <div className="sl-info-cards">
            <div className="sl-info-card"><GraduationCap size={18}/><span>View your profile & progress</span></div>
            <div className="sl-info-card"><GraduationCap size={18}/><span>Check grades per subject</span></div>
            <div className="sl-info-card"><GraduationCap size={18}/><span>View activities & announcements</span></div>
          </div>
        </div>

        <div className="lp-divider-v" />

        <div className="lp-right">
          <div className="lp-card" ref={cardRef} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
            <div className="lp-card-bar" style={{ background: 'linear-gradient(90deg, #e8650a, #c45200)' }} />
            <div className="lp-card-icon" style={{ background: 'rgba(232,101,10,0.12)', border: '1px solid rgba(232,101,10,0.3)', color: '#e8650a' }}>
              <GraduationCap size={26} strokeWidth={1.6} />
            </div>
            <h2 className="lp-card-title">Student Login</h2>
            <p className="lp-card-sub">Sign in with your Student ID and password</p>
            {error && <div className="lp-error"><span>⚠</span> {error}</div>}
            <form onSubmit={handleSubmit} className="lp-form">
              <div className="lp-field">
                <label>Student ID</label>
                <div className="lp-input">
                  <Hash size={15} strokeWidth={2} className="lp-input-icon" />
                  <input name="student_id" value={form.student_id} onChange={handle} placeholder="e.g. 2021-00001" autoComplete="off" required />
                </div>
              </div>
              <div className="lp-field">
                <label>Password</label>
                <div className="lp-input">
                  <Lock size={15} strokeWidth={2} className="lp-input-icon" />
                  <input name="password" type={showPass ? 'text' : 'password'} value={form.password} onChange={handle} placeholder="Enter password" required />
                  <button type="button" className="lp-eye" onClick={() => setShowPass(s => !s)} tabIndex={-1}>
                    {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
              <button type="submit" className="lp-btn" style={{ background: 'linear-gradient(135deg,#e8650a,#c45200)' }} disabled={loading}>
                {loading ? <><span className="spinner" /> Signing in...</> : 'Access Student Portal'}
              </button>
            </form>
            <button className="sl-back-btn" onClick={() => navigate('/admin')}>
              <ArrowLeft size={14} /> Back to Admin Login
            </button>
            <p className="lp-footer">CCS Student Profiling System &copy; {new Date().getFullYear()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
