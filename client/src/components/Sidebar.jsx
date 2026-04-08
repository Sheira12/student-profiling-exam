import { NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { LayoutDashboard, Users, Search, UserPlus, BookOpen, BarChart2 } from 'lucide-react'

const NAV = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard',        end: true },
  { to: '/users',     icon: Users,           label: 'Users',            end: true },
  { to: '/reports',   icon: BarChart2,       label: 'Reports',          end: true },
  { to: '/add',       icon: UserPlus,        label: 'Add Student',      end: true },
  { to: '/progress',  icon: BookOpen,        label: 'Academic Tracker', end: true },
]

export default function Sidebar({ mobileOpen, onClose }) {
  const [expanded, setExpanded] = useState(false)

  // Close on route change (mobile)
  useEffect(() => {
    const handler = () => { if (onClose) onClose() }
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [onClose])

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="sidebar-overlay visible" onClick={onClose} />
      )}

      <aside
        className={`sidebar ${mobileOpen ? 'mobile-open sidebar-expanded' : ''} ${!mobileOpen && expanded ? 'sidebar-expanded' : ''} ${!mobileOpen && !expanded ? 'sidebar-collapsed' : ''}`}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        <div className="sidebar-logo">
          <div className="logo-icon">
            <img src="/logo.png" alt="CCS Logo" className="logo-img" />
          </div>
          {(expanded || mobileOpen) && (
            <div className="logo-texts">
              <span className="logo-text">CCS Profile Hub</span>
              <span className="logo-sub">Pamantasan ng Cabuyao</span>
            </div>
          )}
        </div>

        {(expanded || mobileOpen) && <div className="sidebar-section-label">MODULES</div>}

        <nav className="sidebar-nav">
          {NAV.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              title={!expanded && !mobileOpen ? label : ''}
              onClick={() => { if (onClose) onClose() }}
            >
              <Icon size={18} className="sidebar-icon-svg" strokeWidth={1.8} />
              {(expanded || mobileOpen) && <span className="sidebar-label">{label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
