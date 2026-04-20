import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Lock, User, Eye, EyeOff } from 'lucide-react'

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const cardRef = useRef(null)
  const navigate = useNavigate()

  const handle = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setTimeout(() => {
      if (form.username === 'admin' && form.password === 'admin123') {
        onLogin(); navigate('/')
      } else {
        setError('Invalid username or password.')
        setLoading(false)
      }
    }, 800)
  }

  const handleMouseMove = (e) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const rotateX = ((y - rect.height / 2) / rect.height) * -10
    const rotateY = ((x - rect.width / 2) / rect.width) * 10
    card.style.transform = `perspective(1200px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02,1.02,1.02)`
  }
  const handleMouseLeave = () => {
    if (cardRef.current)
      cardRef.current.style.transform = 'perspective(1200px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)'
  }

  const particles = Array.from({ length: 22 }, (_, i) => ({
    id: i,
    size: Math.random() * 14 + 4,
    left: Math.random() * 100,
    delay: Math.random() * 8,
    duration: Math.random() * 10 + 10,
  }))

  return (
    <div className="lp-root">
      {/* Full background */}
      <div className="lp-bg" />
      <div className="lp-bg-glow lp-glow-1" />
      <div className="lp-bg-glow lp-glow-2" />
      <div className="lp-bg-glow lp-glow-3" />

      {/* Particles */}
      {particles.map(p => (
        <div key={p.id} className="lp-particle" style={{
          width: p.size, height: p.size,
          left: `${p.left}%`,
          animationDelay: `${p.delay}s`,
          animationDuration: `${p.duration}s`,
        }} />
      ))}

      {/* Main layout */}
      <div className="lp-layout">

        {/* Left — Logo + School */}
        <div className="lp-left">
          <div className="lp-logo-ring">
            <img src="/logo.png" alt="CCS Logo" className="lp-logo-img" />
          </div>
          <h1 className="lp-school">College of Computing Studies</h1>
          <p className="lp-school-sub">Pamantasan ng Cabuyao</p>
          <div className="lp-tagline">Student Profiling System</div>
        </div>

        {/* Divider */}
        <div className="lp-divider-v" />

        {/* Right — Login Card */}
        <div className="lp-right">
          <div
            className="lp-card"
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            {/* Card glow top bar */}
            <div className="lp-card-bar" />

            <div className="lp-card-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
              </svg>
            </div>

            <h2 className="lp-card-title">Welcome Back</h2>
            <p className="lp-card-sub">Sign in to your admin account</p>

            {error && <div className="lp-error"><span>⚠</span>{error}</div>}

            <form onSubmit={handleSubmit} className="lp-form">
              <div className="lp-field">
                <label>Username</label>
                <div className="lp-input">
                  <User size={15} strokeWidth={2} className="lp-input-icon" />
                  <input
                    name="username"
                    value={form.username}
                    onChange={handle}
                    placeholder="Enter username"
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              <div className="lp-field">
                <label>Password</label>
                <div className="lp-input">
                  <Lock size={15} strokeWidth={2} className="lp-input-icon" />
                  <input
                    name="password"
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={handle}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    required
                  />
                  <button type="button" className="lp-eye" onClick={() => setShowPass(s => !s)} tabIndex={-1}>
                    {showPass ? <EyeOff size={14} strokeWidth={2} /> : <Eye size={14} strokeWidth={2} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="lp-btn" disabled={loading}>
                {loading ? <><span className="spinner" /> Signing in...</> : 'Sign In'}
              </button>
            </form>

            <div className="lp-switch-role">
              <span>Are you a student?</span>
              <button type="button" className="lp-switch-btn" onClick={() => window.dispatchEvent(new CustomEvent('switchToStudent'))}>
                Student Login →
              </button>
            </div>

            <p className="lp-footer">CCS Student Profiling System &copy; {new Date().getFullYear()}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
