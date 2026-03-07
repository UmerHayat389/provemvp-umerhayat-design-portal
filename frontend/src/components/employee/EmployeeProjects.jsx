// src/components/employee/EmployeeProjects.jsx
// ─────────────────────────────────────────────────────────────────────────────
// FIX: Employees CANNOT call PUT /projects/:id  (admin-only → 403 error)
//      Employees must call PUT /projects/:id/task  with { taskId, status }
//      Project data includes myMember.tasks[] — displayed and updated here.
// ─────────────────────────────────────────────────────────────────────────────
import React, { useState, useEffect, useCallback } from 'react';
import { projectAPI } from '../../services/api';
import socketService from '../../services/socketService';
import { toast } from 'react-toastify';
import {
  Briefcase, X, Clock, CheckCircle, AlertTriangle,
  Calendar, User, FileText, ChevronRight, Flag,
  ListChecks, Circle, PlayCircle, Ban,
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const isProjectDelayed = (p) =>
  p.status !== 'Completed' && new Date() > new Date(p.deadline);

const daysLeft = (deadline, status) => {
  if (status === 'Completed') return null;
  return Math.ceil((new Date(deadline) - new Date()) / 86400000);
};

const PROJ_STATUS = {
  'Completed':   { dot: '#10b981', bar: '#10b981', pill: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  'In Progress': { dot: '#3b82f6', bar: '#3b82f6', pill: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  'Not Started': { dot: '#94a3b8', bar: '#94a3b8', pill: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400' },
  'Delayed':     { dot: '#ef4444', bar: '#ef4444', pill: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400' },
  'On Hold':     { dot: '#f59e0b', bar: '#f59e0b', pill: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
};
const getProjStatus = (p) => {
  const key = isProjectDelayed(p) ? 'Delayed' : p.status;
  return { key, ...(PROJ_STATUS[key] || PROJ_STATUS['Not Started']) };
};

const TASK_STATUS = {
  'To Do':       { label: 'To Do',       Icon: Circle,       cls: 'text-slate-400',   bg: 'bg-slate-50 dark:bg-slate-800/60',        border: 'border-slate-200 dark:border-slate-700'      },
  'In Progress': { label: 'In Progress', Icon: PlayCircle,   cls: 'text-blue-500',    bg: 'bg-blue-50 dark:bg-blue-900/20',          border: 'border-blue-200 dark:border-blue-800'        },
  'Done':        { label: 'Done',        Icon: CheckCircle,  cls: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20',    border: 'border-emerald-200 dark:border-emerald-800'  },
  'Blocked':     { label: 'Blocked',     Icon: Ban,          cls: 'text-red-500',     bg: 'bg-red-50 dark:bg-red-900/20',            border: 'border-red-200 dark:border-red-800'          },
};

const PRIORITY_CLS = {
  High:   'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
  Medium: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
  Low:    'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
};

const STAT_CFG = [
  { key: 'total',      label: 'Total',       Icon: Briefcase,     from: '#1e3a5f', to: '#0f2a4a' },
  { key: 'completed',  label: 'Completed',   Icon: CheckCircle,   from: '#065f46', to: '#047857' },
  { key: 'inProgress', label: 'In Progress', Icon: Clock,         from: '#1e3a8a', to: '#1d4ed8' },
  { key: 'delayed',    label: 'Delayed',     Icon: AlertTriangle, from: '#7f1d1d', to: '#b91c1c' },
];

// Valid next statuses for each task status
const TASK_ACTIONS = {
  'To Do':       [{ next: 'In Progress', label: 'Start',   cls: 'bg-blue-600 hover:bg-blue-700 text-white' }],
  'In Progress': [{ next: 'Done',        label: 'Done',    cls: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
                  { next: 'Blocked',     label: 'Blocked', cls: 'bg-red-500 hover:bg-red-600 text-white' }],
  'Blocked':     [{ next: 'In Progress', label: 'Resume',  cls: 'bg-blue-600 hover:bg-blue-700 text-white' }],
  'Done':        [{ next: 'In Progress', label: 'Reopen',  cls: 'bg-slate-500 hover:bg-slate-600 text-white' }],
};

// ─── Stat Card ────────────────────────────────────────────────────────────────

const StatCard = ({ cfg, value, i }) => (
  <div
    className="relative overflow-hidden rounded-2xl p-5 text-white"
    style={{
      background: `linear-gradient(135deg, ${cfg.from}, ${cfg.to})`,
      boxShadow: `0 4px 20px -4px ${cfg.from}99`,
      animation: `rise .45s cubic-bezier(.22,1,.36,1) ${i * 0.07}s both`,
    }}
  >
    <p className="text-[11px] font-semibold tracking-widest uppercase text-white/60 mb-2">{cfg.label}</p>
    <p className="text-5xl font-black leading-none mb-3">{value}</p>
    <div className="absolute top-3 right-3 opacity-15">
      <cfg.Icon size={56} strokeWidth={1.2} />
    </div>
    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
      <div className="h-full bg-white/40 rounded-full" style={{ width: value > 0 ? '55%' : '0%', transition: 'width .8s ease' }} />
    </div>
  </div>
);

// ─── Task Row ─────────────────────────────────────────────────────────────────

const TaskRow = ({ task, projectId, onTaskUpdate, updatingTask }) => {
  const cfg = TASK_STATUS[task.status] || TASK_STATUS['To Do'];
  const actions = TASK_ACTIONS[task.status] || [];
  const busy = updatingTask === task._id;

  return (
    <div className={`rounded-xl border p-3.5 transition-all ${cfg.bg} ${cfg.border}`}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <cfg.Icon size={14} className={`flex-shrink-0 ${cfg.cls}`} />
          <span className="text-[13px] font-semibold text-slate-800 dark:text-white truncate">{task.title}</span>
        </div>
        <span className={`flex-shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.cls} bg-white/60 dark:bg-black/20 border ${cfg.border}`}>
          {cfg.label}
        </span>
      </div>

      {task.description && (
        <p className="text-[12px] text-slate-500 dark:text-slate-400 mb-2.5 ml-5 leading-relaxed">{task.description}</p>
      )}

      <div className="flex items-center justify-between ml-5 gap-2">
        <div className="flex items-center gap-2 text-[11px] text-slate-400 flex-wrap">
          {task.priority && (
            <span className={`px-1.5 py-0.5 rounded-md border text-[10px] font-semibold ${PRIORITY_CLS[task.priority] || ''}`}>
              {task.priority}
            </span>
          )}
          {task.deadline && (
            <span className="flex items-center gap-1">
              <Calendar size={10} />
              {new Date(task.deadline).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
            </span>
          )}
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          {actions.map(a => (
            <button
              key={a.next}
              disabled={busy}
              onClick={() => onTaskUpdate(projectId, task._id, a.next)}
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-all disabled:opacity-40 ${a.cls}`}
            >
              {busy
                ? <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block align-middle" />
                : a.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── Project Card ─────────────────────────────────────────────────────────────

const ProjectCard = ({ p, i, onOpen }) => {
  const st = getProjStatus(p);
  const dl = daysLeft(p.deadline, p.status);
  const tasks = p.myMember?.tasks || [];
  const doneTasks = tasks.filter(t => t.status === 'Done').length;
  const taskPct = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

  const deadlineLabel =
    p.status === 'Completed' ? 'Completed'
    : dl === null            ? '—'
    : dl < 0                 ? `${Math.abs(dl)}d overdue`
    : dl === 0               ? 'Due today'
    : `${dl}d left`;

  const deadlineCls =
    p.status === 'Completed'     ? 'text-emerald-600 dark:text-emerald-400'
    : dl !== null && dl < 0      ? 'text-red-500 font-bold'
    : dl !== null && dl <= 2     ? 'text-amber-500 font-semibold'
    : 'text-slate-400 dark:text-slate-500';

  return (
    <div
      className="group bg-white dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer flex flex-col"
      style={{ animation: `rise .45s cubic-bezier(.22,1,.36,1) ${i * 0.06 + 0.2}s both` }}
      onClick={() => onOpen(p)}
    >
      <div className="h-1 w-full" style={{ background: st.bar }} />

      <div className="p-5 flex flex-col gap-3 flex-1">
        {/* Title + badge */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-slate-800 dark:text-white text-[15px] leading-snug line-clamp-2 group-hover:text-[#0C2B4E] dark:group-hover:text-blue-300 transition-colors">
            {p.title}
          </h3>
          <span className={`flex-shrink-0 flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${st.pill}`}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
            {st.key}
          </span>
        </div>

        {/* Description */}
        <p className="text-[13px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
          {p.description || 'No description.'}
        </p>

        {/* Task progress */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 uppercase tracking-wide">
              <ListChecks size={11} /> Tasks
            </span>
            <span className="text-[11px] font-bold" style={{ color: st.bar }}>
              {tasks.length > 0 ? `${doneTasks}/${tasks.length} done` : 'No tasks'}
            </span>
          </div>
          <div className="h-1.5 bg-slate-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${taskPct}%`, background: st.bar }}
            />
          </div>
        </div>

        {/* Meta */}
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-lg border ${PRIORITY_CLS[p.priority] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
            <Flag size={9} /> {p.priority || '—'}
          </span>
          <span className={`flex items-center gap-1 text-[12px] ${deadlineCls}`}>
            <Calendar size={11} /> {deadlineLabel}
          </span>
        </div>

        {/* Assigned by */}
        {p.assignedBy?.name && (
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-gray-800 pt-3">
            <User size={11} />
            <span>By <span className="font-semibold text-slate-600 dark:text-slate-300">{p.assignedBy.name}</span></span>
            {p.myMember?.role && <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 font-semibold">{p.myMember.role}</span>}
          </div>
        )}

        <button
          className="w-full flex items-center justify-center gap-1.5 text-[12px] font-semibold py-2 rounded-xl bg-slate-50 dark:bg-gray-800 text-slate-500 hover:bg-[#0C2B4E] hover:text-white dark:hover:bg-[#0C2B4E] transition-all border border-slate-100 dark:border-gray-700"
          onClick={e => { e.stopPropagation(); onOpen(p); }}
        >
          View Tasks & Details <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
};

// ─── Detail Modal ─────────────────────────────────────────────────────────────

const Modal = ({ p, onClose, onTaskUpdate, updatingTask }) => {
  const st = getProjStatus(p);
  const tasks = p.myMember?.tasks || [];
  const doneTasks = tasks.filter(t => t.status === 'Done').length;
  const taskPct = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;
  const dl = daysLeft(p.deadline, p.status);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      style={{ background: 'rgba(2,8,23,.75)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-900 w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: '92vh', animation: 'rise .35s cubic-bezier(.22,1,.36,1) both' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 flex-shrink-0" style={{ background: 'linear-gradient(135deg,#0c2b4e,#1a4d7a)' }}>
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex gap-2 flex-wrap">
              <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: st.dot }} />
                {st.key}
              </span>
              {p.priority && (
                <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-white/20 text-white">
                  {p.priority} Priority
                </span>
              )}
            </div>
            <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white transition-all flex-shrink-0">
              <X size={14} />
            </button>
          </div>
          <h2 className="text-lg font-black text-white leading-tight mb-1">{p.title}</h2>
          <p className="text-[12px] text-white/60 mb-4 line-clamp-2">{p.description}</p>
          <div>
            <div className="flex justify-between text-[11px] text-white/60 mb-1.5">
              <span className="flex items-center gap-1"><ListChecks size={11} /> My Tasks Progress</span>
              <span className="text-white font-bold">{doneTasks}/{tasks.length} done</span>
            </div>
            <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${taskPct}%` }} />
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">

          {isProjectDelayed(p) && (
            <div className="flex items-center gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3">
              <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
              <div>
                <p className="text-[13px] font-bold text-red-700 dark:text-red-400">Project Overdue</p>
                <p className="text-[11px] text-red-500 mt-0.5">Deadline has passed. Please contact your admin.</p>
              </div>
            </div>
          )}

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-2.5">
            {[
              { icon: User,     label: 'Assigned By', val: p.assignedBy?.name || '—', cls: '' },
              { icon: Calendar, label: 'Start Date',   val: p.startDate ? new Date(p.startDate).toLocaleDateString('en-US',{day:'numeric',month:'short',year:'numeric'}) : '—', cls: '' },
              { icon: Clock,    label: 'Deadline',     val: new Date(p.deadline).toLocaleDateString('en-US',{day:'numeric',month:'short',year:'numeric'}),
                cls: isProjectDelayed(p) ? 'text-red-600 dark:text-red-400 font-bold' : '' },
              { icon: Calendar, label: p.status === 'Completed' ? 'Completed On' : dl !== null && dl < 0 ? 'Overdue By' : 'Days Left',
                val: p.status === 'Completed'
                  ? (p.completedAt ? new Date(p.completedAt).toLocaleDateString('en-US',{day:'numeric',month:'short'}) : '—')
                  : dl === null ? '—'
                  : dl < 0 ? `${Math.abs(dl)} days`
                  : `${dl} days`,
                cls: p.status === 'Completed' ? 'text-emerald-600 font-bold' : dl !== null && dl < 0 ? 'text-red-500 font-bold' : dl !== null && dl <= 2 ? 'text-amber-500 font-semibold' : '' },
            ].map(({ icon: Icon, label, val, cls }) => (
              <div key={label} className="bg-slate-50 dark:bg-gray-800 rounded-xl p-3">
                <div className="flex items-center gap-1 text-[11px] text-slate-400 mb-1 font-medium">
                  <Icon size={11} /> {label}
                </div>
                <p className={`text-[13px] text-slate-700 dark:text-slate-200 ${cls}`}>{val}</p>
              </div>
            ))}
          </div>

          {/* Role badge */}
          {p.myMember?.role && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 flex items-center gap-2">
              <User size={14} className="text-blue-500 flex-shrink-0" />
              <span className="text-[12px] text-blue-700 dark:text-blue-300">
                Your role: <strong>{p.myMember.role}</strong>
              </span>
            </div>
          )}

          {/* Tasks section */}
          <div>
            <h3 className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <ListChecks size={12} /> My Tasks
            </h3>
            {tasks.length === 0 ? (
              <div className="text-center py-8 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-100 dark:border-gray-700">
                <ListChecks size={26} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                <p className="text-[13px] text-slate-400">No tasks assigned to you yet.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {tasks.map(task => (
                  <TaskRow
                    key={task._id}
                    task={task}
                    projectId={p._id}
                    onTaskUpdate={onTaskUpdate}
                    updatingTask={updatingTask}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Admin notes */}
          {p.notes && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-[11px] text-amber-600 dark:text-amber-400 font-semibold mb-2">
                <FileText size={11} /> Admin Notes
              </div>
              <p className="text-[13px] text-amber-800 dark:text-amber-300 leading-relaxed">{p.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function EmployeeProjects({ user }) {
  const [projects,      setProjects]      = useState([]);
  const [stats,         setStats]         = useState({});
  const [loading,       setLoading]       = useState(true);
  const [detailProject, setDetailProject] = useState(null);
  const [updatingTask,  setUpdatingTask]  = useState(null);
  const [filter,        setFilter]        = useState('All');

  const fetchProjects = useCallback(async () => {
    try {
      const [pRes, sRes] = await Promise.all([
        projectAPI.getMyProjects(),
        projectAPI.getMyProjectStats(),
      ]);
      setProjects(pRes.data.projects);
      setStats(sRes.data.stats);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
    const socket = socketService.getSocket();
    if (socket) {
      socket.on('project:assigned', fetchProjects);
      socket.on('project:updated',  fetchProjects);
      socket.on('project:deleted',  fetchProjects);
    }
    return () => {
      if (socket) {
        socket.off('project:assigned', fetchProjects);
        socket.off('project:updated',  fetchProjects);
        socket.off('project:deleted',  fetchProjects);
      }
    };
  }, [fetchProjects]);

  // ── FIXED: calls PUT /projects/:id/task (employee-allowed endpoint) ────────
  const handleTaskUpdate = async (projectId, taskId, newStatus) => {
    setUpdatingTask(taskId);
    try {
      await projectAPI.updateTaskStatus(projectId, taskId, newStatus);
      toast.success(`Task marked as ${newStatus}`);
      const [pRes, sRes] = await Promise.all([
        projectAPI.getMyProjects(),
        projectAPI.getMyProjectStats(),
      ]);
      const freshProjects = pRes.data.projects;
      setProjects(freshProjects);
      setStats(sRes.data.stats);
      // Refresh open modal
      if (detailProject?._id === projectId) {
        const fresh = freshProjects.find(p => p._id === projectId);
        if (fresh) setDetailProject(fresh);
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to update task');
    } finally {
      setUpdatingTask(null);
    }
  };

  const FILTERS = ['All', 'Not Started', 'In Progress', 'Completed', 'Delayed'];
  const filtered = filter === 'All'
    ? projects
    : filter === 'Delayed'
      ? projects.filter(isProjectDelayed)
      : projects.filter(p => p.status === filter);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <div className="w-9 h-9 border-2 border-[#0C2B4E] border-t-transparent rounded-full animate-spin" />
      <p className="text-[13px] text-slate-400 font-medium">Loading projects…</p>
    </div>
  );

  return (
    <>
      <style>{`
        @keyframes rise {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0);    }
        }
      `}</style>

      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 p-4 md:p-6 space-y-6">

        {/* Header */}
        <div style={{ animation: 'rise .4s ease both' }}>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm" style={{ background: 'linear-gradient(135deg,#0c2b4e,#1a4d7a)' }}>
              <Briefcase size={17} className="text-white" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">My Projects</h1>
          </div>
          <p className="text-[13px] text-slate-400 dark:text-slate-500 ml-12">
            {projects.length} project{projects.length !== 1 ? 's' : ''} assigned to you
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {STAT_CFG.map((cfg, i) => (
            <StatCard key={cfg.key} cfg={cfg} value={stats[cfg.key] || 0} i={i} />
          ))}
        </div>

        {/* Filters */}
        {projects.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ animation: 'rise .4s ease .25s both' }}>
            {FILTERS.map(tab => {
              const count =
                tab === 'All'     ? projects.length
                : tab === 'Delayed' ? projects.filter(isProjectDelayed).length
                : projects.filter(p => p.status === tab).length;
              return (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-[12px] font-semibold transition-all border ${
                    filter === tab
                      ? 'bg-[#0C2B4E] text-white border-[#0C2B4E] shadow-sm'
                      : 'bg-white dark:bg-gray-900 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-gray-800 hover:border-[#0C2B4E]/50 hover:text-[#0C2B4E]'
                  }`}
                >
                  {tab}{tab !== 'All' && count > 0 ? ` ${count}` : ''}
                </button>
              );
            })}
          </div>
        )}

        {/* Cards */}
        {filtered.length === 0 ? (
          projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                <Briefcase size={30} className="text-slate-300 dark:text-slate-600" />
              </div>
              <h3 className="text-[15px] font-bold text-slate-600 dark:text-slate-400 mb-1">No Projects Yet</h3>
              <p className="text-[13px] text-slate-400 max-w-xs leading-relaxed">
                Your admin will assign projects when they're ready.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-slate-100 dark:border-gray-800 p-10 text-center">
              <p className="text-[13px] text-slate-400">No <strong>{filter}</strong> projects.</p>
            </div>
          )
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((p, i) => (
              <ProjectCard key={p._id} p={p} i={i} onOpen={setDetailProject} />
            ))}
          </div>
        )}
      </div>

      {detailProject && (
        <Modal
          p={detailProject}
          onClose={() => setDetailProject(null)}
          onTaskUpdate={handleTaskUpdate}
          updatingTask={updatingTask}
        />
      )}
    </>
  );
}