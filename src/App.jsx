// src/App.jsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Pages & Components
import Login from './pages/Login';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminAttendance from './components/admin/AdminAttendance';
import AdminLeave from './components/admin/AdminLeave';
import EmployeeDashboard from './components/employee/EmployeeDashboard';
import EmployeeAttendance from './components/employee/EmployeeAttendance';
import EmployeeLeave from './components/employee/EmployeeLeave';
import Sidebar from './components/common/Sidebar';
import Navbar from './components/common/Navbar';

// Dummy data
import { dummyData } from './data/dummyData';

function App() {
  const [user, setUser] = useState(null); // Logged-in user
  const [attendance, setAttendance] = useState(dummyData.attendance);
  const [leaveRequests, setLeaveRequests] = useState(dummyData.leaveRequests);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // If not logged in, show login page
  if (!user) {
    return <Login setUser={setUser} />;
  }

  // Layout wrapper
  const Layout = ({ children }) => (
    <div className="flex h-screen bg-gray-100">
      <Sidebar user={user} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col">
        <Navbar user={user} setUser={setUser} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="flex-1 p-4 overflow-auto">{children}</main>
      </div>
    </div>
  );

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
            <Route path="/" element={<Layout><EmployeeDashboard /></Layout>} />
            <Route path="/attendance" element={<Layout><EmployeeAttendance user={user} attendance={attendance} setAttendance={setAttendance} /></Layout>} />
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