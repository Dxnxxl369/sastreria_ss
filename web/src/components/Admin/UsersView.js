import React, { useState, useEffect } from 'react';
import { createUser, getUsers, deleteUser } from '../../api';
import { Shield, Plus, X, UserPlus, Eye, EyeOff, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const UsersView = () => {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', first_name: '', last_name: '', email: '', role: 'VENDEDOR' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await getUsers();
      // Solo mostramos ADMIN, VENDEDOR, SASTRE. Filtramos clientes de aquí.
      setUsers(res.data.filter(u => u.role !== 'CLIENT'));
    } catch (err) {
      console.error("Error al cargar usuarios", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    try {
      await createUser(newUser);
      setShowModal(false);
      setNewUser({ username: '', password: '', first_name: '', last_name: '', email: '', role: 'VENDEDOR' });
      fetchUsers();
      alert("Usuario creado exitosamente.");
    } catch (err) {
      const errorData = err.response?.data;
      let errorMsg = "Error al crear usuario.";
      if (errorData) {
        errorMsg = Object.entries(errorData).map(([key, value]) => `${key}: ${value}`).join('\n');
      }
      alert(errorMsg);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este usuario?")) {
      try {
        await deleteUser(id);
        fetchUsers();
      } catch (err) {
        alert("No se pudo eliminar el usuario.");
      }
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold dark:text-white">Gestión de Usuarios / Personal</h2>
          <p className="text-slate-500 text-sm mt-1">Administra el acceso de Vendedores y Personal Administrativo.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
        >
          <Plus size={18} /> Nuevo Usuario
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">Cargando personal...</div>
      ) : users.length === 0 ? (
        <div className="p-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center text-slate-400">
          <Shield size={64} className="mb-4 text-indigo-100 dark:text-indigo-900/30" />
          <p className="font-medium">No hay personal registrado aún.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="text-slate-400 dark:text-slate-500 border-b border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest">
                <th className="px-4 py-4">Usuario</th>
                <th className="px-4 py-4">Nombre Completo</th>
                <th className="px-4 py-4">Rol</th>
                <th className="px-4 py-4">Email</th>
                <th className="px-4 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-5 font-bold text-indigo-600 dark:text-indigo-400 text-sm">{u.username}</td>
                  <td className="px-4 py-5 font-medium text-sm">{u.first_name} {u.last_name}</td>
                  <td className="px-4 py-5 text-sm">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-5 text-sm text-slate-500">{u.email || '-'}</td>
                  <td className="px-4 py-5 text-right">
                    <button onClick={() => handleDelete(u.id)} className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 rounded-3xl p-8 w-full max-w-md shadow-2xl border dark:border-slate-800"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-600 rounded-xl text-white">
                    <UserPlus size={20} />
                  </div>
                  <h3 className="text-xl font-bold dark:text-white">Crear Usuario</h3>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddUser} className="space-y-5">
                <div className="grid grid-cols-1 gap-4">
                  <label className="block">
                    <span className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Usuario (Login)</span>
                    <input 
                      required 
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white outline-none focus:ring-2 ring-indigo-500 transition-all" 
                      value={newUser.username} 
                      onChange={e => setNewUser({...newUser, username: e.target.value})} 
                    />
                  </label>
                  <label className="block relative">
                    <span className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Contraseña</span>
                    <div className="relative">
                      <input 
                        required 
                        type={showPassword ? "text" : "password"} 
                        className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white outline-none focus:ring-2 ring-indigo-500 transition-all" 
                        value={newUser.password} 
                        onChange={e => setNewUser({...newUser, password: e.target.value})} 
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Nombre</span>
                    <input required className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white outline-none focus:ring-2 ring-indigo-500 transition-all" value={newUser.first_name} onChange={e => setNewUser({...newUser, first_name: e.target.value})} />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Apellido</span>
                    <input required className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white outline-none focus:ring-2 ring-indigo-500 transition-all" value={newUser.last_name} onChange={e => setNewUser({...newUser, last_name: e.target.value})} />
                  </label>
                </div>

                <label className="block">
                  <span className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Correo electrónico</span>
                  <input type="email" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white outline-none focus:ring-2 ring-indigo-500 transition-all" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} />
                </label>

                <label className="block">
                  <span className="text-[10px] font-black uppercase text-slate-400 mb-1 block">Rol de Acceso</span>
                  <select className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl dark:text-white outline-none focus:ring-2 ring-indigo-500 transition-all" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                    <option value="VENDEDOR">Vendedor</option>
                    <option value="SASTRE">Sastre</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </label>
                
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 text-slate-500 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all">
                    Cancelar
                  </button>
                  <button type="submit" className="flex-[2] bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20">
                    Guardar Usuario
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UsersView;