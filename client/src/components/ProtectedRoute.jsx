import { Navigate } from 'react-router-dom'
import { getAuthState, ROLE_HOME, ROLE_LOGIN } from '../hooks/useAuth'

/**
 * ProtectedRoute — enforces role-based access on every render.
 *
 * Props:
 *   allowedRoles  string[]  — roles that may access this route
 *   redirectTo    string    — where to send unauthenticated users (login page)
 *   children      ReactNode
 */
export default function ProtectedRoute({ allowedRoles, redirectTo, children }) {
  const { role } = getAuthState()

  // No session → send to login
  if (!role) return <Navigate to={redirectTo} replace />

  // Wrong role → send to own portal home
  if (!allowedRoles.includes(role)) {
    return <Navigate to={ROLE_HOME[role] || ROLE_LOGIN[role] || '/'} replace />
  }

  return children
}
