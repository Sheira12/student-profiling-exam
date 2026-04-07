import { NavLink } from 'react-router-dom'
import { useState } from 'react'
import {
  LayoutDashboard, Users, Search, UserPlus, BookOpen
} from 'lucide-react'

const NAV = [
  { to: '/',         icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/students', icon: Users,           label: 'Student Information' },
  { to: '/query',    icon: Search,          label: 'Comprehensive Search' },
  { to: '/add',      icon: UserPlus,        label: 'Add Student' },
  { to: '/progress', icon: BookOpen,        label: 'Academic Tracker' },
]

export default function Sidebar() {
  const [expanded, setExpanded] = useState(false)

  return (
    <aside
      className={`sidebar ${expanded ? 'sidebar-expanded' : 'sidebar-collapsed'}`}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div className="sidebar-logo">
        <div className="logo-icon">
          <img src="/logo.png" alt="CCS Logo" className="logo-img" />
        </div>
        {expanded && (
          <div className="logo-texts">
            <span className="logo-text">CCS Profile Hub</span>
            <span className="logo-sub">Pamantasan ng Cabuyao</span>
          </div>
        )}
      </div>

      {expanded && <div className="sidebar-section-label">MODULES</div>}

      <nav className="sidebar-nav">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            title={!expanded ? label : ''}
          >
            <Icon size={18} className="sidebar-icon-svg" strokeWidth={1.8} />
            {expanded && <span className="sidebar-label">{label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
