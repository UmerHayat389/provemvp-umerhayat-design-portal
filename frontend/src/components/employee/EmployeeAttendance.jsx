// src/components/employee/EmployeeAttendance.jsx
import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { FaClock, FaCalendarAlt, FaUser } from 'react-icons/fa';
import Calendar from '../common/Calendar';
import { useTheme } from '../../context/ThemeContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const EmployeeAttendance = ({ user, attendance, setAttendance }) => {
  const { isDark } = useTheme();
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
    datasets: [{
      label: 'Days',
      data: [summary.Present, summary.Absent, summary.Leave],
      backgroundColor: ['#4CAF50', '#F44336', '#FF9800'],
    }],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: { color: isDark ? '#E5E7EB' : '#374151' }
      },
      tooltip: {
        backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
        titleColor: isDark ? '#F9FAFB' : '#111827',
        bodyColor: isDark ? '#E5E7EB' : '#374151',
        borderColor: isDark ? '#374151' : '#E5E7EB',
        borderWidth: 1,
      },
    },
    scales: {
      x: { ticks: { color: isDark ? '#9CA3AF' : '#6B7280' }, grid: { color: isDark ? '#374151' : '#E5E7EB' } },
      y: { ticks: { color: isDark ? '#9CA3AF' : '#6B7280' }, grid: { color: isDark ? '#374151' : '#E5E7EB' } },
    },
  };

  return (
    <div className="space-y-6 p-4 bg-gray-50 dark:bg-gray-950 min-h-screen transition-colors duration-200">

      {/* Clock In/Out */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg text-center border border-gray-100 dark:border-gray-700"
        style={{
          transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: 0,
          animation: 'fadeIn 0.5s ease-out forwards',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.15), 0 10px 10px -5px rgba(0,0,0,0.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)';
        }}>
        <h3 className="text-2xl font-bold mb-4 text-[#0C2B4E] dark:text-blue-400">Clock In / Clock Out</h3>
        {!isClockedIn ? (
          <button
            onClick={handleClockIn}
            className="bg-green-500 dark:bg-green-600 text-white px-8 py-3 rounded-xl text-lg"
            style={{ transition: 'all 200ms ease' }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.05)';
              e.target.style.backgroundColor = isDark ? '#16a34a' : '#22c55e';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.backgroundColor = isDark ? '#16a34a' : '#22c55e';
            }}
          >
            <FaClock className="inline mr-2" /> Clock In
          </button>
        ) : (
          <div className="space-y-4 animate-fadeIn">
            <p className="text-[#0C2B4E] dark:text-gray-200 font-medium">
              Elapsed Time: <span className="font-bold text-[#0C2B4E] dark:text-blue-400">{formatTime(elapsedTime)}</span>
            </p>
            <button
              onClick={handleClockOut}
              className="bg-red-500 dark:bg-red-600 text-white px-8 py-3 rounded-xl text-lg"
              style={{ transition: 'all 200ms ease' }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'scale(1.05)';
                e.target.style.backgroundColor = isDark ? '#dc2626' : '#ef4444';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'scale(1)';
                e.target.style.backgroundColor = isDark ? '#dc2626' : '#ef4444';
              }}
            >
              <FaClock className="inline mr-2" /> Clock Out
            </button>
          </div>
        )}
      </div>

      {/* Clock Out Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-md flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg p-8 animate-slideIn transform border border-gray-200 dark:border-gray-700"
            style={{ transition: 'all 300ms ease' }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
            <h2 className="text-3xl font-bold mb-6 text-center text-[#0C2B4E] dark:text-blue-400 flex items-center justify-center gap-2">
              <FaClock /> Clock Out Summary
            </h2>

            <div className="grid grid-cols-2 gap-4 text-[#0C2B4E] dark:text-gray-200">
              <div className="font-semibold flex items-center gap-2"><FaUser /> Employee:</div>
              <div className="text-[#0C2B4E] dark:text-gray-300">{employee.name}</div>
              <div className="font-semibold flex items-center gap-2"><FaCalendarAlt /> Date:</div>
              <div className="text-[#0C2B4E] dark:text-gray-300">{new Date(clockOutTime).toLocaleDateString()}</div>
              <div className="font-semibold">Day:</div>
              <div className="text-[#0C2B4E] dark:text-gray-300 font-medium">{new Date(clockOutTime).toLocaleString('default', { weekday: 'long' })}</div>
              <div className="font-semibold">Clock In:</div>
              <div className="text-[#0C2B4E] dark:text-gray-300">{new Date(clockInTime).toLocaleTimeString()}</div>
              <div className="font-semibold">Clock Out:</div>
              <div className="text-[#0C2B4E] dark:text-gray-300">{new Date(clockOutTime).toLocaleTimeString()}</div>
              <div className="font-semibold">Total Hours:</div>
              <div className="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 font-bold px-2 py-1 rounded-lg animate-pulse">{totalHours.toFixed(2)} hrs</div>
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={closeModal}
                className="bg-[#0C2B4E] dark:bg-blue-700 text-white px-6 py-3 rounded-xl"
                style={{ transition: 'all 200ms ease' }}
                onMouseEnter={(e) => {
                  e.target.style.transform = 'scale(1.05)';
                  e.target.style.backgroundColor = isDark ? '#1e40af' : '#0a243d';
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = 'scale(1)';
                  e.target.style.backgroundColor = isDark ? '#1d4ed8' : '#0C2B4E';
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark Attendance */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700"
        style={{
          transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: 0,
          animation: 'fadeIn 0.5s ease-out 0.1s forwards',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.15), 0 10px 10px -5px rgba(0,0,0,0.08)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)';
        }}>
        <h3 className="text-2xl font-bold mb-4 text-[#0C2B4E] dark:text-blue-400">Mark Today's Attendance</h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => handleMarkAttendance('Present')}
            className="px-6 py-2 rounded-xl bg-green-200 dark:bg-green-900/40 text-green-800 dark:text-green-200 hover:bg-green-500 dark:hover:bg-green-700 hover:text-white"
            style={{ transition: 'all 200ms ease' }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          >Present ✅</button>
          <button
            onClick={() => handleMarkAttendance('Absent')}
            className="px-6 py-2 rounded-xl bg-red-200 dark:bg-red-900/40 text-red-800 dark:text-red-200 hover:bg-red-500 dark:hover:bg-red-700 hover:text-white"
            style={{ transition: 'all 200ms ease' }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          >Absent ❌</button>
          <button
            onClick={() => handleMarkAttendance('Leave')}
            className="px-6 py-2 rounded-xl bg-yellow-200 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-500 dark:hover:bg-yellow-700 hover:text-white"
            style={{ transition: 'all 200ms ease' }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
          >Leave 🟡</button>
        </div>
      </div>

      {/* Monthly View */}
      <div className="space-y-4 animate-fadeIn">
        <div className="flex flex-wrap gap-4 justify-center items-center mb-4">
          <select
            value={currentMonth}
            onChange={(e) => setCurrentMonth(parseInt(e.target.value))}
            className="border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2 shadow-sm focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 bg-white dark:bg-gray-800 text-[#0C2B4E] dark:text-gray-200 font-medium transition-all duration-200"
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
            className="border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2 shadow-sm focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500 bg-white dark:bg-gray-800 text-[#0C2B4E] dark:text-gray-200 font-medium transition-all duration-200"
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

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 transition-all duration-300"
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(0,0,0,0.15), 0 10px 10px -5px rgba(0,0,0,0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)';
          }}>
          <Bar data={barData} options={chartOptions} />
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: scale(0.95) translateY(-20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
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