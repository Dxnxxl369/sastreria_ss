import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Ruler, ShieldCheck, Loader2, Eye, EyeOff } from 'lucide-react';
import { login } from '../../api';

const Login = ({ onLoginSuccess }) => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await login(credentials);
      const { token, role, user_id, first_name, last_name } = response.data;
      
      // Solo permitimos Admin y Vendedor en el ERP web por ahora
      if (role !== 'ADMIN' && role !== 'VENDEDOR') {
        setError('Acceso denegado. Se requiere cuenta de administrador o vendedor.');
        setLoading(false);
        return;
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ id: user_id, role, first_name, last_name }));
      onLoginSuccess();
    } catch (err) {
      setError('Credenciales incorrectas o error en el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-10 rounded-3xl shadow-2xl w-full max-w-md">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <Ruler className="text-white" size={32} />
          </div>
        </div>
        <h2 className="text-3xl font-black text-center text-slate-900 mb-2">Sastrería ERP</h2>
        <p className="text-center text-slate-500 mb-8">Acceso administrativo y de ventas</p>

        {error && (
          <div className="bg-rose-50 text-rose-600 p-4 rounded-xl text-sm font-medium mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Usuario</label>
            <input 
              type="text" 
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 ring-indigo-500 outline-none transition-all"
              value={credentials.username}
              onChange={(e) => setCredentials({...credentials, username: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Contraseña</label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 ring-indigo-500 outline-none transition-all"
                value={credentials.password}
                onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-500 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <ShieldCheck size={20} />} 
            Ingresar
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;