import React, { createContext, useContext, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, Bell } from 'lucide-react';

const ToastContext = createContext(null);

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] space-y-3 flex flex-col items-end pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className={`px-4 py-4 min-w-[300px] rounded-2xl shadow-xl border flex items-center gap-3 bg-white pointer-events-auto`}
            >
              {toast.type === 'success' && <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />}
              {toast.type === 'error' && <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />}
              {toast.type === 'info' && <Info className="w-6 h-6 text-blue-500 flex-shrink-0" />}
              {toast.type === 'queue' && <Bell className="w-6 h-6 text-primary-500 flex-shrink-0" />}
              
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900">{
                  toast.type === 'success' ? 'Success' : 
                  toast.type === 'error' ? 'Error' : 
                  toast.type === 'queue' ? 'Notification' : 'Info'
                }</p>
                <p className="text-sm text-slate-600">{toast.message}</p>
              </div>
              
              <button onClick={() => removeToast(toast.id)} className="text-slate-400 hover:text-slate-600 ml-2">
                &times;
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};
