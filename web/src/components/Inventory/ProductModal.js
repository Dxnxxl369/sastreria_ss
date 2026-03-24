import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Package, Ruler, Layers, DollarSign, Tag, Plus, Trash2, Box, Settings2 } from 'lucide-react';

const ProductModal = ({ isOpen, onClose, onSave, product, categories }) => {
  const initialForm = useMemo(() => ({
    name: '', sku: '', category: '', product_type: 'FINISHED',
    stock: 0, unit: 'un', min_stock_alert: 5,
    cost_price: 0, sale_price: 0, is_active_web: true, is_for_sale: false,
    attributes: { variants: [] }, image: null
  }), []);

  const [formData, setFormData] = useState(initialForm);
  const [imagePreview, setImagePreview] = useState(null);
  
  // Generator states
  const [genSizes, setGenSizes] = useState('');
  const [genColors, setGenColors] = useState('');

  useEffect(() => {
    if (product) {
      const attrs = typeof product.attributes === 'string' 
        ? JSON.parse(product.attributes) 
        : (product.attributes || {});
      
      if (!attrs.variants) attrs.variants = [];

      setFormData({
        ...initialForm,
        ...product,
        category: (product.category && typeof product.category === 'object') ? product.category.id : (product.category || ''),
        attributes: attrs
      });
      setImagePreview(product.image);
    } else {
      setFormData(initialForm);
      setImagePreview(null);
    }
  }, [product, isOpen, initialForm]);

  useEffect(() => {
    if (formData.attributes.variants && formData.attributes.variants.length > 0) {
      const totalVariantsStock = formData.attributes.variants.reduce((sum, v) => sum + parseFloat(v.stock || 0), 0);
      if (parseFloat(formData.stock) !== totalVariantsStock) {
        setFormData(prev => ({ ...prev, stock: totalVariantsStock }));
      }
    }
  }, [formData.attributes.variants, formData.stock]);

  const generateVariants = () => {
    const sizes = genSizes.split(',').map(s => s.trim()).filter(s => s);
    const colors = genColors.split(',').map(c => c.trim()).filter(c => c);
    
    if (sizes.length === 0 && colors.length === 0) return;

    const newVariants = [];
    if (sizes.length > 0 && colors.length > 0) {
      sizes.forEach(s => colors.forEach(c => newVariants.push({ talla: s, color: c, stock: 0 })));
    } else {
      sizes.forEach(s => newVariants.push({ talla: s, color: '', stock: 0 }));
      colors.forEach(c => newVariants.push({ talla: '', color: c, stock: 0 }));
    }

    setFormData(prev => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        variants: [...(prev.attributes.variants || []), ...newVariants]
      }
    }));
    setGenSizes(''); setGenColors('');
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const newState = { ...prev, [name]: type === 'checkbox' ? checked : value };
      if (name === 'category') {
        const newCat = categories.find(c => c.id === parseInt(value));
        const newConfig = newCat?.field_config || {};
        const cleanedAttrs = { variants: prev.attributes.variants || [] };
        Object.keys(newConfig).forEach(k => {
          if (!["Usar Costo", "Usar Venta"].includes(k) && prev.attributes[k]) {
            cleanedAttrs[k] = prev.attributes[k];
          }
        });
        newState.attributes = cleanedAttrs;
      }
      return newState;
    });
  };

  const handleAttributeChange = (attrName, value) => {
    setFormData(prev => ({
      ...prev,
      attributes: { ...prev.attributes, [attrName]: value }
    }));
  };

  const handleAddVariant = () => {
    setFormData(prev => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        variants: [...(prev.attributes.variants || []), { talla: '', color: '', stock: 0 }]
      }
    }));
  };

  const handleVariantChange = (index, field, value) => {
    const newVariants = [...(formData.attributes.variants || [])];
    newVariants[index] = { ...newVariants[index], [field]: value };
    setFormData(prev => ({
      ...prev,
      attributes: { ...prev.attributes, variants: newVariants }
    }));
  };

  const handleRemoveVariant = (index) => {
    const newVariants = formData.attributes.variants.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      attributes: { ...prev.attributes, variants: newVariants }
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    const activeCat = categories.find(c => c.id === parseInt(formData.category));
    const catConfig = activeCat?.field_config || {};
    const finalAttributes = { variants: formData.attributes.variants || [] };
    
    Object.keys(catConfig).forEach(k => {
      if (!["Usar Costo", "Usar Venta"].includes(k)) {
        finalAttributes[k] = formData.attributes[k] || '';
      }
    });

    Object.keys(formData).forEach(key => {
      if (key === 'attributes') data.append(key, JSON.stringify(finalAttributes));
      else if (key === 'image') { if (formData[key] instanceof File) data.append(key, formData[key]); }
      else data.append(key, formData[key]);
    });
    onSave(data);
  };

  if (!isOpen) return null;

  const activeCategory = categories.find(c => c.id === parseInt(formData.category));
  const categoryConfig = activeCategory?.field_config || {};
  const hasVariants = formData.attributes.variants && formData.attributes.variants.length > 0;

  // Lógica HCI: Ocultar Talla/Color si hay variantes activas
  const dynamicFields = Object.keys(categoryConfig).filter(k => {
    if (["Usar Costo", "Usar Venta"].includes(k)) return false;
    if (hasVariants && (k.toLowerCase() === 'talla' || k.toLowerCase() === 'color')) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-5xl shadow-2xl border dark:border-slate-800 my-10 overflow-hidden">
        <div className="px-8 py-6 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl text-white"><Package size={20} /></div>
            <h3 className="text-xl font-bold dark:text-white">{product ? `Editando: ${product.name}` : 'Nuevo Item'}</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-all text-slate-500"><X /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* COLUMNA IZQUIERDA: BÁSICOS */}
            <div className="space-y-6">
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Nombre Descriptivo</span>
                <input name="name" required className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl dark:text-white outline-none focus:ring-2 ring-indigo-500 transition-all" value={formData.name || ''} onChange={handleChange} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">SKU / Código</span>
                  <input name="sku" className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl dark:text-white outline-none" value={formData.sku || ''} onChange={handleChange} />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Categoría</span>
                  <select name="category" required className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl dark:text-white font-bold" value={formData.category} onChange={handleChange}>
                    <option value="">Seleccionar...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="flex gap-6 items-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed dark:border-slate-700">
                <div className="w-24 h-24 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border dark:border-slate-700 flex-shrink-0 shadow-inner flex items-center justify-center">
                  {imagePreview ? <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" /> : <div className="text-slate-300"><Ruler size={32} /></div>}
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Imagen del producto</p>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="text-[10px] dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-indigo-50 file:text-indigo-600 hover:file:bg-indigo-100 cursor-pointer" />
                </div>
              </div>
            </div>

            {/* COLUMNA DERECHA: STOCK Y PRECIOS */}
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Stock {hasVariants ? '(Calculado)' : 'Manual'}</span>
                  <input 
                    type="number" 
                    name="stock" 
                    readOnly={hasVariants}
                    onFocus={e => !hasVariants && e.target.value === '0' && e.target.select()} 
                    className={`w-full p-4 border border-slate-200 dark:border-slate-700 rounded-2xl dark:text-white font-black text-xl ${hasVariants ? 'bg-slate-100 dark:bg-slate-800 opacity-70 cursor-not-allowed' : 'bg-slate-50 dark:bg-slate-800'}`} 
                    value={formData.stock} 
                    onChange={handleChange} 
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase text-slate-400 ml-1 tracking-widest">Unidad</span>
                  <input name="unit" placeholder="mts, un, etc" className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl dark:text-white" value={formData.unit || ''} onChange={handleChange} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {categoryConfig["Usar Costo"] && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-indigo-500 ml-1 tracking-widest">Costo Insumo ($)</span>
                    <input type="number" step="0.01" name="cost_price" onFocus={e => e.target.value === '0' && e.target.select()} className="w-full p-4 bg-indigo-50/30 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl dark:text-white font-black text-xl" value={formData.cost_price} onChange={handleChange} />
                  </div>
                )}
                {categoryConfig["Usar Venta"] && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-emerald-500 ml-1 tracking-widest">Precio Venta ($)</span>
                    <input type="number" step="0.01" name="sale_price" onFocus={e => e.target.value === '0' && e.target.select()} className="w-full p-4 bg-emerald-50/30 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl dark:text-white font-black text-xl" value={formData.sale_price} onChange={handleChange} />
                  </div>
                )}
              </div>

              {categoryConfig["Usar Venta"] && (
                <label className="flex items-center gap-4 p-5 bg-slate-50 dark:bg-slate-800 rounded-2xl border dark:border-slate-700 cursor-pointer hover:bg-slate-100 transition-all group">
                  <input type="checkbox" name="is_for_sale" className="w-6 h-6 rounded-lg text-indigo-600 border-slate-300" checked={formData.is_for_sale} onChange={handleChange} />
                  <div>
                    <span className="text-xs font-black dark:text-slate-300 uppercase tracking-widest block">Disponible para Venta</span>
                    <span className="text-[10px] text-slate-500 uppercase">Aparecerá en el catálogo del POS</span>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* MATRIZ DE VARIANTES (TALLA / COLOR) */}
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b dark:border-slate-800 pb-4 gap-4">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                <Layers size={14} /> Gestión de Variantes (Matriz de Stock)
              </h4>
              <div className="flex flex-wrap gap-2">
                <input placeholder="Tallas (S,M,L)" className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] outline-none border dark:border-slate-700" value={genSizes} onChange={e => setGenSizes(e.target.value)} />
                <input placeholder="Colores (Rojo, Azul)" className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] outline-none border dark:border-slate-700" value={genColors} onChange={e => setGenColors(e.target.value)} />
                <button type="button" onClick={generateVariants} className="px-4 py-2 bg-emerald-600 text-white text-[10px] font-black rounded-lg hover:bg-emerald-700 transition-all uppercase">
                  Generar Combinaciones
                </button>
                <button type="button" onClick={handleAddVariant} className="px-4 py-2 bg-indigo-600 text-white text-[10px] font-black rounded-lg hover:bg-indigo-700 flex items-center gap-2 transition-all uppercase">
                  <Plus size={14} /> Fila Manual
                </button>
              </div>
            </div>

            {hasVariants ? (
              <div className="overflow-x-auto rounded-3xl border dark:border-slate-800">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-tighter">Talla</th>
                      <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-tighter">Color / Detalle</th>
                      <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-tighter">Stock</th>
                      <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-tighter text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-slate-800">
                    {formData.attributes.variants.map((variant, idx) => (
                      <tr key={idx} className="bg-white dark:bg-slate-900/50 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all">
                        <td className="p-3">
                          <input 
                            placeholder="Ej: S, 40, Única"
                            className="w-full p-2.5 bg-transparent border-b dark:border-slate-700 dark:text-white outline-none focus:border-indigo-500 text-sm font-bold"
                            value={variant.talla || ''}
                            onChange={(e) => handleVariantChange(idx, 'talla', e.target.value)}
                          />
                        </td>
                        <td className="p-3">
                          <input 
                            placeholder="Ej: Azul, Rayado"
                            className="w-full p-2.5 bg-transparent border-b dark:border-slate-700 dark:text-white outline-none focus:border-indigo-500 text-sm font-bold"
                            value={variant.color || ''}
                            onChange={(e) => handleVariantChange(idx, 'color', e.target.value)}
                          />
                        </td>
                        <td className="p-3">
                          <input 
                            type="number"
                            className="w-24 p-2.5 bg-indigo-50/50 dark:bg-indigo-900/20 border-b-2 border-indigo-200 dark:border-indigo-800 dark:text-white outline-none focus:border-indigo-500 font-black text-center"
                            value={variant.stock || 0}
                            onChange={(e) => handleVariantChange(idx, 'stock', e.target.value)}
                          />
                        </td>
                        <td className="p-3 text-right">
                          <button type="button" onClick={() => handleRemoveVariant(idx)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-10 border-2 border-dashed dark:border-slate-800 rounded-[2rem] flex flex-col items-center justify-center text-center space-y-3 bg-slate-50/50 dark:bg-slate-800/20">
                <Box size={32} className="text-slate-300" />
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Sin variantes configuradas</p>
                <p className="text-[10px] text-slate-500 max-w-xs">Usa variantes para gestionar diferentes tallas y colores de un mismo producto con stocks independientes.</p>
              </div>
            )}
          </div>

          {/* OTROS ATRIBUTOS DINÁMICOS DE LA CATEGORÍA */}
          {dynamicFields.length > 0 && (
            <div className="p-8 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border dark:border-slate-800 space-y-6">
              <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2"><Settings2 size={14} /> Otros Detalles: {activeCategory.name}</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {dynamicFields.map(attr => {
                  const config = categoryConfig[attr] || {};
                  const isSelect = config.type === 'select';
                  const options = config.options ? config.options.split(',').map(o => o.trim()) : [];

                  return (
                    <div key={attr} className="space-y-1">
                      <span className="text-[10px] font-bold text-slate-500 uppercase ml-1">{attr}</span>
                      {isSelect ? (
                        <select 
                          className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl dark:text-white outline-none focus:ring-2 ring-indigo-500 font-bold"
                          value={formData.attributes[attr] || ''} 
                          onChange={(e) => handleAttributeChange(attr, e.target.value)}
                        >
                          <option value="">Seleccionar {attr}...</option>
                          {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : (
                        <input 
                          className="w-full p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl dark:text-white outline-none focus:ring-2 ring-indigo-500"
                          placeholder={`Ingresar ${attr}...`}
                          value={formData.attributes[attr] || ''} 
                          onChange={(e) => handleAttributeChange(attr, e.target.value)} 
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex gap-4 pt-6 border-t dark:border-slate-800">
            <button type="button" onClick={onClose} className="flex-1 p-5 bg-slate-100 dark:bg-slate-800 text-slate-500 font-black rounded-2xl hover:bg-slate-200 transition-all uppercase tracking-widest text-xs">Cancelar</button>
            <button type="submit" className="flex-[2] p-5 bg-indigo-600 text-white font-black rounded-2xl shadow-2xl shadow-indigo-500/30 hover:bg-indigo-700 hover:-translate-y-1 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-xs">
              <Save size={20} /> Finalizar y Guardar
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ProductModal;