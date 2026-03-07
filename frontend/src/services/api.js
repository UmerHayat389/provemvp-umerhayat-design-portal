// src/services/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000, // ← FIX: 15s timeout so failed requests error quickly instead of hanging forever
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // ← FIX: add helpful console message so you can see exactly what failed
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK' || !error.response) {
      console.error(
        '🔴 API Network Error — is your backend running on',
        API_BASE_URL,
        error.message
      );
    }
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login:          (credentials) => api.post('/auth/login', credentials),
  getMe:          ()            => api.get('/auth/me'),
  changePassword: (data)        => api.post('/auth/change-password', data),
};

export const userAPI = {
  getUsers:   ()             => api.get('/users'),
  createUser: (userData)     => api.post('/users', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id)           => api.delete(`/users/${id}`),
};

export const attendanceAPI = {
  clockIn:         ()     => api.post('/attendance/clock-in'),
  clockOut:        ()     => api.post('/attendance/clock-out'),
  getMyRecords:    ()     => api.get('/attendance/my-records'),
  getAllRecords:    ()     => api.get('/attendance/all-records'),
  markStatus:      (data) => api.post('/attendance/mark-status', data),
  adminMarkStatus: (data) => api.post('/attendance/admin-mark-status', data),
};

export const leaveAPI = {
  applyLeave:        (leaveData)  => api.post('/leaves', leaveData),
  getLeaves:         ()           => api.get('/leaves'),
  getMyLeaves:       ()           => api.get('/leaves/my-leaves'),
  updateLeaveStatus: (id, status) => api.put(`/leaves/${id}/status`, { status }),
};

export const dashboardAPI = {
  getAdminStats:    () => api.get('/dashboard/admin'),
  getEmployeeStats: () => api.get('/dashboard/employee'),
};



export const projectAPI = {
  getAllProjects:       ()                          => api.get('/projects'),
  getProjectStats:     ()                          => api.get('/projects/stats'),
  getEmployeeProjects: (employeeId)                => api.get(`/projects/employee/${employeeId}`),
  createProject:       (data)                      => api.post('/projects', data),
  updateProject:       (id, data)                  => api.put(`/projects/${id}`, data),       // admin only
  deleteProject:       (id)                        => api.delete(`/projects/${id}`),
  getMyProjects:       ()                          => api.get('/projects/my-projects'),
  getMyProjectStats:   ()                          => api.get('/projects/my-stats'),
  updateTaskStatus:    (projectId, taskId, status) => api.put(`/projects/${projectId}/task`, { taskId, status }), // ← ADD THIS
};

export default api;