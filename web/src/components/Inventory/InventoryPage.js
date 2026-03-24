import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  getProducts, getCategories, createCategory, updateCategory,
  createProduct, updateProduct, patchProduct, deleteProduct 
} from './inventoryApi';
import { 
  Package, Plus, Search, Trash2, 
  Edit3, Layers, X, CheckSquare, Square, DollarSign, Tag, Settings2
} from 'lucide-react';
import ProductModal from './ProductModal';

const MASTER_ATTRIBUTES = [
  "Talla", "Color", "Tela", "Material", "Género", 
  "Marca", "Temporada", "Ubicación", "Estilo", "Modelo"
];

const InventoryPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newCat, setNewCat] = useState({ 
    name: '', 
    useCost: true, 
    useSale: true, 
    selectedFields: [] 
  });
  const [customField, setCustomField] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([getProducts(), getCategories()]);
      setProducts(prodRes.data);
      setCategories(catRes.data);
    } catch (err) { console.error(err); }
  };

  const handleEditCategory = (cat) => {
    setEditingCategory(cat);
    const fieldConfig = cat.field_config || {};
    setNewCat({
      name: cat.name,
      useCost: fieldConfig["Usar Costo"] !== false,
      useSale: fieldConfig["Usar Venta"] !== false,
      selectedFields: Object.keys(fieldConfig)
        .filter(k => k !== "Usar Costo" && k !== "Usar Venta")
        .map(k => {
          const val = fieldConfig[k];
          return {
            name: k,
            type: typeof val === 'object' ? val.type : 'text',
            options: typeof val === 'object' ? val.options : ''
          };
        })
    });
  };

  const resetCatForm = () => {
    setEditingCategory(null);
    setNewCat({ name: '', useCost: true, useSale: true, selectedFields: [] });
    setCustomField('');
  };

  const handleSaveProduct = async (formData) => {
    try {
      if (editingProduct) await patchProduct(editingProduct.id, formData);
      else await createProduct(formData);
      setIsModalOpen(false);
      loadData();
    } catch (err) { 
      console.error("Full Error:", err);
      const errorData = err.response?.data;
      let msg = "Error al guardar.";
      if (errorData) {
        msg = Object.entries(errorData)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join('\n');
      }
      alert(`DETALLES DEL ERROR:\n${msg}`);
    }
  };

  const toggleAttribute = (attrName) => {
    setNewCat(prev => {
      const exists = prev.selectedFields.find(f => f.name === attrName);
      if (exists) {
        return { ...prev, selectedFields: prev.selectedFields.filter(f => f.name !== attrName) };
      } else {
        return { ...prev, selectedFields: [...prev.selectedFields, { name: attrName, type: 'text', options: '' }] };
      }
    });
  };

  const addCustomAttribute = () => {
    if (customField && !newCat.selectedFields.find(f => f.name === customField)) {
      setNewCat(prev => ({
        ...prev,
        selectedFields: [...prev.selectedFields, { name: customField, type: 'text', options: '' }]
      }));
      setCustomField('');
    }
  };

  const updateFieldType = (index, type) => {
    const fields = [...newCat.selectedFields];
    fields[index].type = type;
    setNewCat({ ...newCat, selectedFields: fields });
  };

  const updateFieldOptions = (index, options) => {
    const fields = [...newCat.selectedFields];
    fields[index].options = options;
    setNewCat({ ...newCat, selectedFields: fields });
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    const fieldConfig = {
      "Usar Costo": newCat.useCost,
      "Usar Venta": newCat.useSale
    };
    newCat.selectedFields.forEach(f => { 
      fieldConfig[f.name] = { type: f.type, options: f.options }; 
    });
    
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, { name: newCat.name, field_config: fieldConfig });
      } else {
        await createCategory({ name: newCat.name, field_config: fieldConfig });
      }
      setIsCatModalOpen(false);
      resetCatForm();
      loadData();
    } catch (err) { alert("Error al guardar categoría"); }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'all' || p.category === parseInt(selectedCategory);
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex flex-1 w-full gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input type="text" placeholder="Buscar en inventario..." className="w-full pl-12 pr-6 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none focus:ring-4 ring-indigo-500/10 dark:text-white" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <select className="px-6 py-3.5 bg-slate-50 dark:bg-slate-800 rounded-2xl outline-none font-bold dark:text-white border-none" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
            <option value="all">Filtro: Todo</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button onClick={() => { resetCatForm(); setIsCatModalOpen(true); }} className="flex-1 md:flex-none px-6 py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"><Layers size={20} /> Config. Categoría</button>
          <button onClick={() => { setEditingProduct(null); setIsModalOpen(true); }} className="flex-1 md:flex-none px-8 py-3.5 rounded-2xl bg-indigo-600 text-white font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2"><Plus size={22} /> Nuevo Item</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map(product => (
          <div key={product.id} className="group bg-white dark:bg-slate-900 p-5 rounded-[2.5rem] shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-2xl transition-all duration-300 relative overflow-hidden">
            <div className="aspect-square bg-slate-50 dark:bg-slate-800 rounded-3xl mb-5 overflow-hidden relative border dark:border-slate-700">
              {product.image ? <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center text-slate-200 dark:text-slate-700"><Package size={48} /></div>}
              <div className="absolute top-3 right-3 flex gap-2 translate-y-12 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                <button onClick={() => { setEditingProduct(product); setIsModalOpen(true); }} className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-xl text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all"><Edit3 size={18} /></button>
                <button onClick={() => { if(window.confirm("¿Eliminar?")) deleteProduct(product.id).then(loadData); }} className="p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={18} /></button>
              </div>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">{categories.find(c => c.id === product.category)?.name}</span>
              <h4 className="font-bold text-slate-800 dark:text-white truncate">{product.name}</h4>
              <p className="text-xs text-slate-400 font-mono">SKU: {product.sku || '---'}</p>
            </div>
            <div className="mt-6 pt-5 border-t dark:border-slate-800 flex justify-between items-end">
              <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Stock</p><p className={`text-xl font-black ${parseFloat(product.stock) <= 5 ? 'text-rose-500' : 'text-slate-800 dark:text-white'}`}>{product.stock} <span className="text-xs font-medium text-slate-400">{product.unit}</span></p></div>
              <div className="text-right"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Venta</p><p className="text-xl font-black text-indigo-600">${parseFloat(product.sale_price).toLocaleString()}</p></div>
            </div>
          </div>
        ))}
      </div>

      <ProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveProduct} product={editingProduct} categories={categories} />

      <AnimatePresence>
        {isCatModalOpen && (
          <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 w-full max-w-4xl shadow-2xl border dark:border-slate-800 my-10 flex flex-col md:flex-row gap-10">
              {/* LISTA DE CATEGORÍAS */}
              <div className="w-full md:w-1/3 space-y-6 border-r dark:border-slate-800 pr-6">
                <div>
                  <h3 className="text-xl font-black dark:text-white">Categorías</h3>
                  <p className="text-slate-500 text-xs">Selecciona para editar</p>
                </div>
                <div className="space-y-2 max-height-[400px] overflow-y-auto">
                  <button onClick={resetCatForm} className={`w-full text-left p-3 rounded-xl transition-all text-sm font-bold flex items-center gap-2 ${!editingCategory ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'}`}>
                    <Plus size={16} /> Nueva Categoría
                  </button>
                  {categories.map(c => (
                    <button key={c.id} onClick={() => handleEditCategory(c)} className={`w-full text-left p-3 rounded-xl transition-all text-sm font-bold truncate ${editingCategory?.id === c.id ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500'}`}>
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* FORMULARIO */}
              <div className="flex-1">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-2xl font-black dark:text-white">
                      {editingCategory ? `Editando: ${editingCategory.name}` : 'Configurar Nueva Categoría'}
                    </h3>
                    <p className="text-slate-500 text-sm">Define los campos y comportamiento.</p>
                  </div>
                  <button onClick={() => setIsCatModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all text-slate-500 md:hidden"><X size={24} /></button>
                </div>
                
                <form onSubmit={handleSaveCategory} className="space-y-6">
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-slate-400 ml-1">Nombre</span>
                    <input required className="w-full p-4 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-2xl dark:text-white outline-none focus:ring-4 ring-indigo-500/10" value={newCat.name} onChange={e => setNewCat({...newCat, name: e.target.value})} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <button type="button" onClick={() => setNewCat({...newCat, useCost: !newCat.useCost})} className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all font-bold ${newCat.useCost ? 'bg-indigo-50 border-indigo-600 text-indigo-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'}`}>
                      <DollarSign size={18} /> {newCat.useCost ? 'Pedir Costo: SÍ' : 'Pedir Costo: NO'}
                    </button>
                    <button type="button" onClick={() => setNewCat({...newCat, useSale: !newCat.useSale})} className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all font-bold ${newCat.useSale ? 'bg-emerald-50 border-emerald-600 text-emerald-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'}`}>
                      <Tag size={18} /> {newCat.useSale ? 'Pedir Venta: SÍ' : 'Pedir Venta: NO'}
                    </button>
                  </div>

                  <div className="space-y-4">
                    <span className="text-[10px] font-black uppercase text-slate-400 ml-1 block tracking-widest">Atributos adicionales:</span>
                    <div className="grid grid-cols-1 gap-3">
                      {/* Mostrar todos los campos seleccionados con su configuración */}
                      {newCat.selectedFields.map((f, idx) => (
                        <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border dark:border-slate-700 flex flex-col gap-3">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-sm dark:text-white flex items-center gap-2">
                              <Settings2 size={14} className="text-indigo-500" /> {f.name}
                            </span>
                            <button type="button" onClick={() => toggleAttribute(f.name)} className="text-rose-500 hover:bg-rose-50 p-1 rounded-lg transition-all">
                              <X size={16} />
                            </button>
                          </div>
                          <div className="flex gap-2">
                            <select 
                              className="bg-white dark:bg-slate-900 border dark:border-slate-700 rounded-xl p-2 text-xs outline-none font-bold dark:text-white"
                              value={f.type} 
                              onChange={e => updateFieldType(idx, e.target.value)}
                            >
                              <option value="text">Texto Libre</option>
                              <option value="select">Selección (Dropdown)</option>
                            </select>
                            {f.type === 'select' && (
                              <input 
                                className="flex-1 bg-white dark:bg-slate-900 border dark:border-slate-700 rounded-xl p-2 text-xs outline-none dark:text-white"
                                placeholder="Opciones (separadas por coma)..."
                                value={f.options}
                                onChange={e => updateFieldOptions(idx, e.target.value)}
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 space-y-3">
                      <span className="text-[10px] font-black uppercase text-slate-400 ml-1 block tracking-widest">Sugerencias rápidas:</span>
                      <div className="flex flex-wrap gap-2">
                        {MASTER_ATTRIBUTES.filter(m => !newCat.selectedFields.find(f => f.name === m)).map(attr => (
                          <button key={attr} type="button" onClick={() => toggleAttribute(attr)} className="px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 text-[10px] font-bold hover:border-indigo-500 hover:text-indigo-500 transition-all">
                            + {attr}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 mt-4 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border dark:border-slate-700">
                      <input 
                        className="flex-1 bg-transparent px-4 py-2 outline-none text-xs dark:text-white" 
                        placeholder="Crear campo totalmente personalizado..."
                        value={customField}
                        onChange={e => setCustomField(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addCustomAttribute())}
                      />
                      <button type="button" onClick={addCustomAttribute} className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all">
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t dark:border-slate-800">
                    <button type="button" onClick={() => { setIsCatModalOpen(false); resetCatForm(); }} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-500 font-bold rounded-2xl uppercase tracking-widest text-xs">Cerrar</button>
                    <button type="submit" className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all uppercase tracking-widest text-xs">
                      {editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InventoryPage;