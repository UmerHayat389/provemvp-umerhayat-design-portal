// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Pages & Components
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminAttendance from './components/admin/AdminAttendance';
import AdminLeave from './components/admin/AdminLeave';
import ManageEmployees from './components/admin/Manageemployees';
import EmployeeDashboard from './components/employee/EmployeeDashboard';
import EmployeeAttendance from './components/employee/EmployeeAttendance';
import EmployeeLeave from './components/employee/EmployeeLeave';
import Sidebar from './components/common/Sidebar';
import Navbar from './components/common/Navbar';
import ProtectedRoute from './routes/ProtectedRoute';

// Dummy data
import { dummyData } from './data/dummyData';

function App() {
  // ✅ User state
  const [user, setUser] = useState(null);

  // ✅ NEW: loading state to prevent refresh white screen
  const [loadingUser, setLoadingUser] = useState(true);

  // ✅ Load user from localStorage before rendering routes
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoadingUser(false);
  }, []);

  // Attendance & Leave states
  const [attendance, setAttendance] = useState(dummyData.attendance);
  const [leaveRequests, setLeaveRequests] = useState(dummyData.leaveRequests);

  // Sidebar state
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Layout wrapper
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

  // ✅ Prevent routes from rendering until user is restored
  if (loadingUser) {
    return null;
  }

  return (
    <Router>
      <Routes>

        {/* Login Route */}
        <Route
          path="/login"
          element={
            user ? (
              <Navigate
                to={user.role === 'Admin' ? '/admin/dashboard' : '/employee/dashboard'}
                replace
              />
            ) : (
              <Login setUser={setUser} />
            )
          }
        />

        {/* Root redirect */}
        <Route
          path="/"
          element={
            user ? (
              <Navigate
                to={user.role === 'Admin' ? '/admin/dashboard' : '/employee/dashboard'}
                replace
              />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* ================= ADMIN ROUTES ================= */}

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

        <Route
          path="/admin/manageemployees"
          element={
            <ProtectedRoute user={user} allowedRole="Admin">
              <Layout>
                <ManageEmployees />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* ================= EMPLOYEE ROUTES ================= */}

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
                <EmployeeAttendance
                  user={user}
                  attendance={attendance}
                  setAttendance={setAttendance}
                />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/employee/leave"
          element={
            <ProtectedRoute user={user} allowedRole="Employee">
              <Layout>
                <EmployeeLeave
                  user={user}
                  leaveRequests={leaveRequests}
                  setLeaveRequests={setLeaveRequests}
                />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFound user={user} />} />

      </Routes>
    </Router>
  );
}

export default App;