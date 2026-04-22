import { NavLink, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, Users, UserPlus, BookOpen, BarChart2,
  Filter, Briefcase, ClipboardList, GraduationCap, Megaphone, Shield, X, ChevronLeft, Menu
} from 'lucide-react'

const NAV = [
  { to: '/admin/dashboard',     icon: LayoutDashboard, label: 'Dashboard'        },
  { to: '/admin/students',      icon: Users,           label: 'Students'         },
  { to: '/admin/reports',       icon: BarChart2,       label: 'Reports'          },
  { to: '/admin/reports-query', icon: Filter,          label: 'Query & Filter'   },
  { to: '/admin/add',           icon: UserPlus,        label: 'Add Student'      },
  { to: '/admin/subjects',      icon: GraduationCap,   label: 'Subjects'         },
  { to: '/admin/advisers',      icon: Briefcase,       label: 'Advisers'         },
  { to: '/admin/disciplinary',  icon: Shield,          label: 'Disciplinary'     },
  { to: '/admin/progress',      icon: BookOpen,        label: 'Academic Tracker' },
  { to: '/admin/announcements', icon: Megaphone,       label: 'Announcements'    },
  { to: '/admin/logs',          icon: ClipboardList,   label: 'Activity Logs'    },
]

export default function Sidebar({ mobileOpen, onClose, isCollapsed, onToggleCollapse }) {
  // Close sidebar on route change (mobile)
  useEffect(() => {
    const handler = () => { if (onClose) onClose() }
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [onClose])

  const showLabels = !isCollapsed || mobileOpen

  return (
    <>
      {/* Overlay — only when mobile drawer is open */}
      {mobileOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', 
            inset: 0,
            background: 'rgba(0,0,0,0.3)',
            zIndex: 999,
            backdropFilter: 'blur(2px)',
          }}
        />
      )}

      <aside
        className="modern-sidebar"
        style={{
          width: mobileOpen ? '280px' : (isCollapsed ? '80px' : '280px'),
          transform: mobileOpen
            ? 'translateX(0)'
            : (window.innerWidth <= 768 ? 'translateX(-100%)' : 'translateX(0)'),
        }}
      >
        {/* Logo Section */}
        <div className="sidebar-header">
          <div className="logo-section">
            <button 
              className="logo-circle"
              onClick={mobileOpen ? onClose : onToggleCollapse}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <div className="hamburger-icon">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </button>
            {showLabels && (
              <div className="logo-text-group">
                <span className="logo-title">CCS Profile Hub</span>
                <span className="logo-subtitle">Pamantasan ng Cabuyao</span>
              </div>
            )}
          </div>

          {/* Mobile close button */}
          {mobileOpen && (
            <button className="mobile-close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-navigation">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              title={!showLabels ? label : ''}
              onClick={() => { if (onClose) onClose() }}
            >
              <div className="nav-icon">
                <Icon size={20} strokeWidth={2} />
              </div>
              {showLabels && <span className="nav-label">{label}</span>}
            </NavLink>
          ))}
        </nav>
      </aside>

      <style jsx>{`
        .modern-sidebar {
          position: fixed;
          top: 0;
          left: 0;
          bottom: 0;
          background: #ffffff;
          box-shadow: 2px 0 20px rgba(0, 0, 0, 0.08);
          display: flex;
          flex-direction: column;
          z-index: 1000;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          overflow: hidden;
        }

        body.dark-mode .modern-sidebar {
          background: #1a1d2e;
          box-shadow: 2px 0 20px rgba(0, 0, 0, 0.3);
        }

        .sidebar-header {
          padding: 24px 20px;
          border-bottom: 1px solid #f0f0f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-height: 80px;
        }

        body.dark-mode .sidebar-header {
          border-bottom: 1px solid #2d3348;
        }

        .logo-section {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          justify-content: center;
        }

        .modern-sidebar:not([style*="280px"]) .logo-section {
          justify-content: center;
        }

        .modern-sidebar[style*="280px"] .logo-section {
          justify-content: flex-start;
        }

        .logo-circle {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
          flex-shrink: 0;
          border: none;
          cursor: pointer;
          transition: all 0.2s;
        }

        .logo-circle:hover {
          transform: scale(1.05);
          box-shadow: 0 6px 16px rgba(255, 107, 53, 0.4);
        }

        .logo-circle:active {
          transform: scale(0.98);
        }

        .hamburger-icon {
          display: flex;
          flex-direction: column;
          gap: 4px;
          width: 20px;
        }

        .hamburger-icon span {
          display: block;
          width: 100%;
          height: 2.5px;
          background: white;
          border-radius: 2px;
        }

        .logo-img {
          width: 32px;
          height: 32px;
          object-fit: contain;
        }

        .logo-text-group {
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow: hidden;
        }

        .logo-title {
          font-size: 16px;
          font-weight: 700;
          color: #1a1a1a;
          white-space: nowrap;
        }

        body.dark-mode .logo-title {
          color: #f8f9fa;
        }

        .logo-subtitle {
          font-size: 11px;
          color: #999;
          white-space: nowrap;
        }

        body.dark-mode .logo-subtitle {
          color: #b8bfd4;
        }

        .collapse-toggle-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: #f8f9fa;
          color: #666;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          flex-shrink: 0;
        }

        .collapse-toggle-btn:hover {
          background: #ff6b35;
          color: white;
        }

        body.dark-mode .collapse-toggle-btn {
          background: #2d3348;
          color: #c5cae0;
        }

        body.dark-mode .collapse-toggle-btn:hover {
          background: #ff6b35;
          color: white;
        }

        .mobile-close-btn {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background: #f8f9fa;
          color: #666;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .mobile-close-btn:hover {
          background: #ff6b35;
          color: white;
        }

        body.dark-mode .mobile-close-btn {
          background: #2d3348;
          color: #c5cae0;
        }

        body.dark-mode .mobile-close-btn:hover {
          background: #ff6b35;
          color: white;
        }

        .sidebar-navigation {
          flex: 1;
          padding: 16px 12px;
          overflow-y: auto;
          overflow-x: hidden;
        }

        .sidebar-navigation::-webkit-scrollbar {
          width: 6px;
        }

        .sidebar-navigation::-webkit-scrollbar-thumb {
          background: #e0e0e0;
          border-radius: 3px;
        }

        body.dark-mode .sidebar-navigation::-webkit-scrollbar-thumb {
          background: #2d3348;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          margin-bottom: 4px;
          border-radius: 12px;
          text-decoration: none;
          color: #666;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s;
          position: relative;
          overflow: hidden;
        }

        body.dark-mode .nav-item {
          color: #c5cae0;
        }

        .nav-item:hover {
          background: #fff5f0;
          color: #ff6b35;
        }

        body.dark-mode .nav-item:hover {
          background: #2d3348;
          color: #ffa366;
        }

        .nav-item.active {
          background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3);
        }

        body.dark-mode .nav-item.active {
          background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
          color: white;
          box-shadow: 0 4px 12px rgba(255, 107, 53, 0.4);
        }

        .nav-item.active .nav-icon {
          color: white;
        }

        .nav-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .nav-label {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        @media (max-width: 768px) {
          .modern-sidebar {
            width: 280px !important;
          }

          .collapse-toggle-btn {
            display: none;
          }
        }
      `}</style>
    </>
  )
}
