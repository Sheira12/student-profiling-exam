import { useState } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import StudentLogin from "./pages/StudentLogin";
import EmployeeLogin from "./pages/EmployeeLogin";
import StudentPortal from "./pages/StudentPortal";
import EmployeePortal from "./pages/EmployeePortal";
import Dashboard from "./pages/Dashboard";
import StudentInformation from "./pages/StudentInformation";
import StudentProfile from "./pages/StudentProfile";
import AddStudent from "./pages/AddStudent";
import EditStudent from "./pages/EditStudent";
import QueryStudents from "./pages/QueryStudents";
import ReportsQuery from "./pages/ReportsQuery";
import AcademicProgress from "./pages/AcademicProgress";
import AcademicTrackerPicker from "./pages/AcademicTrackerPicker";
import SubjectManagement from "./pages/SubjectManagement";
import AdviserManagement from "./pages/AdviserManagement";
import ActivityLogs from "./pages/ActivityLogs";
import Announcements from "./pages/Announcements";
import { getAuthState, setAdmin, setEmployee, setStudent, clearAuth, ROLE_HOME } from "./hooks/useAuth";
import "./App.css";

// ── Login guards: if already logged in with matching role, skip login ──
function AdminLoginGuard() {
  const { role } = getAuthState()
  if (role === 'admin') return <Navigate to="/admin/dashboard" replace />
  return <Login />
}

function AdviserLoginGuard() {
  const { role } = getAuthState()
  if (role === 'employee') return <Navigate to="/adviser/portal" replace />
  return <EmployeeLogin />
}

function StudentLoginGuard() {
  const { role } = getAuthState()
  if (role === 'student') return <Navigate to="/student/portal" replace />
  return <StudentLogin />
}

// ── Admin layout wrapper ──
function AdminLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()
  const { role } = getAuthState()

  const handleLogout = () => {
    clearAuth()
    navigate('/admin', { replace: true })
    // Force re-render by reloading — simplest approach without global state
    window.location.href = '/admin'
  }

  return (
    <div className="layout">
      <Sidebar mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      <div className="layout-body">
        <TopBar
          onLogout={handleLogout}
          user={{ name: 'CCS Admin', role: 'Administrator', initials: 'CA' }}
          onMenuToggle={() => setMobileMenuOpen(o => !o)}
        />
        <main className="layout-main">
          <Routes>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard"     element={<Dashboard />} />
            <Route path="students"      element={<StudentInformation role="admin" />} />
            <Route path="students/:id"  element={<StudentProfile />} />
            <Route path="add"           element={<AddStudent />} />
            <Route path="edit/:id"      element={<EditStudent />} />
            <Route path="reports"       element={<QueryStudents />} />
            <Route path="reports-query" element={<ReportsQuery />} />
            <Route path="subjects"      element={<SubjectManagement />} />
            <Route path="advisers"      element={<AdviserManagement />} />
            <Route path="logs"          element={<ActivityLogs />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="progress"      element={<AcademicTrackerPicker />} />
            <Route path="progress/:id"  element={<AcademicProgress />} />
            <Route path="*"             element={<Navigate to="dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

// ── Adviser portal wrapper ──
function AdviserPortalWrapper() {
  const { employeeData } = getAuthState()
  const navigate = useNavigate()

  const handleLogout = () => {
    clearAuth()
    window.location.href = '/adviser'
  }

  if (!employeeData) return <Navigate to="/adviser" replace />
  return <EmployeePortal employee={employeeData} onLogout={handleLogout} />
}

// ── Student portal wrapper ──
function StudentPortalWrapper() {
  const { studentData } = getAuthState()

  const handleLogout = () => {
    clearAuth()
    window.location.href = '/student'
  }

  if (!studentData) return <Navigate to="/student" replace />
  return <StudentPortal student={studentData} onLogout={handleLogout} />
}

// ── Root App ──
export default function App() {
  return (
    <Routes>
      {/* Root → admin login */}
      <Route path="/" element={<Navigate to="/admin" replace />} />

      {/* Admin */}
      <Route path="/admin" element={<AdminLoginGuard />} />
      <Route path="/admin/*" element={
        <ProtectedRoute allowedRoles={['admin']} redirectTo="/admin">
          <AdminLayout />
        </ProtectedRoute>
      } />

      {/* Adviser */}
      <Route path="/adviser" element={<AdviserLoginGuard />} />
      <Route path="/adviser/portal" element={
        <ProtectedRoute allowedRoles={['employee']} redirectTo="/adviser">
          <AdviserPortalWrapper />
        </ProtectedRoute>
      } />

      {/* Student */}
      <Route path="/student" element={<StudentLoginGuard />} />
      <Route path="/student/portal" element={
        <ProtectedRoute allowedRoles={['student']} redirectTo="/student">
          <StudentPortalWrapper />
        </ProtectedRoute>
      } />

      {/* Legacy short paths → redirect to new admin paths */}
      <Route path="/dashboard"     element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/students"      element={<Navigate to="/admin/students" replace />} />
      <Route path="/users"         element={<Navigate to="/admin/students" replace />} />
      <Route path="/add"           element={<Navigate to="/admin/add" replace />} />
      <Route path="/reports"       element={<Navigate to="/admin/reports" replace />} />
      <Route path="/reports-query" element={<Navigate to="/admin/reports-query" replace />} />
      <Route path="/subjects"      element={<Navigate to="/admin/subjects" replace />} />
      <Route path="/advisers"      element={<Navigate to="/admin/advisers" replace />} />
      <Route path="/logs"          element={<Navigate to="/admin/logs" replace />} />
      <Route path="/announcements" element={<Navigate to="/admin/announcements" replace />} />
      <Route path="/progress"      element={<Navigate to="/admin/progress" replace />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  )
}
