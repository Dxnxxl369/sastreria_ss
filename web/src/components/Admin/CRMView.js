import React, { useState, useEffect } from 'react';
import { getClients, createClient, updateClient, getProducts } from '../../api';
import { Plus, X, Ruler, Eye, Save, Calendar, Scissors, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- COMPONENTE DE INPUT ESPECIALIZADO PARA SASTRES ---
const TailorInput = ({ label, value, onChange, type = "number", disabled = false, className = "", step = "0.1" }) => {
  const handleFocus = (e) => {
    if (value === 0 || value === '0') e.target.select();
  };

  return (
    <div className={`flex items-center justify-between gap-2 ${className}`}>
      {label && <span className="text-[11px] font-bold text-slate-500 truncate w-24">{label}</span>}
      <input
        type={type}
        step={step}
        disabled={disabled}
        value={value}
        onFocus={handleFocus}
        onChange={onChange}
        className="w-20 p-1.5 bg-white dark:bg-slate-800 border-b-2 border-slate-200 dark:border-slate-700 transition-all outline-none text-right font-bold dark:text-white focus:border-indigo-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
    </div>
  );
};

const CRMView = () => {
  const [clients, setClients] = useState([]);
  const [fabrics, setFabrics] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState('create');
  const [showFabricList, setShowFabricList] = useState(false);
  
  const initialForm = {
    code: '', first_name: '', last_name: '', address: '', phone: '', email: '',
    test_date: '', delivery_date: '', total_price: 0, deposit: 0, balance: 0,
    measurements: {
      color: '', quantity: 1, 
      sc_largo: 0, entalle: 0, espalda: 0, hombro: 0, manga: 0, torax: 0, abdomen: 0, alto_busto: 0, chaleco: 0,
      cintura: 0, cadera: 0, pf_largo: 0, entre_pierna: 0, muslo: 0, rodilla: 0, vota_pie: 0, caja: 0, largo_falda: 0,
      detalle_saco: '', detalle_pantalon: '', detalle_chaleco: '', detalle_falda: '', modelo_detalle: ''
    }
  };

  const [formData, setFormData] = useState(initialForm);

  useEffect(() => {
    fetchClients();
    getProducts().then(res => setFabrics(res.data.filter(p => p.product_type === 'RAW')));
  }, []);

  const fetchClients = async () => {
    try {
      const res = await getClients();
      setClients(res.data.filter(c => c.id !== 0));
    } catch (err) { console.error(err); }
  };

  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    const val = parseFloat(value) || 0;
    const newForm = { ...formData, [name]: val };
    newForm.balance = (newForm.total_price - newForm.deposit).toFixed(2);
    setFormData(newForm);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (viewMode === 'create') await createClient(formData);
      else await updateClient(formData.id, formData);
      setShowModal(false);
      fetchClients();
      alert("Operación exitosa");
    } catch (err) { alert("Error al guardar datos."); }
  };

  const openModal = (mode, client = null) => {
    setViewMode(mode);
    setFormData(client ? { ...client, measurements: client.measurements || initialForm.measurements } : initialForm);
    setShowModal(true);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 transition-all duration-500">
      <div className="flex justify-between mb-8 items-center">
        <div>
          <h2 className="text-2xl font-bold dark:text-white">Fichas de Clientes / Sastrería</h2>
          <p className="text-slate-500 text-sm">Registro técnico de medidas y control de entregas.</p>
        </div>
        <button onClick={() => openModal('create')} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20">
          <Plus size={20} /> Nuevo Registro
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest border-b dark:border-slate-800">
              <th className="px-4 py-4">Código</th>
              <th className="px-4 py-4">Cliente</th>
              <th className="px-4 py-4">Entrega</th>
              <th className="px-4 py-4">Saldo</th>
              <th className="px-4 py-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
            {clients.map(c => (
              <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                <td className="px-4 py-5 font-mono text-sm text-indigo-600 font-bold">{c.code || '---'}</td>
                <td className="px-4 py-5 font-bold text-sm dark:text-white">{c.first_name} {c.last_name}</td>
                <td className="px-4 py-5 text-sm dark:text-slate-300">
                  {c.delivery_date ? new Date(c.delivery_date).toLocaleDateString() : 'No definida'}
                </td>
                <td className="px-4 py-5 text-sm font-black text-rose-500">${c.balance}</td>
                <td className="px-4 py-5 text-right flex justify-end gap-2">
                  <button onClick={() => openModal('view', c)} className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-indigo-600 hover:text-white transition-all text-indigo-600"><Eye size={18} /></button>
                  <button onClick={() => openModal('edit', c)} className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl hover:bg-emerald-600 hover:text-white transition-all text-emerald-600"><Scissors size={18} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} 
              className="bg-white dark:bg-slate-900 rounded-[3rem] w-full max-w-6xl shadow-2xl border dark:border-slate-800 overflow-hidden my-10 relative"
            >
              <div className="px-12 py-8 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                <div className="text-center w-full relative">
                   <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2">
                      <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20"><Ruler /></div>
                      <div className="text-left">
                        <h3 className="text-2xl font-black dark:text-white leading-none">DAMIAN</h3>
                        <p className="text-[10px] font-bold tracking-[0.4em] text-slate-400 mt-1 uppercase">Sastrería</p>
                      </div>
                   </div>
                   <button onClick={() => setShowModal(false)} className="absolute right-0 top-1/2 -translate-y-1/2 p-3 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full transition-all text-rose-500"><X size={24} /></button>
                </div>
              </div>

              <form onSubmit={handleSave} className="p-12 space-y-12 max-h-[75vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <label className="flex items-center gap-4 border-b dark:border-slate-800 pb-2 transition-all focus-within:border-indigo-500">
                      <span className="text-[10px] font-black uppercase text-slate-400 w-32 tracking-tighter">Nombre Cliente:</span>
                      <input disabled={viewMode === 'view'} required className="flex-1 bg-transparent dark:text-white outline-none font-bold" value={formData.first_name + ' ' + (formData.last_name || '')} onChange={e => {
                        const parts = e.target.value.split(' ');
                        setFormData({...formData, first_name: parts[0], last_name: parts.slice(1).join(' ')});
                      }} />
                    </label>
                    <div className="grid grid-cols-2 gap-8">
                      <label className="flex items-center gap-4 border-b dark:border-slate-800 pb-2 focus-within:border-indigo-500 transition-all">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Cel:</span>
                        <input disabled={viewMode === 'view'} required className="flex-1 bg-transparent dark:text-white outline-none font-bold font-mono" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                      </label>
                      <label className="flex items-center gap-4 border-b dark:border-slate-800 pb-2 focus-within:border-indigo-500 transition-all">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-tighter">Código:</span>
                        <input disabled={viewMode === 'view'} required className="flex-1 bg-transparent dark:text-indigo-400 outline-none font-black font-mono" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} />
                      </label>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-8">
                      <label className="block border-b dark:border-slate-800 pb-2 focus-within:border-indigo-500 transition-all">
                        <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Fecha de Prueba:</span>
                        <input disabled={viewMode === 'view'} type="date" className="w-full bg-transparent dark:text-white outline-none font-bold" value={formData.test_date} onChange={e => setFormData({...formData, test_date: e.target.value})} />
                      </label>
                      <label className="block border-b dark:border-slate-800 pb-2 focus-within:border-indigo-500 transition-all">
                        <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Fecha de Entrega:</span>
                        <input disabled={viewMode === 'view'} type="date" className="w-full bg-transparent dark:text-white outline-none font-bold" value={formData.delivery_date} onChange={e => setFormData({...formData, delivery_date: e.target.value})} />
                      </label>
                    </div>
                    <div className="flex items-center gap-4 border-b dark:border-slate-800 pb-2 focus-within:border-indigo-500 transition-all relative">
                      <span className="text-[10px] font-black uppercase text-indigo-500 w-32 tracking-tighter">Color / Tipo Tela:</span>
                      <input 
                        disabled={viewMode === 'view'} 
                        className="flex-1 bg-transparent dark:text-white outline-none font-bold uppercase" 
                        placeholder="Escribir o buscar..."
                        value={formData.measurements.color} 
                        onChange={e => setFormData({...formData, measurements: {...formData.measurements, color: e.target.value}})} 
                      />
                      <button type="button" onClick={() => setShowFabricList(!showFabricList)} className="p-1 hover:text-indigo-500 text-slate-400 transition-all"><Search size={16} /></button>
                      <AnimatePresence>
                        {showFabricList && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="absolute top-full left-0 right-0 z-50 mt-2 bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-2xl shadow-2xl max-h-48 overflow-y-auto">
                            {fabrics.map(f => (
                              <button key={f.id} type="button" onClick={() => { setFormData({...formData, measurements: {...formData.measurements, color: f.name}}); setShowFabricList(false); }} className="w-full text-left p-3 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-sm font-bold border-b dark:border-slate-700 last:border-0 dark:text-white flex justify-between">
                                <span>{f.name}</span><span className="text-[10px] text-slate-400 uppercase tracking-tighter">Stock: {f.stock}</span>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                <div className="border-2 border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden relative">
                  <table className="w-full border-collapse">
                    <thead><tr className="bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-widest dark:text-slate-400"><th className="p-4 border-r dark:border-slate-700 w-48 text-center">Saco / Chaleco</th><th className="p-4 border-r dark:border-slate-700 w-48 text-center">Pantalón / Falda</th><th className="p-4 text-center">Modelo / Detalle</th></tr></thead>
                    <tbody>
                      <tr className="align-top">
                        <td className="p-6 border-r dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/30"><div className="space-y-4">
                          {[{id: 'sc_largo', label: 'Largo'}, {id: 'entalle', label: 'Entalle'}, {id: 'espalda', label: 'Espalda'}, {id: 'hombro', label: 'Hombro'}, {id: 'manga', label: 'Manga'}, {id: 'torax', label: 'Tórax'}, {id: 'abdomen', label: 'Abdomen'}, {id: 'alto_busto', label: 'Alto busto'}, {id: 'chaleco', label: 'Chaleco'}].map(f => (
                            <TailorInput key={f.id} label={f.label} disabled={viewMode === 'view'} value={formData.measurements[f.id]} onChange={e => setFormData({...formData, measurements: {...formData.measurements, [f.id]: e.target.value}})} />
                          ))}
                        </div></td>
                        <td className="p-6 border-r dark:border-slate-700 bg-slate-50/30 dark:bg-slate-900/30"><div className="space-y-4">
                          {[{id: 'cintura', label: 'Cintura'}, {id: 'cadera', label: 'Cadera'}, {id: 'pf_largo', label: 'Largo'}, {id: 'entre_pierna', label: 'E. pierna'}, {id: 'muslo', label: 'Muslo'}, {id: 'rodilla', label: 'Rodilla'}, {id: 'vota_pie', label: 'Botapié'}, {id: 'caja', label: 'Caja'}, {id: 'largo_falda', label: 'L. falda'}].map(f => (
                            <TailorInput key={f.id} label={f.label} disabled={viewMode === 'view'} value={formData.measurements[f.id]} onChange={e => setFormData({...formData, measurements: {...formData.measurements, [f.id]: e.target.value}})} />
                          ))}
                        </div></td>
                        <td className="p-6 space-y-6"><div className="space-y-4">
                          {['Saco', 'Pantalon', 'Chaleco', 'Falda'].map(cat => (
                            <div key={cat} className="space-y-1"><span className="text-[10px] font-black uppercase text-indigo-500/50">{cat}:</span>
                              <textarea disabled={viewMode === 'view'} className="w-full bg-slate-50/50 dark:bg-slate-800/50 p-3 rounded-xl text-sm border dark:border-slate-700 outline-none focus:ring-1 ring-indigo-500 dark:text-white transition-all" rows="2" value={formData.measurements[`detalle_${cat.toLowerCase()}`]} onChange={e => setFormData({...formData, measurements: {...formData.measurements, [`detalle_${cat.toLowerCase()}`]: e.target.value}})} />
                            </div>
                          ))}
                        </div></td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-center gap-12 bg-slate-50 dark:bg-slate-800/50 p-10 rounded-[2.5rem] border dark:border-slate-800">
                   <div className="flex items-center gap-4"><span className="text-[10px] font-black uppercase text-slate-400">Precio total:</span>
                      <div className="flex items-center border-b-2 border-slate-300 dark:border-slate-700 px-2"><span className="text-indigo-600 font-black">$</span>
                        <input disabled={viewMode === 'view'} type="number" name="total_price" onFocus={e => e.target.value === '0' && e.target.select()} className="bg-transparent text-2xl font-black text-indigo-600 outline-none w-32 p-2 [appearance:textfield]" value={formData.total_price} onChange={handlePriceChange} />
                      </div>
                   </div>
                   <div className="flex items-center gap-4"><span className="text-[10px] font-black uppercase text-slate-400">A cuenta:</span>
                      <div className="flex items-center border-b-2 border-slate-300 dark:border-slate-700 px-2"><span className="text-emerald-600 font-black">$</span>
                        <input disabled={viewMode === 'view'} type="number" name="deposit" onFocus={e => e.target.value === '0' && e.target.select()} className="bg-transparent text-2xl font-black text-emerald-600 outline-none w-32 p-2 [appearance:textfield]" value={formData.deposit} onChange={handlePriceChange} />
                      </div>
                   </div>
                   <div className="flex items-center gap-4"><span className="text-[10px] font-black uppercase text-slate-400">Saldo:</span>
                      <div className="px-6 py-3 bg-rose-50 dark:bg-rose-900/20 rounded-2xl border border-rose-100 dark:border-rose-900/30"><span className="text-2xl font-black text-rose-600">${formData.balance}</span></div>
                   </div>
                </div>

                <div className="flex gap-4">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 p-6 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold rounded-3xl hover:bg-slate-200 transition-all uppercase tracking-widest text-xs">{viewMode === 'view' ? 'Cerrar Ficha' : 'Descartar'}</button>
                  {viewMode !== 'view' && (<button type="submit" className="flex-[2] p-6 bg-indigo-600 text-white font-black rounded-3xl shadow-2xl shadow-indigo-500/30 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs"><Save size={24} /> {viewMode === 'create' ? 'Guardar Registro' : 'Actualizar Ficha'}</button>)}
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CRMView;