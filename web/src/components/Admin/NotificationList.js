import React, { useState, useEffect } from 'react';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../../api';
import { Bell, X, Check, BellOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const NotificationList = ({ isOpen, onClose }) => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = () => {
    getNotifications().then(res => setNotifications(res.data)).catch(console.error);
  };

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 z-[200] overflow-hidden">
      <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
        <h3 className="font-bold flex items-center gap-2">
          <Bell size={18} className="text-indigo-600" /> Notificaciones
        </h3>
        <div className="flex gap-2">
          <button onClick={handleMarkAllRead} title="Marcar todo como leído" className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-all text-emerald-500">
            <Check size={18} />
          </button>
          <button onClick={onClose} className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-full transition-all text-slate-400">
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
        {notifications.length === 0 ? (
          <div className="p-10 text-center text-slate-400 flex flex-col items-center gap-2">
            <BellOff size={32} className="opacity-20" />
            <p className="text-sm">No tienes notificaciones</p>
          </div>
        ) : (
          notifications.map(n => (
            <div 
              key={n.id} 
              className={`p-5 border-b border-slate-50 dark:border-slate-800 transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 relative group ${!n.is_read ? 'bg-indigo-50/30 dark:bg-indigo-950/10' : ''}`}
            >
              {!n.is_read && <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-indigo-600 rounded-full" />}
              <p className={`text-sm font-bold ${!n.is_read ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400'}`}>{n.title}</p>
              <p className="text-xs text-slate-500 mt-1">{n.message}</p>
              <p className="text-[10px] text-slate-400 mt-2">{new Date(n.created_at).toLocaleString()}</p>
              
              {!n.is_read && (
                <button 
                  onClick={() => handleMarkRead(n.id)}
                  className="absolute right-4 bottom-4 p-1.5 bg-white dark:bg-slate-700 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600"
                >
                  <Check size={14} />
                </button>
              )}
            </div>
          ))
        )}
      </div>
      
      <div className="p-4 bg-slate-50 dark:bg-slate-800/50 text-center">
        <button onClick={onClose} className="text-xs font-bold text-slate-400 hover:text-indigo-600 transition-colors">Cerrar Panel</button>
      </div>
    </div>
  );
};

export default NotificationList;