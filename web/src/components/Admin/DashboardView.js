import React, { useState, useEffect } from 'react';
import { Users, AlertCircle, CheckCircle, TrendingUp } from 'lucide-react';
import { getDashboardStats } from '../../api';

const StatCard = ({ title, value, trend, icon: Icon, color, onClick }) => (
  <div 
    onClick={onClick}
    className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-xl transition-all group cursor-pointer active:scale-95"
  >
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-2xl bg-slate-50 dark:bg-slate-800 group-hover:scale-110 transition-transform ${color}`}>
        <Icon size={24} />
      </div>
      <span className="text-xs font-bold px-2 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 rounded-lg">{trend}</span>
    </div>
    <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold">{title}</p>
    <p className="text-3xl font-black mt-1 dark:text-white">{value}</p>
  </div>
);

const DashboardView = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    total_sales: 0,
    active_clients: 0,
    critical_stock: 0,
    ready_orders: 0
  });

  useEffect(() => {
    getDashboardStats().then(res => setStats(res.data)).catch(console.error);
  }, []);

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          title="Ventas Totales" 
          value={`$${parseFloat(stats.total_sales).toLocaleString()}`} 
          trend="Real-time" 
          icon={TrendingUp} 
          color="text-indigo-600" 
          onClick={() => onNavigate('reports')}
        />
        <StatCard 
          title="Clientes Activos" 
          value={stats.active_clients} 
          trend="Real-time" 
          icon={Users} 
          color="text-emerald-500" 
          onClick={() => onNavigate('crm')}
        />
        <StatCard 
          title="Stock Crítico" 
          value={`${stats.critical_stock} Items`} 
          trend="Action Req." 
          icon={AlertCircle} 
          color="text-rose-500" 
          onClick={() => onNavigate('wms')}
        />
        <StatCard 
          title="Ordenes Web" 
          value={stats.ready_orders} 
          trend="Pending" 
          icon={CheckCircle} 
          color="text-amber-500" 
          onClick={() => onNavigate('pos')}
        />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400">
          Gráfica de ventas (Próximamente)
        </div>
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400">
          Alertas recientes (Próximamente)
        </div>
      </div>
    </div>
  );
};

export default DashboardView;