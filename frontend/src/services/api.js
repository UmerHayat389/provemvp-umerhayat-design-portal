// src/services/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Global 401 handler
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── AUTH ──────────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.post('/auth/change-password', data),
};

// ── USERS ─────────────────────────────────────────────────────────────────────
export const userAPI = {
  getUsers: () => api.get('/users'),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
};

// ── ATTENDANCE ────────────────────────────────────────────────────────────────
export const attendanceAPI = {
  clockIn: () => api.post('/attendance/clock-in'),
  clockOut: () => api.post('/attendance/clock-out'),

  // Employee: fetch own records
  getMyRecords: () => api.get('/attendance/my-records'),

  // Admin: fetch all records
  getAllRecords: () => api.get('/attendance/all-records'),

  /**
   * Admin mark / override attendance for any employee on any date.
   * Body: { userId: string, date: 'YYYY-MM-DD', status: 'Present'|'Absent'|'Leave' }
   *
   * Employee self-mark (today only):
   * Body: { status: 'Present'|'Absent'|'Leave' }
   */
  markStatus: (data) => api.post('/attendance/mark-status', data),
};

// ── LEAVES ────────────────────────────────────────────────────────────────────
export const leaveAPI = {
  applyLeave: (leaveData) => api.post('/leaves', leaveData),
  getLeaves: () => api.get('/leaves'),                                 // Admin: all
  getMyLeaves: () => api.get('/leaves/my-leaves'),                     // Employee: own
  updateLeaveStatus: (id, status) => api.put(`/leaves/${id}/status`, { status }), // Admin: approve/reject
};

// ── DASHBOARD ─────────────────────────────────────────────────────────────────
export const dashboardAPI = {
  getAdminStats: () => api.get('/dashboard/admin'),
  getEmployeeStats: () => api.get('/dashboard/employee'),
};

export default api;