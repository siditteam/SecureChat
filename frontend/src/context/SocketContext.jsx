import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { enqueue, dequeueAll } from '../utils/offlineQueue';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const flushQueue = useCallback(async (s) => {
    try {
      const items = await dequeueAll();
      if (!items.length) return;
      setPendingCount(0);
      for (const item of items) {
        const { id: _id, queuedAt: _queuedAt, ...payload } = item;
        s.emit('send_message', payload);
      }
    } catch { /* IndexedDB may be unavailable */ }
  }, []);

  // Send a message: if connected, emit immediately; if offline, enqueue
  const sendMessage = useCallback((payload, callback) => {
    if (socket?.connected) {
      socket.emit('send_message', payload, callback);
    } else {
      enqueue(payload).then(() => setPendingCount((n) => n + 1));
      callback?.({ success: false, queued: true });
    }
  }, [socket]);

  useEffect(() => {
    if (!user) {
      setSocket((prev) => { prev?.disconnect(); return null; });
      setConnected(false);
      return;
    }

    const token = localStorage.getItem('token');
    const s = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 5,
    });

    s.on('connect', () => {
      setConnected(true);
      flushQueue(s);
    });
    s.on('disconnect', () => setConnected(false));

    // Another device logged in — mark this session as replaced
    s.on('session_replaced', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('privateKey');
      s.disconnect();
      window.dispatchEvent(new CustomEvent('unddr:session_replaced'));
    });

    setSocket(s);
    return () => { s.disconnect(); };
  }, [user, flushQueue]);

  return (
    <SocketContext.Provider value={{ socket, connected, pendingCount, sendMessage }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
