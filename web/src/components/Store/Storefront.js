import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X, ArrowRight, Package, CheckCircle2, ShieldCheck, Loader2, User, LogOut, Eye, EyeOff } from 'lucide-react';
import { getProducts, createWebOrder, login, createUser } from '../../api';

const StoreLayout = ({ children, cartCount, onOpenCart, user, onLogout }) => (
  <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white">
    <nav className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <span className="text-xl font-black tracking-tighter uppercase cursor-pointer" onClick={() => window.location.href="/"}>Sastrería Elite</span>
          <div className="hidden md:flex gap-6 text-sm font-medium text-gray-500">
            <a href="#" className="hover:text-black transition-colors">Colecciones</a>
            <a href="#" className="hover:text-black transition-colors">A Medida</a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4 text-sm font-bold">
              <span className="hidden md:block">Hola, {user.first_name}</span>
              <button onClick={onLogout} className="p-2 hover:bg-gray-50 rounded-full text-rose-500 transition-all"><LogOut size={18} /></button>
            </div>
          ) : (
            <User size={20} className="text-gray-400" />
          )}
          <button onClick={onOpenCart} className="relative p-2 hover:bg-gray-50 rounded-full transition-all group">
            <ShoppingBag size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full ring-2 ring-white">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </nav>
    <main>{children}</main>
  </div>
);

