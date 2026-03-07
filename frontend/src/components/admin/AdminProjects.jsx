// src/components/admin/AdminProjects.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { projectAPI, userAPI } from '../../services/api';
import socketService from '../../services/socketService';
import { toast } from 'react-toastify';
import {
  Briefcase, Plus, X, Eye, Trash2, Edit2, Clock, CheckCircle,
  AlertTriangle, ChevronDown, ChevronUp, Users, UserPlus,
  ClipboardList, ArrowLeft, Circle, Search, Filter,
  Calendar, Flag, Hash, Star, Zap, Target,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────
const BRAND     = '#0C2B4E';
const BRAND2    = '#1a4d7a';
const PRIORITIES = ['Low', 'Medium', 'High'];
const STATUSES   = ['Not Started', 'In Progress', 'Completed', 'Delayed', 'On Hold'];
const TASK_STATUSES = ['To Do', 'In Progress', 'Done', 'Blocked'];

const ROLE_SUGGESTIONS = [
  'Frontend Developer', 'Backend Developer', 'Full Stack Developer',
  'UI/UX Designer', 'Project Manager', 'QA Engineer',
  'DevOps Engineer', 'Data Analyst', 'Mobile Developer',
];

// ─────────────────────────────────────────────────────────────────────────────
// Style helpers
// ─────────────────────────────────────────────────────────────────────────────
const statusStyle = (s) => ({
  'Completed':   { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-700', dot: 'bg-emerald-500' },
  'In Progress': { bg: 'bg-blue-50 dark:bg-blue-900/30',       text: 'text-blue-700 dark:text-blue-300',       border: 'border-blue-200 dark:border-blue-700',       dot: 'bg-blue-500'    },
  'Delayed':     { bg: 'bg-red-50 dark:bg-red-900/30',         text: 'text-red-700 dark:text-red-300',         border: 'border-red-200 dark:border-red-700',         dot: 'bg-red-500'     },
  'Not Started': { bg: 'bg-gray-50 dark:bg-gray-800',          text: 'text-gray-600 dark:text-gray-400',       border: 'border-gray-200 dark:border-gray-600',       dot: 'bg-gray-400'    },
  'On Hold':     { bg: 'bg-amber-50 dark:bg-amber-900/30',     text: 'text-amber-700 dark:text-amber-300',     border: 'border-amber-200 dark:border-amber-700',     dot: 'bg-amber-500'   },
  'To Do':       { bg: 'bg-gray-50 dark:bg-gray-800',          text: 'text-gray-600 dark:text-gray-400',       border: 'border-gray-200 dark:border-gray-600',       dot: 'bg-gray-400'    },
  'Done':        { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-700', dot: 'bg-emerald-500' },
  'Blocked':     { bg: 'bg-red-50 dark:bg-red-900/30',         text: 'text-red-700 dark:text-red-300',         border: 'border-red-200 dark:border-red-700',         dot: 'bg-red-500'     },
}[s] || { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', dot: 'bg-gray-400' });

const priorityStyle = (p) => ({
  High:   { text: 'text-red-600 dark:text-red-400',    bg: 'bg-red-50 dark:bg-red-900/30',    icon: '🔴' },
  Medium: { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30', icon: '🟡' },
  Low:    { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-900/30', icon: '🟢' },
}[p] || { text: 'text-gray-500', bg: 'bg-gray-50', icon: '⚪' });

const StatusBadge = ({ status, small }) => {
  const s = statusStyle(status);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border font-semibold ${small ? 'text-xs' : 'text-xs'} ${s.bg} ${s.text} ${s.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
};

const Avatar = ({ name = '', size = 'sm' }) => {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };
  return (
    <div className={`${sizes[size]} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}
      style={{ background: `linear-gradient(135deg, ${BRAND}, ${BRAND2})` }}>
      {initials || '?'}
    </div>
  );
};

const isDelayed = (p) => p.status !== 'Completed' && p.deadline && new Date() > new Date(p.deadline);

// ─────────────────────────────────────────────────────────────────────────────
// Empty form factory
// ─────────────────────────────────────────────────────────────────────────────
const emptyForm = () => ({
  title: '', description: '', deadline: '', startDate: '',
  priority: 'Medium', notes: '',
  team: [{ userId: '', role: '', tasks: [] }],
});

const emptyTask = () => ({ title: '', description: '', priority: 'Medium', deadline: '' });

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminProjects() {
  const [projects,      setProjects]      = useState([]);
  const [employees,     setEmployees]     = useState([]);
  const [stats,         setStats]         = useState({});
  const [loading,       setLoading]       = useState(true);
  const [view,          setView]          = useState('list'); // 'list' | 'form' | 'detail'
  const [editProject,   setEditProject]   = useState(null);
  const [detailProject, setDetailProject] = useState(null);
  const [form,          setForm]          = useState(emptyForm());
  const [submitting,    setSubmitting]    = useState(false);
  const [search,        setSearch]        = useState('');
  const [filterStatus,  setFilterStatus]  = useState('All');
  const [expandedEmp,   setExpandedEmp]   = useState(null);
  const [activeTaskMember, setActiveTaskMember] = useState(null); // index of member whose task panel is open
  const [roleInput,     setRoleInput]     = useState({}); // { [memberIdx]: string }

  // ── fetch ────────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    try {
      const [pRes, sRes, uRes] = await Promise.all([
        projectAPI.getAllProjects(),
        projectAPI.getProjectStats(),
        userAPI.getUsers(),
      ]);
      setProjects(pRes.data?.projects || []);
      setStats(sRes.data?.stats    || {});
      setEmployees(Array.isArray(uRes.data) ? uRes.data.filter(u => u.role === 'Employee') : []);
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const socket = socketService.getSocket?.();
    if (socket) {
      socket.on('project:updated', fetchAll);
      socket.on('project:deleted', fetchAll);
    }
    return () => {
      if (socket) { socket.off('project:updated', fetchAll); socket.off('project:deleted', fetchAll); }
    };
  }, [fetchAll]);

  // ── form helpers ─────────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditProject(null);
    setForm(emptyForm());
    setActiveTaskMember(null);
    setRoleInput({});
    setView('form');
  };

  const openEdit = (p) => {
    setEditProject(p);
    setForm({
      title:       p.title,
      description: p.description,
      deadline:    p.deadline?.slice(0, 10)  || '',
      startDate:   p.startDate?.slice(0, 10) || '',
      priority:    p.priority  || 'Medium',
      notes:       p.notes     || '',
      status:      p.status,
      team: (p.team || []).map(m => ({
        userId: m.userId?._id || m.userId || '',
        role:   m.role || '',
        tasks:  (m.tasks || []).map(t => ({
          _id:         t._id,
          title:       t.title,
          description: t.description || '',
          priority:    t.priority    || 'Medium',
          deadline:    t.deadline?.slice(0, 10) || '',
          status:      t.status      || 'To Do',
        })),
      })),
    });
    setActiveTaskMember(null);
    setRoleInput({});
    setView('form');
  };

  // ── team helpers ─────────────────────────────────────────────────────────────
  const addMember = () =>
    setForm(f => ({ ...f, team: [...f.team, { userId: '', role: '', tasks: [] }] }));

  const removeMember = (idx) =>
    setForm(f => ({ ...f, team: f.team.filter((_, i) => i !== idx) }));

  const updateMember = (idx, key, val) =>
    setForm(f => ({
      ...f,
      team: f.team.map((m, i) => i === idx ? { ...m, [key]: val } : m),
    }));

  // ── task helpers ─────────────────────────────────────────────────────────────
  const addTask = (memberIdx) =>
    setForm(f => ({
      ...f,
      team: f.team.map((m, i) =>
        i === memberIdx ? { ...m, tasks: [...m.tasks, emptyTask()] } : m
      ),
    }));

  const removeTask = (memberIdx, taskIdx) =>
    setForm(f => ({
      ...f,
      team: f.team.map((m, i) =>
        i === memberIdx ? { ...m, tasks: m.tasks.filter((_, j) => j !== taskIdx) } : m
      ),
    }));

  const updateTask = (memberIdx, taskIdx, key, val) =>
    setForm(f => ({
      ...f,
      team: f.team.map((m, i) =>
        i === memberIdx
          ? { ...m, tasks: m.tasks.map((t, j) => j === taskIdx ? { ...t, [key]: val } : t) }
          : m
      ),
    }));

  // ── submit ───────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!form.title.trim()) return toast.error('Project title is required');
    if (!form.description.trim()) return toast.error('Description is required');
    if (!form.deadline) return toast.error('Deadline is required');
    if (!form.team.length) return toast.error('Add at least one team member');
    for (const m of form.team) {
      if (!m.userId) return toast.error('Select an employee for each team member');
      if (!m.role.trim()) return toast.error('Enter a role for each team member');
    }
    // Check duplicate team members
    const ids = form.team.map(m => m.userId);
    if (new Set(ids).size !== ids.length) return toast.error('Each employee can only be added once');

    setSubmitting(true);
    try {
      if (editProject) {
        await projectAPI.updateProject(editProject._id, form);
        toast.success('Project updated!');
      } else {
        await projectAPI.createProject(form);
        toast.success('Project created and team notified!');
      }
      setView('list');
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Delete this project?')) return;
    try {
      await projectAPI.deleteProject(id);
      toast.success('Project deleted');
      if (view === 'detail') setView('list');
      fetchAll();
    } catch {
      toast.error('Failed to delete');
    }
  };

  // ── derived data ─────────────────────────────────────────────────────────────
  const byEmployee = employees.map(emp => ({
    emp,
    projects: projects.filter(p => p.team?.some(m => (m.userId?._id || m.userId) === emp._id)),
  })).filter(e => e.projects.length > 0);

  const filtered = projects.filter(p => {
    const q   = search.toLowerCase();
    const hit = !q || p.title?.toLowerCase().includes(q)
      || p.team?.some(m => m.userId?.name?.toLowerCase().includes(q));
    const st  = filterStatus === 'All' || (isDelayed(p) ? 'Delayed' : p.status) === filterStatus;
    return hit && st;
  });

  const getEmployee = (id) => employees.find(e => e._id === id);

  // ─────────────────────────────────────────────────────────────────────────────
  // LOADING
  // ─────────────────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#0C2B4E] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading projects…</p>
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // FORM VIEW — Create / Edit
  // ─────────────────────────────────────────────────────────────────────────────
  if (view === 'form') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-3 sm:p-6">
        <div className="max-w-4xl mx-auto">

          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setView('list')}
              className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-[#0C2B4E] dark:hover:text-white transition-colors">
              <ArrowLeft size={18} /> Back
            </button>
            <div className="w-px h-5 bg-gray-300 dark:bg-gray-600" />
            <h1 className="text-xl font-bold text-[#0C2B4E] dark:text-white">
              {editProject ? 'Edit Project' : 'Create New Project'}
            </h1>
          </div>

          <div className="space-y-5">

            {/* ── Section 1: Project Info ───────────────────────────────────── */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-lg bg-[#0C2B4E]/10 dark:bg-[#0C2B4E]/30 flex items-center justify-center">
                  <Briefcase size={16} color={BRAND} />
                </div>
                <h2 className="font-bold text-[#0C2B4E] dark:text-white">Project Details</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Project Title *</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Company Website Redesign"
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-medium focus:outline-none focus:border-[#0C2B4E] dark:focus:border-blue-400 transition-colors" />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Description *</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    rows={3} placeholder="Describe the project goals and scope…"
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none focus:outline-none focus:border-[#0C2B4E] dark:focus:border-blue-400 transition-colors" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Start Date</label>
                  <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                    style={{ colorScheme: 'dark' }}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-[#0C2B4E] dark:focus:border-blue-400 transition-colors" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Deadline *</label>
                  <input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                    style={{ colorScheme: 'dark' }}
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-[#0C2B4E] dark:focus:border-blue-400 transition-colors" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Priority</label>
                  <div className="flex gap-2">
                    {PRIORITIES.map(p => {
                      const ps = priorityStyle(p);
                      const active = form.priority === p;
                      return (
                        <button key={p} type="button" onClick={() => setForm(f => ({ ...f, priority: p }))}
                          className={`flex-1 py-2 rounded-xl text-xs font-bold border-2 transition-all ${active ? `${ps.bg} ${ps.text} border-current` : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-300'}`}>
                          {ps.icon} {p}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {editProject && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Status</label>
                    <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                      style={{ colorScheme: 'dark' }}
                      className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-[#0C2B4E] transition-colors">
                      {STATUSES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Admin Notes</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    rows={2} placeholder="Internal notes for the team…"
                    className="w-full px-4 py-2.5 rounded-xl border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none focus:outline-none focus:border-[#0C2B4E] dark:focus:border-blue-400 transition-colors" />
                </div>
              </div>
            </div>

            {/* ── Section 2: Team Members ────────────────────────────────────── */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 sm:p-6">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#0C2B4E]/10 dark:bg-[#0C2B4E]/30 flex items-center justify-center">
                    <Users size={16} color={BRAND} />
                  </div>
                  <h2 className="font-bold text-[#0C2B4E] dark:text-white">Team Members</h2>
                  <span className="ml-1 w-5 h-5 rounded-full bg-[#0C2B4E] text-white text-xs flex items-center justify-center font-bold">
                    {form.team.length}
                  </span>
                </div>
                <button type="button" onClick={addMember}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0C2B4E] text-white text-xs font-semibold rounded-lg hover:bg-[#1a4d7a] transition-colors">
                  <UserPlus size={14} /> Add Member
                </button>
              </div>

              <div className="space-y-4">
                {form.team.map((member, mIdx) => {
                  const emp = getEmployee(member.userId);
                  const isTaskOpen = activeTaskMember === mIdx;
                  return (
                    <div key={mIdx} className="border-2 border-gray-100 dark:border-gray-700 rounded-xl overflow-hidden">

                      {/* Member row */}
                      <div className="p-4 bg-gray-50 dark:bg-gray-800/50">
                        <div className="flex flex-col sm:flex-row gap-3">

                          {/* Employee select */}
                          <div className="flex-1 min-w-0">
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Employee *</label>
                            <select value={member.userId}
                              onChange={e => updateMember(mIdx, 'userId', e.target.value)}
                              style={{ colorScheme: 'dark' }}
                              className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-[#0C2B4E] dark:focus:border-blue-400 transition-colors">
                              <option value="">Select employee…</option>
                              {employees.map(e => (
                                <option key={e._id} value={e._id} disabled={form.team.some((m, i) => i !== mIdx && m.userId === e._id)}>
                                  {e.name} — {e.department || e.position || 'Employee'}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Role input with suggestions */}
                          <div className="flex-1 min-w-0 relative">
                            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Role in Project *</label>
                            <input
                              value={member.role}
                              onChange={e => updateMember(mIdx, 'role', e.target.value)}
                              onFocus={() => setRoleInput(r => ({ ...r, [mIdx]: true }))}
                              onBlur={() => setTimeout(() => setRoleInput(r => ({ ...r, [mIdx]: false })), 150)}
                              placeholder="e.g. Frontend Developer"
                              className="w-full px-3 py-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-[#0C2B4E] dark:focus:border-blue-400 transition-colors" />
                            {roleInput[mIdx] && (
                              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl z-20 max-h-44 overflow-y-auto">
                                {ROLE_SUGGESTIONS.filter(r => r.toLowerCase().includes(member.role.toLowerCase())).map(r => (
                                  <button key={r} type="button"
                                    onMouseDown={() => updateMember(mIdx, 'role', r)}
                                    className="w-full text-left px-3 py-2 text-sm hover:bg-[#0C2B4E]/10 dark:hover:bg-[#0C2B4E]/30 text-gray-700 dark:text-gray-300 transition-colors">
                                    {r}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-end gap-2">
                            <button type="button"
                              onClick={() => setActiveTaskMember(isTaskOpen ? null : mIdx)}
                              className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold border-2 transition-all ${isTaskOpen ? 'bg-[#0C2B4E] text-white border-[#0C2B4E]' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-[#0C2B4E] hover:text-[#0C2B4E]'}`}>
                              <ClipboardList size={13} />
                              Tasks {member.tasks.length > 0 && <span className="ml-0.5 w-4 h-4 rounded-full bg-current/20 flex items-center justify-center">{member.tasks.length}</span>}
                            </button>
                            {form.team.length > 1 && (
                              <button type="button" onClick={() => removeMember(mIdx)}
                                className="p-2 rounded-lg text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors border-2 border-transparent hover:border-red-200">
                                <X size={15} />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Employee preview */}
                        {emp && (
                          <div className="mt-3 flex items-center gap-2 p-2.5 bg-white dark:bg-gray-900 rounded-lg border border-gray-100 dark:border-gray-700">
                            <Avatar name={emp.name} size="sm" />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{emp.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{emp.email} · {emp.department || '—'}</p>
                            </div>
                            {member.role && (
                              <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-[#0C2B4E]/10 dark:bg-[#0C2B4E]/30 text-[#0C2B4E] dark:text-blue-300 font-semibold whitespace-nowrap">
                                {member.role}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Task panel */}
                      {isTaskOpen && (
                        <div className="p-4 border-t-2 border-gray-100 dark:border-gray-700">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                              Tasks for {emp?.name || 'this member'}
                            </p>
                            <button type="button" onClick={() => addTask(mIdx)}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-[#0C2B4E] dark:text-blue-400 border border-[#0C2B4E]/30 dark:border-blue-400/30 rounded-lg hover:bg-[#0C2B4E]/5 transition-colors">
                              <Plus size={12} /> Add Task
                            </button>
                          </div>

                          {member.tasks.length === 0 ? (
                            <div className="text-center py-6 text-gray-400 dark:text-gray-500">
                              <ClipboardList size={28} className="mx-auto mb-2 opacity-40" />
                              <p className="text-xs">No tasks yet. Click "Add Task" to assign work.</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {member.tasks.map((task, tIdx) => (
                                <div key={tIdx} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700">
                                  <div className="flex items-start gap-2 mb-2">
                                    <div className="flex-1 min-w-0">
                                      <input value={task.title}
                                        onChange={e => updateTask(mIdx, tIdx, 'title', e.target.value)}
                                        placeholder="Task title *"
                                        className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#0C2B4E] transition-colors" />
                                    </div>
                                    <button type="button" onClick={() => removeTask(mIdx, tIdx)}
                                      className="p-1.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex-shrink-0">
                                      <X size={13} />
                                    </button>
                                  </div>
                                  <textarea value={task.description}
                                    onChange={e => updateTask(mIdx, tIdx, 'description', e.target.value)}
                                    placeholder="Task description (optional)"
                                    rows={2}
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-xs text-gray-700 dark:text-gray-300 resize-none focus:outline-none focus:border-[#0C2B4E] mb-2 transition-colors" />
                                  <div className="flex flex-wrap gap-2">
                                    <select value={task.priority}
                                      onChange={e => updateTask(mIdx, tIdx, 'priority', e.target.value)}
                                      style={{ colorScheme: 'dark' }}
                                      className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-xs text-gray-700 dark:text-gray-300 focus:outline-none">
                                      {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                                    </select>
                                    <input type="date" value={task.deadline}
                                      onChange={e => updateTask(mIdx, tIdx, 'deadline', e.target.value)}
                                      style={{ colorScheme: 'dark' }}
                                      className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-xs text-gray-700 dark:text-gray-300 focus:outline-none" />
                                    {editProject && (
                                      <select value={task.status}
                                        onChange={e => updateTask(mIdx, tIdx, 'status', e.target.value)}
                                        style={{ colorScheme: 'dark' }}
                                        className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-xs text-gray-700 dark:text-gray-300 focus:outline-none">
                                        {TASK_STATUSES.map(s => <option key={s}>{s}</option>)}
                                      </select>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Add member button (bottom) */}
              <button type="button" onClick={addMember}
                className="mt-4 w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:border-[#0C2B4E] hover:text-[#0C2B4E] dark:hover:border-blue-400 dark:hover:text-blue-400 transition-all font-semibold flex items-center justify-center gap-2">
                <UserPlus size={16} /> Add Another Team Member
              </button>
            </div>

            {/* ── Submit ────────────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row gap-3 pb-6">
              <button type="button" onClick={() => setView('list')}
                className="flex-1 py-3 rounded-xl border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Cancel
              </button>
              <button type="button" onClick={handleSubmit} disabled={submitting}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${BRAND}, ${BRAND2})` }}>
                {submitting ? 'Saving…' : editProject ? 'Update Project' : 'Create Project & Assign Team'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // DETAIL VIEW
  // ─────────────────────────────────────────────────────────────────────────────
  if (view === 'detail' && detailProject) {
    const p       = detailProject;
    const delayed = isDelayed(p);
    const disp    = delayed ? 'Delayed' : p.status;

    // Progress calculation
    const allTasks  = (p.team || []).flatMap(m => m.tasks || []);
    const doneTasks = allTasks.filter(t => t.status === 'Done').length;
    const progress  = allTasks.length ? Math.round((doneTasks / allTasks.length) * 100) : 0;

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-3 sm:p-6">
        <div className="max-w-4xl mx-auto space-y-5">

          {/* Header */}
          <div className="flex items-center justify-between">
            <button onClick={() => setView('list')}
              className="flex items-center gap-2 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:text-[#0C2B4E] dark:hover:text-white transition-colors">
              <ArrowLeft size={18} /> Back to Projects
            </button>
            <div className="flex gap-2">
              <button onClick={() => { openEdit(p); }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#0C2B4E] dark:text-blue-400 border border-[#0C2B4E]/30 dark:border-blue-400/30 rounded-lg hover:bg-[#0C2B4E]/5 transition-colors">
                <Edit2 size={13} /> Edit
              </button>
              <button onClick={(e) => handleDelete(p._id, e)}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-500 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <Trash2 size={13} /> Delete
              </button>
            </div>
          </div>

          {/* Project Card */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${BRAND}, ${BRAND2}, #38bdf8)` }} />
            <div className="p-5 sm:p-6">
              {delayed && (
                <div className="mb-4 flex items-center gap-2 px-4 py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm font-semibold">
                  <AlertTriangle size={16} /> This project is overdue — deadline has passed!
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap mb-2">
                    <h1 className="text-xl font-bold text-[#0C2B4E] dark:text-white">{p.title}</h1>
                    <StatusBadge status={disp} />
                    <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${priorityStyle(p.priority).bg} ${priorityStyle(p.priority).text}`}>
                      {priorityStyle(p.priority).icon} {p.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{p.description}</p>
                </div>
              </div>

              {/* Progress */}
              {allTasks.length > 0 && (
                <div className="mt-5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">Overall Progress</span>
                    <span className="text-xs font-bold text-[#0C2B4E] dark:text-blue-400">{progress}% ({doneTasks}/{allTasks.length} tasks)</span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${BRAND}, ${BRAND2})` }} />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
                {[
                  { label: 'Start Date', val: p.startDate ? new Date(p.startDate).toLocaleDateString() : '—', icon: <Calendar size={14} /> },
                  { label: 'Deadline',   val: p.deadline  ? new Date(p.deadline).toLocaleDateString()  : '—', icon: <Calendar size={14} />, red: delayed },
                  { label: 'Team Size',  val: `${p.team?.length || 0} members`,                               icon: <Users size={14} /> },
                  { label: 'Total Tasks', val: `${allTasks.length} tasks`,                                     icon: <ClipboardList size={14} /> },
                ].map(item => (
                  <div key={item.label} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                    <div className={`flex items-center gap-1.5 text-xs font-semibold mb-1 ${item.red ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>
                      {item.icon} {item.label}
                    </div>
                    <p className={`text-sm font-bold ${item.red ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{item.val}</p>
                  </div>
                ))}
              </div>
              {p.notes && (
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1">Admin Notes</p>
                  <p className="text-sm text-amber-800 dark:text-amber-200">{p.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Team & Tasks */}
          <div className="space-y-4">
            {(p.team || []).map((member, mIdx) => {
              const emp      = member.userId;
              const tasks    = member.tasks || [];
              const mDone    = tasks.filter(t => t.status === 'Done').length;
              const mProg    = tasks.length ? Math.round((mDone / tasks.length) * 100) : 0;
              const expanded = expandedEmp === mIdx;
              return (
                <div key={mIdx} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {/* Member header */}
                  <button className="w-full p-4 sm:p-5 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    onClick={() => setExpandedEmp(expanded ? null : mIdx)}>
                    <Avatar name={emp?.name || '?'} size="md" />
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-gray-900 dark:text-white text-sm">{emp?.name || 'Unknown'}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-[#0C2B4E]/10 dark:bg-[#0C2B4E]/30 text-[#0C2B4E] dark:text-blue-300 font-semibold">{member.role}</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{emp?.email}</p>
                      {tasks.length > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden max-w-32">
                            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${mProg}%` }} />
                          </div>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{mDone}/{tasks.length}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {tasks.length > 0 && (
                        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</span>
                      )}
                      {expanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                    </div>
                  </button>

                  {/* Tasks */}
                  {expanded && (
                    <div className="border-t border-gray-100 dark:border-gray-700">
                      {tasks.length === 0 ? (
                        <div className="p-6 text-center text-gray-400 dark:text-gray-500">
                          <ClipboardList size={24} className="mx-auto mb-2 opacity-40" />
                          <p className="text-xs">No tasks assigned to this member</p>
                        </div>
                      ) : (
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {tasks.map((task, tIdx) => (
                            <div key={tIdx} className={`p-3.5 rounded-xl border ${statusStyle(task.status).bg} ${statusStyle(task.status).border}`}>
                              <div className="flex items-start justify-between gap-2 mb-1.5">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{task.title}</p>
                                <StatusBadge status={task.status} small />
                              </div>
                              {task.description && <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{task.description}</p>}
                              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 flex-wrap">
                                <span className={`${priorityStyle(task.priority).text} font-semibold`}>{priorityStyle(task.priority).icon} {task.priority}</span>
                                {task.deadline && <span>· Due {new Date(task.deadline).toLocaleDateString()}</span>}
                                {task.completedAt && <span className="text-emerald-600">· Done {new Date(task.completedAt).toLocaleDateString()}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // LIST VIEW (default)
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#0C2B4E] dark:text-white">Project Management</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
          </div>
          <button onClick={openCreate}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white rounded-xl shadow-lg hover:opacity-90 transition-all"
            style={{ background: `linear-gradient(135deg, ${BRAND}, ${BRAND2})` }}>
            <Plus size={18} /> New Project
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total',       value: stats.total      || 0, icon: <Briefcase size={18} />,     color: BRAND,       light: '#e8f0f8' },
            { label: 'Completed',   value: stats.completed  || 0, icon: <CheckCircle size={18} />,   color: '#059669',   light: '#d1fae5' },
            { label: 'In Progress', value: stats.inProgress || 0, icon: <Clock size={18} />,         color: '#2563eb',   light: '#dbeafe' },
            { label: 'Delayed',     value: stats.delayed    || 0, icon: <AlertTriangle size={18} />, color: '#dc2626',   light: '#fee2e2' },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: s.light, color: s.color }}>
                {s.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Employee Summary */}
        {byEmployee.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <h2 className="font-bold text-[#0C2B4E] dark:text-white flex items-center gap-2">
                <Users size={18} /> Employee Project Summary
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    {['Employee', 'Total', 'Completed', 'In Progress', 'Delayed', 'Details'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {byEmployee.map(({ emp, projects: ep }) => {
                    const now  = new Date();
                    const es   = {
                      total:      ep.length,
                      completed:  ep.filter(p => p.status === 'Completed').length,
                      inProgress: ep.filter(p => p.status === 'In Progress').length,
                      delayed:    ep.filter(p => p.status !== 'Completed' && new Date(p.deadline) < now).length,
                    };
                    return (
                      <tr key={emp._id} className="border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={emp.name} size="sm" />
                            <div>
                              <p className="font-semibold text-gray-900 dark:text-white text-sm">{emp.name}</p>
                              <p className="text-xs text-gray-400">{emp.department || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 font-bold text-gray-900 dark:text-white">{es.total}</td>
                        <td className="px-4 py-3.5"><span className="font-semibold text-emerald-600 dark:text-emerald-400">{es.completed}</span></td>
                        <td className="px-4 py-3.5"><span className="font-semibold text-blue-600 dark:text-blue-400">{es.inProgress}</span></td>
                        <td className="px-4 py-3.5"><span className="font-semibold text-red-600 dark:text-red-400">{es.delayed}</span></td>
                        <td className="px-4 py-3.5">
                          <button onClick={() => {
                            const first = ep[0];
                            if (first) { setDetailProject(first); setView('detail'); }
                          }} className="text-xs font-semibold text-[#0C2B4E] dark:text-blue-400 hover:underline">
                            View →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* All Projects */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <h2 className="font-bold text-[#0C2B4E] dark:text-white flex items-center gap-2">
              <Briefcase size={18} /> All Projects
            </h2>
            <div className="flex gap-2 flex-wrap">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search…"
                  className="pl-8 pr-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-[#0C2B4E] transition-colors w-36 sm:w-48" />
              </div>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                style={{ colorScheme: 'dark' }}
                className="px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white focus:outline-none">
                <option>All</option>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <Briefcase size={32} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p className="font-semibold text-gray-500 dark:text-gray-400">No projects found</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 p-4 sm:p-5">
              {filtered.map(p => {
                const delayed = isDelayed(p);
                const disp    = delayed ? 'Delayed' : p.status;
                const allT    = (p.team || []).flatMap(m => m.tasks || []);
                const doneT   = allT.filter(t => t.status === 'Done').length;
                const prog    = allT.length ? Math.round((doneT / allT.length) * 100) : 0;
                return (
                  <div key={p._id}
                    className="border border-gray-200 dark:border-gray-700 rounded-2xl p-4 hover:shadow-md hover:border-[#0C2B4E]/30 dark:hover:border-blue-500/30 transition-all cursor-pointer bg-white dark:bg-gray-900"
                    onClick={() => { setDetailProject(p); setView('detail'); }}>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-snug">{p.title}</h3>
                      <StatusBadge status={disp} small />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">{p.description}</p>

                    {/* Team avatars */}
                    <div className="flex items-center gap-1.5 mb-3">
                      {(p.team || []).slice(0, 4).map((m, i) => (
                        <div key={i} title={m.userId?.name || ''} style={{ marginLeft: i > 0 ? '-8px' : '0', zIndex: 10 - i, position: 'relative' }}>
                          <Avatar name={m.userId?.name || '?'} size="sm" />
                        </div>
                      ))}
                      {(p.team || []).length > 4 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 font-semibold">+{p.team.length - 4}</span>
                      )}
                      <span className="ml-auto text-xs text-gray-400">{p.team?.length || 0} member{p.team?.length !== 1 ? 's' : ''}</span>
                    </div>

                    {/* Progress bar */}
                    {allT.length > 0 && (
                      <div className="mb-3">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>Progress</span>
                          <span className="font-semibold">{prog}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${prog}%`, background: `linear-gradient(90deg, ${BRAND}, ${BRAND2})` }} />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span className={`${priorityStyle(p.priority).text} font-semibold`}>{priorityStyle(p.priority).icon} {p.priority}</span>
                      <span className={delayed ? 'text-red-500 font-semibold' : ''}>
                        {delayed ? '⚠ ' : ''}Due {new Date(p.deadline).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700" onClick={e => e.stopPropagation()}>
                      <button onClick={() => openEdit(p)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                        <Edit2 size={12} /> Edit
                      </button>
                      <button onClick={(e) => handleDelete(p._id, e)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                        <Trash2 size={12} /> Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}