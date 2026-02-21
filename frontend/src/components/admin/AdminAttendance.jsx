import React, { useState, useMemo, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { attendanceAPI } from "../../services/api";
import { FaClock, FaUsers, FaUserTimes, FaRegClock } from "react-icons/fa";

const AdminAttendance = () => {
  const [calendarView] = useState("dayGridMonth");
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [modalData, setModalData] = useState(null);

  // ── Real data from API ──────────────────────────────────────────────────────
  const [allRecords, setAllRecords] = useState([]);   // raw DB records
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  // ── Fetch all attendance records on mount ───────────────────────────────────
  useEffect(() => {
    fetchAllRecords();
  }, []);

  const fetchAllRecords = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await attendanceAPI.getAllRecords();
      const data = Array.isArray(res.data) ? res.data
        : Array.isArray(res.data?.records) ? res.data.records
        : [];
      setAllRecords(data);

      // Auto-select first employee found
      if (data.length > 0 && !selectedEmployee) {
        const first = data[0].userId?.name || '';
        setSelectedEmployee(first);
      }
    } catch (err) {
      console.error('Error fetching all records:', err);
      setError('Failed to load attendance data.');
    } finally {
      setLoading(false);
    }
  };

  // ── Derive unique employee list from records ─────────────────────────────────
  const employees = useMemo(() => {
    const map = {};
    allRecords.forEach(r => {
      const u = r.userId;
      if (u && u._id && !map[u._id]) {
        map[u._id] = { id: u._id, name: u.name, email: u.email, role: u.position || 'Employee' };
      }
    });
    return Object.values(map);
  }, [allRecords]);

  // Set first employee once employees load
  useEffect(() => {
    if (employees.length > 0 && !selectedEmployee) {
      setSelectedEmployee(employees[0].name);
    }
  }, [employees]);

  // ── Stats for selected employee + selected month ─────────────────────────────
  const stats = useMemo(() => {
    const employeeRecords = allRecords.filter(r => {
      const d = new Date(r.date);
      return r.userId?.name === selectedEmployee &&
        d.getFullYear() === selectedYear &&
        d.getMonth() === selectedMonth;
    });

    const present = employeeRecords.filter(r => r.status === 'Present').length;
    const absentOrLeave = employeeRecords.filter(r => r.status === 'Absent' || r.status === 'Leave').length;
    const totalHours = employeeRecords.reduce((sum, r) => sum + (r.totalHours || 0), 0);

    return {
      totalMonthHours: totalHours.toFixed(1) + 'h',
      presentDays: present,
      absentOrLeaveDays: absentOrLeave,
    };
  }, [allRecords, selectedEmployee, selectedYear, selectedMonth]);

  // ── Calendar events for selected employee + month ────────────────────────────
  const events = useMemo(() => {
    const bgEvents = [];
    const emojiEvents = [];

    allRecords.forEach(r => {
      if (r.userId?.name !== selectedEmployee) return;
      const d = new Date(r.date);
      if (d.getFullYear() !== selectedYear || d.getMonth() !== selectedMonth) return;

      const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      let bg = '';
      let emoji = '';

      if (r.status === 'Present')      { bg = 'rgba(34,197,94,0.35)';  emoji = '✅'; }
      else if (r.status === 'Leave')   { bg = 'rgba(234,179,8,0.35)';  emoji = '🟡'; }
      else if (r.status === 'Absent')  { bg = 'rgba(239,68,68,0.35)';  emoji = '❌'; }

      bgEvents.push({ start: dateStr, display: 'background', backgroundColor: bg });
      emojiEvents.push({
        start: dateStr, title: emoji, allDay: true,
        backgroundColor: 'transparent', borderColor: 'transparent', display: 'auto',
        extendedProps: { record: r },
      });
    });

    return [...bgEvents, ...emojiEvents];
  }, [allRecords, selectedEmployee, selectedYear, selectedMonth]);

  // ── Top stat cards ───────────────────────────────────────────────────────────
  const topCards = [
    { title: "Total Hours",    value: stats.totalMonthHours,    icon: <FaClock size={20} className="text-blue-600 dark:text-blue-400" />,   color: "text-blue-600 dark:text-blue-400",  bg: "bg-blue-50 dark:bg-blue-900/30" },
    { title: "Present Days",   value: stats.presentDays,        icon: <FaUsers size={20} className="text-green-600 dark:text-green-400" />, color: "text-green-600 dark:text-green-400", bg: "bg-green-50 dark:bg-green-900/30" },
    { title: "Absent / Leave", value: stats.absentOrLeaveDays,  icon: <FaUserTimes size={20} className="text-red-500 dark:text-red-400" />, color: "text-red-500 dark:text-red-400",    bg: "bg-red-50 dark:bg-red-900/30" },
  ];

  // ── Date click → show modal with real record data ────────────────────────────
  const handleDateClick = (info) => {
    const dateStr = info.dateStr;
    const employee = employees.find(e => e.name === selectedEmployee);
    const record = allRecords.find(r => {
      const d = new Date(r.date);
      const rDateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      return r.userId?.name === selectedEmployee && rDateStr === dateStr;
    });

    if (!record) return; // no record for this date, don't open modal

    const clockIn  = record.clockIn  ? new Date(record.clockIn).toLocaleTimeString()  : '—';
    const clockOut = record.clockOut ? new Date(record.clockOut).toLocaleTimeString() : '—';
    const hours    = record.totalHours ? record.totalHours.toFixed(2) + 'h' : '—';

    setModalData({
      date: dateStr,
      employee,
      log: { status: record.status },
      workingHours: hours,
      productiveHours: hours,
      clockIn,
      clockOut,
      breakHours: '—',
      overtime: '—',
    });
  };

  // ── Loading / error states ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-64">
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
          </svg>
          <span>Loading attendance data...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center">
          <p className="text-red-600 dark:text-red-400">{error}</p>
          <button onClick={fetchAllRecords} className="mt-3 px-4 py-2 bg-[#0C2B4E] text-white rounded-lg text-sm hover:bg-[#0a243d] transition-colors">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">

      {/* TOP CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {topCards.map((card, i) => (
          <div key={i} className={`${card.bg} bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 flex items-center gap-4 border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-lg hover:scale-105 transform`}>
            <div className="p-3 rounded-full bg-gray-100 dark:bg-gray-700 transition-colors duration-200">
              {card.icon}
            </div>
            <div>
              <h2 className={`text-2xl font-bold ${card.color}`}>{card.value}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">{card.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* FILTERS + CALENDAR */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 border border-gray-100 dark:border-gray-700 transition-all duration-300">
        <div className="flex flex-wrap gap-3 items-center mb-4 justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
            Attendance Calendar
          </h3>
          <div className="flex flex-wrap gap-2 items-center">

            {/* Employee dropdown — real data */}
            <select
              className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
            >
              {employees.length === 0 && <option value="">No employees</option>}
              {employees.map((emp) => (
                <option key={emp.id} value={emp.name}>{emp.name}</option>
              ))}
            </select>

            <select
              className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>

            <select
              className="border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* No records notice */}
        {employees.length === 0 && (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500">
            No attendance records found. Employees need to clock in first.
          </div>
        )}

        {/* FullCalendar */}
        <div className="[&_.fc-theme-standard_.fc-scrollgrid]:border-gray-200 dark:[&_.fc-theme-standard_.fc-scrollgrid]:border-gray-700
          [&_.fc-col-header-cell]:bg-gray-50 dark:[&_.fc-col-header-cell]:bg-gray-700
          [&_.fc-col-header-cell-cushion]:text-gray-700 dark:[&_.fc-col-header-cell-cushion]:text-gray-200
          [&_.fc-daygrid-day-number]:text-gray-700 dark:[&_.fc-daygrid-day-number]:text-gray-300
          [&_.fc-toolbar-title]:text-gray-800 dark:[&_.fc-toolbar-title]:text-gray-100
          [&_.fc-daygrid-day]:bg-white dark:[&_.fc-daygrid-day]:bg-gray-800
          [&_.fc-day-today]:bg-blue-50 dark:[&_.fc-day-today]:bg-blue-900/30">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin, listPlugin]}
            initialView={calendarView}
            events={events}
            height="auto"
            headerToolbar={{ left: "", center: "title", right: "" }}
            dateClick={handleDateClick}
            eventContent={(arg) => (
              <div style={{ position: "relative", width: "100%", height: "100%" }}>
                <div style={{
                  position: "absolute", top: "2px", left: "2px",
                  fontSize: "12px", fontWeight: 600,
                  display: "flex", gap: "2px",
                  pointerEvents: "none", background: "transparent", opacity: 1,
                }}>
                  <span>{arg.event.title}</span>
                </div>
              </div>
            )}
          />
        </div>
      </div>

      {/* MODAL — real clock in/out times */}
      {modalData && (
        <div className="fixed inset-0 bg-black/30 dark:bg-black/60 backdrop-blur-md flex justify-center items-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 w-full max-w-4xl relative animate-scaleIn border border-gray-200 dark:border-gray-700">

            <button
              onClick={() => setModalData(null)}
              className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 transition-colors duration-200"
            >
              &times;
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-[#0C2B4E] flex items-center justify-center text-white text-2xl font-bold border-2 border-blue-500">
                {modalData.employee?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{modalData.employee?.name}</h2>
                <p className="text-gray-500 dark:text-gray-400">{modalData.employee?.role}</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm">{modalData.date}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-xl flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105">
                <FaClock className="text-blue-600 dark:text-blue-400 text-2xl" />
                <p className="text-sm text-blue-700 dark:text-blue-300 font-semibold">Total Hours</p>
                <p className="text-lg font-bold text-blue-800 dark:text-blue-200">{modalData.workingHours}</p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-xl flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105">
                <FaUsers className="text-green-600 dark:text-green-400 text-2xl" />
                <p className="text-sm text-green-700 dark:text-green-300 font-semibold">Clock In</p>
                <p className="text-lg font-bold text-green-800 dark:text-green-200">{modalData.clockIn}</p>
              </div>
              <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-xl flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105">
                <FaRegClock className="text-yellow-500 dark:text-yellow-400 text-2xl" />
                <p className="text-sm text-yellow-700 dark:text-yellow-300 font-semibold">Clock Out</p>
                <p className="text-lg font-bold text-yellow-800 dark:text-yellow-200">{modalData.clockOut}</p>
              </div>
              <div className="bg-red-50 dark:bg-red-900/30 p-4 rounded-xl flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105">
                <FaUserTimes className="text-red-500 dark:text-red-400 text-2xl" />
                <p className="text-sm text-red-700 dark:text-red-300 font-semibold">Status</p>
                <p className="text-lg font-bold text-red-800 dark:text-red-200">{modalData.log?.status}</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-center">
                <thead className="bg-gray-100 dark:bg-gray-700">
                  <tr>
                    {["Check In", "Status", "Check Out", "Total Hours"].map((th, i) => (
                      <th key={i} className="px-4 py-2 text-gray-600 dark:text-gray-300 font-semibold">{th}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                    <td className="px-4 py-2 text-gray-800 dark:text-gray-200">{modalData.clockIn}</td>
                    <td className="px-4 py-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold
                        ${modalData.log?.status === "Present" ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300" :
                          modalData.log?.status === "Leave"   ? "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300" :
                          "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"}`}>
                        {modalData.log?.status || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-800 dark:text-gray-200">{modalData.clockOut}</td>
                    <td className="px-4 py-2 text-gray-800 dark:text-gray-200">{modalData.workingHours}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default AdminAttendance;