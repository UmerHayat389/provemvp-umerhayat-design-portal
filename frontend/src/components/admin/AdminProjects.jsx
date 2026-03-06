// src/components/admin/AdminProjects.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { projectAPI, userAPI } from '../../services/api';
import socketService from '../../services/socketService';
import { toast } from 'react-toastify';
import {
  Briefcase, Plus, X, Eye, Trash2, Edit2,
  Clock, CheckCircle, AlertTriangle, ChevronDown, ChevronUp,
} from 'lucide-react';

const BRAND = '#0C2B4E';

const statusColor = (status) => ({
  'Completed':   'bg-green-100  text-green-700  border-green-300',
  'In Progress': 'bg-blue-100   text-blue-700   border-blue-300',
  'Delayed':     'bg-red-100    text-red-700    border-red-300',
  'Not Started': 'bg-gray-100   text-gray-600   border-gray-300',
}[status] || 'bg-gray-100 text-gray-600');

const priorityColor = (p) => ({
  High:   'bg-red-100 text-red-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  Low:    'bg-green-100 text-green-700',
}[p] || '');

const isDelayed = (p) => p.status !== 'Completed' && new Date() > new Date(p.deadline);

const emptyForm = {
  title: '', description: '', assignedTo: '',
  deadline: '', priority: 'Medium', notes: '', startDate: '',
};

