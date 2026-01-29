// src/components/employee/EmployeeAttendance.jsx
import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import Calendar from '../common/Calendar';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const EmployeeAttendance = ({ user, attendance, setAttendance }) => {
  const employee = { id: user.email === 'umer@employee' ? 1 : 2, name: user.name }; // Map email to ID
  const [clockInTime, setClockInTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [clockOutTime, setClockOutTime] = useState(null);
  const [totalHours, setTotalHours] = useState(0);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  useEffect(() => {
    let interval;
    if (isClockedIn) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - clockInTime);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isClockedIn, clockInTime]);

  const handleClockIn = () => {
    const now = Date.now();
    setClockInTime(now);
    setIsClockedIn(true);
    setElapsedTime(0);
  };

  const handleClockOut = () => {
    const now = Date.now();
    setClockOutTime(now);
    setTotalHours((now - clockInTime) / (1000 * 60 * 60));
    setIsClockedIn(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setClockInTime(null);
    setClockOutTime(null);
    setTotalHours(0);
  };

  const formatTime = (ms) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleMarkAttendance = (status) => {
    const today = new Date();
    const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const monthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    setAttendance(prev => ({
      ...prev,
      [monthKey]: {
        ...prev[monthKey],
        [dateKey]: {
          ...prev[monthKey]?.[dateKey],
          [employee.id]: { status, notes: '' },
        },
      },
    }));
  };

  const monthData = attendance[`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`] || {};
  const employeeAttendance = Object.keys(monthData).reduce((acc, date) => {
    if (monthData[date][employee.id]) {
      acc[date] = monthData[date][employee.id];
    }
    return acc;
  }, {});

  const summary = { Present: 0, Absent: 0, Leave: 0 };
  Object.values(employeeAttendance).forEach(day => {
    summary[day.status] = (summary[day.status] || 0) + 1;
  });

  const barData = {
    labels: ['Present', 'Absent', 'Leave'],
    datasets: [{ label: 'Days', data: [summary.Present, summary.Absent, summary.Leave], backgroundColor: ['#4CAF50', '#F44336', '#FF9800'] }],
  };

  return (
    <div className="space-y-6">
      {/* Clock In/Out */}
      <div className="bg-white p-6 rounded-lg shadow-md text-center">
        <h3 className="text-xl font-bold mb-4">Clock In/Out</h3>
        {!isClockedIn ? (
          <button onClick={handleClockIn} className="bg-green-500 text-white px-6 py-3 rounded-lg text-lg hover:bg-green-600">
            Clock In
          </button>
        ) : (
          <div>
            <p className="mb-4">Elapsed Time: {formatTime(elapsedTime)}</p>
            <button onClick={handleClockOut} className="bg-red-500 text-white px-6 py-3 rounded-lg text-lg hover:bg-red-600">
              Clock Out
            </button>
          </div>
        )}
      </div>

      {/* Modal for Clock Out Summary */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Clock Out Summary</h3>
            <p>Clock In: {new Date(clockInTime).toLocaleTimeString()}</p>
            <p>Clock Out: {new Date(clockOutTime).toLocaleTimeString()}</p>
            <p>Total Hours: {totalHours.toFixed(2)}</p>
            <button onClick={closeModal} className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Mark Attendance */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-bold mb-4">Mark Today's Attendance</h3>
        <div className="space-x-4">
          <button
            onClick={() => handleMarkAttendance('Present')}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-green-500 hover:text-white"
          >
            Present ✅
          </button>
          <button
            onClick={() => handleMarkAttendance('Absent')}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-red-500 hover:text-white"
          >
            Absent ❌
          </button>
          <button
            onClick={() => handleMarkAttendance('Leave')}
            className="px-4 py-2 rounded bg-gray-200 hover:bg-yellow-500 hover:text-white"
          >
            Leave 🟡
          </button>
        </div>
      </div>

      {/* Monthly View */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <button onClick={() => setCurrentMonth(currentMonth - 1)} className="bg-blue-500 text-white p-2 rounded">Prev Month</button>
          <h3 className="text-xl font-bold">{new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
          <button onClick={() => setCurrentMonth(currentMonth + 1)} className="bg-blue-500 text-white p-2 rounded">Next Month</button>
        </div>
        <Calendar month={currentMonth} year={currentYear} onDateClick={() => {}} attendanceData={employeeAttendance} />
        <div className="bg-white p-4 rounded-lg shadow-md">
          <Bar data={barData} />
        </div>
      </div>
    </div>
  );
};

export default EmployeeAttendance;