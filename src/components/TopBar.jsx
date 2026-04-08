import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Search, Moon, Sun, X, LogOut, ChevronDown, Menu } from 'lucide-react'
import NotificationPanel from './NotificationPanel'

export default function TopBar({ onLogout, user, onMenuToggle }) {
  const [q, setQ] = useState('')
  const [dark, setDark] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const dropdownRef = useRef(null)

  // user = { name: 'CCS Admin', role: 'admin', initials: 'CA' }
  const displayName = user?.name || 'Admin'
  const initials = user?.initials || displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const role = user?.role || 'admin'

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    setQ(params.get('search') || '')
  }, [location.search])

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    navigate(q.trim() ? `/students?search=${encodeURIComponent(q.trim())}` : '/students')
  }
  const handleClear = () => { setQ(''); navigate('/students') }
  const toggleDark = () => { setDark(d => !d); document.body.classList.toggle('dark-mode') }

  return (
    <header className="topbar">
      <button className="mobile-menu-btn" onClick={onMenuToggle} title="Menu">
        <Menu size={22} strokeWidth={2} />
      </button>
      <div className="topbar-title">Student Information System</div>

      <form className="topbar-search" onSubmit={handleSearch}>
        <Search size={15} className="topbar-search-icon" strokeWidth={2} />
        <input
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Quick search..."
          onKeyDown={e => e.key === 'Escape' && handleClear()}
        />
        {q && (
          <button type="button" className="topbar-clear" onClick={handleClear}>
            <X size={13} strokeWidth={2.5} />
          </button>
        )}
      </form>

      <div className="topbar-actions">
        <button className="icon-btn" title="Toggle dark mode" onClick={toggleDark}>
          {dark
            ? <Sun size={18} strokeWidth={1.8} className="icon-animated" />
            : <Moon size={18} strokeWidth={1.8} className="icon-animated" />
          }
        </button>

        <NotificationPanel />

        {/* Logged-in user dropdown */}
        <div className="topbar-user-wrap" ref={dropdownRef}>
          <button className="topbar-user-btn" onClick={() => setDropdownOpen(o => !o)}>
            <div className="topbar-avatar">{initials}</div>
            <span className="topbar-username">{displayName}</span>
            <ChevronDown size={14} strokeWidth={2.5} className={`topbar-chevron ${dropdownOpen ? 'open' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="topbar-dropdown">
              <div className="dropdown-user-info">
                <div className="dropdown-avatar">{initials}</div>
                <div>
                  <div className="dropdown-name">{displayName}</div>
                  <div className="dropdown-role">{role}</div>
                </div>
              </div>
              <div className="dropdown-divider" />
              <button className="dropdown-item logout" onClick={() => { setDropdownOpen(false); onLogout() }}>
                <LogOut size={14} strokeWidth={2} /> Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
