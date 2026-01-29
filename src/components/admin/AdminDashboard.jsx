// src/components/admin/AdminDashboard.jsx
import React from 'react';
import { Line, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Title, Tooltip, Legend);

const AdminDashboard = ({ attendance, leaveRequests }) => {
  // Calculate metrics from shared state
  const totalEmployees = 2; // Umer and Faizan
  const presentToday = Object.values(attendance['2023-10'] || {}).filter(day => Object.values(day).some(emp => emp.status === 'Present')).length; // Simplified count
  const onLeave = leaveRequests.filter(r => r.status === 'Approved').length;
  const pendingRequests = leaveRequests.filter(r => r.status === 'Pending').length;

  const lineData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{ label: 'Attendance', data: [5, 6, 4, 7, 5, 6, 5], borderColor: 'rgb(75, 192, 192)', tension: 0.1 }],
  };

  const donutData = {
    labels: ['Present', 'Absent', 'On Leave'],
    datasets: [{ data: [presentToday, totalEmployees - presentToday - onLeave, onLeave], backgroundColor: ['#4CAF50', '#F44336', '#FF9800'] }],
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">{totalEmployees} Total Employees</div>
        <div className="bg-white p-4 rounded-lg shadow">{presentToday} Present Today</div>
        <div className="bg-white p-4 rounded-lg shadow">{onLeave} On Leave</div>
        <div className="bg-white p-4 rounded-lg shadow">{pendingRequests} Pending Leave Requests</div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow"><Line data={lineData} /></div>
        <div className="bg-white p-4 rounded-lg shadow"><Doughnut data={donutData} /></div>
      </div>
    </div>
  );
};

export default AdminDashboard;