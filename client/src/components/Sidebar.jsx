import { NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { LayoutDashboard, Users, Search, UserPlus, BookOpen, BarChart2, Filter, Briefcase, ClipboardList, GraduationCap, Megaphone } from 'lucide-react'

const NAV = [
  { to: '/admin/dashboard',     icon: LayoutDashboard, label: 'Dashboard',          end: true },
  { to: '/admin/students',      icon: Users,           label: 'Students',           end: true },
  { to: '/admin/reports',       icon: BarChart2,       label: 'Reports',            end: true },
  { to: '/admin/reports-query', icon: Filter,          label: 'Query & Filter',     end: true },
  { to: '/admin/add',           icon: UserPlus,        label: 'Add Student',        end: true },
  { to: '/admin/subjects',      icon: GraduationCap,   label: 'Subjects',           end: true },
  { to: '/admin/advisers',      icon: Briefcase,       label: 'Advisers',           end: true },
  { to: '/admin/progress',      icon: BookOpen,        label: 'Academic Tracker',   end: true },
  { to: '/admin/announcements', icon: Megaphone,       label: 'Announcements',      end: true },
  { to: '/admin/logs',          icon: ClipboardList,   label: 'Activity Logs',      end: true },
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
