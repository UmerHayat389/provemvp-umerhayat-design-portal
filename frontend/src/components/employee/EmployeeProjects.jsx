// src/components/employee/EmployeeProjects.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { projectAPI } from '../../services/api';
import socketService from '../../services/socketService';
import { toast } from 'react-toastify';
import { Briefcase, X, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

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

export default function EmployeeProjects({ user }) {
  const [projects,      setProjects]      = useState([]);
  const [stats,         setStats]         = useState({});
  const [loading,       setLoading]       = useState(true);
  const [detailProject, setDetailProject] = useState(null);
  const [updating,      setUpdating]      = useState(null);

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

  const handleStatusUpdate = async (projectId, newStatus) => {
    setUpdating(projectId);
    try {
      await projectAPI.updateProject(projectId, { status: newStatus });
      toast.success(`Marked as ${newStatus}`);
      fetchProjects();
      if (detailProject?._id === projectId) {
        setDetailProject(p => ({ ...p, status: newStatus }));
      }
    } catch {
      toast.error('Failed to update status');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#0C2B4E] border-t-transparent" />
    </div>
  );

  return (
    <div className="p-4 space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Briefcase size={28} color="#0C2B4E" />
        <h1 className="text-2xl font-bold text-[#0C2B4E] dark:text-white">My Projects</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total',       value: stats.total || 0,      icon: <Briefcase size={20} />,     color: 'bg-[#0C2B4E]' },
          { label: 'Completed',   value: stats.completed || 0,  icon: <CheckCircle size={20} />,   color: 'bg-green-600'  },
          { label: 'In Progress', value: stats.inProgress || 0, icon: <Clock size={20} />,         color: 'bg-blue-600'   },
          { label: 'Delayed',     value: stats.delayed || 0,    icon: <AlertTriangle size={20} />, color: 'bg-red-600'    },
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

      {/* Project Cards */}
      {projects.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-12 text-center shadow">
          <Briefcase size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No projects assigned to you yet.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map(p => {
            const delayed = isDelayed(p);
            const displayStatus = delayed ? 'Delayed' : p.status;
            return (
              <div
                key={p._id}
                className="bg-white dark:bg-gray-900 border dark:border-gray-700 rounded-xl p-4 shadow hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setDetailProject(p)}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-[#0C2B4E] dark:text-white pr-2">{p.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full border whitespace-nowrap ${statusColor(displayStatus)}`}>
                    {displayStatus}
                  </span>
                </div>

                {delayed && (
                  <div className="text-xs text-red-600 font-semibold mb-2">⚠ This project is LATE</div>
                )}

                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{p.description}</p>

                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <span className={`${priorityColor(p.priority)} px-2 py-0.5 rounded-full`}>{p.priority} Priority</span>
                  <span className={delayed ? 'text-red-600 font-bold' : ''}>
                    Due: {new Date(p.deadline).toLocaleDateString()}
                  </span>
                </div>

                {/* Quick action buttons */}
                <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                  {p.status !== 'In Progress' && p.status !== 'Completed' && (
                    <button
                      disabled={updating === p._id}
                      onClick={() => handleStatusUpdate(p._id, 'In Progress')}
                      className="flex-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 py-1.5 rounded-lg hover:bg-blue-100 transition-all disabled:opacity-50"
                    >
                      Start
                    </button>
                  )}
                  {p.status !== 'Completed' && (
                    <button
                      disabled={updating === p._id}
                      onClick={() => handleStatusUpdate(p._id, 'Completed')}
                      className="flex-1 text-xs bg-green-50 text-green-700 border border-green-200 py-1.5 rounded-lg hover:bg-green-100 transition-all disabled:opacity-50"
                    >
                      Mark Complete
                    </button>
                  )}
                  {p.status === 'Completed' && (
                    <div className="flex-1 text-xs text-center text-green-600 font-semibold py-1.5">
                      ✓ Completed
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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
                <div>
                  <p className="text-gray-400 text-xs mb-1">Status</p>
                  <span className={`text-xs px-2 py-1 rounded-full border ${statusColor(isDelayed(detailProject) ? 'Delayed' : detailProject.status)}`}>
                    {isDelayed(detailProject) ? 'Delayed' : detailProject.status}
                  </span>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Priority</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${priorityColor(detailProject.priority)}`}>{detailProject.priority}</span>
                </div>
                <div><p className="text-gray-400 text-xs">Assigned By</p><p className="font-medium">{detailProject.assignedBy?.name}</p></div>
                <div><p className="text-gray-400 text-xs">Start Date</p><p className="font-medium">{detailProject.startDate ? new Date(detailProject.startDate).toLocaleDateString() : '—'}</p></div>
                <div>
                  <p className="text-gray-400 text-xs">Deadline</p>
                  <p className={`font-medium ${isDelayed(detailProject) ? 'text-red-600 font-bold' : ''}`}>
                    {new Date(detailProject.deadline).toLocaleDateString()}
                  </p>
                </div>
                {detailProject.completedAt && (
                  <div><p className="text-gray-400 text-xs">Completed On</p><p className="font-medium text-green-600">{new Date(detailProject.completedAt).toLocaleDateString()}</p></div>
                )}
              </div>

              <div>
                <p className="text-gray-400 text-xs mb-1">Description</p>
                <p className="text-gray-700 dark:text-gray-300">{detailProject.description}</p>
              </div>

              {detailProject.notes && (
                <div>
                  <p className="text-gray-400 text-xs mb-1">Admin Notes</p>
                  <p className="text-gray-700 dark:text-gray-300">{detailProject.notes}</p>
                </div>
              )}

              {/* Status update actions */}
              {detailProject.status !== 'Completed' && (
                <div className="flex gap-3 pt-2">
                  {detailProject.status !== 'In Progress' && (
                    <button
                      disabled={updating === detailProject._id}
                      onClick={() => handleStatusUpdate(detailProject._id, 'In Progress')}
                      className="flex-1 bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition-all text-sm font-medium disabled:opacity-50"
                    >
                      Start Project
                    </button>
                  )}
                  <button
                    disabled={updating === detailProject._id}
                    onClick={() => { handleStatusUpdate(detailProject._id, 'Completed'); setDetailProject(null); }}
                    className="flex-1 bg-green-600 text-white py-2 rounded-xl hover:bg-green-700 transition-all text-sm font-medium disabled:opacity-50"
                  >
                    Mark Complete
                  </button>
                </div>
              )}
              {detailProject.status === 'Completed' && (
                <div className="text-center text-green-600 font-semibold py-2">✓ Project Completed</div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}