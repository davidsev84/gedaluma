import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Package, Search, FileCheck, Layers, Tag
} from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { useAuth } from '../context/AuthContext';
import { mockIslas, getStoredInventoryProducts } from '../data/mock';
import type { InventoryProduct } from '../data/mock';
import { supabase } from '../lib/supabase';
import { generateInventoryPDF } from '../lib/pdfGenerator';
import { ProductCatalogModal } from '../components/ProductCatalogModal';

export function NewInventory() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const searchParams = new URLSearchParams(window.location.search);
  const initialIslaId = searchParams.get('isla') || mockIslas[0].id;

  const [step, setStep] = useState(0);
  const [selectedIsla, setSelectedIsla] = useState(initialIslaId);
  const [evaluatorName, setEvaluatorName] = useState(user?.name || 'Supervisor Operativo');
  const [inventoryDate, setInventoryDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const [activeCategory, setActiveCategory] = useState<'COCOEXPRESS' | 'KELAO'>('COCOEXPRESS');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCatalogModal, setShowCatalogModal] = useState(false);

  // Products state (can be reloaded if costs/names change)
  const [productsCatalog, setProductsCatalog] = useState<InventoryProduct[]>(() => getStoredInventoryProducts());

  // Values map: product_id -> { system: number | '', physical: number | '', observation: string }
  const [itemValues, setItemValues] = useState<Record<string, { system: number | ''; physical: number | ''; observation: string }>>({});

  const [isSaving, setIsSaving] = useState(false);
  const sigRef = useRef<any>(null);

  const refreshProducts = () => {
    setProductsCatalog(getStoredInventoryProducts());
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIsla) return alert('Por favor selecciona la isla.');
    if (!evaluatorName.trim()) return alert('Por favor ingresa el nombre del responsable.');

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setStartTime(nowTime);
    setStep(1);
  };

  const handleItemChange = (prodId: string, field: 'system' | 'physical' | 'observation', value: any) => {
    setItemValues(prev => ({
      ...prev,
      [prodId]: {
        system: prev[prodId]?.system ?? 0,
        physical: prev[prodId]?.physical ?? 0,
        observation: prev[prodId]?.observation ?? '',
        [field]: value
      }
    }));
  };

  // Realtime calculations including Dollar Amounts ($)
  const calculateTotals = () => {
    let totalMissing = 0;
    let totalMissingDollars = 0;
    let totalMatch = 0;
    let totalSurplus = 0;
    let totalSurplusDollars = 0;

    productsCatalog.forEach(prod => {
      const val = itemValues[prod.id];
      const sys = val && val.system !== '' ? Number(val.system) : 0;
      const phys = val && val.physical !== '' ? Number(val.physical) : 0;
      const diff = phys - sys;
      const unitCost = Number(prod.cost) || 1.00;

      if (diff < 0) {
        const missingCount = Math.abs(diff);
        totalMissing += missingCount;
        totalMissingDollars += missingCount * unitCost;
      } else if (diff === 0) {
        totalMatch += 1;
      } else {
        totalSurplus += diff;
        totalSurplusDollars += diff * unitCost;
      }
    });

    return { 
      totalMissing, 
      totalMissingDollars, 
      totalMatch, 
      totalSurplus, 
      totalSurplusDollars 
    };
  };

  const handleFinishStep1 = () => {
    const autoEnd = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setEndTime(autoEnd);
    setStep(2);
  };

  const handleSaveInventory = async () => {
    setIsSaving(true);
    let savedInventory: any = null;

    try {
      const islaObj = mockIslas.find(i => i.id === selectedIsla);
      const totals = calculateTotals();

      const itemsDetail = productsCatalog.map(prod => {
        const val = itemValues[prod.id];
        const sys = val && val.system !== '' ? Number(val.system) : 0;
        const phys = val && val.physical !== '' ? Number(val.physical) : 0;
        const unitCost = Number(prod.cost) || 1.00;
        const diff = phys - sys;

        return {
          product_id: prod.id,
          category: prod.category,
          name: prod.name,
          unit: prod.unit,
          cost: unitCost,
          system_qty: sys,
          physical_qty: phys,
          diff_qty: diff,
          total_cost_impact: diff * unitCost,
          observation: val?.observation || ''
        };
      });

      const inventoryPayload = {
        isla_id: selectedIsla,
        isla_name: islaObj?.name || 'Desconocida',
        evaluator_name: evaluatorName,
        date: inventoryDate,
        start_time: startTime,
        end_time: endTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        total_missing: totals.totalMissing,
        total_missing_dollars: totals.totalMissingDollars,
        total_match: totals.totalMatch,
        total_surplus: totals.totalSurplus,
        total_surplus_dollars: totals.totalSurplusDollars,
        is_discounted: false, // Default pending discount
        created_at: new Date().toISOString()
      };

      // Try Supabase insert
      try {
        const { data: invData, error: invErr } = await supabase
          .from('inventories')
          .insert([inventoryPayload])
          .select()
          .single();

        if (!invErr && invData) {
          savedInventory = invData;
          const itemsToInsert = itemsDetail.map(it => ({
            inventory_id: invData.id,
            ...it
          }));
          await supabase.from('inventory_items').insert(itemsToInsert);
        } else {
          throw invErr || new Error('Error al insertar en Supabase');
        }
      } catch (dbErr: any) {
        console.warn('Fallback a almacenamiento local para inventario:', dbErr);
        savedInventory = {
          id: `inv_off_${Date.now()}`,
          ...inventoryPayload
        };
        const existingOffline = JSON.parse(localStorage.getItem('gedaluma_offline_inventories') || '[]');
        localStorage.setItem('gedaluma_offline_inventories', JSON.stringify([savedInventory, ...existingOffline]));

        const offlineItemsMap = JSON.parse(localStorage.getItem('gedaluma_offline_inventory_items') || '{}');
        offlineItemsMap[savedInventory.id] = itemsDetail;
        localStorage.setItem('gedaluma_offline_inventory_items', JSON.stringify(offlineItemsMap));
      }

      alert('✅ Inventario registrado exitosamente.');

      let sigData = undefined;
      if (sigRef.current && !sigRef.current.isEmpty()) {
        sigData = sigRef.current.getCanvas().toDataURL('image/png');
      }

      const wantsPDF = window.confirm('¿Desea generar y descargar el documento PDF del inventario ahora?');
      if (wantsPDF && savedInventory) {
        generateInventoryPDF(savedInventory, itemsDetail, sigData);
      }

      if (user?.role === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/evaluate');
      }

    } catch (err: any) {
      console.error('Error guardando inventario:', err);
      alert(`Error al guardar el inventario: ${err.message || String(err)}`);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredProducts = productsCatalog.filter(p => 
    p.category === activeCategory &&
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totals = calculateTotals();

  return (
    <div className="container" style={{ maxWidth: '1000px', paddingBottom: '80px' }}>
      {/* MODAL EDITABLE DE PRODUCTOS Y COSTOS */}
      <ProductCatalogModal 
        isOpen={showCatalogModal}
        onClose={() => setShowCatalogModal(false)}
        onSave={refreshProducts}
      />

      {/* HEADER */}
      <header className="flex justify-between items-center header-flex-mobile mb-6 pb-4" style={{ borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#009C48' }}>
            <Package size={28} /> Control de Inventarios de Isla GEDALUMA
          </h1>
          <p className="text-muted" style={{ fontSize: '0.88rem' }}>
            Comparativa Físico vs Sistema, Faltantes en Unidades (un.) y Dólares ($)
          </p>
        </div>
        <div className="flex gap-2 items-center header-actions-mobile" style={{ paddingRight: '90px' }}>
          <button 
            type="button"
            onClick={() => setShowCatalogModal(true)} 
            className="btn btn-outline"
            style={{ padding: '8px 12px', fontSize: '0.85rem', borderColor: '#009C48', color: '#009C48', fontWeight: 700 }}
          >
            Productos (Costos)
          </button>

          <Link 
            to="/evaluate" 
            className="btn btn-outline"
            style={{ padding: '8px 12px', fontSize: '0.85rem', borderColor: '#009C48', color: '#009C48', fontWeight: 700 }}
          >
            Evaluación
          </Link>

          <Link 
            to="/evaluate?mode=ghost" 
            className="btn btn-outline"
            style={{ padding: '8px 12px', fontSize: '0.85rem', borderColor: '#f7b500', color: '#b48200', fontWeight: 700 }}
          >
            Cliente Fantasma
          </Link>

          {user?.role === 'admin' && (
            <Link to="/dashboard" className="btn btn-outline" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
              Volver al Panel
            </Link>
          )}
          <button onClick={logout} className="btn btn-ghost">
            <span>Salir</span>
          </button>
        </div>
      </header>

      {/* STEP 0: DATOS DE CABECERA DEL INVENTARIO */}
      {step === 0 && (
        <div className="card" style={{ maxWidth: '650px', margin: '0 auto' }}>
          <div className="flex items-center gap-3 mb-6" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
            <Layers size={24} style={{ color: '#009C48' }} />
            <h2 className="text-xl font-bold">Variables de Cabecera del Inventario</h2>
          </div>

          <form onSubmit={handleStart} className="flex flex-col gap-4">
            <div className="form-group">
              <label className="form-label">Isla a Inventariar *</label>
              <select 
                className="form-control" 
                value={selectedIsla}
                onChange={e => setSelectedIsla(e.target.value)}
                required
              >
                {mockIslas.map(i => (
                  <option key={i.id} value={i.id}>ISLA {i.name} ({i.location})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Responsable / Auditor del Inventario *</label>
              <input 
                type="text" 
                className="form-control"
                value={evaluatorName}
                onChange={e => setEvaluatorName(e.target.value)}
                required
                placeholder="Nombre de la persona que realiza el conteo..."
              />
            </div>

            <div className="form-group">
              <label className="form-label">Fecha del Inventario *</label>
              <input 
                type="date" 
                className="form-control"
                value={inventoryDate}
                onChange={e => setInventoryDate(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary mt-4" 
              style={{ background: '#009C48', borderColor: '#009C48', padding: '14px', fontSize: '1rem', fontWeight: 800 }}
            >
              Iniciar Conteo de Productos ({productsCatalog.length} Ítems) →
            </button>
          </form>
        </div>
      )}

      {/* STEP 1: CONTEO FÍSICO VS SISTEMA POR CATEGORÍA */}
      {step === 1 && (
        <div>
          {/* BANNER FLOTANTE DE TOTALES EN TIEMPO REAL CON UNIDADES Y DÓLARES */}
          <div className="card mb-6" style={{ background: 'var(--surface-color)', border: '2px solid #009C48', position: 'sticky', top: '10px', zIndex: 30 }}>
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#009C48', textTransform: 'uppercase' }}>
                  Resumen de Conteo en Vivo
                </span>
                <h3 className="text-xl font-bold" style={{ margin: 0 }}>
                  ISLA {mockIslas.find(i => i.id === selectedIsla)?.name}
                </h3>
              </div>

              <div className="flex gap-3">
                <div className="text-center" style={{ padding: '6px 14px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 700 }}>Total Faltantes</span>
                  <p style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--danger)', margin: 0 }}>
                    {totals.totalMissing} un. <span style={{ fontSize: '0.9rem' }}>(${totals.totalMissingDollars.toFixed(2)})</span>
                  </p>
                </div>

                <div className="text-center text-success" style={{ padding: '6px 14px', background: 'rgba(0, 156, 72, 0.1)', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#009C48', fontWeight: 700 }}>Conformes</span>
                  <p style={{ fontSize: '1.15rem', fontWeight: 800, color: '#009C48', margin: 0 }}>
                    {totals.totalMatch} prod.
                  </p>
                </div>

                <div className="text-center" style={{ padding: '6px 14px', background: 'rgba(2, 132, 199, 0.1)', borderRadius: '10px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 700 }}>Sobrantes</span>
                  <p style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0284c7', margin: 0 }}>
                    +{totals.totalSurplus} un. <span style={{ fontSize: '0.9rem' }}>(+${totals.totalSurplusDollars.toFixed(2)})</span>
                  </p>
                </div>
              </div>

              <button 
                onClick={handleFinishStep1}
                className="btn btn-primary"
                style={{ background: '#009C48', borderColor: '#009C48', padding: '10px 20px', fontWeight: 800 }}
              >
                Continuar a Firma y PDF →
              </button>
            </div>
          </div>

          {/* SELECCIÓN DE CATEGORÍA Y BUSCADOR */}
          <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
            <div className="flex gap-2">
              <button 
                onClick={() => setActiveCategory('COCOEXPRESS')}
                className={`btn ${activeCategory === 'COCOEXPRESS' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ 
                  background: activeCategory === 'COCOEXPRESS' ? '#009C48' : 'transparent',
                  borderColor: '#009C48',
                  fontWeight: 700
                }}
              >
                🥥 COCOEXPRESS ({productsCatalog.filter(p => p.category === 'COCOEXPRESS').length})
              </button>

              <button 
                onClick={() => setActiveCategory('KELAO')}
                className={`btn ${activeCategory === 'KELAO' ? 'btn-primary' : 'btn-ghost'}`}
                style={{ 
                  background: activeCategory === 'KELAO' ? '#009C48' : 'transparent',
                  borderColor: '#009C48',
                  fontWeight: 700
                }}
              >
                🍦 KELAO ({productsCatalog.filter(p => p.category === 'KELAO').length})
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2" style={{ background: 'var(--surface-color)', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', minWidth: '240px' }}>
                <Search size={18} className="text-muted" />
                <input 
                  type="text" 
                  placeholder="Buscar producto por nombre..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '0.88rem' }}
                />
              </div>

              <button 
                onClick={() => setShowCatalogModal(true)}
                className="btn btn-outline flex items-center gap-1"
                style={{ padding: '6px 12px', fontSize: '0.85rem', borderColor: '#009C48', color: '#009C48' }}
              >
                <Tag size={16} /> Modificar Costos
              </button>
            </div>
          </div>

          {/* TABLA DE PRODUCTOS DE LA CATEGORÍA SELECCIONADA CON ANCHOS OPTIMIZADOS */}
          <div className="card table-responsive" style={{ padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-color)', borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 14px', width: '26%' }}>Producto</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center', width: '6%' }}>U/M</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center', width: '9%' }}>Costo Unit.</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center', width: '9%' }}>Sistema</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center', width: '9%' }}>Físico</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center', width: '22%' }}>Diferencia</th>
                  <th style={{ padding: '12px 14px', width: '19%' }}>Obs.</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(prod => {
                  const val = itemValues[prod.id] || { system: 0, physical: 0, observation: '' };
                  const sys = val.system !== '' ? Number(val.system) : 0;
                  const phys = val.physical !== '' ? Number(val.physical) : 0;
                  const diff = phys - sys;
                  const unitCost = Number(prod.cost) || 1.00;
                  const dollarImpact = diff * unitCost;

                  return (
                    <tr key={prod.id} style={{ 
                      borderBottom: '1px solid var(--border-color)',
                      background: diff < 0 ? 'rgba(239, 68, 68, 0.04)' : diff > 0 ? 'rgba(2, 132, 199, 0.04)' : 'inherit'
                    }}>
                      <td style={{ padding: '12px 14px', fontWeight: 700 }}>
                        {prod.name}
                      </td>

                      <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                        <span style={{ background: 'var(--bg-color)', padding: '2px 8px', borderRadius: '10px', fontSize: '0.78rem', fontWeight: 700 }}>
                          {prod.unit}
                        </span>
                      </td>

                      <td style={{ padding: '12px 14px', textAlign: 'center', fontWeight: 700, color: '#009C48' }}>
                        ${unitCost.toFixed(2)}
                      </td>

                      <td style={{ padding: '8px 4px', textAlign: 'center' }}>
                        <input 
                          type="number"
                          step="0.01"
                          className="form-control"
                          style={{ textAlign: 'center', fontWeight: 700, padding: '6px 4px', maxWidth: '75px', margin: '0 auto' }}
                          value={val.system}
                          onChange={e => handleItemChange(prod.id, 'system', e.target.value === '' ? '' : Number(e.target.value))}
                        />
                      </td>

                      <td style={{ padding: '8px 4px', textAlign: 'center' }}>
                        <input 
                          type="number"
                          step="0.01"
                          className="form-control"
                          style={{ textAlign: 'center', fontWeight: 800, padding: '6px 4px', borderColor: '#009C48', maxWidth: '75px', margin: '0 auto' }}
                          value={val.physical}
                          onChange={e => handleItemChange(prod.id, 'physical', e.target.value === '' ? '' : Number(e.target.value))}
                        />
                      </td>

                      <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                        <span style={{ 
                          padding: '4px 10px', 
                          borderRadius: '12px', 
                          fontSize: '0.82rem', 
                          fontWeight: 800,
                          display: 'inline-block',
                          whiteSpace: 'nowrap',
                          background: diff < 0 ? 'rgba(239, 68, 68, 0.15)' : diff === 0 ? 'rgba(0, 156, 72, 0.15)' : 'rgba(2, 132, 199, 0.15)',
                          color: diff < 0 ? 'var(--danger)' : diff === 0 ? '#009C48' : '#0284c7'
                        }}>
                          {diff < 0 
                            ? `Falta (${diff} / -$${Math.abs(dollarImpact).toFixed(2)})` 
                            : diff === 0 
                              ? 'Conforme ($0.00)' 
                              : `Sobrante (+${diff} / +$${dollarImpact.toFixed(2)})`}
                        </span>
                      </td>

                      <td style={{ padding: '8px 10px' }}>
                        <input 
                          type="text" 
                          className="form-control"
                          placeholder="Nota u observación..."
                          style={{ fontSize: '0.82rem', padding: '6px' }}
                          value={val.observation}
                          onChange={e => handleItemChange(prod.id, 'observation', e.target.value)}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button 
              onClick={handleFinishStep1}
              className="btn btn-primary flex items-center gap-2"
              style={{ background: '#009C48', borderColor: '#009C48', padding: '12px 28px', fontSize: '1.05rem', fontWeight: 800 }}
            >
              <FileCheck size={20} /> Finalizar Conteo y Pasar a Firma →
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: FIRMA DIGITAL Y GENERACIÓN DE PDF */}
      {step === 2 && (
        <div className="card" style={{ maxWidth: '650px', margin: '0 auto' }}>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#009C48' }}>
            <FileCheck size={24} /> Conformidad y Cierre de Inventario
          </h2>

          <div className="mb-6" style={{ background: 'var(--bg-color)', padding: '16px', borderRadius: '10px' }}>
            <p style={{ margin: '4px 0', fontSize: '0.9rem' }}><strong>Isla:</strong> ISLA {mockIslas.find(i => i.id === selectedIsla)?.name}</p>
            <p style={{ margin: '4px 0', fontSize: '0.9rem' }}><strong>Responsable:</strong> {evaluatorName}</p>
            <p style={{ margin: '4px 0', fontSize: '0.9rem' }}><strong>Fecha / Hora:</strong> {inventoryDate} ({startTime} - {endTime})</p>
            
            <div className="flex gap-4 mt-3 pt-3" style={{ borderTop: '1px dashed var(--border-color)' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--danger)' }}>
                Faltantes: <strong>{totals.totalMissing} un. (${totals.totalMissingDollars.toFixed(2)})</strong>
              </span>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#009C48' }}>
                Cuadran: <strong>{totals.totalMatch} prod.</strong>
              </span>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0284c7' }}>
                Sobran: <strong>+{totals.totalSurplus} un. (+${totals.totalSurplusDollars.toFixed(2)})</strong>
              </span>
            </div>
          </div>

          <div className="form-group mb-6">
            <label className="form-label font-bold mb-2">Firma Digital de Conformidad *</label>
            <div style={{ border: '2px dashed var(--border-color)', borderRadius: '10px', background: '#fff' }}>
              <SignatureCanvas 
                ref={sigRef} 
                penColor="black"
                canvasProps={{ width: 550, height: 160, className: 'sigCanvas' }} 
              />
            </div>
            <button 
              type="button" 
              onClick={() => sigRef.current?.clear()} 
              className="btn btn-ghost text-muted mt-2" 
              style={{ fontSize: '0.8rem' }}
            >
              Borrar firma para reintentar
            </button>
          </div>

          <div className="flex justify-end gap-3">
            <button 
              type="button" 
              onClick={() => setStep(1)} 
              className="btn btn-ghost"
            >
              ← Modificar Conteo
            </button>

            <button 
              onClick={handleSaveInventory}
              disabled={isSaving}
              className="btn btn-primary" 
              style={{ background: '#009C48', borderColor: '#009C48', padding: '12px 24px', fontWeight: 800 }}
            >
              {isSaving ? 'Guardando...' : '💾 Guardar Inventario e Imprimir PDF'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
