// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import NotFound from './pages/NotFound';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminAttendance from './components/admin/AdminAttendance';
import AdminLeave from './components/admin/AdminLeave';
import ManageEmployees from './components/admin/Manageemployees';
import AdminProjects from './components/admin/AdminProjects';           // ✅ NEW
import EmployeeDashboard from './components/employee/EmployeeDashboard';
import EmployeeAttendance from './components/employee/EmployeeAttendance';
import EmployeeLeave from './components/employee/EmployeeLeave';
import EmployeeProjects from './components/employee/EmployeeProjects';  // ✅ NEW
import Sidebar from './components/common/Sidebar';
import Navbar from './components/common/Navbar';
import ProtectedRoute from './routes/ProtectedRoute';
import socketService from './services/socketService';                   // ✅ NEW

function App() {
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [attendance, setAttendance] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
    setLoadingUser(false);
  }, []);

  // ✅ NEW: Connect socket when user logs in, disconnect on logout
  useEffect(() => {
    if (user) {
      socketService.connect();
      socketService.joinRoom(user._id);
    } else {
      socketService.disconnect();
    }
    return () => socketService.disconnect();
  }, [user]);

  const Layout = ({ children }) => (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950 transition-colors duration-200">
      <Sidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar user={user} setUser={setUser} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 p-4 overflow-auto bg-gray-100 dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200">
          {children}
        </main>
      </div>
    </div>
  );

  if (loadingUser) return null;

  return (
    <Router>
      <Routes>

        <Route
          path="/login"
          element={
            user
              ? <Navigate to={user.role === 'Admin' ? '/admin/dashboard' : '/employee/dashboard'} replace />
              : <Login setUser={setUser} />
          }
        />

        <Route
          path="/"
          element={
            user
              ? <Navigate to={user.role === 'Admin' ? '/admin/dashboard' : '/employee/dashboard'} replace />
              : <Navigate to="/login" replace />
          }
        />

        {/* ── ADMIN ROUTES ── */}
        <Route path="/admin/dashboard"
          element={
            <ProtectedRoute user={user} allowedRole="Admin">
              <Layout><AdminDashboard attendance={attendance} leaveRequests={leaveRequests} /></Layout>
            </ProtectedRoute>
          }
        />
        <Route path="/admin/attendance"
          element={
            <ProtectedRoute user={user} allowedRole="Admin">
              <Layout><AdminAttendance /></Layout>
            </ProtectedRoute>
          }
        />
        <Route path="/admin/attendance/:employeeSlug"
          element={
            <ProtectedRoute user={user} allowedRole="Admin">
              <Layout><AdminAttendance /></Layout>
            </ProtectedRoute>
          }
        />
        <Route path="/admin/leave"
          element={
            <ProtectedRoute user={user} allowedRole="Admin">
              <Layout><AdminLeave leaveRequests={leaveRequests} setLeaveRequests={setLeaveRequests} /></Layout>
            </ProtectedRoute>
          }
        />
        <Route path="/admin/manageemployees"
          element={
            <ProtectedRoute user={user} allowedRole="Admin">
              <Layout><ManageEmployees /></Layout>
            </ProtectedRoute>
          }
        />
        {/* ✅ NEW */}
        <Route path="/admin/projects"
          element={
            <ProtectedRoute user={user} allowedRole="Admin">
              <Layout><AdminProjects /></Layout>
            </ProtectedRoute>
          }
        />

        {/* ── EMPLOYEE ROUTES ── */}
        <Route path="/employee/dashboard"
          element={
            <ProtectedRoute user={user} allowedRole="Employee">
              <Layout><EmployeeDashboard /></Layout>
            </ProtectedRoute>
          }
        />
        <Route path="/employee/attendance"
          element={
            <ProtectedRoute user={user} allowedRole="Employee">
              <Layout><EmployeeAttendance user={user} attendance={attendance} setAttendance={setAttendance} /></Layout>
            </ProtectedRoute>
          }
        />
        <Route path="/employee/leave"
          element={
            <ProtectedRoute user={user} allowedRole="Employee">
              <Layout><EmployeeLeave user={user} leaveRequests={leaveRequests} setLeaveRequests={setLeaveRequests} /></Layout>
            </ProtectedRoute>
          }
        />
        {/* ✅ NEW */}
        <Route path="/employee/projects"
          element={
            <ProtectedRoute user={user} allowedRole="Employee">
              <Layout><EmployeeProjects user={user} /></Layout>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<NotFound user={user} />} />

      </Routes>
    </Router>
  );
}

export default App;