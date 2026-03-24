import React, { useState, useEffect } from 'react';
import { getProducts, getClients, createSale } from '../../api';
import { ShoppingCart, Search, User, CheckCircle, Zap } from 'lucide-react';

const POSView = () => {
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [cart, setCart] = useState([]);
  const [selectedClient, setSelectedClient] = useState(0); // 0 is Consumidor Final
  const [searchTerm, setSearchTerm] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getProducts().then(res => setProducts(res.data)).catch(console.error);
    getClients().then(res => setClients(res.data)).catch(console.error);
  }, []);

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const addToCart = (product) => {
    const existing = cart.find(i => i.product === product.id);
    if (existing) {
      setCart(cart.map(i => i.product === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setCart([...cart, { product: product.id, name: product.name, price_at_sale: product.sale_price, quantity: 1 }]);
    }
  };

  const total = cart.reduce((acc, item) => acc + (parseFloat(item.price_at_sale) * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    setProcessing(true);
    const user = JSON.parse(localStorage.getItem('user'));

    try {
      await createSale({
        client: selectedClient || 0,
        seller: user.id,
        items: cart
      });
      setSuccess(true);
      setCart([]);
      setTimeout(() => setSuccess(false), 3000);
      // Actualizar stock localmente
      getProducts().then(res => setProducts(res.data));
    } catch (err) {
      alert(err.response?.data?.error || "Error al procesar la venta.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-12rem)]">
      {/* SECCIÓN PRODUCTOS */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 flex-1 flex flex-col overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h3 className="text-xl font-bold dark:text-white">Selección de Productos</h3>
              <p className="text-xs text-slate-500 mt-1">Haz click en un producto para añadirlo al carrito.</p>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por nombre o SKU..." 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl outline-none focus:ring-2 ring-indigo-500 dark:text-white transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2 pb-4 custom-scrollbar">
            {filteredProducts.length === 0 && (
               <div className="col-span-full py-20 text-center text-slate-400">
                  No se encontraron productos.
               </div>
            )}
            {filteredProducts.map(p => (
              <div key={p.id} onClick={() => addToCart(p)} className="p-4 border dark:border-slate-800 rounded-3xl hover:border-indigo-500 transition-all cursor-pointer group bg-slate-50 dark:bg-slate-800/30 flex flex-col">
                <div className="w-full h-28 bg-white dark:bg-slate-900 rounded-2xl mb-4 overflow-hidden flex items-center justify-center border dark:border-slate-800">
                  {p.image ? <img src={p.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform" /> : <ShoppingCart className="text-slate-200 dark:text-slate-800" size={32} />}
                </div>
                <p className="font-bold text-sm dark:text-white truncate" title={p.name}>{p.name}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-tighter mb-2">SKU: {p.sku}</p>
                <div className="flex justify-between items-end mt-auto">
                  <p className="text-indigo-600 dark:text-indigo-400 font-black text-lg">${parseFloat(p.sale_price).toLocaleString()}</p>
                  <div className={`px-2 py-1 rounded-lg text-[10px] font-bold ${parseFloat(p.stock) <= parseFloat(p.min_stock_alert) ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    Stock: {p.stock}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* SECCIÓN CARRITO */}
      <div className="bg-indigo-600 text-white p-8 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-2xl font-black">Venta Actual</h3>
          <Zap className="text-indigo-300" />
        </div>
        
        <div className="mb-8">
          <label className="text-[10px] font-black uppercase text-indigo-200 mb-2 block tracking-widest">Cliente</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400" size={18} />
            <select 
              className="w-full pl-10 pr-4 py-4 bg-indigo-700/50 border border-indigo-500/30 rounded-2xl text-white outline-none appearance-none focus:ring-2 ring-white/50 font-bold"
              value={selectedClient}
              onChange={e => setSelectedClient(e.target.value)}
            >
              <option value="0">Cliente Genérico (Venta Rápida)</option>
              {clients.filter(c => c.id !== 0).map(c => (
                <option key={c.id} value={c.id} className="text-slate-900">{c.first_name} {c.last_name}</option>
              ))}
            </select>
          </div>
          <p className="text-[10px] text-indigo-300 mt-2 italic">Solo registra datos para trajes a medida o ajustes.</p>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
          {cart.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full opacity-40">
              <ShoppingCart size={48} className="mb-4" />
              <p className="font-bold">Carrito vacío</p>
            </div>
          )}
          {cart.map((item, i) => (
            <div key={i} className="flex justify-between items-center bg-white/10 backdrop-blur-sm p-4 rounded-2xl border border-white/5">
              <div className="flex-1 min-w-0 mr-4">
                <p className="font-bold text-sm truncate">{item.name}</p>
                <p className="text-[10px] text-indigo-200">${parseFloat(item.price_at_sale).toLocaleString()} x {item.quantity}</p>
              </div>
              <div className="flex flex-col items-end">
                <p className="font-black">${(parseFloat(item.price_at_sale) * item.quantity).toLocaleString()}</p>
                <div className="flex gap-2 mt-1">
                   <button onClick={() => {
                     const updated = [...cart];
                     if (updated[i].quantity > 1) {
                       updated[i].quantity -= 1;
                       setCart(updated);
                     } else {
                       setCart(cart.filter((_, idx) => idx !== i));
                     }
                   }} className="w-5 h-5 bg-white/20 rounded-md flex items-center justify-center text-xs hover:bg-white/30">-</button>
                   <button onClick={() => {
                     const updated = [...cart];
                     updated[i].quantity += 1;
                     setCart(updated);
                   }} className="w-5 h-5 bg-white/20 rounded-md flex items-center justify-center text-xs hover:bg-white/30">+</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="border-t border-indigo-400/30 pt-6 mt-6">
          <div className="flex justify-between text-sm text-indigo-200 mb-1">
            <span>Subtotal</span>
            <span>${total.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-3xl font-black mb-8">
            <span>TOTAL</span>
            <span>${total.toLocaleString()}</span>
          </div>
          
          {success ? (
            <div className="w-full bg-emerald-500 text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-2 animate-bounce">
              <CheckCircle /> ¡VENTA EXITOSA!
            </div>
          ) : (
            <button 
              onClick={handleCheckout}
              disabled={cart.length === 0 || processing}
              className="w-full bg-white text-indigo-600 py-5 rounded-2xl font-black text-xl hover:bg-slate-50 transition-all shadow-2xl shadow-black/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {processing ? 'PROCESANDO...' : 'PAGAR AHORA'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default POSView;