export default function AdminProjects() {
  const [projects,       setProjects]       = useState([]);
  const [employees,      setEmployees]      = useState([]);
  const [stats,          setStats]          = useState({});
  const [loading,        setLoading]        = useState(true);
  const [showModal,      setShowModal]      = useState(false);
  const [detailProject,  setDetailProject]  = useState(null);
  const [editProject,    setEditProject]    = useState(null);
  const [expandedEmp,    setExpandedEmp]    = useState(null);
  const [form,           setForm]           = useState(emptyForm);
  const [submitting,     setSubmitting]     = useState(false);
  const [searchTerm,     setSearchTerm]     = useState('');
  const [filterStatus,   setFilterStatus]   = useState('All');

  const fetchAll = useCallback(async () => {
    try {
      const [pRes, sRes, uRes] = await Promise.all([
        projectAPI.getAllProjects(),
        projectAPI.getProjectStats(),
        userAPI.getUsers(),
      ]);
      setProjects(pRes.data.projects);
      setStats(sRes.data.stats);
      setEmployees(uRes.data.filter(u => u.role === 'Employee'));
    } catch {
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const socket = socketService.getSocket();
    if (socket) {
      socket.on('project:updated', fetchAll);
      socket.on('project:deleted', fetchAll);
    }
    return () => {
      if (socket) { socket.off('project:updated', fetchAll); socket.off('project:deleted', fetchAll); }
    };
  }, [fetchAll]);

  const openCreate = () => { setEditProject(null); setForm(emptyForm); setShowModal(true); };
  const openEdit   = (p) => {
    setEditProject(p);
    setForm({
      title: p.title, description: p.description,
      assignedTo: p.assignedTo._id, deadline: p.deadline?.slice(0,10),
      priority: p.priority, notes: p.notes || '',
      startDate: p.startDate?.slice(0,10) || '',
      status: p.status,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.assignedTo || !form.deadline) {
      return toast.error('Please fill all required fields');
    }
    setSubmitting(true);
    try {
      if (editProject) {
        await projectAPI.updateProject(editProject._id, form);
        toast.success('Project updated!');
      } else {
        await projectAPI.createProject(form);
        toast.success('Project assigned!');
      }
      setShowModal(false);
      fetchAll();
    } catch {
      toast.error('Failed to save project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project?')) return;
    try {
      await projectAPI.deleteProject(id);
      toast.success('Deleted');
      fetchAll();
    } catch {
      toast.error('Failed to delete');
    }
  };

  // Group projects by employee
  const byEmployee = employees.map(emp => ({
    emp,
    projects: projects.filter(p => p.assignedTo?._id === emp._id),
  })).filter(e => e.projects.length > 0);

  const filtered = projects.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.assignedTo?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === 'All' || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#0C2B4E] border-t-transparent" />
    </div>
  );

  return (
    <div className="p-4 space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Briefcase size={28} color={BRAND} />
          <h1 className="text-2xl font-bold text-[#0C2B4E] dark:text-white">Project Management</h1>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-[#0C2B4E] text-white rounded-xl hover:bg-[#1a4d7a] transition-all"
        >
          <Plus size={18} /> Assign Project
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total',       value: stats.total || 0,       icon: <Briefcase size={20} />,    color: 'bg-[#0C2B4E]' },
          { label: 'Completed',   value: stats.completed || 0,   icon: <CheckCircle size={20} />,  color: 'bg-green-600'  },
          { label: 'In Progress', value: stats.inProgress || 0,  icon: <Clock size={20} />,        color: 'bg-blue-600'   },
          { label: 'Delayed',     value: stats.delayed || 0,     icon: <AlertTriangle size={20} />, color: 'bg-red-600'   },
        ].map(s => (
          <div key={s.label} className={`${s.color} text-white rounded-xl p-4 flex items-center gap-3 shadow`}>
            {s.icon}
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-sm opacity-90">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Employee Summary Table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-4">
        <h2 className="text-lg font-bold text-[#0C2B4E] dark:text-white mb-4">Employee Project Summary</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#0C2B4E] text-white">
                {['Employee', 'Total', 'Completed', 'In Progress', 'Delayed', 'Details'].map(h => (
                  <th key={h} className="px-4 py-3 text-left rounded">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {byEmployee.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No projects assigned yet</td></tr>
              ) : byEmployee.map(({ emp, projects: ep }) => {
                const now = new Date();
                const empStats = {
                  total:      ep.length,
                  completed:  ep.filter(p => p.status === 'Completed').length,
                  inProgress: ep.filter(p => p.status === 'In Progress').length,
                  delayed:    ep.filter(p => p.status !== 'Completed' && new Date(p.deadline) < now).length,
                };
                return (
                  <React.Fragment key={emp._id}>
                    <tr
                      className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      onClick={() => setExpandedEmp(expandedEmp === emp._id ? null : emp._id)}
                    >
                      <td className="px-4 py-3 font-semibold text-[#0C2B4E] dark:text-white flex items-center gap-2">
                        {expandedEmp === emp._id ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
                        {emp.name}
                        <span className="text-xs text-gray-400">{emp.department}</span>
                      </td>
                      <td className="px-4 py-3">{empStats.total}</td>
                      <td className="px-4 py-3 text-green-600 font-medium">{empStats.completed}</td>
                      <td className="px-4 py-3 text-blue-600 font-medium">{empStats.inProgress}</td>
                      <td className="px-4 py-3 text-red-600 font-medium">{empStats.delayed}</td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-[#0C2B4E] underline">
                          {expandedEmp === emp._id ? 'Hide' : 'View'} Projects
                        </span>
                      </td>
                    </tr>
                    {expandedEmp === emp._id && ep.map(p => {
                      const delayed = isDelayed(p);
                      const displayStatus = delayed ? 'Delayed' : p.status;
                      return (
                        <tr key={p._id} className="bg-gray-50 dark:bg-gray-800 border-b dark:border-gray-700">
                          <td className="px-8 py-2 text-sm" colSpan={2}>
                            <span className="font-medium">{p.title}</span>
                            {delayed && <span className="ml-2 text-xs text-red-600 font-bold">⚠ LATE</span>}
                          </td>
                          <td className="px-4 py-2" colSpan={2}>
                            <span className={`text-xs px-2 py-1 rounded-full border ${statusColor(displayStatus)}`}>
                              {displayStatus}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-500">
                            Due: {new Date(p.deadline).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2">
                            <div className="flex gap-2">
                              <button onClick={() => setDetailProject(p)} className="text-[#0C2B4E] hover:opacity-70"><Eye size={15}/></button>
                              <button onClick={() => openEdit(p)} className="text-blue-600 hover:opacity-70"><Edit2 size={15}/></button>
                              <button onClick={() => handleDelete(p._id)} className="text-red-500 hover:opacity-70"><Trash2 size={15}/></button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* All Projects List */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow p-4">
        <div className="flex flex-wrap gap-3 items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#0C2B4E] dark:text-white">All Projects</h2>
          <div className="flex gap-2 flex-wrap">
            <input
              placeholder="Search projects or employee..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white"
            />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 text-sm dark:bg-gray-800 dark:text-white"
            >
              {['All','Not Started','In Progress','Completed','Delayed'].map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.length === 0 ? (
            <p className="text-gray-400 col-span-3 text-center py-8">No projects found</p>
          ) : filtered.map(p => {
            const delayed = isDelayed(p);
            const displayStatus = delayed ? 'Delayed' : p.status;
            return (
              <div
                key={p._id}
                className="border dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setDetailProject(p)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-[#0C2B4E] dark:text-white">{p.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full border ${statusColor(displayStatus)}`}>
                    {displayStatus}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{p.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>👤 {p.assignedTo?.name}</span>
                  <span className={delayed ? 'text-red-600 font-bold' : ''}>
                    {delayed ? '⚠ LATE · ' : ''}Due: {new Date(p.deadline).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex gap-2 mt-3" onClick={e => e.stopPropagation()}>
                  <span className={`text-xs px-2 py-1 rounded-full ${priorityColor(p.priority)}`}>{p.priority}</span>
                  <button onClick={() => openEdit(p)} className="ml-auto text-blue-500 hover:opacity-70"><Edit2 size={14}/></button>
                  <button onClick={() => handleDelete(p._id)} className="text-red-500 hover:opacity-70"><Trash2 size={14}/></button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
              <h2 className="text-xl font-bold text-[#0C2B4E] dark:text-white">
                {editProject ? 'Edit Project' : 'Assign New Project'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {[
                { label: 'Project Title *', key: 'title', type: 'text' },
                { label: 'Start Date', key: 'startDate', type: 'date' },
                { label: 'Deadline *', key: 'deadline', type: 'date' },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
                  <input
                    type={type}
                    value={form[key]}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-white text-sm"
                  />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description *</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assign To *</label>
                <select
                  value={form.assignedTo}
                  onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}
                  className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-white text-sm"
                >
                  <option value="">Select Employee</option>
                  {employees.map(e => (
                    <option key={e._id} value={e._id}>{e.name} — {e.department}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
                  <select
                    value={form.priority}
                    onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                    className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-white text-sm"
                  >
                    {['Low','Medium','High'].map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                {editProject && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                    <select
                      value={form.status}
                      onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                      className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-white text-sm"
                    >
                      {['Not Started','In Progress','Completed','Delayed'].map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Admin Notes</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full border dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-800 dark:text-white text-sm"
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full bg-[#0C2B4E] text-white py-3 rounded-xl font-semibold hover:bg-[#1a4d7a] transition-all disabled:opacity-50"
              >
                {submitting ? 'Saving...' : editProject ? 'Update Project' : 'Assign Project'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {detailProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b dark:border-gray-700">
              <h2 className="text-xl font-bold text-[#0C2B4E] dark:text-white">{detailProject.title}</h2>
              <button onClick={() => setDetailProject(null)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              {isDelayed(detailProject) && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 font-semibold">
                  ⚠ This project is LATE — deadline has passed!
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-gray-400 text-xs">Status</p>
                  <span className={`text-xs px-2 py-1 rounded-full border ${statusColor(isDelayed(detailProject) ? 'Delayed' : detailProject.status)}`}>
                    {isDelayed(detailProject) ? 'Delayed' : detailProject.status}
                  </span>
                </div>
                <div><p className="text-gray-400 text-xs">Priority</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${priorityColor(detailProject.priority)}`}>{detailProject.priority}</span>
                </div>
                <div><p className="text-gray-400 text-xs">Assigned To</p><p className="font-medium">{detailProject.assignedTo?.name}</p></div>
                <div><p className="text-gray-400 text-xs">Department</p><p className="font-medium">{detailProject.assignedTo?.department || '—'}</p></div>
                <div><p className="text-gray-400 text-xs">Start Date</p><p className="font-medium">{detailProject.startDate ? new Date(detailProject.startDate).toLocaleDateString() : '—'}</p></div>
                <div><p className="text-gray-400 text-xs">Deadline</p><p className={`font-medium ${isDelayed(detailProject) ? 'text-red-600' : ''}`}>{new Date(detailProject.deadline).toLocaleDateString()}</p></div>
                {detailProject.completedAt && (
                  <div><p className="text-gray-400 text-xs">Completed At</p><p className="font-medium text-green-600">{new Date(detailProject.completedAt).toLocaleDateString()}</p></div>
                )}
              </div>
              <div><p className="text-gray-400 text-xs mb-1">Description</p><p className="text-gray-700 dark:text-gray-300">{detailProject.description}</p></div>
              {detailProject.notes && (
                <div><p className="text-gray-400 text-xs mb-1">Admin Notes</p><p className="text-gray-700 dark:text-gray-300">{detailProject.notes}</p></div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { openEdit(detailProject); setDetailProject(null); }}
                  className="flex-1 bg-[#0C2B4E] text-white py-2 rounded-xl hover:bg-[#1a4d7a] transition-all text-sm font-medium"
                >
                  Edit Project
                </button>
                <button
                  onClick={() => { handleDelete(detailProject._id); setDetailProject(null); }}
                  className="flex-1 bg-red-500 text-white py-2 rounded-xl hover:bg-red-600 transition-all text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}