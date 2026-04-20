import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Moon, Sun, LogOut, ChevronDown, Menu } from 'lucide-react'
import NotificationPanel from './NotificationPanel'

export default function TopBar({ onLogout, user, onMenuToggle }) {
  const [dark, setDark] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)

  const displayName = user?.name || 'Admin'
  const initials = user?.initials || displayName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const role = user?.role || 'admin'

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target))
        setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const toggleDark = () => { setDark(d => !d); document.body.classList.toggle('dark-mode') }

  return (
    <header className="topbar">
      <button className="mobile-menu-btn" onClick={onMenuToggle} title="Menu">
        <Menu size={22} strokeWidth={2} />
      </button>
      <div className="topbar-title">Student Information System</div>

      <div className="topbar-divider" />

      <div className="topbar-actions">
        <button className="icon-btn" title="Toggle dark mode" onClick={toggleDark}>
          {dark
            ? <Sun size={18} strokeWidth={1.8} className="icon-animated" />
            : <Moon size={18} strokeWidth={1.8} className="icon-animated" />
          }
        </button>

        <NotificationPanel />

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
