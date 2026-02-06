import React from "react";
import {
  FaUsers,
  FaBuilding,
  FaMoneyBillWave,
  FaCalendarAlt,
} from "react-icons/fa";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

import { dashboardData } from "../../data/dashboardData";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Tooltip,
  Legend
);

const AdminDashboard = () => {
  /* =======================
     STAT CARDS CONFIG
  ======================= */
  const statCards = [
    {
      title: "Employees",
      value: dashboardData.stats.employees,
      icon: <FaUsers />,
      bg: "bg-teal-500",
    },
    {
      title: "Present",
      value: dashboardData.stats.present,
      icon: <FaBuilding />,
      bg: "bg-purple-700",
    },
    {
      title: "Leaves",
      value: dashboardData.stats.leaves,
      icon: <FaCalendarAlt />,
      bg: "bg-orange-500",
    },
    {
      title: "Salary",
      value: dashboardData.stats.salary,
      icon: <FaMoneyBillWave />,
      bg: "bg-green-500",
    },
  ];

  /* =======================
     CHART DATA
  ======================= */

  const departmentChart = {
    labels: dashboardData.departments.map((d) => d.name),
    datasets: [
      {
        data: dashboardData.departments.map((d) => d.value),
        backgroundColor: ["#3B82F6", "#EC4899", "#FACC15", "#22C55E"],
        borderWidth: 0,
      },
    ],
  };

  const salaryChart = {
    labels: dashboardData.salaryByMonth.labels,
    datasets: [
      {
        label: "Received",
        data: dashboardData.salaryByMonth.received,
        backgroundColor: "#4F46E5",
      },
      {
        label: "Pending",
        data: dashboardData.salaryByMonth.pending,
        backgroundColor: "#F59E0B",
      },
    ],
  };

  const projectChart = {
    labels: dashboardData.employees.map((e) => e.name),
    datasets: [
      {
        label: "Assigned",
        data: dashboardData.employees.map((e) => e.projectsAssigned),
        borderColor: "#6366F1",
        backgroundColor: "rgba(99,102,241,0.2)",
        tension: 0.4, // makes line smooth
        fill: true,
      },
      {
        label: "Completed",
        data: dashboardData.employees.map((e) => e.projectsCompleted),
        borderColor: "#22C55E",
        backgroundColor: "rgba(34,197,94,0.2)",
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const attendanceChart = {
    labels: dashboardData.employees.map((e) => e.name),
    datasets: [
      {
        label: "Present",
        data: dashboardData.employees.map((e) => e.attendance.present),
        backgroundColor: "rgba(34,197,94,0.8)",
      },
      {
        label: "Leave",
        data: dashboardData.employees.map((e) => e.attendance.leave),
        backgroundColor: "rgba(234,179,8,0.5)",
      },
      {
        label: "Absent",
        data: dashboardData.employees.map((e) => e.attendance.absent),
        backgroundColor: "rgba(239,68,68,0.5)",
      },
    ],
  };

  /* =======================
     CHART OPTIONS WITH ANIMATION
  ======================= */
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      tooltip: { enabled: true },
    },
    animation: {
      duration: 1500, // 1.5 seconds animation
      easing: "easeOutQuart",
    },
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* =======================
          STAT CARDS
      ======================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, i) => (
          <div
            key={i}
            className={`${card.bg} text-white p-5 rounded-xl shadow-lg flex justify-between items-center transform hover:scale-105 transition-all`}
          >
            <div>
              <p className="text-sm opacity-90">{card.title}</p>
              <h2 className="text-2xl font-bold">{card.value}</h2>
            </div>
            <div className="text-3xl bg-white/20 p-3 rounded-lg">{card.icon}</div>
          </div>
        ))}
      </div>

      {/* =======================
          CHARTS ROW 1
      ======================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl shadow">
          <h3 className="font-semibold mb-4">Total Employees By Department</h3>
          <Doughnut data={departmentChart} options={chartOptions} />
        </div>

        <div className="bg-white p-5 rounded-xl shadow">
          <h3 className="font-semibold mb-4">Total Salary By Month</h3>
          <Bar data={salaryChart} options={chartOptions} />
        </div>
      </div>

      {/* =======================
          CHARTS ROW 2
      ======================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-5 rounded-xl shadow">
          <h3 className="font-semibold mb-4">
            Employee Projects (Assigned vs Completed)
          </h3>
          <Line data={projectChart} options={chartOptions} />
        </div>

        <div className="bg-white p-5 rounded-xl shadow">
          <h3 className="font-semibold mb-4">Employee Attendance Overview</h3>
          <Bar data={attendanceChart} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
