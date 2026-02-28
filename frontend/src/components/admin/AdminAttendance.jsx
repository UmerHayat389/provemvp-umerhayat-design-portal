// src/components/admin/AdminAttendance.jsx
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { attendanceAPI, userAPI } from "../../services/api";
import {
  FaClock, FaUsers, FaUserTimes, FaRegClock, FaSearch,
  FaArrowLeft, FaCalendarCheck, FaCheckCircle, FaTimesCircle,
  FaCoffee, FaSyncAlt,
} from "react-icons/fa";
import { toast } from "react-toastify";

/* ─────────────────────────────────────────────────────────────────────────────
   Helpers
───────────────────────────────────────────────────────────────────────────── */
const toDateStr = (d) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
};

const slugify = (name = "") => name.toLowerCase().replace(/\s+/g, "-");
const unslugify = (slug = "") => slug.replace(/-/g, " ");

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

/* ─────────────────────────────────────────────────────────────────────────────
   Auto-absent: every past weekday with no record → Absent
───────────────────────────────────────────────────────────────────────────── */
const injectAutoAbsent = (records, employeeId, year, month) => {
  const today = new Date();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const existingDates = new Set(
    records
      .filter((r) => r.userId?._id === employeeId)
      .map((r) => toDateStr(r.date))
  );

  const synthetic = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    if (d > today) break;
    const dow = d.getDay();
    if (dow === 0 || dow === 6) continue; // skip weekends
    const ds = toDateStr(d);
    if (!existingDates.has(ds)) {
      synthetic.push({
        _synthetic: true,
        userId: { _id: employeeId },
        date: ds,
        status: "Absent",
        clockIn: null,
        clockOut: null,
        totalHours: 0,
      });
    }
  }
  return synthetic;
};

