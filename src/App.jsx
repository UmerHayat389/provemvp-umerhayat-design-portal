// src/App.jsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminAttendance from './components/admin/AdminAttendance';
import AdminLeave from './components/admin/AdminLeave';
import EmployeeAttendance from './components/employee/EmployeeAttendance';
import EmployeeLeave from './components/employee/EmployeeLeave';
import Sidebar from './components/common/Sidebar';
import Navbar from './components/common/Navbar';
import { dummyData } from './data/dummyData'; // Import base data

function App() {
  const [user, setUser] = useState(null); // Logged-in user
  const [attendance, setAttendance] = useState(dummyData.attendance); // Shared attendance state
  const [leaveRequests, setLeaveRequests] = useState(dummyData.leaveRequests); // Shared leave requests state
  const [sidebarOpen, setSidebarOpen] = useState(false); // Add this for mobile sidebar toggle

  // If not logged in, show login
  if (!user) {
    return <Login setUser={setUser} />;
  }

  // Layout wrapper (add props for sidebar toggle)
  const Layout = ({ children }) => (
    <div className="flex h-screen bg-gray-100">
      <Sidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col">
        <Navbar user={user} setUser={setUser} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 p-4 overflow-auto">{children}</main>
      </div>
    </div>
  );

  // Rest of the code remains unchanged
  return (
    <Router>
      <Routes>
        {/* Admin Routes */}
        {user.role === 'Admin' && (
          <>
            <Route path="/" element={<Layout><AdminDashboard attendance={attendance} leaveRequests={leaveRequests} /></Layout>} />
            <Route path="/attendance" element={<Layout><AdminAttendance attendance={attendance} setAttendance={setAttendance} /></Layout>} />
            <Route path="/leave" element={<Layout><AdminLeave leaveRequests={leaveRequests} setLeaveRequests={setLeaveRequests} /></Layout>} />
          </>
        )}
        {/* Employee Routes */}
        {user.role === 'Employee' && (
          <>
            <Route path="/" element={<Layout><EmployeeAttendance user={user} attendance={attendance} setAttendance={setAttendance} leaveRequests={leaveRequests} setLeaveRequests={setLeaveRequests} /></Layout>} />
            <Route path="/leave" element={<Layout><EmployeeLeave user={user} leaveRequests={leaveRequests} setLeaveRequests={setLeaveRequests} /></Layout>} />
          </>
        )}
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;