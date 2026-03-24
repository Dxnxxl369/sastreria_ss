import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { 
  Users, Package, ShoppingCart,
  Sun, Moon, LayoutDashboard, Search, Plus,
  Ruler, LogOut, Shield, Bell, BarChart3
} from 'lucide-react';

import InventoryPage from './components/Inventory/InventoryPage';
import Storefront from './components/Store/Storefront';
import Login from './components/Auth/Login';
import NotificationList from './components/Admin/NotificationList';
import { getNotifications } from './api';

import CRMView from './components/Admin/CRMView';
import POSView from './components/Admin/POSView';
import DashboardView from './components/Admin/DashboardView';
import UsersView from './components/Admin/UsersView';
import ReportsView from './components/Admin/ReportsView';

// --- CONTENIDO POR MÓDULO (ERP) ---
const ModuleContent = ({ type, onNavigate }) => {
  switch (type) {
    case 'dashboard': return <DashboardView onNavigate={onNavigate} />;
    case 'users': return <UsersView />;
    case 'crm': return <CRMView />;
    case 'wms': return <InventoryPage />;
    case 'pos': return <POSView />;
    case 'reports': return <ReportsView />;
    default: return <DashboardView onNavigate={onNavigate} />;
  }
};

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return React.cloneElement(children, { onLogout: () => setIsAuthenticated(false) });
};

// --- COMPONENTE PRINCIPAL CON ROUTING ---
const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Storefront />} />
        <Route path="/admin/*" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

// --- PANEL ADMINISTRATIVO (ERP) ---
const AdminPanel = ({ onLogout }) => {
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastNotificationId, setLastNotificationId] = useState(null);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');

  useEffect(() => {
    const checkNotifications = async () => {
      try {
        const res = await getNotifications();
        const unread = res.data.filter(n => !n.is_read);
        setUnreadCount(unread.length);
        
        if (unread.length > 0) {
          const newestId = unread[0].id;
          if (lastNotificationId && newestId !== lastNotificationId) {
            audio.play().catch(e => console.log("Audio play blocked"));
          }
          setLastNotificationId(newestId);
        }
      } catch (err) {
        console.error(err);
      }
    };

    checkNotifications();
    const interval = setInterval(checkNotifications, 3000); // Cada 3 segundos para respuesta rápida
    return () => clearInterval(interval);
  }, [lastNotificationId]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    if (onLogout) onLogout();
  };

  const menuItems = [
    { id: 'dashboard', label: 'Resumen', icon: LayoutDashboard },
    { id: 'reports', label: 'Reportes / BI', icon: BarChart3 },
    { id: 'users', label: 'Personal', icon: Shield },
    { id: 'crm', label: 'Clientes / CRM', icon: Users },
    { id: 'wms', label: 'Inventario / WMS', icon: Package },
    { id: 'pos', label: 'Ventas / POS', icon: ShoppingCart },
  ];

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-500 font-sans">
        
        {/* SIDEBAR */}
        <aside className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-8 flex flex-col shadow-2xl z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Ruler className="text-white" size={24} />
            </div>
            <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
              EliteTailor
            </span>
          </div>
          
          <nav className="space-y-3 flex-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${
                  activeTab === item.id 
                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/30 font-bold translate-x-2' 
                    : 'hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
                }`}
              >
                <item.icon size={22} className={activeTab === item.id ? 'text-white' : 'group-hover:scale-110 transition-transform'} /> 
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mt-auto space-y-4">
            <div className="px-5 py-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Usuario Activo</p>
              <p className="font-bold truncate">{user.first_name || user.username}</p>
              <p className="text-xs text-indigo-500 font-bold">{user.role}</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setDarkMode(!darkMode)}
                className="flex-1 p-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:ring-2 ring-indigo-500 transition-all active:scale-90"
              >
                {darkMode ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-indigo-600" />}
              </button>
              <button 
                onClick={handleLogout}
                className="flex-1 p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 flex items-center justify-center hover:ring-2 ring-rose-500 transition-all active:scale-90"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </aside>

        {/* CONTENIDO PRINCIPAL */}
        <main className="flex-1 p-10 overflow-y-auto overflow-x-hidden">
          <header className="flex justify-between items-center mb-12">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight mb-2">
                {menuItems.find(i => i.id === activeTab)?.label}
              </h1>
              <p className="text-slate-500 dark:text-slate-400">Panel administrativo v2.4</p>
            </div>
            <div className="flex gap-4 items-center">
              <div className="relative">
                <button 
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border dark:border-slate-800 text-slate-500 hover:text-indigo-600 transition-all active:scale-95 relative"
                >
                  <Bell size={24} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full ring-4 ring-slate-50 dark:ring-slate-950 animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <NotificationList isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
              </div>

              <div className="relative hidden md:block">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Búsqueda inteligente..." 
                  className="pl-12 pr-6 py-3.5 w-80 rounded-2xl border-none bg-white dark:bg-slate-900 shadow-sm focus:ring-4 ring-indigo-500/20 outline-none transition-all dark:placeholder-slate-600"
                />
              </div>
              <button className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white px-6 py-3.5 rounded-2xl flex items-center gap-3 font-bold shadow-xl shadow-indigo-500/20 transition-all">
                <Plus size={22} /> Nuevo
              </button>
            </div>
          </header>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4, ease: "circOut" }}
            >
              <ModuleContent type={activeTab} onNavigate={(tab) => setActiveTab(tab)} />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default App;