import React, { useState } from 'react';
import { X, Save, Plus, Tag, Search, RotateCcw, Check } from 'lucide-react';
import type { InventoryProduct } from '../data/mock';
import { 
  getStoredInventoryProducts, 
  saveStoredInventoryProducts,
  inventoryProductsCatalog 
} from '../data/mock';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave?: () => void;
}

export function ProductCatalogModal({ isOpen, onClose, onSave }: Props) {
  const [products, setProducts] = useState<InventoryProduct[]>(() => getStoredInventoryProducts());
  const [activeCategory, setActiveCategory] = useState<'COCOEXPRESS' | 'KELAO'>('COCOEXPRESS');
  const [searchTerm, setSearchTerm] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // New product form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdCategory, setNewProdCategory] = useState<'COCOEXPRESS' | 'KELAO'>('COCOEXPRESS');
  const [newProdUnit, setNewProdUnit] = useState<'UN' | 'LT' | 'GR'>('UN');
  const [newProdCost, setNewProdCost] = useState<number>(1.00);

  if (!isOpen) return null;

  const handleCostChange = (id: string, newCost: number) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, cost: Math.max(0, newCost) } : p));
  };

  const handleNameChange = (id: string, newName: string) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, name: newName } : p));
  };

  const handleUnitChange = (id: string, newUnit: 'UN' | 'LT' | 'GR') => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, unit: newUnit } : p));
  };

  const handleSaveAll = () => {
    saveStoredInventoryProducts(products);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
    if (onSave) onSave();
  };

  const handleResetDefaults = () => {
    if (window.confirm('¿Deseas restaurar los costos y nombres de productos al valor por defecto ($1.00 cada uno)?')) {
      setProducts(inventoryProductsCatalog);
      saveStoredInventoryProducts(inventoryProductsCatalog);
      if (onSave) onSave();
    }
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim()) return alert('Ingresa un nombre para el producto');

    const newProd: InventoryProduct = {
      id: `inv_custom_${Date.now()}`,
      category: newProdCategory,
      name: newProdName.trim(),
      unit: newProdUnit,
      cost: Number(newProdCost) || 1.00
    };

    const updated = [...products, newProd];
    setProducts(updated);
    saveStoredInventoryProducts(updated);

    // Reset form
    setNewProdName('');
    setShowAddForm(false);
    if (onSave) onSave();
  };

  const filteredProducts = products.filter(p => 
    p.category === activeCategory &&
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '16px'
    }}>
      <div className="card" style={{
        width: '100%',
        maxWidth: '850px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        padding: 0,
        overflow: 'hidden'
      }}>
        {/* MODAL HEADER */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'between',
          alignItems: 'center',
          background: 'var(--surface-color)'
        }}>
          <div className="flex items-center gap-2">
            <Tag style={{ color: '#009C48' }} size={24} />
            <div>
              <h3 className="text-xl font-bold" style={{ margin: 0 }}>Catálogo y Costos de Productos de Inventario</h3>
              <p className="text-muted" style={{ fontSize: '0.8rem', margin: 0 }}>
                Modifica el costo unitario ($), nombre y unidad de medida (U/M) para estadísticas y reportes
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-ghost" style={{ padding: '6px' }}>
            <X size={20} />
          </button>
        </div>

        {/* CONTENIDO INTERMEDIO: CATEGORÍAS, BUSCADOR Y ACCIONES */}
        <div style={{ padding: '14px 24px', background: 'var(--bg-color)', borderBottom: '1px solid var(--border-color)' }} className="flex justify-between items-center flex-wrap gap-3">
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveCategory('COCOEXPRESS')}
              className={`btn ${activeCategory === 'COCOEXPRESS' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ background: activeCategory === 'COCOEXPRESS' ? '#009C48' : 'transparent', borderColor: '#009C48', fontWeight: 700 }}
            >
              🥥 COCOEXPRESS ({products.filter(p => p.category === 'COCOEXPRESS').length})
            </button>
            <button 
              onClick={() => setActiveCategory('KELAO')}
              className={`btn ${activeCategory === 'KELAO' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ background: activeCategory === 'KELAO' ? '#009C48' : 'transparent', borderColor: '#009C48', fontWeight: 700 }}
            >
              🍦 KELAO ({products.filter(p => p.category === 'KELAO').length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2" style={{ background: 'var(--surface-color)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', minWidth: '220px' }}>
              <Search size={16} className="text-muted" />
              <input 
                type="text" 
                placeholder="Buscar producto..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '0.85rem' }}
              />
            </div>

            <button 
              onClick={() => setShowAddForm(!showAddForm)} 
              className="btn btn-outline flex items-center gap-1"
              style={{ padding: '6px 12px', fontSize: '0.85rem', borderColor: '#009C48', color: '#009C48' }}
            >
              <Plus size={16} /> Nuevo Producto
            </button>
          </div>
        </div>

        {/* FORMULARIO AGREGAR NUEVO PRODUCTO (SI ESTÁ ACTIVO) */}
        {showAddForm && (
          <form 
            onSubmit={handleAddProduct} 
            style={{ 
              padding: '16px 20px', 
              background: 'rgba(0, 156, 72, 0.06)', 
              borderBottom: '2px solid #009C48',
              margin: '12px 16px',
              borderRadius: '10px'
            }}
          >
            <h4 style={{ margin: '0 0 12px 0', fontSize: '0.9rem', fontWeight: 800, color: '#009C48', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} /> Registrar Nuevo Producto al Catálogo
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div style={{ gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-primary)' }}>
                  Nombre del Producto *
                </label>
                <input 
                  type="text" 
                  placeholder="Ej. Aceite Coco 500ml..."
                  className="form-control"
                  style={{ fontSize: '0.85rem' }}
                  value={newProdName}
                  onChange={e => setNewProdName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-primary)' }}>
                  Categoría *
                </label>
                <select 
                  className="form-control"
                  style={{ fontSize: '0.85rem' }}
                  value={newProdCategory}
                  onChange={e => setNewProdCategory(e.target.value as any)}
                >
                  <option value="COCOEXPRESS">COCOEXPRESS</option>
                  <option value="KELAO">KELAO</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-primary)' }}>
                  Unidad (U/M) *
                </label>
                <select 
                  className="form-control"
                  style={{ fontSize: '0.85rem' }}
                  value={newProdUnit}
                  onChange={e => setNewProdUnit(e.target.value as any)}
                >
                  <option value="UN">UN</option>
                  <option value="LT">LT</option>
                  <option value="GR">GR</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, display: 'block', marginBottom: '4px', color: 'var(--text-primary)' }}>
                  Costo PVP ($) *
                </label>
                <input 
                  type="number" 
                  step="0.01" 
                  placeholder="0.00"
                  className="form-control"
                  style={{ fontSize: '0.85rem' }}
                  value={newProdCost}
                  onChange={e => setNewProdCost(Number(e.target.value))}
                  required
                />
              </div>

              <div style={{ gridColumn: 'span 3', display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button 
                  type="button" 
                  onClick={() => setShowAddForm(false)} 
                  className="btn btn-ghost" 
                  style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ background: '#009C48', borderColor: '#009C48', padding: '6px 16px', fontSize: '0.85rem', fontWeight: 800 }}
                >
                  Guardar Producto
                </button>
              </div>
            </div>
          </form>
        )}

        {/* TABLA EDITABLE DE PRODUCTOS */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 0 }} className="table-responsive">
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ background: 'var(--bg-color)', borderBottom: '2px solid var(--border-color)', textAlign: 'left', position: 'sticky', top: 0, zIndex: 10 }}>
                <th style={{ padding: '10px 16px', width: '45%' }}>Nombre del Producto</th>
                <th style={{ padding: '10px 16px', textAlign: 'center', width: '20%' }}>U/M</th>
                <th style={{ padding: '10px 16px', textAlign: 'center', width: '25%' }}>Costo Unitario ($)</th>
                <th style={{ padding: '10px 16px', textAlign: 'center', width: '10%' }}>Categoría</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '8px 16px' }}>
                    <input 
                      type="text" 
                      className="form-control"
                      style={{ fontSize: '0.85rem', fontWeight: 600, padding: '4px 8px' }}
                      value={p.name}
                      onChange={e => handleNameChange(p.id, e.target.value)}
                    />
                  </td>

                  <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                    <select 
                      className="form-control"
                      style={{ fontSize: '0.82rem', textAlign: 'center', padding: '4px 8px' }}
                      value={p.unit}
                      onChange={e => handleUnitChange(p.id, e.target.value as any)}
                    >
                      <option value="UN">UN</option>
                      <option value="LT">LT</option>
                      <option value="GR">GR</option>
                    </select>
                  </td>

                  <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                      <span style={{ fontWeight: 800, color: '#009C48' }}>$</span>
                      <input 
                        type="number" 
                        step="0.01"
                        min="0"
                        className="form-control"
                        style={{ width: '100px', textAlign: 'center', fontWeight: 800, color: '#009C48', padding: '4px 8px' }}
                        value={p.cost}
                        onChange={e => handleCostChange(p.id, Number(e.target.value))}
                      />
                    </div>
                  </td>

                  <td style={{ padding: '8px 16px', textAlign: 'center' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', background: 'var(--bg-color)', color: 'var(--text-secondary)' }}>
                      {p.category}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MODAL FOOTER */}
        <div style={{
          padding: '14px 24px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'var(--surface-color)'
        }}>
          <button 
            type="button" 
            onClick={handleResetDefaults}
            className="btn btn-ghost text-muted flex items-center gap-1"
            style={{ fontSize: '0.82rem' }}
          >
            <RotateCcw size={15} /> Restaurar valores por defecto ($1.00)
          </button>

          <div className="flex gap-3 items-center">
            {savedSuccess && (
              <span className="flex items-center gap-1" style={{ color: '#009C48', fontWeight: 700, fontSize: '0.85rem' }}>
                <Check size={16} /> ¡Costos guardados!
              </span>
            )}
            <button onClick={onClose} className="btn btn-ghost">
              Cerrar
            </button>
            <button 
              onClick={handleSaveAll}
              className="btn btn-primary flex items-center gap-2"
              style={{ background: '#009C48', borderColor: '#009C48', padding: '10px 20px', fontWeight: 800 }}
            >
              <Save size={18} /> Guardar Todos los Costos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
