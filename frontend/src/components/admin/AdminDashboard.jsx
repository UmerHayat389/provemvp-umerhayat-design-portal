// src/components/admin/AdminDashboard.jsx
import React, { useEffect, useState, useCallback } from "react";
import { FaUsers, FaBuilding, FaMoneyBillWave, FaCalendarAlt } from "react-icons/fa";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  LineElement, PointElement, ArcElement, Tooltip, Legend,
} from "chart.js";
import { useTheme } from "../../context/ThemeContext";
import { dashboardAPI } from "../../services/api";
import useSocket from "../../hooks/useSocket";

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Tooltip, Legend);

// ─── pulse animation for live indicator ──────────────────────────────────────
const LiveBadge = () => (
  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-400">
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
    </span>
    Live
  </span>
);

const AdminDashboard = () => {
  const { isDark } = useTheme();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // ── state ──────────────────────────────────────────────────────────────────
  const [stats, setStats]       = useState({ employees: 0, present: 0, leaves: 0, salary: '$0' });
  const [deptData, setDeptData] = useState([]);
  const [salaryData, setSalaryData] = useState({ labels: [], received: [], pending: [] });
  const [empProjects, setEmpProjects] = useState([]);
  const [empAttendance, setEmpAttendance] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  // ── socket ─────────────────────────────────────────────────────────────────
  const socket = useSocket(user._id);

  // ── fetch dashboard data ───────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const { data } = await dashboardAPI.getAdminStats();

      setStats({
        employees: data.stats?.employees ?? 0,
        present:   data.stats?.present   ?? 0,
        leaves:    data.stats?.leaves    ?? 0,
        salary:    data.stats?.salary    ?? '$0',
      });

      setDeptData(data.departments ?? []);
      setSalaryData(data.salaryByMonth ?? { labels: [], received: [], pending: [] });
      setEmpProjects(data.employeeProjects ?? []);
      setEmpAttendance(data.employeeAttendance ?? []);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('AdminDashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // initial load
  useEffect(() => { fetchData(); }, [fetchData]);

  // ── real-time: re-fetch on any relevant event ──────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const refresh = () => fetchData();

    socket.on('attendance:update',  refresh);
    socket.on('leave:update',       refresh);
    socket.on('project:update',     refresh);
    socket.on('user:update',        refresh);
    socket.on('dashboard:refresh',  refresh);

    return () => {
      socket.off('attendance:update',  refresh);
      socket.off('leave:update',       refresh);
      socket.off('project:update',     refresh);
      socket.off('user:update',        refresh);
      socket.off('dashboard:refresh',  refresh);
    };
  }, [socket, fetchData]);

  // ── chart helpers ──────────────────────────────────────────────────────────
  const deptNames   = deptData.map(d => d.name);
  const deptValues  = deptData.map(d => d.value);
  const empNames    = empProjects.map(e => e.name);

  const departmentChart = {
    labels: deptNames,
    datasets: [{
      data: deptValues,
      backgroundColor: ["#3B82F6","#EC4899","#FACC15","#22C55E","#F97316","#8B5CF6"],
      borderWidth: 0,
    }],
  };

  const salaryChart = {
    labels: salaryData.labels,
    datasets: [
      { label: "Received", data: salaryData.received, backgroundColor: "#4F46E5" },
      { label: "Pending",  data: salaryData.pending,  backgroundColor: "#F59E0B" },
    ],
  };

  const projectChart = {
    labels: empNames,
    datasets: [
      {
        label: "Assigned",
        data: empProjects.map(e => e.projectsAssigned),
        borderColor: "#6366F1", backgroundColor: "rgba(99,102,241,0.2)", tension: 0.4, fill: true,
      },
      {
        label: "Completed",
        data: empProjects.map(e => e.projectsCompleted),
        borderColor: "#22C55E", backgroundColor: "rgba(34,197,94,0.2)", tension: 0.4, fill: true,
      },
    ],
  };

  const attendanceChart = {
    labels: empAttendance.map(e => e.name),
    datasets: [
      { label: "Present", data: empAttendance.map(e => e.present), backgroundColor: "rgba(34,197,94,0.8)"  },
      { label: "Leave",   data: empAttendance.map(e => e.leave),   backgroundColor: "rgba(234,179,8,0.5)"  },
      { label: "Absent",  data: empAttendance.map(e => e.absent),  backgroundColor: "rgba(239,68,68,0.5)"  },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
        labels: { color: isDark ? "#E5E7EB" : "#374151", font: { size: 12 } },
      },
      tooltip: {
        enabled: true,
        backgroundColor: isDark ? "#1F2937" : "#FFFFFF",
        titleColor:      isDark ? "#F9FAFB"  : "#111827",
        bodyColor:       isDark ? "#E5E7EB"  : "#374151",
        borderColor:     isDark ? "#374151"  : "#E5E7EB",
        borderWidth: 1,
      },
    },
    scales: {
      x: { ticks: { color: isDark ? "#9CA3AF" : "#6B7280" }, grid: { color: isDark ? "#374151" : "#E5E7EB" } },
      y: { ticks: { color: isDark ? "#9CA3AF" : "#6B7280" }, grid: { color: isDark ? "#374151" : "#E5E7EB" } },
    },
    animation: { duration: 800, easing: "easeOutQuart" },
  };

  const doughnutOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
        labels: { color: isDark ? "#E5E7EB" : "#374151", font: { size: 12 } },
      },
    },
    animation: { duration: 800, easing: "easeOutQuart" },
  };

  const statCards = [
    { title: "Employees", value: stats.employees, icon: <FaUsers />,         bg: "bg-teal-500"   },
    { title: "Present",   value: stats.present,   icon: <FaBuilding />,      bg: "bg-purple-700" },
    { title: "Leaves",    value: stats.leaves,    icon: <FaCalendarAlt />,   bg: "bg-orange-500" },
    { title: "Salary",    value: stats.salary,    icon: <FaMoneyBillWave />, bg: "bg-green-500"  },
  ];

  const cardCls = "p-4 rounded-xl shadow-sm bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700";
  const cardTitle = "text-xs font-bold uppercase tracking-wide mb-3 text-gray-500 dark:text-gray-400";

  const compactChartOpts = {
    ...chartOptions,
    maintainAspectRatio: false,
    plugins: {
      ...chartOptions.plugins,
      legend: {
        position: "top",
        labels: { color: isDark ? "#E5E7EB" : "#374151", font: { size: 10 }, boxWidth: 10, padding: 8 },
      },
    },
    scales: {
      x: { ticks: { color: isDark ? "#9CA3AF" : "#6B7280", font: { size: 9 } }, grid: { color: isDark ? "#2d3748" : "#f0f0f0" } },
      y: { ticks: { color: isDark ? "#9CA3AF" : "#6B7280", font: { size: 9 } }, grid: { color: isDark ? "#2d3748" : "#f0f0f0" } },
    },
  };

  const compactDoughnutOpts = {
    ...doughnutOptions,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: { color: isDark ? "#E5E7EB" : "#374151", font: { size: 10 }, boxWidth: 10, padding: 8 },
      },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 dark:text-gray-400 text-sm">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-950 transition-colors duration-300 p-4">
      <div className="space-y-4 animate-fadeIn">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <h1 className="text-base font-bold text-gray-900 dark:text-gray-100">Admin Dashboard</h1>
          <LiveBadge />
        </div>

        {/* ── STAT CARDS ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map((card, i) => (
            <div key={i} className={`${card.bg} text-white px-4 py-3 rounded-xl flex justify-between items-center`}>
              <div>
                <p className="text-[11px] opacity-80 font-medium">{card.title}</p>
                <h2 className="text-lg font-bold mt-0.5">{card.value}</h2>
              </div>
              <div className="text-lg bg-white/20 p-2 rounded-lg">{card.icon}</div>
            </div>
          ))}
        </div>

        {/* ── ALL 4 CHARTS in 2x2 grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className={cardCls}>
            <h3 className={cardTitle}>Employees By Department</h3>
            <div style={{ height: '190px' }}>
              {deptData.length > 0
                ? <Doughnut data={departmentChart} options={compactDoughnutOpts} />
                : <p className="text-xs text-gray-400 text-center pt-16">No department data</p>
              }
            </div>
          </div>
          <div className={cardCls}>
            <h3 className={cardTitle}>Salary By Month</h3>
            <div style={{ height: '190px' }}>
              {salaryData.labels.length > 0
                ? <Bar data={salaryChart} options={compactChartOpts} />
                : <p className="text-xs text-gray-400 text-center pt-16">No salary data</p>
              }
            </div>
          </div>
          <div className={cardCls}>
            <h3 className={cardTitle}>Projects — Assigned vs Completed</h3>
            <div style={{ height: '190px' }}>
              {empProjects.length > 0
                ? <Line data={projectChart} options={compactChartOpts} />
                : <p className="text-xs text-gray-400 text-center pt-16">No project data</p>
              }
            </div>
          </div>
          <div className={cardCls}>
            <h3 className={cardTitle}>Attendance Overview</h3>
            <div style={{ height: '190px' }}>
              {empAttendance.length > 0
                ? <Bar data={attendanceChart} options={compactChartOpts} />
                : <p className="text-xs text-gray-400 text-center pt-16">No attendance data</p>
              }
            </div>
          </div>
        </div>

      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0);   }
        }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
      `}</style>
    </div>
  );
};

export default AdminDashboard;