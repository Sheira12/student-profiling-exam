import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import Login from "./pages/Login";
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
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => sessionStorage.getItem("ccs_auth") === "true",
  );

  const handleLogin = () => {
    sessionStorage.setItem("ccs_auth", "true");
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("ccs_auth");
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="layout">
      <Sidebar />
      <div className="layout-body">
        <TopBar onLogout={handleLogout} />
        <main className="layout-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/students" element={<StudentInformation />} />
            <Route path="/students/:id" element={<StudentProfile />} />
            <Route path="/add" element={<AddStudent />} />
            <Route path="/edit/:id" element={<EditStudent />} />
            <Route path="/query" element={<QueryStudents />} />
            <Route path="/progress" element={<AcademicTrackerPicker />} />
            <Route path="/progress/:id" element={<AcademicProgress />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
