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
import api from './services/api';

function App() {
  const [user, setUserState] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [attendance, setAttendance] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);

  // ✅ setUser — always syncs React state + localStorage together
  const setUser = useCallback((newUser) => {
    if (newUser) {
      localStorage.setItem('user', JSON.stringify(newUser));
    } else {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
    setUserState(newUser);
  }, []);

  // ✅ On app load: if token exists, fetch FRESH user from DB (includes profilePhoto)
  // This is the KEY fix — localStorage may have stale user without profilePhoto
  useEffect(() => {
    const initUser = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        // No token — definitely not logged in, go straight to login
        setLoadingUser(false);
        return;
      }

      // Token exists — fetch fresh user from DB (always includes profilePhoto)
      // Keep loadingUser=true until this completes so Navbar never renders stale data
      try {
        const res = await api.get('/profile/me');
        const freshUser = res.data;
        localStorage.setItem('user', JSON.stringify(freshUser));
        setUserState(freshUser);
      } catch (err) {
        if (err.response?.status === 401) {
          // Token expired/invalid — clear everything
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUserState(null);
        } else {
          // Network error — fall back to localStorage so app still works offline
          const savedUser = localStorage.getItem('user');
          if (savedUser) {
            try { setUserState(JSON.parse(savedUser)); } catch { /* ignore */ }
          }
        }
      } finally {
        setLoadingUser(false);
      }
    };


    initUser();
  }, []); // runs once on mount

  // ✅ Auto-logout when JWT token expires
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // Decode token payload (middle part) without a library
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiresAt = payload.exp * 1000; // convert to ms
      const msUntilExpiry = expiresAt - Date.now();

      if (msUntilExpiry <= 0) {
        // Already expired
        setUser(null);
        return;
      }

      // Set timer to auto-logout exactly when token expires
      const timer = setTimeout(() => {
        setUser(null);
      }, msUntilExpiry);

      return () => clearTimeout(timer); // cleanup on unmount or user change
    } catch {
      // Invalid token format — clear it
      setUser(null);
    }
  }, [user]); // re-runs when user logs in/out

  // Socket — depends only on userId string to avoid reconnect loop
  const userId = user?._id?.toString();
  useEffect(() => {
    if (userId) {
      socketService.connect();
      socketService.joinRoom(userId);
    } else {
      socketService.disconnect();
    }
  }, [userId]);

  const Layout = ({ children }) => (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950 transition-colors duration-200">
      <Sidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar user={user} setUser={setUser} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        {/* bg-* removed — page components set their own background via inline styles */}
        <main className="flex-1 overflow-auto text-gray-900 dark:text-gray-100 transition-colors duration-200">
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

        {/* Shared page wrapper — restores the p-4 + bg that <main> no longer provides */}
        {/* EmployeeProjects is excluded — it manages its own full-bleed bg + padding */}
        {/* ── ADMIN ROUTES ── */}
        <Route path="/admin/dashboard" element={<ProtectedRoute user={user} allowedRole="Admin"><Layout><div className="p-4 min-h-full bg-gray-100 dark:bg-gray-950"><AdminDashboard attendance={attendance} leaveRequests={leaveRequests} /></div></Layout></ProtectedRoute>} />
        <Route path="/admin/attendance" element={<ProtectedRoute user={user} allowedRole="Admin"><Layout><div className="p-4 min-h-full bg-gray-100 dark:bg-gray-950"><AdminAttendance /></div></Layout></ProtectedRoute>} />
        <Route path="/admin/attendance/:employeeSlug" element={<ProtectedRoute user={user} allowedRole="Admin"><Layout><div className="p-4 min-h-full bg-gray-100 dark:bg-gray-950"><AdminAttendance /></div></Layout></ProtectedRoute>} />
        <Route path="/admin/leave" element={<ProtectedRoute user={user} allowedRole="Admin"><Layout><div className="p-4 min-h-full bg-gray-100 dark:bg-gray-950"><AdminLeave leaveRequests={leaveRequests} setLeaveRequests={setLeaveRequests} /></div></Layout></ProtectedRoute>} />
        <Route path="/admin/manageemployees" element={<ProtectedRoute user={user} allowedRole="Admin"><Layout><div className="p-4 min-h-full bg-gray-100 dark:bg-gray-950"><ManageEmployees /></div></Layout></ProtectedRoute>} />
        <Route path="/admin/projects" element={<ProtectedRoute user={user} allowedRole="Admin"><Layout><div className="p-4 min-h-full bg-gray-100 dark:bg-gray-950"><AdminProjects /></div></Layout></ProtectedRoute>} />
        <Route path="/admin/profile" element={<ProtectedRoute user={user} allowedRole="Admin"><ProfileLayout><ProfilePage user={user} setUser={setUser} /></ProfileLayout></ProtectedRoute>} />

        {/* ── EMPLOYEE ROUTES ── */}
        <Route path="/employee/dashboard" element={<ProtectedRoute user={user} allowedRole="Employee"><Layout><div className="p-4 min-h-full bg-gray-100 dark:bg-gray-950"><EmployeeDashboard /></div></Layout></ProtectedRoute>} />
        <Route path="/employee/attendance" element={<ProtectedRoute user={user} allowedRole="Employee"><Layout><div className="p-4 min-h-full bg-gray-100 dark:bg-gray-950"><EmployeeAttendance user={user} attendance={attendance} setAttendance={setAttendance} /></div></Layout></ProtectedRoute>} />
        <Route path="/employee/leave" element={<ProtectedRoute user={user} allowedRole="Employee"><Layout><div className="p-4 min-h-full bg-gray-100 dark:bg-gray-950"><EmployeeLeave user={user} leaveRequests={leaveRequests} setLeaveRequests={setLeaveRequests} /></div></Layout></ProtectedRoute>} />
        {/* EmployeeProjects — self-managed bg, no wrapper */}
        <Route path="/employee/projects" element={<ProtectedRoute user={user} allowedRole="Employee"><Layout><EmployeeProjects user={user} /></Layout></ProtectedRoute>} />
        <Route path="/employee/profile" element={<ProtectedRoute user={user} allowedRole="Employee"><ProfileLayout><ProfilePage user={user} setUser={setUser} /></ProfileLayout></ProtectedRoute>} />

        <Route path="*" element={<NotFound user={user} />} />

      </Routes>
    </Router>
  );
}

export default App;