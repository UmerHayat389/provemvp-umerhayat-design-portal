// src/services/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============ AUTH API ============
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),

  // Forgot Password — single step
  // POST /auth/change-password → body: { email, oldPassword, newPassword }
  changePassword: (data) => api.post('/auth/change-password', data),
};

// ============ USER API ============
export const userAPI = {
  getUsers: () => api.get('/users'),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
};

// ============ ATTENDANCE API ============
export const attendanceAPI = {
  clockIn: () => api.post('/attendance/clock-in'),
  clockOut: () => api.post('/attendance/clock-out'),
  getMyRecords: () => api.get('/attendance/my-records'),
  getAllRecords: () => api.get('/attendance/all-records'),       // Admin only
  markStatus: (data) => api.post('/attendance/mark-status', data), // { status: 'Present'|'Absent'|'Leave' }
};

// ============ LEAVE API ============
export const leaveAPI = {
  applyLeave: (leaveData) => api.post('/leaves', leaveData),
  getLeaves: () => api.get('/leaves'),
  updateLeaveStatus: (id, status) => api.put(`/leaves/${id}/status`, { status }),
  getMyLeaves: () => api.get('/leaves/my-leaves'),
};

// ============ DASHBOARD API ============
export const dashboardAPI = {
  getAdminStats: () => api.get('/dashboard/admin'),
  getEmployeeStats: () => api.get('/dashboard/employee'),
};

export default api;