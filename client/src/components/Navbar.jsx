import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const { pathname } = useLocation()

  const links = [
    { to: '/', label: 'Students' },
    { to: '/add', label: 'Add Student' },
    { to: '/query', label: 'Query / Filter' },
  ]

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="brand-icon">🎓</span>
        <span>Student Profiling System</span>
      </div>
      <ul className="navbar-links">
        {links.map(({ to, label }) => (
          <li key={to}>
            <Link to={to} className={pathname === to ? 'active' : ''}>
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
