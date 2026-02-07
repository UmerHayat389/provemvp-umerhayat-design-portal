// src/components/employee/EmployeeAttendance.jsx
import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { FaClock, FaCalendarAlt, FaUser } from 'react-icons/fa';
import Calendar from '../common/Calendar';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const EmployeeAttendance = ({ user, attendance, setAttendance }) => {
  const employee = { id: user.email === 'umer@employee' ? 1 : 2, name: user.name };
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
    <div className="space-y-6 p-4 bg-white min-h-screen">

      {/* Clock In/Out */}
      <div className="bg-white p-6 rounded-xl shadow-lg text-center hover:shadow-2xl transition duration-300 animate-fadeIn border border-gray-100">
        <h3 className="text-2xl font-bold mb-4 text-[#0C2B4E]">Clock In / Clock Out</h3>
        {!isClockedIn ? (
          <button onClick={handleClockIn} className="bg-green-500 text-white px-8 py-3 rounded-xl text-lg hover:bg-green-600 hover:scale-105 transition duration-200 transform">
            <FaClock className="inline mr-2" /> Clock In
          </button>
        ) : (
          <div className="space-y-4 animate-fadeIn">
            <p className="text-[#0C2B4E] font-medium">Elapsed Time: <span className="font-bold text-[#0C2B4E]">{formatTime(elapsedTime)}</span></p>
            <button onClick={handleClockOut} className="bg-red-500 text-white px-8 py-3 rounded-xl text-lg hover:bg-red-600 hover:scale-105 transition duration-200 transform">
              <FaClock className="inline mr-2" /> Clock Out
            </button>
          </div>
        )}
      </div>

      {/* Clock Out Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 animate-slideIn transform scale-100 hover:scale-105 transition duration-300">
            <h2 className="text-3xl font-bold mb-6 text-center text-[#0C2B4E] flex items-center justify-center gap-2">
              <FaClock /> Clock Out Summary
            </h2>

            <div className="grid grid-cols-2 gap-4 text-[#0C2B4E]">
              <div className="font-semibold flex items-center gap-2"><FaUser /> Employee:</div>
              <div className="text-[#0C2B4E]">{employee.name}</div>

              <div className="font-semibold flex items-center gap-2"><FaCalendarAlt /> Date:</div>
              <div className="text-[#0C2B4E]">{new Date(clockOutTime).toLocaleDateString()}</div>

              <div className="font-semibold">Day:</div>
              <div className="text-[#0C2B4E] font-medium">{new Date(clockOutTime).toLocaleString('default', { weekday: 'long' })}</div>

              <div className="font-semibold">Clock In:</div>
              <div className="text-[#0C2B4E]">{new Date(clockInTime).toLocaleTimeString()}</div>

              <div className="font-semibold">Clock Out:</div>
              <div className="text-[#0C2B4E]">{new Date(clockOutTime).toLocaleTimeString()}</div>

              <div className="font-semibold">Total Hours:</div>
              <div className="bg-green-100 text-green-800 font-bold px-2 py-1 rounded-lg animate-pulse">{totalHours.toFixed(2)} hrs</div>
            </div>

            <div className="mt-8 text-center">
              <button onClick={closeModal} className="bg-[#0C2B4E] text-white px-6 py-3 rounded-xl hover:bg-[#0C2B4E]/90 hover:scale-105 transition duration-200 transform">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark Attendance */}
      <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition duration-300 animate-fadeIn border border-gray-100">
        <h3 className="text-2xl font-bold mb-4 text-[#0C2B4E]">Mark Today's Attendance</h3>
        <div className="flex flex-wrap gap-4">
          <button onClick={() => handleMarkAttendance('Present')} className="px-6 py-2 rounded-xl bg-green-200 hover:bg-green-500 hover:text-white hover:scale-105 transition duration-200 transform">Present ✅</button>
          <button onClick={() => handleMarkAttendance('Absent')} className="px-6 py-2 rounded-xl bg-red-200 hover:bg-red-500 hover:text-white hover:scale-105 transition duration-200 transform">Absent ❌</button>
          <button onClick={() => handleMarkAttendance('Leave')} className="px-6 py-2 rounded-xl bg-yellow-200 hover:bg-yellow-500 hover:text-white hover:scale-105 transition duration-200 transform">Leave 🟡</button>
        </div>
      </div>

      {/* Monthly View with Beautiful Dropdowns */}
      <div className="space-y-4 animate-fadeIn">
        <div className="flex flex-wrap gap-4 justify-center items-center mb-4">
          <select
            value={currentMonth}
            onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
            className="border border-gray-300 rounded-xl px-4 py-2 shadow-sm focus:ring-2 focus:ring-blue-400 hover:shadow-md transition duration-200 text-[#0C2B4E] font-medium"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i}>
                {new Date(currentYear, i).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
          <select
            value={currentYear}
            onChange={(e) => setCurrentYear(parseInt(e.target.value))}
            className="border border-gray-300 rounded-xl px-4 py-2 shadow-sm focus:ring-2 focus:ring-blue-400 hover:shadow-md transition duration-200 text-[#0C2B4E] font-medium"
          >
            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <Calendar
          month={currentMonth}
          year={currentYear}
          onDateClick={() => {}}
          attendanceData={employeeAttendance}
        />

        <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition duration-300 animate-fadeIn border border-gray-100">
          <Bar data={barData} />
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: scale(0.95) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }

        .animate-slideIn {
          animation: slideIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};

export default EmployeeAttendance;