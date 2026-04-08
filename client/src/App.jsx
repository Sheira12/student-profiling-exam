import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import StudentLogin from "./pages/StudentLogin";
import StudentPortal from "./pages/StudentPortal";
import Dashboard from "./pages/Dashboard";
import StudentInformation from "./pages/StudentInformation";
import StudentProfile from "./pages/StudentProfile";
import AddStudent from "./pages/AddStudent";
import EditStudent from "./pages/EditStudent";
import QueryStudents from "./pages/QueryStudents";
import AcademicProgress from "./pages/AcademicProgress";
import AcademicTrackerPicker from "./pages/AcademicTrackerPicker";
import "./App.css";

export default function App() {
  const [role, setRole] = useState(
    () => sessionStorage.getItem("ccs_role") || null
  )
  const [studentData, setStudentData] = useState(
    () => {
      const s = sessionStorage.getItem("ccs_student")
      return s ? JSON.parse(s) : null
    }
  )
  const [showStudentLogin, setShowStudentLogin] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Listen for switch-to-student event from admin login page
  useEffect(() => {
    const handler = () => setShowStudentLogin(true)
    window.addEventListener('switchToStudent', handler)
    return () => window.removeEventListener('switchToStudent', handler)
  }, [])

  const handleAdminLogin = () => {
    sessionStorage.setItem("ccs_role", "admin")
    setRole("admin")
    setShowStudentLogin(false)
  }

  const handleStudentLogin = (student) => {
    sessionStorage.setItem("ccs_role", "student")
    sessionStorage.setItem("ccs_student", JSON.stringify(student))
    setRole("student")
    setStudentData(student)
  }

  const handleLogout = () => {
    sessionStorage.removeItem("ccs_role")
    sessionStorage.removeItem("ccs_student")
    setRole(null)
    setStudentData(null)
    setShowStudentLogin(false)
  }

  // Not logged in
  if (!role) {
    if (showStudentLogin) {
      return (
        <StudentLogin
          onStudentLogin={handleStudentLogin}
          onBackToAdmin={() => setShowStudentLogin(false)}
        />
      )
    }
    return <Login onLogin={handleAdminLogin} />
  }

  // Student portal (read-only)
  if (role === "student") {
    return <StudentPortal student={studentData} onLogout={handleLogout} />
  }

  // Admin dashboard
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
            {/* ── Part 1: Client-side routing ── */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />

            {/* ── Part 2: Dynamic routing /users/:id ── */}
            {/* ── Part 5: Pass role prop down (one-way data flow) ── */}
            <Route path="/students" element={<StudentInformation role="admin" />} />
            <Route path="/users"    element={<StudentInformation role="admin" />} />
            <Route path="/students/:id" element={<StudentProfile />} />
            <Route path="/users/:id"    element={<StudentProfile />} />

            {/* ── Part 6: Admin-only routes ── */}
            <Route path="/add"  element={
              <ProtectedRoute role={role} allowed={['admin']} redirectTo="/">
                <AddStudent />
              </ProtectedRoute>
            } />
            <Route path="/edit/:id" element={
              <ProtectedRoute role={role} allowed={['admin']} redirectTo="/">
                <EditStudent />
              </ProtectedRoute>
            } />

            {/* ── Part 6: /reports blocked for non-admins ── */}
            <Route path="/reports" element={
              <ProtectedRoute role={role} allowed={['admin']} redirectTo="/">
                <QueryStudents />
              </ProtectedRoute>
            } />
            <Route path="/query" element={
              <ProtectedRoute role={role} allowed={['admin']} redirectTo="/">
                <QueryStudents />
              </ProtectedRoute>
            } />

            <Route path="/progress"     element={<AcademicTrackerPicker />} />
            <Route path="/progress/:id" element={<AcademicProgress />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}
