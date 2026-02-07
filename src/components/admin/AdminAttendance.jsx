import React, { useState, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { attendanceData } from "../../data/attendanceData";
import { FaClock, FaUsers, FaUserTimes, FaRegClock } from "react-icons/fa";

const AdminAttendance = () => {
  const [calendarView, setCalendarView] = useState("dayGridMonth");
  const [selectedEmployee, setSelectedEmployee] = useState(
    attendanceData.employees[0].name
  );
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [modalData, setModalData] = useState(null); // for modal

  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December"
  ];

  // =========================
  // Calendar Events
  // =========================
  const events = useMemo(() => {
    const bgEvents = [];
    const emojiEvents = [];

    const employee = attendanceData.employees.find(
      (emp) => emp.name === selectedEmployee
    );

    if (!employee) return [];

    employee.attendanceLogs.forEach((log) => {
      const d = new Date(log.date);

      if (d.getFullYear() === selectedYear && d.getMonth() === selectedMonth) {
        let bg = "";
        let emoji = "";

        if (log.status === "Present") {
          bg = "rgba(34,197,94,0.35)";
          emoji = "✅";
        } else if (log.status === "Leave") {
          bg = "rgba(234,179,8,0.35)";
          emoji = "🟡";
        } else if (log.status === "Absent") {
          bg = "rgba(239,68,68,0.35)";
          emoji = "❌";
        }

        // Background
        bgEvents.push({
          start: log.date,
          display: "background",
          backgroundColor: bg,
        });

        // Emoji + employee name
        emojiEvents.push({
          start: log.date,
          title: emoji,
          allDay: true,
           backgroundColor: "transparent",
              borderColor: "transparent",
          display: "auto",
        });
      }
    });

    return [...bgEvents, ...emojiEvents];
  }, [selectedEmployee, selectedYear, selectedMonth]);

  const { stats } = attendanceData;

  const topCards = [
    {
      title: "Total Hours",
      value: stats.totalMonthHours,
      icon: <FaClock size={20} className="text-blue-600" />,
      color: "text-blue-600",
    },
    {
      title: "Present Days",
      value: stats.presentDays,
      icon: <FaUsers size={20} className="text-green-600" />,
      color: "text-green-600",
    },
    {
      title: "Absent / Leave",
      value: stats.absentOrLeaveDays,
      icon: <FaUserTimes size={20} className="text-red-500" />,
      color: "text-red-500",
    },
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  // Handle date click to show modal
  const handleDateClick = (info) => {
    const dateStr = info.dateStr;
    const employee = attendanceData.employees.find(
      (emp) => emp.name === selectedEmployee
    );
    const log = employee.attendanceLogs.find((l) => l.date === dateStr);

    setModalData({
      date: dateStr,
      employee: employee,
      log: log,
      workingHours: "8h 36m", // dummy
      productiveHours: "8h 36m",
      breakHours: "22m 15s",
      overtime: "2h 15m",
    });
  };

  return (
    <div className="p-6 space-y-6">

      {/* TOP CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {topCards.map((card, i) => (
          <div key={i} className="bg-white rounded-xl shadow-md p-6 flex items-center gap-4">
            <div className="p-3 rounded-full bg-gray-100">{card.icon}</div>
            <div>
              <h2 className={`text-2xl font-bold ${card.color}`}>{card.value}</h2>
              <p className="text-sm text-gray-500">{card.title}</p>
            </div>
          </div>
        ))}
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex flex-wrap gap-3 items-center mb-4 justify-between">
          <h3 className="text-lg font-semibold">Attendance Calendar</h3>
          <div className="flex flex-wrap gap-2 items-center">
            <select
              className="border border-gray-300 rounded-lg p-2"
              value={selectedEmployee}
              onChange={(e) => setSelectedEmployee(e.target.value)}
            >
              {attendanceData.employees.map((emp) => (
                <option key={emp.id} value={emp.name}>{emp.name}</option>
              ))}
            </select>
            <select
              className="border border-gray-300 rounded-lg p-2"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select
              className="border border-gray-300 rounded-lg p-2"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* FULL CALENDAR */}
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin, listPlugin]}
          initialView={calendarView}
          events={events}
          height="auto"
          headerToolbar={{ left: "", center: "title", right: "" }}
          dateClick={handleDateClick}
          eventContent={(arg) => (
            <div style={{ position: "relative", width: "100%", height: "100%" }}>
              <div
                style={{
                  position: "absolute",
                  top: "2px",
                  left: "2px",
                  fontSize: "12px",
                  fontWeight: 600,
                  display: "flex",
                  gap: "2px",
                  pointerEvents: "none",
                  background: "transparent",
                  opacity: 1,
                }}
              >
                <span>{arg.event.title}</span>
                <span className="text-gray-700">{arg.event.extendedProps.employeeName}</span>
              </div>
            </div>
          )}
        />
      </div>

      {/* ===== MODAL ===== */}
      {modalData && (
        <div className="fixed inset-0   bg-black/30 backdrop-blur-md flex justify-center items-center z-50 p-4 border-black">
          <div className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-4xl relative animate-fadeIn">
            
            {/* Close Button */}
            <button
              onClick={() => setModalData(null)}
              className="absolute top-4 right-4 bg-[#E7000B] hover:bg-[#E7000B] text-white hover:text-green-100 rounded-full p-2 transition-colors"
            >
              &times;
            </button>

            {/* Profile + Date */}
            <div className="flex items-center gap-4 mb-6">
              <img
                src={modalData.employee.profile || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRSA5JQjt0s4bWoMQWoSuxKQjer-ZDZ66e21A&s"}
                alt={modalData.employee.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-blue-500"
              />
              <div>
                <h2 className="text-2xl font-bold">{modalData.employee.name}</h2>
                <p className="text-gray-500">{modalData.employee.role}</p>
                <p className="text-gray-400 text-sm">{modalData.date}</p>
              </div>
            </div>

            {/* Top cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-xl flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow-md transition">
                <FaClock className="text-blue-600 text-2xl" />
                <p className="text-sm text-blue-700 font-semibold">Total Hours</p>
                <p className="text-lg font-bold text-blue-800">{modalData.workingHours}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-xl flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow-md transition">
                <FaUsers className="text-green-600 text-2xl" />
                <p className="text-sm text-green-700 font-semibold">Productive Hours</p>
                <p className="text-lg font-bold text-green-800">{modalData.productiveHours}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-xl flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow-md transition">
                <FaRegClock className="text-yellow-500 text-2xl" />
                <p className="text-sm text-yellow-700 font-semibold">Break Hours</p>
                <p className="text-lg font-bold text-yellow-800">{modalData.breakHours}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-xl flex flex-col items-center justify-center gap-2 shadow-sm hover:shadow-md transition">
                <FaUserTimes className="text-red-500 text-2xl" />
                <p className="text-sm text-red-700 font-semibold">Overtime</p>
                <p className="text-lg font-bold text-red-800">{modalData.overtime}</p>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200 text-center">
                <thead className="bg-gray-100">
                  <tr>
                    {["Check In","Status","Check Out","Break","Late","Overtime","Production Hours"].map((th, i) => (
                      <th key={i} className="px-4 py-2 text-gray-600 font-semibold">{th}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr className="hover:bg-gray-50 transition">
                    <td className="px-4 py-2">09:00 AM</td>
                    <td className="px-4 py-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold 
                        ${modalData.log.status === "Present" ? "bg-green-100 text-green-700" :
                          modalData.log.status === "Leave" ? "bg-yellow-100 text-yellow-700" :
                          "bg-red-100 text-red-700"}`}>
                        {modalData.log.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">06:45 PM</td>
                    <td className="px-4 py-2">30 Min</td>
                    <td className="px-4 py-2">32 Min</td>
                    <td className="px-4 py-2">20 Min</td>
                    <td className="px-4 py-2">8.55 Hrs</td>
                  </tr>
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAttendance;