// src/components/employee/EmployeeAttendance.jsx
import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { FaClock, FaCalendarAlt, FaUser } from 'react-icons/fa';
import Calendar from '../common/Calendar';
import { useTheme } from '../../context/ThemeContext';
import { attendanceAPI } from '../../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const EmployeeAttendance = ({ user }) => {
  const { isDark } = useTheme();

  // ── Clock state ──────────────────────────────────────────────────────────────
  const [clockInTime, setClockInTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [clockOutTime, setClockOutTime] = useState(null);
  const [totalHours, setTotalHours] = useState(0);
  const [clockLoading, setClockLoading] = useState(false);
  const [clockError, setClockError] = useState('');

  // ── Records state ────────────────────────────────────────────────────────────
  const [records, setRecords] = useState([]);           // raw DB records
  const [recordsLoading, setRecordsLoading] = useState(true);

  // ── Calendar/chart state ─────────────────────────────────────────────────────
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // ── On mount: fetch records + restore any active clock-in from today ─────────
  useEffect(() => {
    fetchRecords();
  }, []);

  // Elapsed time ticker
  useEffect(() => {
    let interval;
    if (isClockedIn && clockInTime) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - new Date(clockInTime).getTime());
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isClockedIn, clockInTime]);

  // ── Fetch all records for this employee ──────────────────────────────────────
  const fetchRecords = async () => {
    try {
      setRecordsLoading(true);
      const res = await attendanceAPI.getMyRecords();
      const data = Array.isArray(res.data) ? res.data
        : Array.isArray(res.data?.records) ? res.data.records
        : [];
      setRecords(data);

      // Restore clock-in state if there's an open record today (clockIn set, clockOut not)
      const today = new Date().toDateString();
      const openRecord = data.find(r =>
        r.clockIn && !r.clockOut &&
        new Date(r.date).toDateString() === today
      );
      if (openRecord) {
        setIsClockedIn(true);
        setClockInTime(openRecord.clockIn);
        setElapsedTime(Date.now() - new Date(openRecord.clockIn).getTime());
      }
    } catch (err) {
      console.error('Error fetching attendance records:', err);
    } finally {
      setRecordsLoading(false);
    }
  };

  // ── Clock In ─────────────────────────────────────────────────────────────────
  const handleClockIn = async () => {
    setClockError('');
    setClockLoading(true);
    try {
      const res = await attendanceAPI.clockIn();
      const record = res.data?.attendance || res.data;
      setClockInTime(record.clockIn);
      setIsClockedIn(true);
      setElapsedTime(0);
      await fetchRecords();
    } catch (err) {
      setClockError(err.response?.data?.message || 'Clock in failed. Please try again.');
    } finally {
      setClockLoading(false);
    }
  };

  // ── Clock Out ────────────────────────────────────────────────────────────────
  const handleClockOut = async () => {
    setClockError('');
    setClockLoading(true);
    try {
      const res = await attendanceAPI.clockOut();
      const record = res.data?.attendance || res.data;
      const outTime = record.clockOut;
      const hours = record.totalHours ?? ((new Date(outTime) - new Date(clockInTime)) / (1000 * 60 * 60));
      setClockOutTime(outTime);
      setTotalHours(hours);
      setIsClockedIn(false);
      setShowModal(true);
      await fetchRecords();
    } catch (err) {
      setClockError(err.response?.data?.message || 'Clock out failed. Please try again.');
    } finally {
      setClockLoading(false);
    }
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

  // ── Build calendar-friendly attendance map from DB records ───────────────────
  // Shape: { "YYYY-MM-DD": { status, clockIn, clockOut } }
  const employeeAttendance = records.reduce((acc, record) => {
    const d = new Date(record.date);
    const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    acc[dateKey] = {
      status: record.status || 'Present',
      clockIn: record.clockIn,
      clockOut: record.clockOut,
    };
    return acc;
  }, {});

  // ── Filter to current month for summary + chart ──────────────────────────────
  const summary = { Present: 0, Absent: 0, Leave: 0 };
  Object.entries(employeeAttendance).forEach(([dateKey, val]) => {
    const [y, m] = dateKey.split('-').map(Number);
    if (y === currentYear && m === currentMonth + 1) {
      summary[val.status] = (summary[val.status] || 0) + 1;
    }
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

        {clockError && (
          <p className="text-red-500 text-sm mb-3">{clockError}</p>
        )}

        {!isClockedIn ? (
          <button
            onClick={handleClockIn}
            disabled={clockLoading}
            className="bg-green-500 dark:bg-green-600 text-white px-8 py-3 rounded-xl text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ transition: 'all 200ms ease' }}
            onMouseEnter={(e) => { if (!clockLoading) { e.target.style.transform = 'scale(1.05)'; e.target.style.backgroundColor = isDark ? '#16a34a' : '#22c55e'; } }}
            onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; e.target.style.backgroundColor = isDark ? '#16a34a' : '#22c55e'; }}
          >
            <FaClock className="inline mr-2" /> {clockLoading ? 'Clocking In...' : 'Clock In'}
          </button>
        ) : (
          <div className="space-y-4 animate-fadeIn">
            <p className="text-[#0C2B4E] dark:text-gray-200 font-medium">
              Elapsed Time: <span className="font-bold text-[#0C2B4E] dark:text-blue-400">{formatTime(elapsedTime)}</span>
            </p>
            <button
              onClick={handleClockOut}
              disabled={clockLoading}
              className="bg-red-500 dark:bg-red-600 text-white px-8 py-3 rounded-xl text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ transition: 'all 200ms ease' }}
              onMouseEnter={(e) => { if (!clockLoading) { e.target.style.transform = 'scale(1.05)'; e.target.style.backgroundColor = isDark ? '#dc2626' : '#ef4444'; } }}
              onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; e.target.style.backgroundColor = isDark ? '#dc2626' : '#ef4444'; }}
            >
              <FaClock className="inline mr-2" /> {clockLoading ? 'Clocking Out...' : 'Clock Out'}
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
              <div className="text-[#0C2B4E] dark:text-gray-300">{user.name}</div>
              <div className="font-semibold flex items-center gap-2"><FaCalendarAlt /> Date:</div>
              <div className="text-[#0C2B4E] dark:text-gray-300">{new Date(clockOutTime).toLocaleDateString()}</div>
              <div className="font-semibold">Day:</div>
              <div className="text-[#0C2B4E] dark:text-gray-300 font-medium">{new Date(clockOutTime).toLocaleString('default', { weekday: 'long' })}</div>
              <div className="font-semibold">Clock In:</div>
              <div className="text-[#0C2B4E] dark:text-gray-300">{new Date(clockInTime).toLocaleTimeString()}</div>
              <div className="font-semibold">Clock Out:</div>
              <div className="text-[#0C2B4E] dark:text-gray-300">{new Date(clockOutTime).toLocaleTimeString()}</div>
              <div className="font-semibold">Total Hours:</div>
              <div className="bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 font-bold px-2 py-1 rounded-lg animate-pulse">
                {typeof totalHours === 'number' ? totalHours.toFixed(2) : parseFloat(totalHours).toFixed(2)} hrs
              </div>
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={closeModal}
                className="bg-[#0C2B4E] dark:bg-blue-700 text-white px-6 py-3 rounded-xl"
                style={{ transition: 'all 200ms ease' }}
                onMouseEnter={(e) => { e.target.style.transform = 'scale(1.05)'; e.target.style.backgroundColor = isDark ? '#1e40af' : '#0a243d'; }}
                onMouseLeave={(e) => { e.target.style.transform = 'scale(1)'; e.target.style.backgroundColor = isDark ? '#1d4ed8' : '#0C2B4E'; }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark Attendance — kept for manual override if needed */}
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
          {['Present', 'Absent', 'Leave'].map((status) => {
            const styles = {
              Present: 'bg-green-200 dark:bg-green-900/40 text-green-800 dark:text-green-200 hover:bg-green-500 dark:hover:bg-green-700 hover:text-white',
              Absent:  'bg-red-200 dark:bg-red-900/40 text-red-800 dark:text-red-200 hover:bg-red-500 dark:hover:bg-red-700 hover:text-white',
              Leave:   'bg-yellow-200 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-500 dark:hover:bg-yellow-700 hover:text-white',
            };
            const icons = { Present: '✅', Absent: '❌', Leave: '🟡' };
            return (
              <button
                key={status}
                onClick={() => handleMarkAttendance(status)}
                className={`px-6 py-2 rounded-xl ${styles[status]}`}
                style={{ transition: 'all 200ms ease' }}
                onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
              >
                {status} {icons[status]}
              </button>
            );
          })}
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

        {recordsLoading ? (
          <div className="flex items-center justify-center py-12">
            <svg className="animate-spin h-8 w-8 text-[#0C2B4E] dark:text-blue-400" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
          </div>
        ) : (
          <>
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
          </>
        )}
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
        .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
        .animate-slideIn { animation: slideIn 0.4s ease-out; }
      `}</style>
    </div>
  );
};

// ── handleMarkAttendance needs to persist to DB too ───────────────────────────
// Attached as a method via a wrapper so the component stays clean
const EmployeeAttendanceWithMark = (props) => {
  const handleMarkAttendance = async (status) => {
    try {
      await attendanceAPI.markStatus({ status });
    } catch (err) {
      console.error('Mark attendance error:', err);
    }
  };
  return <EmployeeAttendance {...props} handleMarkAttendance={handleMarkAttendance} />;
};

export default EmployeeAttendance;