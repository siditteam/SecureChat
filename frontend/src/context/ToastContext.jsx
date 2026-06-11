import React, { createContext, useState, useContext, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const show = useCallback((message, opts = {}) => {
    const id = Math.random().toString(36).slice(2);
    const t = { id, message, type: opts.type || 'info' };
    setToasts((s) => [t, ...s]);
    setTimeout(() => setToasts((s) => s.filter((x) => x.id !== id)), opts.duration || 3500);
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className={`px-4 py-2 rounded-lg text-sm shadow-md ${t.type === 'error' ? 'bg-red-600 text-white' : 'bg-white/10 text-white'}`}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

export default ToastContext;