/* ═════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═════════════════════════════════════════════════════════════════════════════ */
const AdminAttendance = () => {
  const navigate = useNavigate();
  const { employeeSlug } = useParams(); // present when on /admin/attendance/:employeeSlug

  const [employees, setEmployees] = useState([]);
  const [allRecords, setAllRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const [modalData, setModalData] = useState(null);
  const [showMarkModal, setShowMarkModal] = useState(false);
  const [markModalData, setMarkModalData] = useState(null);
  const [marking, setMarking] = useState(false);

  /* ── Derive selected employee from URL slug ─────────────────────────────── */
  const selectedEmployee = useMemo(() => {
    if (!employeeSlug || employees.length === 0) return null;
    return employees.find((e) => slugify(e.name) === employeeSlug) || null;
  }, [employeeSlug, employees]);

  /* ── Fetch ──────────────────────────────────────────────────────────────── */
  const fetchAllData = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      else setRefreshing(true);
      setError("");

      const [empRes, attRes] = await Promise.all([
        userAPI.getUsers(),
        attendanceAPI.getAllRecords(),
      ]);

      const empData = Array.isArray(empRes.data)
        ? empRes.data
        : Array.isArray(empRes.data?.users)
        ? empRes.data.users
        : Array.isArray(empRes.data?.data)
        ? empRes.data.data
        : [];

      const attData = Array.isArray(attRes.data)
        ? attRes.data
        : Array.isArray(attRes.data?.records)
        ? attRes.data.records
        : [];

      setEmployees(empData);
      setAllRecords(attData);
    } catch (err) {
      console.error(err);
      setError("Failed to load data.");
      if (!silent) toast.error("Failed to load attendance data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  /* ── Auto-refresh every 30 s when on calendar view ─────────────────────── */
  useEffect(() => {
    if (!employeeSlug) return;
    const id = setInterval(() => fetchAllData(true), 30000);
    return () => clearInterval(id);
  }, [employeeSlug, fetchAllData]);

  /* ── Employee stats for list view ──────────────────────────────────────── */
  const employeesWithStats = useMemo(() => {
    return employees.map((emp) => {
      const empRecords = allRecords.filter((r) => r.userId?._id === emp._id);
      const synthetic = injectAutoAbsent(allRecords, emp._id, selectedYear, selectedMonth);
      const monthRecords = [
        ...empRecords.filter((r) => {
          const d = new Date(r.date);
          return d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
        }),
        ...synthetic,
      ];

      const present = empRecords.filter((r) => r.status === "Present").length;
      const absent = empRecords.filter((r) => r.status === "Absent").length + synthetic.length;
      const leave = empRecords.filter((r) => r.status === "Leave").length;
      const totalHours = empRecords.reduce((s, r) => s + (r.totalHours || 0), 0);

      return { ...emp, presentDays: present, absentDays: absent, leaveDays: leave, totalHours: totalHours.toFixed(1) };
    });
  }, [employees, allRecords, selectedYear, selectedMonth]);

  const filteredEmployees = employeesWithStats.filter(
    (emp) =>
      emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /* ── Stats for calendar header cards ───────────────────────────────────── */
  const stats = useMemo(() => {
    if (!selectedEmployee) return { totalMonthHours: "0h", presentDays: 0, absentOrLeaveDays: 0 };

    const real = allRecords.filter((r) => {
      const d = new Date(r.date);
      return r.userId?._id === selectedEmployee._id &&
        d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    });
    const synthetic = injectAutoAbsent(allRecords, selectedEmployee._id, selectedYear, selectedMonth);

    const present = real.filter((r) => r.status === "Present").length;
    const absentOrLeave =
      real.filter((r) => r.status === "Absent" || r.status === "Leave").length +
      synthetic.length;
    const totalHours = real.reduce((s, r) => s + (r.totalHours || 0), 0);

    return {
      totalMonthHours: totalHours.toFixed(1) + "h",
      presentDays: present,
      absentOrLeaveDays: absentOrLeave,
    };
  }, [allRecords, selectedEmployee, selectedYear, selectedMonth]);

  /* ── Calendar events ────────────────────────────────────────────────────── */
  const events = useMemo(() => {
    if (!selectedEmployee) return [];

    const real = allRecords.filter((r) => {
      const d = new Date(r.date);
      return r.userId?._id === selectedEmployee._id &&
        d.getFullYear() === selectedYear && d.getMonth() === selectedMonth;
    });

    const synthetic = injectAutoAbsent(allRecords, selectedEmployee._id, selectedYear, selectedMonth);
    const combined = [...real, ...synthetic];

    const bg = [];
    const emoji = [];

    combined.forEach((r) => {
      const ds = toDateStr(r.date);
      const color =
        r.status === "Present"  ? "rgba(34,197,94,0.3)"  :
        r.status === "Leave"    ? "rgba(234,179,8,0.3)"  :
        "rgba(239,68,68,0.3)";
      const icon =
        r.status === "Present"  ? "✅" :
        r.status === "Leave"    ? "🟡" : "❌";

      bg.push({ start: ds, display: "background", backgroundColor: color });
      emoji.push({
        start: ds,
        title: icon,
        allDay: true,
        backgroundColor: "transparent",
        borderColor: "transparent",
        extendedProps: { record: r },
      });
    });

    return [...bg, ...emoji];
  }, [allRecords, selectedEmployee, selectedYear, selectedMonth]);

  /* ── Date click ─────────────────────────────────────────────────────────── */
  const handleDateClick = (info) => {
    const ds = info.dateStr;
    const record = allRecords.find((r) => {
      return r.userId?._id === selectedEmployee._id && toDateStr(r.date) === ds;
    });

    // Check if it's a synthetic absent (no DB record)
    const synthetic = injectAutoAbsent(allRecords, selectedEmployee._id, selectedYear, selectedMonth)
      .find((s) => s.date === ds);

    if (record) {
      setModalData({
        date: ds,
        employee: selectedEmployee,
        status: record.status,
        clockIn: record.clockIn ? new Date(record.clockIn).toLocaleTimeString() : "—",
        clockOut: record.clockOut ? new Date(record.clockOut).toLocaleTimeString() : "—",
        workingHours: record.totalHours ? record.totalHours.toFixed(2) + "h" : "—",
      });
    } else {
      // Open mark modal (even for synthetic absents — admin can correct)
      setMarkModalData({ date: ds, employee: selectedEmployee });
      setShowMarkModal(true);
    }
  };

  /* ── Mark attendance ────────────────────────────────────────────────────── */
  const handleMarkAttendance = async (status) => {
    setMarking(true);
    try {
      await attendanceAPI.markStatus({
        userId: markModalData.employee._id,
        date: markModalData.date,
        status,
      });
      toast.success(`Marked as ${status} for ${markModalData.date}`);
      setShowMarkModal(false);
      setMarkModalData(null);
      await fetchAllData(true);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to mark attendance");
    } finally {
      setMarking(false);
    }
  };

  /* ── Navigation ─────────────────────────────────────────────────────────── */
  const handleViewCalendar = (employee) => {
    navigate(`/admin/attendance/${slugify(employee.name)}`);
  };

  const handleBackToList = () => {
    navigate("/admin/attendance");
  };

  /* ── Loading / error ────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64 p-6">
        <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
          <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
          Loading attendance data…
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 mb-3">{error}</p>
        <button onClick={() => fetchAllData()} className="px-4 py-2 bg-[#0C2B4E] text-white rounded-lg text-sm">
          Retry
        </button>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════════
     VIEW: EMPLOYEE LIST
  ══════════════════════════════════════════════════════════════════════════ */
  if (!employeeSlug) {
    return (
      <div className="p-3 sm:p-6 space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
              Employee Attendance
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {employees.length} employee{employees.length !== 1 ? "s" : ""} • click a row to view calendar
            </p>
          </div>
          <button
            onClick={() => fetchAllData()}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors self-start sm:self-auto"
          >
            <FaSyncAlt className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-xs">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3" />
          <input
            type="text"
            placeholder="Search employees…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-[#0C2B4E] dark:focus:ring-blue-400"
          />
        </div>

        {/* Table — desktop */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/60">
                <tr>
                  {["Employee", "Department", "Present", "Absent", "Leave", "Total Hrs", "Action"].map((c) => (
                    <th key={c} className="px-5 py-3 text-left text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp) => (
                    <tr
                      key={emp._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors cursor-pointer"
                      onClick={() => handleViewCalendar(emp)}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#0C2B4E] dark:bg-blue-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {emp.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{emp.name}</p>
                            <p className="text-xs text-gray-400">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-sm text-gray-600 dark:text-gray-300">{emp.department || "—"}</td>
                      <td className="px-5 py-3.5">
                        <Badge color="green" icon={<FaCheckCircle className="w-3 h-3" />} value={emp.presentDays} />
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge color="red" icon={<FaTimesCircle className="w-3 h-3" />} value={emp.absentDays} />
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge color="yellow" icon={<FaCoffee className="w-3 h-3" />} value={emp.leaveDays} />
                      </td>
                      <td className="px-5 py-3.5 text-sm font-semibold text-gray-800 dark:text-gray-100">{emp.totalHours}h</td>
                      <td className="px-5 py-3.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleViewCalendar(emp); }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0C2B4E] dark:bg-blue-700 text-white text-xs font-semibold rounded-lg hover:bg-[#0a243d] dark:hover:bg-blue-600 transition-colors"
                        >
                          <FaCalendarCheck className="w-3 h-3" /> Calendar
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-gray-400 text-sm">
                      {searchTerm ? "No employees match your search" : "No employees found"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="sm:hidden divide-y divide-gray-100 dark:divide-gray-700">
            {filteredEmployees.map((emp) => (
              <div key={emp._id} className="p-4" onClick={() => handleViewCalendar(emp)}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[#0C2B4E] flex items-center justify-center text-white font-bold">
                    {emp.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{emp.name}</p>
                    <p className="text-xs text-gray-400">{emp.department}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge color="green" icon="✓" value={`${emp.presentDays} Present`} />
                  <Badge color="red" icon="✗" value={`${emp.absentDays} Absent`} />
                  <Badge color="yellow" icon="🟡" value={`${emp.leaveDays} Leave`} />
                  <Badge color="blue" icon="⏱" value={`${emp.totalHours}h`} />
                </div>
                <button className="w-full py-2 bg-[#0C2B4E] text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2">
                  <FaCalendarCheck /> View Calendar
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ══════════════════════════════════════════════════════════════════════════
     VIEW: CALENDAR  (URL: /admin/attendance/:employeeSlug)
  ══════════════════════════════════════════════════════════════════════════ */
  if (!selectedEmployee) {
    return (
      <div className="p-6 text-center text-gray-500 dark:text-gray-400">
        Employee not found.{" "}
        <button onClick={handleBackToList} className="text-blue-500 underline">
          Go back
        </button>
      </div>
    );
  }

  const topCards = [
    { title: "Total Hours", value: stats.totalMonthHours, icon: <FaClock />, color: "blue" },
    { title: "Present Days", value: stats.presentDays, icon: <FaUsers />, color: "green" },
    { title: "Absent / Leave", value: stats.absentOrLeaveDays, icon: <FaUserTimes />, color: "red" },
  ];

  return (
    <div className="p-3 sm:p-6 space-y-5">

      {/* Top bar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          onClick={handleBackToList}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <FaArrowLeft className="w-3 h-3" /> Back
        </button>
        <button
          onClick={() => fetchAllData(true)}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <FaSyncAlt className={`w-3 h-3 ${refreshing ? "animate-spin" : ""}`} />
          {refreshing ? "Syncing…" : "Refresh"}
        </button>
      </div>

      {/* Employee card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow p-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#0C2B4E] dark:bg-blue-700 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {selectedEmployee.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{selectedEmployee.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {selectedEmployee.department}{selectedEmployee.position ? ` • ${selectedEmployee.position}` : ""}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{selectedEmployee.email}</p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {topCards.map((card, i) => (
          <StatCard key={i} {...card} />
        ))}
      </div>

      {/* Calendar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow p-4">
        {/* Controls */}
        <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            <FaCalendarCheck className="text-[#0C2B4E] dark:text-blue-400" />
            Attendance Calendar
          </h3>
          <div className="flex gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="text-xs border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 mb-3 flex-wrap">
          {[["✅","Present","text-green-600"],["❌","Absent","text-red-500"],["🟡","Leave","text-yellow-500"]].map(([icon,label,cls]) => (
            <span key={label} className={`flex items-center gap-1 text-xs font-medium ${cls}`}>
              {icon} {label}
            </span>
          ))}
        </div>

        {/* FullCalendar */}
        <div className="fc-wrapper [&_.fc-daygrid-day]:cursor-pointer [&_.fc-daygrid-day-number]:text-xs [&_.fc-daygrid-day-number]:text-gray-600 dark:[&_.fc-daygrid-day-number]:text-gray-300 [&_.fc-col-header-cell-cushion]:text-xs [&_.fc-col-header-cell-cushion]:font-semibold [&_.fc-col-header-cell-cushion]:text-gray-500 dark:[&_.fc-col-header-cell-cushion]:text-gray-400 [&_.fc-toolbar-title]:text-sm [&_.fc-toolbar-title]:font-bold [&_.fc-toolbar-title]:text-gray-700 dark:[&_.fc-toolbar-title]:text-gray-200">
          <FullCalendar
            key={`${selectedYear}-${selectedMonth}`}
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            initialDate={`${selectedYear}-${String(selectedMonth + 1).padStart(2, "0")}-01`}
            events={events}
            height="auto"
            headerToolbar={{ left: "", center: "title", right: "" }}
            dateClick={handleDateClick}
            eventContent={(arg) =>
              arg.event.title ? (
                <div className="text-center text-base leading-none pt-0.5 pointer-events-none select-none">
                  {arg.event.title}
                </div>
              ) : null
            }
          />
        </div>

        <p className="mt-3 text-center text-xs text-gray-400 dark:text-gray-500">
          💡 Click any date to view details or mark attendance
        </p>
      </div>

      {/* ── Modal: view record ──────────────────────────────────────────────── */}
      {modalData && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setModalData(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700 animate-scaleIn" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Attendance Record</h3>
                <p className="text-xs text-gray-400 mt-0.5">{modalData.employee?.name} • {modalData.date}</p>
              </div>
              <button onClick={() => setModalData(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none">×</button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <InfoCard label="Status" value={modalData.status} color={modalData.status === "Present" ? "green" : modalData.status === "Leave" ? "yellow" : "red"} icon={<FaCheckCircle />} />
              <InfoCard label="Total Hours" value={modalData.workingHours} color="blue" icon={<FaClock />} />
              <InfoCard label="Clock In" value={modalData.clockIn} color="green" icon={<FaRegClock />} />
              <InfoCard label="Clock Out" value={modalData.clockOut} color="red" icon={<FaRegClock />} />
            </div>

            <button
              onClick={() => { setModalData(null); setMarkModalData({ date: modalData.date, employee: modalData.employee }); setShowMarkModal(true); }}
              className="w-full py-2 border-2 border-[#0C2B4E] dark:border-blue-500 text-[#0C2B4E] dark:text-blue-400 text-sm font-semibold rounded-lg hover:bg-[#0C2B4E] hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-colors"
            >
              Override Status
            </button>
          </div>
        </div>
      )}

      {/* ── Modal: mark attendance ──────────────────────────────────────────── */}
      {showMarkModal && markModalData && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-gray-200 dark:border-gray-700 animate-scaleIn">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Mark Attendance</h3>
            <p className="text-xs text-gray-400 mb-1">{markModalData.employee?.name} • {markModalData.date}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">Select the attendance status for this date:</p>

            <div className="flex flex-col gap-2.5">
              {[
                { status: "Present", bg: "bg-green-500 hover:bg-green-600", icon: <FaCheckCircle /> },
                { status: "Absent",  bg: "bg-red-500 hover:bg-red-600",   icon: <FaTimesCircle /> },
                { status: "Leave",   bg: "bg-yellow-500 hover:bg-yellow-600", icon: <FaCoffee /> },
              ].map(({ status, bg, icon }) => (
                <button
                  key={status}
                  onClick={() => handleMarkAttendance(status)}
                  disabled={marking}
                  className={`${bg} text-white py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60 transition-colors`}
                >
                  {icon} {marking ? "Saving…" : status}
                </button>
              ))}
              <button
                onClick={() => { setShowMarkModal(false); setMarkModalData(null); }}
                disabled={marking}
                className="py-2 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-sm font-semibold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes scaleIn { from { opacity:0; transform:scale(0.92); } to { opacity:1; transform:scale(1); } }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   Sub-components
───────────────────────────────────────────────────────────────────────────── */
const colorMap = {
  green:  { bg: "bg-green-50 dark:bg-green-900/20",  text: "text-green-700 dark:text-green-300",  badge: "bg-green-100 dark:bg-green-900/40" },
  red:    { bg: "bg-red-50 dark:bg-red-900/20",      text: "text-red-600 dark:text-red-400",      badge: "bg-red-100 dark:bg-red-900/40" },
  yellow: { bg: "bg-yellow-50 dark:bg-yellow-900/20",text: "text-yellow-600 dark:text-yellow-400",badge: "bg-yellow-100 dark:bg-yellow-900/40" },
  blue:   { bg: "bg-blue-50 dark:bg-blue-900/20",    text: "text-blue-600 dark:text-blue-400",    badge: "bg-blue-100 dark:bg-blue-900/40" },
};

const StatCard = ({ title, value, icon, color }) => {
  const c = colorMap[color] || colorMap.blue;
  return (
    <div className={`${c.bg} rounded-2xl p-4 flex items-center gap-4 border border-transparent`}>
      <div className={`${c.text} ${c.badge} p-3 rounded-xl text-lg`}>{icon}</div>
      <div>
        <p className={`text-2xl font-bold ${c.text}`}>{value}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{title}</p>
      </div>
    </div>
  );
};

const InfoCard = ({ label, value, color, icon }) => {
  const c = colorMap[color] || colorMap.blue;
  return (
    <div className={`${c.bg} rounded-xl p-3 flex flex-col items-center gap-1`}>
      <span className={`${c.text} text-lg`}>{icon}</span>
      <p className={`text-sm font-bold ${c.text}`}>{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
};

const Badge = ({ color, icon, value }) => {
  const c = colorMap[color] || colorMap.blue;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${c.badge} ${c.text}`}>
      {icon} {value}
    </span>
  );
};

export default AdminAttendance;