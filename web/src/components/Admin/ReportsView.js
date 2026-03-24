import React, { useState, useEffect } from 'react';
import { getSalesReport } from '../../api';
import { FileText, Download, Calendar, Search, TrendingUp, ShoppingCart, User } from 'lucide-react';
import { motion } from 'framer-motion';

const ReportsView = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    getSalesReport()
      .then(res => setSales(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredSales = sales.filter(s => 
    s.client.toLowerCase().includes(filter.toLowerCase()) || 
    s.seller.toLowerCase().includes(filter.toLowerCase())
  );

  const totalRevenue = filteredSales.reduce((acc, s) => acc + parseFloat(s.total), 0);

  return (
    <div className="space-y-8">
      {/* Header & Summary */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black dark:text-white">Reporte de Ventas</h2>
          <p className="text-slate-500 dark:text-slate-400">Historial completo de transacciones físicas y web.</p>
        </div>
        <button className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20">
          <Download size={20} /> Exportar Excel
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-indigo-600 p-6 rounded-3xl text-white shadow-xl shadow-indigo-500/20">
          <TrendingUp className="mb-4 opacity-50" size={32} />
          <p className="text-indigo-100 text-sm font-bold uppercase tracking-wider">Ingresos Totales</p>
          <p className="text-3xl font-black mt-1">${totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <ShoppingCart className="mb-4 text-emerald-500" size={32} />
          <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">Ventas Totales</p>
          <p className="text-3xl font-black mt-1 dark:text-white">{filteredSales.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <Calendar className="mb-4 text-amber-500" size={32} />
          <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">Periodo</p>
          <p className="text-3xl font-black mt-1 dark:text-white text-lg">Últimos 30 días</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por cliente o vendedor..." 
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl outline-none focus:ring-2 ring-indigo-500 transition-all dark:text-white"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
              <th className="px-6 py-4">ID / Tipo</th>
              <th className="px-6 py-4">Fecha</th>
              <th className="px-6 py-4">Cliente</th>
              <th className="px-6 py-4">Vendedor</th>
              <th className="px-6 py-4">Productos</th>
              <th className="px-6 py-4 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {loading ? (
              <tr><td colSpan="6" className="p-20 text-center text-slate-400">Cargando datos del servidor...</td></tr>
            ) : filteredSales.length === 0 ? (
              <tr><td colSpan="6" className="p-20 text-center text-slate-400">No se encontraron ventas.</td></tr>
            ) : filteredSales.map((sale) => (
              <tr key={`${sale.type}-${sale.id}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${sale.type === 'POS' ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
                    <div>
                      <p className="font-bold text-sm">#{sale.id}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{sale.type}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <p className="text-sm font-medium">{new Date(sale.date).toLocaleDateString()}</p>
                  <p className="text-xs text-slate-400">{new Date(sale.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                </td>
                <td className="px-6 py-5 text-sm font-bold flex items-center gap-2">
                  <User size={14} className="text-slate-400" /> {sale.client}
                </td>
                <td className="px-6 py-5 text-sm text-slate-500">{sale.seller}</td>
                <td className="px-6 py-5">
                  <div className="max-w-[200px] truncate text-xs text-slate-400">
                    {sale.items.map(i => `${i.quantity}x ${i.product}`).join(', ')}
                  </div>
                </td>
                <td className="px-6 py-5 text-right font-black text-indigo-600 dark:text-indigo-400">
                  ${parseFloat(sale.total).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ReportsView;