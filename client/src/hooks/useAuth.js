// useAuth — reads/writes session state from sessionStorage
// Keeps auth logic out of App.jsx and components

const KEYS = { role: 'ccs_role', student: 'ccs_student', employee: 'ccs_employee' }

function safeJSON(key) {
  try { return JSON.parse(sessionStorage.getItem(key)) } catch { return null }
}

export function getAuthState() {
  const role = sessionStorage.getItem(KEYS.role)
  if (!['admin', 'student', 'employee'].includes(role)) return { role: null, studentData: null, employeeData: null }
  return {
    role,
    studentData:  safeJSON(KEYS.student),
    employeeData: safeJSON(KEYS.employee),
  }
}

export function setAdmin() {
  sessionStorage.setItem(KEYS.role, 'admin')
  sessionStorage.removeItem(KEYS.student)
  sessionStorage.removeItem(KEYS.employee)
}

export function setEmployee(employee) {
  sessionStorage.setItem(KEYS.role, 'employee')
  sessionStorage.setItem(KEYS.employee, JSON.stringify(employee))
  sessionStorage.removeItem(KEYS.student)
}

export function setStudent(student) {
  sessionStorage.setItem(KEYS.role, 'student')
  sessionStorage.setItem(KEYS.student, JSON.stringify(student))
  sessionStorage.removeItem(KEYS.employee)
}

export function clearAuth() {
  Object.values(KEYS).forEach(k => sessionStorage.removeItem(k))
}

// Role → home route mapping
export const ROLE_HOME = {
  admin:    '/admin/dashboard',
  employee: '/adviser/portal',
  student:  '/student/portal',
}

export const ROLE_LOGIN = {
  admin:    '/admin',
  employee: '/adviser',
  student:  '/student',
}
