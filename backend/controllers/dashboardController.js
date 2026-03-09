// backend/controllers/dashboardController.js
const User       = require('../models/User');
const Attendance = require('../models/Attendance');
const Leave      = require('../models/Leave');
const Project    = require('../models/Project');

// ─── helpers ─────────────────────────────────────────────────────────────────

const startOfDay = (d = new Date()) => {
  const s = new Date(d);
  s.setHours(0, 0, 0, 0);
  return s;
};

const endOfDay = (d = new Date()) => {
  const e = new Date(d);
  e.setHours(23, 59, 59, 999);
  return e;
};

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// ─── Admin dashboard ──────────────────────────────────────────────────────────
exports.adminStats = async (req, res) => {
  try {
    const today = new Date();

    // ── 1. Basic counts ──────────────────────────────────────────────────────
    const totalEmployees = await User.countDocuments({ role: 'Employee', isActive: true });

    const presentToday = await Attendance.countDocuments({
      date:   { $gte: startOfDay(today), $lte: endOfDay(today) },
      status: 'Present',
    });

    const pendingLeaves = await Leave.countDocuments({ status: 'Pending' });

    // Total salary of all active employees
    const salaryAgg = await User.aggregate([
      { $match: { role: 'Employee', isActive: true } },
      { $group: { _id: null, total: { $sum: '$salary' } } },
    ]);
    const totalSalary = salaryAgg[0]?.total ?? 0;
    const salaryFormatted =
      totalSalary >= 1_000_000
        ? `$${(totalSalary / 1_000_000).toFixed(1)}M`
        : totalSalary >= 1_000
        ? `$${(totalSalary / 1_000).toFixed(1)}K`
        : `$${totalSalary}`;

    // ── 2. Departments breakdown ──────────────────────────────────────────────
    const deptAgg = await User.aggregate([
      { $match: { role: 'Employee', isActive: true } },
      { $group: { _id: '$department', value: { $sum: 1 } } },
      { $project: { _id: 0, name: { $ifNull: ['$_id', 'Unknown'] }, value: 1 } },
    ]);

    // ── 3. Salary by month (last 9 months) ────────────────────────────────────
    const employees = await User.find({ role: 'Employee', isActive: true }).select('salary');
    const monthlyReceived = [];
    const monthlyPending  = [];
    const monthlyLabels   = [];

    for (let i = 8; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      monthlyLabels.push(MONTH_LABELS[d.getMonth()]);

      // Count how many employees have approved leaves that month (simplistic — received = paid)
      const received = employees.reduce((s, e) => s + (e.salary ?? 0), 0);
      const pending  = Math.round(received * 0.15); // example: 15% pending
      monthlyReceived.push(Math.round(received / 10000)); // scale for chart
      monthlyPending.push(Math.round(pending  / 10000));
    }

    // ── 4. Per-employee project & attendance data ─────────────────────────────
    const allEmployees = await User.find({ role: 'Employee', isActive: true }).select('name department');

    const employeeProjects   = [];
    const employeeAttendance = [];

    for (const emp of allEmployees) {
      // Projects
      const assigned  = await Project.countDocuments({ 'team.userId': emp._id });
      const completed = await Project.countDocuments({ 'team.userId': emp._id, status: 'Completed' });

      employeeProjects.push({
        name:               emp.name,
        projectsAssigned:   assigned,
        projectsCompleted:  completed,
      });

      // Attendance (last 30 days)
      const since30 = new Date(today);
      since30.setDate(since30.getDate() - 30);

      const [present, leave, absent] = await Promise.all([
        Attendance.countDocuments({ userId: emp._id, date: { $gte: since30 }, status: 'Present' }),
        Attendance.countDocuments({ userId: emp._id, date: { $gte: since30 }, status: 'Leave'   }),
        Attendance.countDocuments({ userId: emp._id, date: { $gte: since30 }, status: 'Absent'  }),
      ]);

      employeeAttendance.push({ name: emp.name, present, leave, absent });
    }

    // ── 5. Respond ────────────────────────────────────────────────────────────
    res.json({
      stats: {
        employees: totalEmployees,
        present:   presentToday,
        leaves:    pendingLeaves,
        salary:    salaryFormatted,
      },
      departments: deptAgg,
      salaryByMonth: {
        labels:   monthlyLabels,
        received: monthlyReceived,
        pending:  monthlyPending,
      },
      employeeProjects,
      employeeAttendance,
    });
  } catch (err) {
    console.error('adminStats error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// ─── Employee dashboard ───────────────────────────────────────────────────────
exports.employeeStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const today  = new Date();

    // ── Project counts ────────────────────────────────────────────────────────
    const myProjects = await Project.find({ 'team.userId': userId });

    const total      = myProjects.length;
    const completed  = myProjects.filter(p => p.status === 'Completed').length;
    const inProgress = myProjects.filter(p => p.status === 'In Progress').length;
    const pending    = myProjects.filter(p => ['Not Started','Delayed','On Hold'].includes(p.status)).length;

    // ── Weekly activity (Mon–Fri of current week) ─────────────────────────────
    const DAY_NAMES = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const weeklyActivity = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - today.getDay() + i);

      const dayProjects = myProjects.filter(p => {
        const updated = new Date(p.updatedAt);
        return updated >= startOfDay(d) && updated <= endOfDay(d);
      });

      weeklyActivity.push({
        name:       DAY_NAMES[i],
        completed:  dayProjects.filter(p => p.status === 'Completed').length,
        inProgress: dayProjects.filter(p => p.status === 'In Progress').length,
      });
    }

    // ── Task distribution (across all my tasks in all projects) ───────────────
    let taskCounts = { 'Done': 0, 'In Progress': 0, 'To Do': 0, 'Blocked': 0 };

    for (const project of myProjects) {
      const member = project.team.find(m => String(m.userId) === String(userId));
      if (!member) continue;
      for (const task of member.tasks ?? []) {
        if (taskCounts[task.status] !== undefined) taskCounts[task.status]++;
      }
    }

    const taskDistribution = [
      { name: 'Completed',  value: taskCounts['Done'],        color: '#10b981' },
      { name: 'In Progress',value: taskCounts['In Progress'], color: '#f59e0b' },
      { name: 'Pending',    value: taskCounts['To Do'],       color: '#ef4444' },
      { name: 'Blocked',    value: taskCounts['Blocked'],     color: '#8b5cf6' },
    ].filter(t => t.value > 0);

    res.json({
      stats: { total, completed, inProgress, pending },
      weeklyActivity,
      taskDistribution,
    });
  } catch (err) {
    console.error('employeeStats error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};