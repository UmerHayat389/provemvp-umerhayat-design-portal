// src/services/socketService.js
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

let socket = null;

const socketService = {
  connect() {
    if (!socket) {
      socket = io(SOCKET_URL, { withCredentials: true, transports: ['websocket'] });
    }
    return socket;
  },

  joinRoom(userId) {
    if (socket && userId) socket.emit('join', userId);
  },

  on(event, callback) {
    if (socket) socket.on(event, callback);
  },

  off(event, callback) {
    if (socket) socket.off(event, callback);
  },

  disconnect() {
    if (socket) { socket.disconnect(); socket = null; }
  },

  getSocket() { return socket; },
};

export default socketService;