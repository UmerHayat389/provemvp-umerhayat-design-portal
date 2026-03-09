// src/components/admin/AdminProjects.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { projectAPI, userAPI } from '../../services/api';
import socketService from '../../services/socketService';
import { toast } from 'react-toastify';
import {
  Briefcase, Plus, X, Trash2, Edit2, Clock, CheckCircle,
  AlertTriangle, ChevronDown, ChevronUp, Users, UserPlus,
  ClipboardList, ArrowLeft, Search, Calendar, TrendingUp, Layers,
} from 'lucide-react';

// ─── Constants ───────────────────────────────────────────────────────────────
const BRAND      = '#0C2B4E';
const BRAND2     = '#1a4d7a';
const PRIORITIES    = ['Low', 'Medium', 'High'];
const STATUSES      = ['Not Started', 'In Progress', 'Completed', 'Delayed', 'On Hold'];
const TASK_STATUSES = ['To Do', 'In Progress', 'Done', 'Blocked'];
const ROLE_SUGGESTIONS = [
  'Frontend Developer','Backend Developer','Full Stack Developer',
  'UI/UX Designer','Project Manager','QA Engineer',
  'DevOps Engineer','Data Analyst','Mobile Developer',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const statusConfig = (s) => ({
  'Completed':   { pill:'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', dot:'bg-emerald-500', bar:'#10b981' },
  'In Progress': { pill:'bg-[#0C2B4E]/10 text-[#0C2B4E] dark:bg-[#4d9de0]/20 dark:text-[#4d9de0]',               dot:'bg-[#4d9de0]',     bar:'#0ea5e9' },
  'Delayed':     { pill:'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',           dot:'bg-rose-500',   bar:'#f43f5e' },
  'Not Started': { pill:'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',              dot:'bg-gray-400',   bar:'#6b7280' },
  'On Hold':     { pill:'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',       dot:'bg-amber-500',  bar:'#f59e0b' },
  'To Do':       { pill:'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',              dot:'bg-gray-400',   bar:'#6b7280' },
  'Done':        { pill:'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',dot:'bg-emerald-500',bar:'#10b981' },
  'Blocked':     { pill:'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',           dot:'bg-rose-500',   bar:'#f43f5e' },
}[s] || { pill:'bg-gray-100 text-gray-600', dot:'bg-gray-400', bar:'#6b7280' });

const priorityConfig = (p) => ({
  High:   { color:'text-rose-600 dark:text-rose-400',    bg:'bg-rose-50 dark:bg-rose-900/30',    dot:'bg-rose-500'    },
  Medium: { color:'text-amber-600 dark:text-amber-400',  bg:'bg-amber-50 dark:bg-amber-900/30',  dot:'bg-amber-500'   },
  Low:    { color:'text-emerald-600 dark:text-emerald-400', bg:'bg-emerald-50 dark:bg-emerald-900/30', dot:'bg-emerald-500' },
}[p] || { color:'text-gray-500', bg:'bg-gray-50', dot:'bg-gray-400' });

const isDelayed = (p) => p.status !== 'Completed' && p.deadline && new Date() > new Date(p.deadline);
const fmtDate   = (d) => d ? new Date(d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : '—';
const emptyForm = () => ({ title:'', description:'', deadline:'', startDate:'', priority:'Medium', notes:'', team:[{ userId:'', role:'', tasks:[] }] });
const emptyTask = () => ({ title:'', description:'', priority:'Medium', deadline:'' });

// ─── Micro-components ────────────────────────────────────────────────────────
const Pill = ({ status }) => {
  const c = statusConfig(status);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide ${c.pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`}/>
      {status}
    </span>
  );
};

const Avatar = ({ name = '', size = 'sm' }) => {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  const s = { sm:'w-7 h-7 text-[10px]', md:'w-9 h-9 text-xs', lg:'w-11 h-11 text-sm' };
  return (
    <div className={`${s[size]} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0 ring-2 ring-white dark:ring-gray-900`}
      style={{ background:`linear-gradient(135deg,${BRAND},${BRAND2})` }}>
      {initials || '?'}
    </div>
  );
};

const Bar = ({ value, color, thin }) => (
  <div className={`w-full ${thin ? 'h-1' : 'h-1.5'} bg-gray-100 dark:bg-gray-700/60 rounded-full overflow-hidden`}>
    <div className="h-full rounded-full transition-all duration-700 ap-bar"
      style={{ width:`${value}%`, background: color || `linear-gradient(90deg,${BRAND},${BRAND2})` }}/>
  </div>
);

// shared field class
const fc = "w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0C2B4E]/20 dark:focus:ring-[#4d9de0]/20 focus:border-[#0C2B4E] dark:focus:border-[#4d9de0] transition-all";

// ─── CSS ─────────────────────────────────────────────────────────────────────
const Styles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=DM+Mono:wght@400;500&display=swap');
    .ap-root, .ap-root * { font-family:'DM Sans',sans-serif; box-sizing:border-box; }
    .ap-mono { font-family:'DM Mono',monospace; }
    @keyframes ap-up  { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
    @keyframes ap-in  { from{opacity:0} to{opacity:1} }
    @keyframes ap-bar { from{width:0} }
    @keyframes ap-spin{ to{transform:rotate(360deg)} }
    .ap-up   { animation:ap-up  0.36s cubic-bezier(.22,1,.36,1) both; }
    .ap-in   { animation:ap-in  0.22s ease both; }
    .ap-bar  { animation:ap-bar 0.75s cubic-bezier(.22,1,.36,1) both; }
    .ap-spin { animation:ap-spin 0.7s linear infinite; }
    .ap-card { transition:transform .2s cubic-bezier(.22,1,.36,1),box-shadow .2s,border-color .2s; }
    .ap-card:hover { transform:translateY(-3px); box-shadow:0 8px 28px -4px rgba(12,43,78,.13); border-color:rgba(12,43,78,.22); }
    .dark .ap-card:hover { box-shadow:0 8px 28px -4px rgba(0,0,0,.4); border-color:rgba(96,165,250,.22); }
    .ap-stat { transition:transform .18s,box-shadow .18s; }
    .ap-stat:hover { transform:translateY(-2px); box-shadow:0 6px 20px -4px rgba(12,43,78,.14); }
    .ap-btn { background:linear-gradient(135deg,#0C2B4E,#1a4d7a); transition:opacity .15s,transform .15s,box-shadow .15s; box-shadow:0 2px 10px rgba(12,43,78,.28); }
    .ap-btn:hover:not(:disabled){ opacity:.9; transform:translateY(-1px); box-shadow:0 5px 18px rgba(12,43,78,.36); }
    .ap-btn:active:not(:disabled){ transform:translateY(0); }
    .ap-btn:disabled{ opacity:.5; }
    .ap-row:hover { background:rgba(12,43,78,.05); }
    .dark .ap-row:hover { background:rgba(255,255,255,.06); }
    .ap-row { transition:background .12s; }
  `}</style>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AdminProjects() {
  const [projects,         setProjects]         = useState([]);
  const [employees,        setEmployees]        = useState([]);
  const [stats,            setStats]            = useState({});
  const [loading,          setLoading]          = useState(true);
  const [view,             setView]             = useState('list');
  const [editProject,      setEditProject]      = useState(null);
  const [detailProject,    setDetailProject]    = useState(null);
  const [form,             setForm]             = useState(emptyForm());
  const [submitting,       setSubmitting]       = useState(false);
  const [search,           setSearch]           = useState('');
  const [filterStatus,     setFilterStatus]     = useState('All');
  const [expandedEmp,      setExpandedEmp]      = useState(null);
  const [activeTaskMember, setActiveTaskMember] = useState(null);
  const [roleInput,        setRoleInput]        = useState({});

  const fetchAll = useCallback(async () => {
    try {
      const [pRes, sRes, uRes] = await Promise.all([
        projectAPI.getAllProjects(),
        projectAPI.getProjectStats(),
        userAPI.getUsers(),
      ]);
      const projects = pRes.data?.projects || [];
      setProjects(projects);
      
      // Calculate stats locally instead of using backend stats
      const total = projects.length;
      const completed = projects.filter(p => p.status === 'Completed').length;
      const inProgress = projects.filter(p => p.status === 'In Progress').length;
      const delayed = projects.filter(p => p.status !== 'Completed' && p.deadline && new Date() > new Date(p.deadline)).length;
      
      // Get employees and calculate their stats
      const allEmployees = Array.isArray(uRes.data) ? uRes.data.filter(u => u.role === 'Employee') : [];
      const employeeStats = allEmployees.map(emp => {
        const empProjects = projects.filter(p => p.team?.some(m => (m.userId?._id || m.userId) === emp._id));
        return {
          ...emp,
          total: empProjects.length,
          completed: empProjects.filter(p => p.status === 'Completed').length,
          inProgress: empProjects.filter(p => p.status === 'In Progress').length,
          delayed: empProjects.filter(p => p.status !== 'Completed' && p.deadline && new Date() > new Date(p.deadline)).length,
        };
      }).filter(es => es.total > 0);
      
      setStats({ total, completed, inProgress, delayed, employeeStats });
      setEmployees(allEmployees);
    } catch { toast.error('Failed to load projects'); }
    finally  { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchAll();
    const socket = socketService.getSocket?.();
    if (socket) { socket.on('project:updated', fetchAll); socket.on('project:deleted', fetchAll); }
    return () => { if (socket) { socket.off('project:updated', fetchAll); socket.off('project:deleted', fetchAll); } };
  }, [fetchAll]);

  const openCreate = () => { setEditProject(null); setForm(emptyForm()); setActiveTaskMember(null); setRoleInput({}); setView('form'); };
  const openEdit   = (p) => {
    setEditProject(p);
    setForm({
      title: p.title, description: p.description,
      deadline: p.deadline?.slice(0,10) || '', startDate: p.startDate?.slice(0,10) || '',
      priority: p.priority || 'Medium', notes: p.notes || '', status: p.status,
      team: (p.team || []).map(m => ({
        userId: m.userId?._id || m.userId || '', role: m.role || '',
        tasks: (m.tasks || []).map(t => ({ _id:t._id, title:t.title, description:t.description||'', priority:t.priority||'Medium', deadline:t.deadline?.slice(0,10)||'', status:t.status||'To Do' })),
      })),
    });
    setActiveTaskMember(null); setRoleInput({}); setView('form');
  };

  const addMember    = ()       => setForm(f => ({ ...f, team:[...f.team, { userId:'', role:'', tasks:[] }] }));
  const removeMember = (i)      => setForm(f => ({ ...f, team:f.team.filter((_,j) => j !== i) }));
  const updateMember = (i,k,v)  => setForm(f => ({ ...f, team:f.team.map((m,j) => j===i ? {...m,[k]:v} : m) }));
  const addTask      = (mi)     => setForm(f => ({ ...f, team:f.team.map((m,i) => i===mi ? {...m,tasks:[...m.tasks,emptyTask()]} : m) }));
  const removeTask   = (mi,ti)  => setForm(f => ({ ...f, team:f.team.map((m,i) => i===mi ? {...m,tasks:m.tasks.filter((_,j)=>j!==ti)} : m) }));
  const updateTask   = (mi,ti,k,v) => setForm(f => ({ ...f, team:f.team.map((m,i) => i===mi ? {...m,tasks:m.tasks.map((t,j)=>j===ti?{...t,[k]:v}:t)} : m) }));

  const handleSubmit = async () => {
    if (!form.title.trim())        return toast.error('Project title is required');
    if (!form.description.trim())  return toast.error('Description is required');
    if (!form.deadline)            return toast.error('Deadline is required');
    if (!form.team.length)         return toast.error('Add at least one team member');
    for (const m of form.team) {
      if (!m.userId)      return toast.error('Select an employee for each team member');
      if (!m.role.trim()) return toast.error('Enter a role for each team member');
    }
    const ids = form.team.map(m => m.userId);
    if (new Set(ids).size !== ids.length) return toast.error('Each employee can only be added once');
    setSubmitting(true);
    try {
      if (editProject) { await projectAPI.updateProject(editProject._id, form); toast.success('Project updated!'); }
      else             { await projectAPI.createProject(form); toast.success('Project created and team notified!'); }
      setView('list'); fetchAll();
    } catch(err) { toast.error(err.response?.data?.message || 'Failed to save project'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Delete this project?')) return;
    try { await projectAPI.deleteProject(id); toast.success('Project deleted'); if (view==='detail') setView('list'); fetchAll(); }
    catch { toast.error('Failed to delete'); }
  };

  const byEmployee = employees.map(emp => ({
    emp,
    projects: projects.filter(p => p.team?.some(m => (m.userId?._id || m.userId) === emp._id)),
  })).filter(e => e.projects.length > 0);

  const filtered = projects.filter(p => {
    const q   = search.toLowerCase();
    const hit = !q || p.title?.toLowerCase().includes(q) || p.team?.some(m => m.userId?.name?.toLowerCase().includes(q));
    const st  = filterStatus === 'All' || (isDelayed(p) ? 'Delayed' : p.status) === filterStatus;
    return hit && st;
  });

  const getEmployee = (id) => employees.find(e => e._id === id);

  // ── LOADING ──────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="ap-root flex items-center justify-center h-64">
      <Styles/>
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-[#0C2B4E]/20 border-t-[#0C2B4E] ap-spin"/>
        <p className="text-[11px] font-semibold text-gray-400 tracking-widest uppercase">Loading…</p>
      </div>
    </div>
  );

  // ── FORM VIEW ─────────────────────────────────────────────────────────────────
  if (view === 'form') return (
    <div className="ap-root min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-6 sm:px-8">
      <Styles/>
      <div className="max-w-3xl mx-auto ap-up">

        <div className="flex items-center gap-3 mb-7">
          <button onClick={() => setView('list')} className="p-2 rounded-xl border border-transparent hover:border-gray-200 dark:hover:border-gray-700 hover:bg-white dark:hover:bg-gray-800 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-all">
            <ArrowLeft size={16}/>
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">{editProject ? 'Edit Project' : 'New Project'}</h1>
            <p className="text-xs text-gray-400 mt-0.5">{editProject ? 'Update project details and team' : 'Fill in details to create a new project'}</p>
          </div>
        </div>

        <div className="space-y-4">

          {/* Project Info */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-4">Project Info</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Title <span className="text-rose-400">*</span></label>
                <input value={form.title} onChange={e => setForm(f => ({...f, title:e.target.value}))} placeholder="e.g. Website Redesign" className={fc}/>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Description <span className="text-rose-400">*</span></label>
                <textarea value={form.description} onChange={e => setForm(f => ({...f, description:e.target.value}))} rows={3} placeholder="Goals and scope of this project…" className={`${fc} resize-none`}/>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Start Date</label>
                <input type="date" value={form.startDate} onChange={e => setForm(f => ({...f, startDate:e.target.value}))} style={{colorScheme:'dark'}} className={fc}/>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Deadline <span className="text-rose-400">*</span></label>
                <input type="date" value={form.deadline} onChange={e => setForm(f => ({...f, deadline:e.target.value}))} style={{colorScheme:'dark'}} className={fc}/>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Priority</label>
                <div className="flex gap-2">
                  {PRIORITIES.map(p => {
                    const pc = priorityConfig(p); const active = form.priority === p;
                    return (
                      <button key={p} type="button" onClick={() => setForm(f => ({...f, priority:p}))}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold border-2 transition-all ${active ? `${pc.bg} ${pc.color} border-current` : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                        <span className={`w-2 h-2 rounded-full ${pc.dot}`}/>{p}
                      </button>
                    );
                  })}
                </div>
              </div>

              {editProject && (
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({...f, status:e.target.value}))} style={{colorScheme:'dark'}} className={fc}>
                    {STATUSES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Admin Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({...f, notes:e.target.value}))} rows={2} placeholder="Internal notes…" className={`${fc} resize-none`}/>
              </div>
            </div>
          </section>

          {/* Team */}
          <section className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">Team</p>
                <span className="px-1.5 py-0.5 rounded-md bg-[#0C2B4E] text-white text-[10px] font-bold">{form.team.length}</span>
              </div>
              <button type="button" onClick={addMember} className="ap-btn flex items-center gap-1.5 px-3 py-1.5 text-white text-[11px] font-semibold rounded-lg">
                <UserPlus size={13}/> Add Member
              </button>
            </div>

            <div className="space-y-3">
              {form.team.map((member, mIdx) => {
                const emp = getEmployee(member.userId); const isTaskOpen = activeTaskMember === mIdx;
                return (
                  <div key={mIdx} className="rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                    <div className="p-3.5 bg-gray-50 dark:bg-gray-800/40">
                      <div className="flex flex-col sm:flex-row gap-2.5">

                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Employee *</p>
                          <select value={member.userId} onChange={e => updateMember(mIdx,'userId',e.target.value)} style={{colorScheme:'dark'}} className={fc}>
                            <option value="">Select employee…</option>
                            {employees.map(e => (
                              <option key={e._id} value={e._id} disabled={form.team.some((m,i) => i!==mIdx && m.userId===e._id)}>
                                {e.name} — {e.department || e.position || 'Employee'}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="flex-1 min-w-0 relative">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Role *</p>
                          <input value={member.role} onChange={e => updateMember(mIdx,'role',e.target.value)}
                            onFocus={() => setRoleInput(r => ({...r,[mIdx]:true}))}
                            onBlur={() => setTimeout(() => setRoleInput(r => ({...r,[mIdx]:false})), 150)}
                            placeholder="e.g. Frontend Developer" className={fc}/>
                          {roleInput[mIdx] && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-30 overflow-hidden ap-in">
                              {ROLE_SUGGESTIONS.filter(r => r.toLowerCase().includes(member.role.toLowerCase())).map(r => (
                                <button key={r} type="button" onMouseDown={() => updateMember(mIdx,'role',r)}
                                  className="w-full text-left px-3.5 py-2.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-b border-gray-50 dark:border-gray-700/50 last:border-0 transition-colors">
                                  {r}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-end gap-1.5">
                          <button type="button" onClick={() => setActiveTaskMember(isTaskOpen ? null : mIdx)}
                            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-[11px] font-semibold border-2 transition-all whitespace-nowrap ${isTaskOpen ? 'bg-[#0C2B4E] text-white border-[#0C2B4E]' : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-[#0C2B4E]/40'}`}>
                            <ClipboardList size={13}/>
                            Tasks {member.tasks.length > 0 && <span className="ml-0.5 px-1 rounded font-bold">{member.tasks.length}</span>}
                          </button>
                          {form.team.length > 1 && (
                            <button type="button" onClick={() => removeMember(mIdx)} className="p-2.5 rounded-xl text-gray-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all border-2 border-transparent hover:border-rose-100 dark:hover:border-rose-900/30">
                              <X size={14}/>
                            </button>
                          )}
                        </div>
                      </div>

                      {emp && (
                        <div className="mt-2.5 flex items-center gap-2.5 px-3 py-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700/60 ap-in">
                          <Avatar name={emp.name} size="sm"/>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">{emp.name}</p>
                            <p className="text-[11px] text-gray-400 truncate">{emp.email}</p>
                          </div>
                          {member.role && <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-[#0C2B4E]/10 dark:bg-[#0C2B4E]/25 text-[#0C2B4E] dark:text-[#4d9de0] font-bold whitespace-nowrap">{member.role}</span>}
                        </div>
                      )}
                    </div>

                    {isTaskOpen && (
                      <div className="p-3.5 border-t border-gray-100 dark:border-gray-800 ap-up">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Tasks · {emp?.name || 'Member'}</p>
                          <button type="button" onClick={() => addTask(mIdx)} className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-[#0C2B4E] dark:text-[#4d9de0] border border-[#0C2B4E]/20 dark:border-[#4d9de0]/30 rounded-lg hover:bg-[#0C2B4E]/5 transition-colors">
                            <Plus size={11}/> Add Task
                          </button>
                        </div>
                        {member.tasks.length === 0 ? (
                          <div className="text-center py-5 text-gray-300 dark:text-gray-600">
                            <ClipboardList size={22} className="mx-auto mb-1.5 opacity-50"/><p className="text-xs">No tasks yet</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {member.tasks.map((task, tIdx) => (
                              <div key={tIdx} className="bg-gray-50 dark:bg-gray-800/60 rounded-xl p-3 border border-gray-100 dark:border-gray-700/50">
                                <div className="flex items-start gap-2 mb-2">
                                  <input value={task.title} onChange={e => updateTask(mIdx,tIdx,'title',e.target.value)} placeholder="Task title *"
                                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:border-[#0C2B4E] transition-colors"/>
                                  <button type="button" onClick={() => removeTask(mIdx,tIdx)} className="p-1.5 text-gray-300 hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all flex-shrink-0"><X size={12}/></button>
                                </div>
                                <textarea value={task.description} onChange={e => updateTask(mIdx,tIdx,'description',e.target.value)} placeholder="Description (optional)" rows={2}
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-[11px] text-gray-600 dark:text-gray-300 resize-none focus:outline-none focus:border-[#0C2B4E] mb-2 transition-colors"/>
                                <div className="flex flex-wrap gap-1.5">
                                  <select value={task.priority} onChange={e => updateTask(mIdx,tIdx,'priority',e.target.value)} style={{colorScheme:'dark'}}
                                    className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-[11px] text-gray-600 dark:text-gray-300 focus:outline-none">
                                    {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                                  </select>
                                  <input type="date" value={task.deadline} onChange={e => updateTask(mIdx,tIdx,'deadline',e.target.value)} style={{colorScheme:'dark'}}
                                    className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-[11px] text-gray-600 dark:text-gray-300 focus:outline-none"/>
                                  {editProject && (
                                    <select value={task.status} onChange={e => updateTask(mIdx,tIdx,'status',e.target.value)} style={{colorScheme:'dark'}}
                                      className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-[11px] text-gray-600 dark:text-gray-300 focus:outline-none">
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

            <button type="button" onClick={addMember}
              className="mt-3 w-full py-2.5 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-400 hover:border-[#0C2B4E]/40 hover:text-[#0C2B4E] dark:hover:border-[#4d9de0]/40 dark:hover:text-[#4d9de0] transition-all font-semibold flex items-center justify-center gap-2">
              <Plus size={14}/> Add Another Member
            </button>
          </section>

          {/* Actions */}
          <div className="flex gap-3 pb-6">
            <button type="button" onClick={() => setView('list')}
              className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Cancel
            </button>
            <button type="button" onClick={handleSubmit} disabled={submitting}
              className="ap-btn flex-1 py-3 rounded-xl font-bold text-sm text-white">
              {submitting ? 'Saving…' : editProject ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── DETAIL VIEW ───────────────────────────────────────────────────────────────
  if (view === 'detail' && detailProject) {
    const p = detailProject; const delayed = isDelayed(p); const disp = delayed ? 'Delayed' : p.status;
    const allTasks  = (p.team || []).flatMap(m => m.tasks || []);
    const doneTasks = allTasks.filter(t => t.status === 'Done').length;
    const progress  = allTasks.length ? Math.round((doneTasks / allTasks.length) * 100) : 0;
    const sc = statusConfig(disp); const pc = priorityConfig(p.priority);

    return (
      <div className="ap-root min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-6 sm:px-8">
        <Styles/>
        <div className="max-w-4xl mx-auto space-y-4 ap-up">

          <div className="flex items-center justify-between">
            <button onClick={() => setView('list')} className="flex items-center gap-2 text-xs font-semibold text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors">
              <ArrowLeft size={15}/> Back to Projects
            </button>
            <div className="flex gap-2">
              <button onClick={() => openEdit(p)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#0C2B4E] dark:text-[#4d9de0] bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-[#0C2B4E]/40 transition-all shadow-sm">
                <Edit2 size={12}/> Edit
              </button>
              <button onClick={e => handleDelete(p._id, e)} className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-500 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all shadow-sm">
                <Trash2 size={12}/> Delete
              </button>
            </div>
          </div>

          {/* Hero */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
            <div className="h-1" style={{ background:`linear-gradient(90deg,${sc.bar},${BRAND2},#38bdf8)` }}/>
            <div className="p-6">
              {delayed && (
                <div className="mb-4 flex items-center gap-2 px-3.5 py-2.5 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-semibold">
                  <AlertTriangle size={14}/> This project is overdue — deadline has passed
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">{p.title}</h1>
                <Pill status={disp}/>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${pc.bg} ${pc.color}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${pc.dot}`}/>{p.priority}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{p.description}</p>

              {allTasks.length > 0 && (
                <div className="mt-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Overall Progress</span>
                    <span className="ap-mono text-xs font-semibold text-gray-600 dark:text-gray-300">{progress}% · {doneTasks}/{allTasks.length}</span>
                  </div>
                  <Bar value={progress}/>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
                {[
                  { label:'Start',   val:fmtDate(p.startDate), icon:<Calendar size={12}/> },
                  { label:'Due',     val:fmtDate(p.deadline),  icon:<Calendar size={12}/>, warn:delayed },
                  { label:'Team',    val:`${p.team?.length||0} members`, icon:<Users size={12}/> },
                  { label:'Tasks',   val:`${allTasks.length} total`,      icon:<ClipboardList size={12}/> },
                ].map((item, i) => (
                  <div key={i} className={`rounded-xl px-3.5 py-3 ${item.warn ? 'bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800/30' : 'bg-gray-50 dark:bg-gray-800/50'}`}>
                    <div className={`flex items-center gap-1 mb-1 text-[10px] font-bold uppercase tracking-widest ${item.warn ? 'text-rose-500' : 'text-gray-400'}`}>
                      {item.icon}{item.label}
                    </div>
                    <p className={`text-sm font-bold ${item.warn ? 'text-rose-600 dark:text-rose-400' : 'text-gray-800 dark:text-white'}`}>{item.val}</p>
                  </div>
                ))}
              </div>

              {p.notes && (
                <div className="mt-4 px-4 py-3 bg-amber-50 dark:bg-amber-900/15 border border-amber-100 dark:border-amber-800/30 rounded-xl">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400 mb-1">Notes</p>
                  <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">{p.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Team & Tasks */}
          <div className="space-y-3">
            {(p.team || []).map((member, mIdx) => {
              const emp = member.userId; const tasks = member.tasks || [];
              const mDone = tasks.filter(t => t.status === 'Done').length;
              const mProg = tasks.length ? Math.round((mDone / tasks.length) * 100) : 0;
              const expanded = expandedEmp === mIdx;
              return (
                <div key={mIdx} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                  <button className="w-full px-5 py-4 flex items-center gap-3.5 hover:bg-gray-50/60 dark:hover:bg-gray-800/30 transition-colors"
                    onClick={() => setExpandedEmp(expanded ? null : mIdx)}>
                    <Avatar name={emp?.name || '?'} size="md"/>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{emp?.name || 'Unknown'}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0C2B4E]/8 dark:bg-[#0C2B4E]/25 text-[#0C2B4E] dark:text-[#4d9de0] font-bold border border-[#0C2B4E]/10 dark:border-[#4d9de0]/20">{member.role}</span>
                      </div>
                      <p className="text-xs text-gray-400">{emp?.email}</p>
                      {tasks.length > 0 && (
                        <div className="flex items-center gap-2 mt-2 max-w-xs">
                          <Bar value={mProg} color="#10b981" thin/>
                          <span className="text-[11px] ap-mono text-gray-400 whitespace-nowrap">{mDone}/{tasks.length}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {tasks.length > 0 && <span className="text-[11px] ap-mono font-bold text-gray-400">{tasks.length}t</span>}
                      <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        {expanded ? <ChevronUp size={13} className="text-gray-400"/> : <ChevronDown size={13} className="text-gray-400"/>}
                      </div>
                    </div>
                  </button>

                  {expanded && (
                    <div className="border-t border-gray-100 dark:border-gray-800 ap-up">
                      {tasks.length === 0 ? (
                        <div className="p-8 text-center text-gray-300 dark:text-gray-600">
                          <ClipboardList size={22} className="mx-auto mb-2 opacity-50"/><p className="text-xs">No tasks assigned</p>
                        </div>
                      ) : (
                        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {tasks.map((task, tIdx) => {
                            const ts = statusConfig(task.status); const tp = priorityConfig(task.priority);
                            return (
                              <div key={tIdx} className="p-3.5 rounded-xl border border-gray-100 dark:border-gray-700/60 bg-gray-50 dark:bg-gray-800/40">
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                  <p className="text-xs font-semibold text-gray-900 dark:text-white leading-snug">{task.title}</p>
                                  <Pill status={task.status}/>
                                </div>
                                {task.description && <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2 leading-relaxed">{task.description}</p>}
                                <div className="flex items-center gap-2 flex-wrap text-[11px]">
                                  <span className={`flex items-center gap-1 font-semibold ${tp.color}`}><span className={`w-1.5 h-1.5 rounded-full ${tp.dot}`}/>{task.priority}</span>
                                  {task.deadline && <span className="text-gray-400">· Due {fmtDate(task.deadline)}</span>}
                                  {task.completedAt && <span className="text-emerald-500">· ✓ {fmtDate(task.completedAt)}</span>}
                                </div>
                              </div>
                            );
                          })}
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

  // ── LIST VIEW ─────────────────────────────────────────────────────────────────
  return (
    <div className="ap-root min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-6 sm:px-6">
      <Styles/>
      <div className="max-w-7xl mx-auto space-y-5">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between ap-up">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Project Management</h1>
            <p className="text-xs text-gray-400 mt-0.5 ap-mono">{projects.length} total projects</p>
          </div>
          <button onClick={openCreate} className="ap-btn self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 text-sm font-bold text-white rounded-xl">
            <Plus size={16}/> New Project
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label:'Total',       value:stats.total      || 0, icon:<Layers size={17}/>,        iconStyle:{color:'#4d9de0'}, bgStyle:{background:'rgba(77,157,224,0.12)'} },
            { label:'Completed',   value:stats.completed  || 0, icon:<CheckCircle size={17}/>,   iconStyle:{color:'#10b981'}, bgStyle:{background:'rgba(16,185,129,0.12)'} },
            { label:'In Progress', value:stats.inProgress || 0, icon:<TrendingUp size={17}/>,    iconStyle:{color:'#f59e0b'}, bgStyle:{background:'rgba(245,158,11,0.12)'}  },
            { label:'Delayed',     value:stats.delayed    || 0, icon:<AlertTriangle size={17}/>, iconStyle:{color:'#f43f5e'}, bgStyle:{background:'rgba(244,63,94,0.12)'}  },
          ].map((s, i) => (
            <div key={s.label} className="ap-stat bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 flex items-center gap-3 shadow-sm ap-up" style={{animationDelay:`${i*0.06}s`}}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{...s.bgStyle, ...s.iconStyle}}>
                {s.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white ap-mono leading-none">{s.value}</p>
                <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-300 mt-0.5 uppercase tracking-wider">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Employee Summary */}
        {byEmployee.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm ap-up" style={{animationDelay:'0.26s'}}>
            <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-[#0C2B4E]/10 dark:bg-[#0C2B4E]/25 flex items-center justify-center flex-shrink-0">
                <Users size={12} color={BRAND}/>
              </div>
              <h2 className="text-sm font-bold text-gray-800 dark:text-white">Employee Summary</h2>
              <span className="ml-auto text-[11px] text-gray-400 ap-mono">{byEmployee.length} employees</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px]">
                <thead>
                  <tr className="border-b border-gray-50 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60">
                    {['Employee','Total','Completed','In Progress','Delayed',''].map(h => (
                      <th key={h} className="px-4 py-2.5 text-left text-[10px] font-bold uppercase tracking-widest text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {byEmployee.map(({ emp, projects:ep }, i) => {
                    const now = new Date();
                    const es  = {
                      total:      ep.length,
                      completed:  ep.filter(p => p.status === 'Completed').length,
                      inProgress: ep.filter(p => p.status === 'In Progress').length,
                      delayed:    ep.filter(p => p.status !== 'Completed' && new Date(p.deadline) < now).length,
                    };
                    return (
                      <tr key={emp._id}
                        className="ap-row border-b border-gray-50 dark:border-gray-800/60 last:border-0 cursor-pointer"
                        onClick={() => { const first = ep[0]; if (first) { setDetailProject(first); setView('detail'); } }}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={emp.name} size="sm"/>
                            <div>
                              <p className="text-xs font-semibold text-gray-800 dark:text-white">{emp.name}</p>
                              <p className="text-[11px] text-gray-400">{emp.department || '—'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3"><span className="ap-mono text-sm font-bold text-gray-800 dark:text-white">{es.total}</span></td>
                        <td className="px-4 py-3"><span className="ap-mono text-sm font-semibold text-emerald-500 dark:text-emerald-400">{es.completed}</span></td>
                        <td className="px-4 py-3"><span className="ap-mono text-sm font-semibold text-[#0C2B4E] dark:text-[#4d9de0]">{es.inProgress}</span></td>
                        <td className="px-4 py-3"><span className="ap-mono text-sm font-semibold text-rose-500 dark:text-rose-400">{es.delayed}</span></td>
                        <td className="px-4 py-3">
                          <span className="text-[11px] font-bold text-[#0C2B4E] dark:text-[#4d9de0]">View →</span>
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
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm ap-up" style={{animationDelay:'0.32s'}}>
          <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-800 dark:text-white">All Projects</h2>
              <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 text-[11px] font-bold ap-mono">{filtered.length}</span>
            </div>
            <div className="flex gap-2">
              <div className="relative">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search projects…"
                  className="pl-8 pr-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0C2B4E]/15 focus:border-[#0C2B4E] dark:focus:border-[#4d9de0] transition-all w-36 sm:w-48"/>
              </div>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{colorScheme:'dark'}}
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-700 dark:text-white focus:outline-none">
                <option>All</option>
                {STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 text-center ap-in">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                <Briefcase size={20} className="text-gray-300 dark:text-gray-600"/>
              </div>
              <p className="text-sm font-semibold text-gray-400">No projects found</p>
              <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">Adjust your search or filters</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 p-4">
              {filtered.map((p, i) => {
                const delayed = isDelayed(p); const disp = delayed ? 'Delayed' : p.status;
                const allT  = (p.team || []).flatMap(m => m.tasks || []);
                const doneT = allT.filter(t => t.status === 'Done').length;
                const prog  = allT.length ? Math.round((doneT / allT.length) * 100) : 0;
                const sc = statusConfig(disp); const pc = priorityConfig(p.priority);
                return (
                  <div key={p._id}
                    className="ap-card group border border-gray-200 dark:border-gray-800 rounded-2xl bg-white dark:bg-gray-900 cursor-pointer overflow-hidden ap-up"
                    style={{animationDelay:`${i*0.05}s`}}
                    onClick={() => { setDetailProject(p); setView('detail'); }}>

                    {/* Status stripe */}
                    <div className="h-0.5" style={{background:sc.bar}}/>

                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-snug line-clamp-2 flex-1">{p.title}</h3>
                        <Pill status={disp}/>
                      </div>

                      <p className="text-[11px] text-gray-400 mb-3 line-clamp-2 leading-relaxed">{p.description}</p>

                      {/* Meta */}
                      <div className="flex items-center gap-3 mb-3 text-[11px] text-gray-400">
                        <span className={`flex items-center gap-1 font-semibold ${pc.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${pc.dot}`}/>{p.priority}
                        </span>
                        <span className={`flex items-center gap-1 ${delayed ? 'text-rose-500 font-semibold' : ''}`}>
                          <Calendar size={10}/>
                          {delayed ? 'Overdue · ' : ''}{fmtDate(p.deadline)}
                        </span>
                      </div>

                      {/* Progress */}
                      {allT.length > 0 && (
                        <div className="mb-3">
                          <div className="flex justify-between text-[11px] mb-1.5">
                            <span className="text-gray-400 font-medium">Tasks</span>
                            <span className="ap-mono font-semibold text-gray-600 dark:text-gray-300">{prog}%</span>
                          </div>
                          <Bar value={prog}/>
                        </div>
                      )}

                      {/* Avatars */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {(p.team || []).slice(0,5).map((m, i) => (
                            <div key={i} title={m.userId?.name || ''} style={{marginLeft:i>0?'-6px':'0',zIndex:10-i,position:'relative'}}>
                              <Avatar name={m.userId?.name || '?'} size="sm"/>
                            </div>
                          ))}
                          {(p.team || []).length > 5 && <span className="ml-1.5 text-[11px] text-gray-400 font-semibold">+{p.team.length - 5}</span>}
                        </div>
                        <span className="text-[11px] text-gray-400 ap-mono">{p.team?.length || 0}m · {allT.length}t</span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-1 mt-3 pt-3 border-t border-gray-50 dark:border-gray-800" onClick={e => e.stopPropagation()}>
                        <button onClick={() => openEdit(p)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-[#0C2B4E] dark:text-[#4d9de0] hover:bg-[#0C2B4E]/6 dark:hover:bg-[#4d9de0]/10 rounded-lg transition-colors">
                          <Edit2 size={11}/> Edit
                        </button>
                        <button onClick={e => handleDelete(p._id, e)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/15 rounded-lg transition-colors">
                          <Trash2 size={11}/> Delete
                        </button>
                      </div>
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