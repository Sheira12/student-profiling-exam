import { Navigate } from 'react-router-dom'

/**
 * ProtectedRoute — role-based access control
 * Props:
 *   role: current user role ('admin' | 'student')
 *   allowed: array of roles allowed e.g. ['admin']
 *   redirectTo: where to redirect if not allowed
 */
export default function ProtectedRoute({ role, allowed, redirectTo = '/', children }) {
  if (!allowed.includes(role)) {
    return <Navigate to={redirectTo} replace />
  }
  return children
}
