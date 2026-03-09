// src/hooks/useSocket.js
import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

let socketInstance = null;

export const getSocket = () => {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });
  }
  return socketInstance;
};

/**
 * useSocket(userId)
 * - Connects socket once, joins the user's room
 * - Returns the socket instance
 */
const useSocket = (userId) => {
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = getSocket();
    socketRef.current = socket;

    if (userId) {
      socket.emit('join', userId);
      // Also join the admin broadcast room so admins get all events
      socket.emit('join', 'admin');
    }

    return () => {
      // Don't disconnect — keep singleton alive across routes
    };
  }, [userId]);

  return socketRef.current;
};

export default useSocket;