// src/App.jsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Pages & Components
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminAttendance from './components/admin/AdminAttendance';
import AdminLeave from './components/admin/AdminLeave';
import EmployeeDashboard from './components/employee/EmployeeDashboard';
import EmployeeAttendance from './components/employee/EmployeeAttendance';
import EmployeeLeave from './components/employee/EmployeeLeave';
import Sidebar from './components/common/Sidebar';
import Navbar from './components/common/Navbar';
import ProtectedRoute from './routes/ProtectedRoute';

// Dummy data
import { dummyData } from './data/dummyData';

function App() {
  const [user, setUser] = useState(null);
  const [attendance, setAttendance] = useState(dummyData.attendance);
  const [leaveRequests, setLeaveRequests] = useState(dummyData.leaveRequests);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Layout wrapper — ✅ dark mode classes added here
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

  return (
    <Router>
      <Routes>
        {/* Login Route */}
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to={user.role === 'Admin' ? '/admin/dashboard' : '/employee/dashboard'} replace />
            ) : (
              <Login setUser={setUser} />
            )
          }
        />

        {/* Root redirect based on user role */}
        <Route
          path="/"
          element={
            user ? (
              <Navigate to={user.role === 'Admin' ? '/admin/dashboard' : '/employee/dashboard'} replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute user={user} allowedRole="Admin">
              <Layout>
                <AdminDashboard attendance={attendance} leaveRequests={leaveRequests} />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/attendance"
          element={
            <ProtectedRoute user={user} allowedRole="Admin">
              <Layout>
                <AdminAttendance attendance={attendance} setAttendance={setAttendance} />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/leave"
          element={
            <ProtectedRoute user={user} allowedRole="Admin">
              <Layout>
                <AdminLeave leaveRequests={leaveRequests} setLeaveRequests={setLeaveRequests} />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Employee Routes */}
        <Route
          path="/employee/dashboard"
          element={
            <ProtectedRoute user={user} allowedRole="Employee">
              <Layout>
                <EmployeeDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/attendance"
          element={
            <ProtectedRoute user={user} allowedRole="Employee">
              <Layout>
                <EmployeeAttendance user={user} attendance={attendance} setAttendance={setAttendance} />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/leave"
          element={
            <ProtectedRoute user={user} allowedRole="Employee">
              <Layout>
                <EmployeeLeave user={user} leaveRequests={leaveRequests} setLeaveRequests={setLeaveRequests} />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* 404 Page - Must be last */}
        <Route path="*" element={<NotFound user={user} />} />
      </Routes>
    </Router>
  );
}

export default App;