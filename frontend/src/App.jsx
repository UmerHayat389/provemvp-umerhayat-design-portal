// src/App.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import NotFound from './pages/NotFound';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminAttendance from './components/admin/AdminAttendance';
import AdminLeave from './components/admin/AdminLeave';
import ManageEmployees from './components/admin/Manageemployees';
import AdminProjects from './components/admin/AdminProjects';
import EmployeeDashboard from './components/employee/EmployeeDashboard';
import EmployeeAttendance from './components/employee/EmployeeAttendance';
import EmployeeLeave from './components/employee/EmployeeLeave';
import EmployeeProjects from './components/employee/EmployeeProjects';
import ProfilePage from './components/common/ProfilePage';
import Sidebar from './components/common/Sidebar';
import Navbar from './components/common/Navbar';
import ProtectedRoute from './routes/ProtectedRoute';
import socketService from './services/socketService';

function App() {
  const [user, setUserState] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [attendance, setAttendance] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);

  // ✅ FIX 1: Custom setUser that always syncs localStorage
  // This makes profile photo instantly reflect in Navbar after save
  const setUser = useCallback((newUser) => {
    if (newUser) {
      localStorage.setItem('user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('user');
    }
    setUserState(newUser);
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUserState(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('user');
      }
    }
    setLoadingUser(false);
  }, []);

  // ✅ FIX 2: Socket loop — depend only on userId string, not whole user object
  // Before: depended on `user` object → new object reference on every render = reconnect loop
  // After: depended on `user?._id` string → only reconnects when user actually logs in/out
  const userId = user?._id;
  useEffect(() => {
    if (userId) {
      socketService.connect();
      socketService.joinRoom(userId);
    } else {
      socketService.disconnect();
    }
  }, [userId]); // ← only fires when userId changes, not on every render

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

  const ProfileLayout = ({ children }) => (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950 transition-colors duration-200">
      <Sidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          {children}
        </div>
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
        <Route path="/admin/dashboard" element={<ProtectedRoute user={user} allowedRole="Admin"><Layout><AdminDashboard attendance={attendance} leaveRequests={leaveRequests} /></Layout></ProtectedRoute>} />
        <Route path="/admin/attendance" element={<ProtectedRoute user={user} allowedRole="Admin"><Layout><AdminAttendance /></Layout></ProtectedRoute>} />
        <Route path="/admin/attendance/:employeeSlug" element={<ProtectedRoute user={user} allowedRole="Admin"><Layout><AdminAttendance /></Layout></ProtectedRoute>} />
        <Route path="/admin/leave" element={<ProtectedRoute user={user} allowedRole="Admin"><Layout><AdminLeave leaveRequests={leaveRequests} setLeaveRequests={setLeaveRequests} /></Layout></ProtectedRoute>} />
        <Route path="/admin/manageemployees" element={<ProtectedRoute user={user} allowedRole="Admin"><Layout><ManageEmployees /></Layout></ProtectedRoute>} />
        <Route path="/admin/projects" element={<ProtectedRoute user={user} allowedRole="Admin"><Layout><AdminProjects /></Layout></ProtectedRoute>} />
        <Route path="/admin/profile" element={<ProtectedRoute user={user} allowedRole="Admin"><ProfileLayout><ProfilePage user={user} setUser={setUser} /></ProfileLayout></ProtectedRoute>} />

        {/* ── EMPLOYEE ROUTES ── */}
        <Route path="/employee/dashboard" element={<ProtectedRoute user={user} allowedRole="Employee"><Layout><EmployeeDashboard /></Layout></ProtectedRoute>} />
        <Route path="/employee/attendance" element={<ProtectedRoute user={user} allowedRole="Employee"><Layout><EmployeeAttendance user={user} attendance={attendance} setAttendance={setAttendance} /></Layout></ProtectedRoute>} />
        <Route path="/employee/leave" element={<ProtectedRoute user={user} allowedRole="Employee"><Layout><EmployeeLeave user={user} leaveRequests={leaveRequests} setLeaveRequests={setLeaveRequests} /></Layout></ProtectedRoute>} />
        <Route path="/employee/projects" element={<ProtectedRoute user={user} allowedRole="Employee"><Layout><EmployeeProjects user={user} /></Layout></ProtectedRoute>} />
        <Route path="/employee/profile" element={<ProtectedRoute user={user} allowedRole="Employee"><ProfileLayout><ProfilePage user={user} setUser={setUser} /></ProfileLayout></ProtectedRoute>} />

        <Route path="*" element={<NotFound user={user} />} />

      </Routes>
    </Router>
  );
}

export default App;