const CustomerAuthModal = ({ isOpen, onClose, onSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({ username: '', password: '', first_name: '', last_name: '', email: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isLogin) {
        const res = await login({ username: formData.username, password: formData.password });
        
        // Validar que solo los clientes puedan entrar a la tienda
        if (res.data.role !== 'CLIENT') {
          setError('Esta cuenta no es de cliente. Por favor, usa una cuenta de cliente o regístrate.');
          setLoading(false);
          return;
        }

        localStorage.setItem('customer_token', res.data.token);
        localStorage.setItem('customer_user', JSON.stringify(res.data));
        onSuccess(res.data);
      } else {
        await createUser({ ...formData, role: 'CLIENT' });
        // Auto login después de registro
        const res = await login({ username: formData.username, password: formData.password });
        localStorage.setItem('customer_token', res.data.token);
        localStorage.setItem('customer_user', JSON.stringify(res.data));
        onSuccess(res.data);
      }
    } catch (err) {
      console.error(err.response?.data);
      setError(isLogin ? 'Credenciales inválidas' : 'Error al registrarse. Prueba con otro usuario.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black">{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}</h2>
          <button onClick={onClose}><X /></button>
        </div>
        {error && <p className="mb-4 text-rose-500 text-sm font-bold bg-rose-50 p-3 rounded-xl">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input required placeholder="Usuario" className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 ring-black" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
          {!isLogin && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <input required placeholder="Nombre" className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 ring-black" value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} />
                <input required placeholder="Apellido" className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 ring-black" value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} />
              </div>
              <input required type="email" placeholder="Email" className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 ring-black" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
            </>
          )}
          <div className="relative">
            <input required type={showPassword ? "text" : "password"} placeholder="Contraseña" className="w-full p-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 ring-black" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-black transition-colors">
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-black text-white py-4 rounded-2xl font-black text-lg hover:bg-gray-900 transition-all flex items-center justify-center gap-2">
            {loading ? <Loader2 className="animate-spin" /> : (isLogin ? 'Entrar' : 'Registrarse')}
          </button>
        </form>
        <button onClick={() => setIsLogin(!isLogin)} className="w-full mt-6 text-sm font-bold text-gray-500 hover:text-black transition-colors">
          {isLogin ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión'}
        </button>
      </motion.div>
    </div>
  );
};

const ProductCard = ({ product, onAddToCart }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="group relative flex flex-col">
    <div className="aspect-[4/5] overflow-hidden rounded-2xl bg-gray-100 relative">
      {product.image ? (
        <img src={product.image} alt={product.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
      ) : (
        <div className="h-full w-full flex items-center justify-center text-gray-300">
          <Package size={48} strokeWidth={1} />
        </div>
      )}
      <button 
        onClick={() => onAddToCart(product)}
        className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur shadow-sm py-3 rounded-xl font-bold text-sm translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 active:scale-95"
      >
        Añadir al Carrito
      </button>
    </div>
    <div className="mt-4 flex justify-between items-start">
      <div>
        <h3 className="text-sm font-bold text-gray-900">{product.name}</h3>
        <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1">Ref: {product.sku}</p>
      </div>
      <p className="text-sm font-black">${parseFloat(product.sale_price).toLocaleString()}</p>
    </div>
  </motion.div>
);

const CheckoutModal = ({ isOpen, onClose, cart, total, onPaymentSuccess }) => {
  const [step, setStep] = useState('form'); // form, processing, success
  const [cardData, setCardData] = useState({ number: '', name: '', expiry: '', cvc: '', address: '' });

  const handlePay = async (e) => {
    e.preventDefault();
    setStep('processing');
    
    setTimeout(async () => {
      try {
        const user = JSON.parse(localStorage.getItem('customer_user'));
        
        await createWebOrder({
          client: user.user_id, 
          items: cart.map(i => ({ product: i.id, quantity: i.quantity, price_at_order: i.sale_price })),
          shipping_address: cardData.address
        });

        setStep('success');
        setTimeout(() => {
          onPaymentSuccess();
          setStep('form');
        }, 3000);
      } catch (error) {
        alert("Error al procesar el pedido. Verifica tu conexión.");
        setStep('form');
      }
    }, 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl">
        {step === 'form' && (
          <div className="p-8">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black">Finalizar Compra</h2>
              <button onClick={onClose}><X /></button>
            </div>
            <form onSubmit={handlePay} className="space-y-6">
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 mb-6">
                <div className="text-3xl font-black text-indigo-600">${total.toLocaleString()}</div>
              </div>
              <div className="space-y-4">
                <input required placeholder="Dirección de Envío" className="w-full px-4 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 ring-black" value={cardData.address} onChange={e => setCardData({...cardData, address: e.target.value})} />
                <input required placeholder="Número de Tarjeta" maxLength="16" className="w-full px-4 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 ring-black font-mono" value={cardData.number} onChange={e => setCardData({...cardData, number: e.target.value.replace(/\D/g, '')})} />
                <div className="grid grid-cols-2 gap-4">
                   <input required placeholder="MM/YY" maxLength="5" className="w-full px-4 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 ring-black" value={cardData.expiry} onChange={e => {
                     let v = e.target.value.replace(/\D/g, '');
                     if (v.length > 2) v = v.substring(0,2) + '/' + v.substring(2,4);
                     setCardData({...cardData, expiry: v});
                   }} />
                   <input required placeholder="CVC" maxLength="4" className="w-full px-4 py-4 bg-gray-50 rounded-2xl outline-none focus:ring-2 ring-black" value={cardData.cvc} onChange={e => setCardData({...cardData, cvc: e.target.value.replace(/\D/g, '')})} />
                </div>
              </div>
              <button type="submit" className="w-full bg-black text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-gray-900 transition-all active:scale-95 shadow-xl shadow-black/10">
                <ShieldCheck size={24} /> Pagar Ahora
              </button>
            </form>
          </div>
        )}

        {step === 'processing' && (
          <div className="p-20 text-center flex flex-col items-center">
            <Loader2 className="animate-spin text-indigo-600 mb-6" size={64} />
            <h3 className="text-2xl font-black">Procesando Pago...</h3>
          </div>
        )}

        {step === 'success' && (
          <div className="p-20 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 size={48} />
            </div>
            <h3 className="text-3xl font-black text-emerald-600">¡Pedido Realizado!</h3>
            <p className="text-gray-500 mt-2">Hemos recibido tu orden y estamos trabajando en ella.</p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

const Storefront = () => {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('customer_user')));

  useEffect(() => {
    getProducts().then(res => setProducts(res.data.filter(p => p.is_for_sale)));
  }, []);

  const addToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) return prev.map(item => item.id === product.id ? {...item, quantity: item.quantity + 1} : item);
      return [...prev, {...product, quantity: 1}];
    });
    setIsCartOpen(true);
  };

  const handleCheckoutClick = () => {
    if (!user) {
      setIsAuthOpen(true);
    } else {
      setIsCartOpen(false);
      setIsCheckoutOpen(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('customer_token');
    localStorage.removeItem('customer_user');
    setUser(null);
  };

  const total = cart.reduce((acc, item) => acc + (item.sale_price * item.quantity), 0);

  return (
    <StoreLayout cartCount={cart.length} onOpenCart={() => setIsCartOpen(true)} user={user} onLogout={handleLogout}>
      <section className="py-20 md:py-32 px-6">
        <div className="mx-auto max-w-7xl text-center">
          <motion.h1 initial={{ opacity: 0, letterSpacing: '-0.05em' }} animate={{ opacity: 1, letterSpacing: '-0.02em' }} transition={{ duration: 1 }} className="text-5xl md:text-8xl font-black tracking-tight">
            Excelencia <span className="text-gray-300">Tailor</span>
          </motion.h1>
          <p className="mt-6 text-gray-500 max-w-xl mx-auto text-lg italic">
            "La elegancia es la única belleza que nunca desaparece."
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16 pb-32">
        {products.map(p => <ProductCard key={p.id} product={p} onAddToCart={addToCart} />)}
      </section>

      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCartOpen(false)} className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed inset-y-0 right-0 z-[101] w-full max-w-md bg-white shadow-2xl flex flex-col p-8">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black">Tu Selección</h2>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X /></button>
              </div>
              <div className="flex-1 overflow-y-auto space-y-6">
                {cart.map(item => (
                  <div key={item.id} className="flex gap-4 border-b border-gray-100 pb-6">
                    <div className="w-20 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                      {item.image && <img src={item.image} className="w-full h-full object-cover" alt="" />}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm">{item.name}</h4>
                      <p className="text-xs text-gray-400 mt-1">Cant: {item.quantity}</p>
                      <p className="text-sm font-black mt-2">${(item.sale_price * item.quantity).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
              {cart.length > 0 && (
                <div className="pt-8 border-t space-y-4">
                  <div className="flex justify-between items-end mb-4">
                    <span className="text-gray-500 font-medium">Total</span>
                    <span className="text-2xl font-black">${total.toLocaleString()}</span>
                  </div>
                  <button onClick={handleCheckoutClick} className="w-full bg-black text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-900 transition-all active:scale-95 shadow-xl shadow-black/10">
                    Finalizar Compra <ArrowRight size={18} />
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <CustomerAuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} onSuccess={(userData) => { setUser(userData); setIsAuthOpen(false); setIsCheckoutOpen(true); }} />

      <CheckoutModal 
        isOpen={isCheckoutOpen} 
        onClose={() => setIsCheckoutOpen(false)} 
        cart={cart}
        total={total}
        onPaymentSuccess={() => {
          setCart([]);
          setIsCheckoutOpen(false);
          getProducts().then(res => setProducts(res.data.filter(p => p.is_for_sale)));
        }}
      />
    </StoreLayout>
  );
};

export default Storefront;