import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Eye, AlertCircle, CheckCircle, X, Download, Package, FileText, Search, Pencil, Save, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { generatePDF, generateInventoryPDF } from '../lib/pdfGenerator';
import { mockIslas } from '../data/mock';
import { useAuth } from '../context/AuthContext';

export function History() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [inventories, setInventories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modales de detalle (Ver)
  const [selectedEval, setSelectedEval] = useState<any>(null);
  const [evalResponses, setEvalResponses] = useState<any[]>([]);
  
  const [selectedInv, setSelectedInv] = useState<any>(null);
  const [invItems, setInvItems] = useState<any[]>([]);
  
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Modales de edición (Editar - Solo Admin)
  const [editingEval, setEditingEval] = useState<any>(null);
  const [editingResponses, setEditingResponses] = useState<any[]>([]);
  const [editingInv, setEditingInv] = useState<any>(null);
  const [editingInvItems, setEditingInvItems] = useState<any[]>([]);
  const [savingEdit, setSavingEdit] = useState(false);

  // Filtros
  const [activeTab, setActiveTab] = useState<'all' | 'evaluations' | 'inventories'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIslaFilter, setSelectedIslaFilter] = useState('');

  useEffect(() => {
    fetchAllHistoryData();
  }, []);

  const fetchAllHistoryData = async () => {
    setLoading(true);
    try {
      // 1. Cargar Evaluaciones (Supabase + Respaldo Local)
      let dbEvals: any[] = [];
      try {
        const { data, error } = await supabase
          .from('evaluations')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) dbEvals = data;
      } catch (e) {
        console.warn('Error fetching db evaluations:', e);
      }

      const savedOfflineEvals = localStorage.getItem('gedaluma_offline_evaluations');
      let offlineEvals: any[] = [];
      if (savedOfflineEvals) {
        try { offlineEvals = JSON.parse(savedOfflineEvals); } catch(e){}
      }

      const combinedEvals = [...dbEvals];
      offlineEvals.forEach(off => {
        if (!combinedEvals.some(e => e.id === off.id)) {
          combinedEvals.push({ ...off, record_type: 'evaluation' });
        }
      });
      setEvaluations(combinedEvals.map(e => ({ ...e, record_type: 'evaluation' })));

      // 2. Cargar Inventarios (Supabase + Respaldo Local)
      let dbInvs: any[] = [];
      try {
        const { data, error } = await supabase
          .from('inventories')
          .select('*')
          .order('created_at', { ascending: false });
        if (!error && data) dbInvs = data;
      } catch (e) {
        console.warn('Error fetching db inventories:', e);
      }

      const savedOfflineInvs = localStorage.getItem('gedaluma_offline_inventories');
      let offlineInvs: any[] = [];
      if (savedOfflineInvs) {
        try { offlineInvs = JSON.parse(savedOfflineInvs); } catch(e){}
      }

      const combinedInvs = [...dbInvs];
      offlineInvs.forEach(off => {
        if (!combinedInvs.some(i => i.id === off.id)) {
          combinedInvs.push({ ...off, record_type: 'inventory' });
        }
      });
      setInventories(combinedInvs.map(i => ({ ...i, record_type: 'inventory' })));

    } catch (err) {
      console.error('Error cargando historial:', err);
    } finally {
      setLoading(false);
    }
  };

  // Alternar validez de evaluación
  const toggleEvalValidation = async (id: string, currentStatus: boolean) => {
    setEvaluations(prev => prev.map(e => e.id === id ? { ...e, is_valid: !currentStatus } : e));

    try {
      const { data, error } = await supabase
        .from('evaluations')
        .update({ is_valid: !currentStatus })
        .eq('id', id)
        .select();
        
      if (error || !data || data.length === 0) {
        throw error || new Error("Supabase bloqueó la actualización.");
      }
    } catch (err: any) {
      console.error('Error al actualizar evaluación:', err);
      alert('Hubo un aviso al cambiar el estado. Recargando datos...');
      fetchAllHistoryData();
    }
  };

  // Alternar validez de inventario
  const toggleInvValidation = async (id: string, currentStatus: boolean) => {
    setInventories(prev => prev.map(i => i.id === id ? { ...i, is_valid: !currentStatus } : i));

    try {
      const { data, error } = await supabase
        .from('inventories')
        .update({ is_valid: !currentStatus })
        .eq('id', id)
        .select();
        
      if (error || !data || data.length === 0) {
        throw error || new Error("Supabase bloqueó la actualización.");
      }
    } catch (err: any) {
      console.error('Error al actualizar inventario:', err);
      alert('Hubo un aviso al cambiar el estado del inventario. Recargando...');
      fetchAllHistoryData();
    }
  };

  // Alternar visto de descuento en inventario
  const toggleInvDiscount = async (id: string, currentDiscounted: boolean) => {
    setInventories(prev => prev.map(i => i.id === id ? { ...i, is_discounted: !currentDiscounted } : i));

    try {
      const { data, error } = await supabase
        .from('inventories')
        .update({ is_discounted: !currentDiscounted })
        .eq('id', id)
        .select();

      if (error || !data || data.length === 0) {
        throw error || new Error("Supabase bloqueó la actualización.");
      }
    } catch (err) {
      console.error('Error al actualizar estado de descuento:', err);
    }
  };

  // Eliminar Evaluación (Solo Admin)
  const handleDeleteEvaluation = async (id: string, islaName: string) => {
    if (!window.confirm(`⚠️ ¿Estás seguro de que deseas ELIMINAR PERMANENTEMENTE esta evaluación de la Isla ${islaName}? Esta acción no se puede deshacer.`)) {
      return;
    }

    setEvaluations(prev => prev.filter(e => e.id !== id));

    try {
      await supabase.from('responses').delete().eq('evaluation_id', id);
      const { error } = await supabase.from('evaluations').delete().eq('id', id);

      if (error) {
        console.warn('Error al eliminar en Supabase, removiendo de caché local:', error);
      }

      try {
        const savedOffline = localStorage.getItem('gedaluma_offline_evaluations');
        if (savedOffline) {
          const arr: any[] = JSON.parse(savedOffline);
          const filtered = arr.filter(o => o.id !== id);
          localStorage.setItem('gedaluma_offline_evaluations', JSON.stringify(filtered));
        }
      } catch (e) {}

      alert('✅ Evaluación eliminada correctamente.');
    } catch (err: any) {
      alert(`⚠️ Error al eliminar evaluación: ${err.message || String(err)}`);
    }
  };

  // Eliminar Inventario (Solo Admin)
  const handleDeleteInventory = async (id: string, islaName: string) => {
    if (!window.confirm(`⚠️ ¿Estás seguro de que deseas ELIMINAR PERMANENTEMENTE este inventario de la Isla ${islaName}? Esta acción no se puede deshacer.`)) {
      return;
    }

    setInventories(prev => prev.filter(i => i.id !== id));

    try {
      await supabase.from('inventory_items').delete().eq('inventory_id', id);
      const { error } = await supabase.from('inventories').delete().eq('id', id);

      if (error) {
        console.warn('Error al eliminar en Supabase, removiendo de caché local:', error);
      }

      try {
        const savedOfflineInv = localStorage.getItem('gedaluma_offline_inventories');
        if (savedOfflineInv) {
          const arr: any[] = JSON.parse(savedOfflineInv);
          const filtered = arr.filter(o => o.id !== id);
          localStorage.setItem('gedaluma_offline_inventories', JSON.stringify(filtered));
        }

        const offlineItemsMap = JSON.parse(localStorage.getItem('gedaluma_offline_inventory_items') || '{}');
        delete offlineItemsMap[id];
        localStorage.setItem('gedaluma_offline_inventory_items', JSON.stringify(offlineItemsMap));
      } catch (e) {}

      alert('✅ Inventario eliminado correctamente.');
    } catch (err: any) {
      alert(`⚠️ Error al eliminar inventario: ${err.message || String(err)}`);
    }
  };

  // Abrir detalle de Evaluación
  const viewEvalDetails = async (evaluation: any) => {
    setSelectedEval(evaluation);
    setLoadingDetails(true);
    try {
      const { data, error } = await supabase
        .from('responses')
        .select('*')
        .eq('evaluation_id', evaluation.id);
      if (!error && data) {
        setEvalResponses(data);
      } else {
        setEvalResponses([]);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Abrir detalle de Inventario
  const viewInvDetails = async (inventory: any) => {
    setSelectedInv(inventory);
    setLoadingDetails(true);
    try {
      let items: any[] = [];
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('inventory_id', inventory.id);

      if (!error && data && data.length > 0) {
        items = data;
      } else {
        const offlineItemsMap = JSON.parse(localStorage.getItem('gedaluma_offline_inventory_items') || '{}');
        items = offlineItemsMap[inventory.id] || [];
      }
      setInvItems(items);
    } catch (err) {
      console.error('Error cargando ítems de inventario:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Abrir modal de edición de Evaluación (Solo Admin)
  const openEditEvalModal = async (evaluation: any) => {
    setEditingEval({ ...evaluation });
    setLoadingDetails(true);
    try {
      const { data } = await supabase
        .from('responses')
        .select('*')
        .eq('evaluation_id', evaluation.id);
      setEditingResponses(data || []);
    } catch (e) {
      setEditingResponses([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Guardar cambios de Evaluación (Solo Admin)
  const handleSaveEvaluationEdit = async () => {
    if (!editingEval) return;
    setSavingEdit(true);

    try {
      const payloadToUpdate = {
        isla_id: String(editingEval.isla_id),
        isla_name: editingEval.isla_name,
        evaluator_name: editingEval.evaluator_name,
        evaluator_role: editingEval.evaluator_role,
        evaluated_employee: editingEval.evaluated_employee || null,
        total_score: Number(editingEval.total_score || 0),
        status: editingEval.status,
        auditor_type: editingEval.auditor_type || null,
        time_slot: editingEval.time_slot || null
      };

      // 1. Actualizar en Supabase si no es registro offline puro
      const { error } = await supabase
        .from('evaluations')
        .update(payloadToUpdate)
        .eq('id', editingEval.id);

      if (error) {
        console.warn("Supabase update error, actualizando estado local:", error);
      }

      // 2. Actualizar respuestas si fueron modificadas
      if (editingResponses.length > 0) {
        for (const resp of editingResponses) {
          if (resp.id) {
            await supabase
              .from('responses')
              .update({
                value: resp.value,
                observation: resp.observation || null
              })
              .eq('id', resp.id);
          }
        }
      }

      // 3. Actualizar estado local
      setEvaluations(prev => prev.map(e => e.id === editingEval.id ? { ...e, ...payloadToUpdate } : e));

      // 4. Actualizar respaldo local en localStorage si aplica
      const savedOfflineEvals = localStorage.getItem('gedaluma_offline_evaluations');
      if (savedOfflineEvals) {
        try {
          const offlineArr: any[] = JSON.parse(savedOfflineEvals);
          const updated = offlineArr.map(o => o.id === editingEval.id ? { ...o, ...payloadToUpdate } : o);
          localStorage.setItem('gedaluma_offline_evaluations', JSON.stringify(updated));
        } catch(e){}
      }

      alert('✅ Evaluación modificada exitosamente.');
      setEditingEval(null);
    } catch (err: any) {
      alert(`⚠️ Error al guardar cambios: ${err.message || String(err)}`);
    } finally {
      setSavingEdit(false);
    }
  };

  // Abrir modal de edición de Inventario (Solo Admin)
  const openEditInvModal = async (inventory: any) => {
    setEditingInv({ ...inventory });
    setLoadingDetails(true);
    try {
      let items: any[] = [];
      const { data } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('inventory_id', inventory.id);
      if (data && data.length > 0) {
        items = data;
      } else {
        const offlineItemsMap = JSON.parse(localStorage.getItem('gedaluma_offline_inventory_items') || '{}');
        items = offlineItemsMap[inventory.id] || [];
      }
      setEditingInvItems(items);
    } catch (e) {
      setEditingInvItems([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Recalcular totales del inventario en edición
  const recalculateInvTotals = (items: any[]) => {
    let missingUn = 0;
    let missingDol = 0;
    let matchUn = 0;
    let surplusUn = 0;
    let surplusDol = 0;

    items.forEach(it => {
      const sys = Number(it.system_qty || 0);
      const phy = Number(it.physical_qty || 0);
      const cost = Number(it.cost || 0);
      const diff = phy - sys;

      if (diff < 0) {
        missingUn += Math.abs(diff);
        missingDol += Math.abs(diff) * cost;
      } else if (diff > 0) {
        surplusUn += diff;
        surplusDol += diff * cost;
      } else {
        matchUn += 1;
      }
    });

    setEditingInv((prev: any) => ({
      ...prev,
      total_missing: Number(missingUn.toFixed(2)),
      total_missing_dollars: Number(missingDol.toFixed(2)),
      total_match: matchUn,
      total_surplus: Number(surplusUn.toFixed(2)),
      total_surplus_dollars: Number(surplusDol.toFixed(2))
    }));
  };

  // Guardar cambios de Inventario (Solo Admin)
  const handleSaveInventoryEdit = async () => {
    if (!editingInv) return;
    setSavingEdit(true);

    try {
      const payloadToUpdate = {
        isla_id: String(editingInv.isla_id),
        isla_name: editingInv.isla_name,
        evaluator_name: editingInv.evaluator_name,
        date: editingInv.date,
        start_time: editingInv.start_time,
        end_time: editingInv.end_time,
        total_missing: Number(editingInv.total_missing || 0),
        total_missing_dollars: Number(editingInv.total_missing_dollars || 0),
        total_match: Number(editingInv.total_match || 0),
        total_surplus: Number(editingInv.total_surplus || 0),
        total_surplus_dollars: Number(editingInv.total_surplus_dollars || 0),
        is_discounted: !!editingInv.is_discounted
      };

      // 1. Actualizar inventario principal en Supabase
      const { error } = await supabase
        .from('inventories')
        .update(payloadToUpdate)
        .eq('id', editingInv.id);

      if (error) {
        console.warn("Supabase update inventory warning:", error);
      }

      // 2. Actualizar cada ítem de inventario si posee ID en DB
      if (editingInvItems.length > 0) {
        for (const item of editingInvItems) {
          const sys = Number(item.system_qty || 0);
          const phy = Number(item.physical_qty || 0);
          const diff = phy - sys;
          const impact = diff * Number(item.cost || 0);

          if (item.id) {
            await supabase
              .from('inventory_items')
              .update({
                system_qty: sys,
                physical_qty: phy,
                diff_qty: diff,
                cost: Number(item.cost || 0),
                total_cost_impact: impact,
                observation: item.observation || ''
              })
              .eq('id', item.id);
          }
        }
      }

      // 3. Actualizar estado local
      setInventories(prev => prev.map(i => i.id === editingInv.id ? { ...i, ...payloadToUpdate } : i));

      // 4. Actualizar respaldo local en localStorage si aplica
      const savedOfflineInvs = localStorage.getItem('gedaluma_offline_inventories');
      if (savedOfflineInvs) {
        try {
          const offlineArr: any[] = JSON.parse(savedOfflineInvs);
          const updated = offlineArr.map(o => o.id === editingInv.id ? { ...o, ...payloadToUpdate } : o);
          localStorage.setItem('gedaluma_offline_inventories', JSON.stringify(updated));

          const offlineItemsMap = JSON.parse(localStorage.getItem('gedaluma_offline_inventory_items') || '{}');
          offlineItemsMap[editingInv.id] = editingInvItems;
          localStorage.setItem('gedaluma_offline_inventory_items', JSON.stringify(offlineItemsMap));
        } catch(e){}
      }

      alert('✅ Inventario modificado exitosamente.');
      setEditingInv(null);
    } catch (err: any) {
      alert(`⚠️ Error al guardar cambios de inventario: ${err.message || String(err)}`);
    } finally {
      setSavingEdit(false);
    }
  };

  // Descargar PDF de Inventario en un clic
  const downloadInventoryPDFDirect = async (inventory: any) => {
    let items: any[] = [];
    try {
      const { data } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('inventory_id', inventory.id);
      if (data && data.length > 0) {
        items = data;
      } else {
        const offlineItemsMap = JSON.parse(localStorage.getItem('gedaluma_offline_inventory_items') || '{}');
        items = offlineItemsMap[inventory.id] || [];
      }
    } catch (e) {}

    generateInventoryPDF(inventory, items);
  };

  // Combinar registros según filtros
  const combinedRecords: any[] = [];
  
  if (activeTab === 'all' || activeTab === 'evaluations') {
    evaluations.forEach(e => combinedRecords.push({ ...e, record_type: 'evaluation' }));
  }
  if (activeTab === 'all' || activeTab === 'inventories') {
    inventories.forEach(i => combinedRecords.push({ ...i, record_type: 'inventory' }));
  }

  // Ordenar por fecha descendente
  combinedRecords.sort((a, b) => {
    const dateA = new Date(a.created_at || a.date).getTime();
    const dateB = new Date(b.created_at || b.date).getTime();
    return dateB - dateA;
  });

  // Filtrado de búsqueda e isla
  const filteredRecords = combinedRecords.filter(item => {
    const searchLower = searchTerm.toLowerCase().trim();
    const matchesSearch = !searchTerm || 
      (item.isla_name && item.isla_name.toLowerCase().includes(searchLower)) ||
      (item.evaluator_name && item.evaluator_name.toLowerCase().includes(searchLower)) ||
      (item.evaluated_employee && item.evaluated_employee.toLowerCase().includes(searchLower));

    const matchesIsla = !selectedIslaFilter || 
      String(item.isla_id) === String(selectedIslaFilter) || 
      (item.isla_name && item.isla_name.toLowerCase().includes(selectedIslaFilter.toLowerCase()));

    return matchesSearch && matchesIsla;
  });

  return (
    <div className="container" style={{ maxWidth: '1240px', paddingBottom: '40px' }}>
      {/* HEADER DE LA PÁGINA */}
      <header className="flex justify-between items-center header-flex-mobile" style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <h1 className="text-2xl" style={{ fontWeight: 800, color: '#009C48', display: 'flex', alignItems: 'center', gap: '8px' }}>
            Historial de Evaluaciones e Inventarios
          </h1>
          <p className="text-muted" style={{ fontSize: '0.88rem' }}>
            Auditorías de desempeño, visitas fantasma y conteos físicos de existencias
          </p>
        </div>
        
        <div className="flex gap-2 items-center flex-wrap header-actions-mobile" style={{ paddingRight: '10px' }}>
          <Link 
            to="/evaluate" 
            className="btn hover-lift"
            style={{ height: '36px', padding: '0 12px', fontSize: '0.8rem', fontWeight: 700, borderRadius: '8px', background: '#009C48', border: '1px solid #009C48', color: '#ffffff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
          >
            + Evaluación
          </Link>

          <Link 
            to="/evaluate?mode=ghost" 
            className="btn hover-lift"
            style={{ height: '36px', padding: '0 12px', fontSize: '0.8rem', fontWeight: 700, borderRadius: '8px', background: '#f7b500', border: '1px solid #f7b500', color: '#000000', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
          >
            + Cliente Fantasma
          </Link>

          <Link 
            to="/inventory/new" 
            className="btn hover-lift"
            style={{ height: '36px', padding: '0 12px', fontSize: '0.8rem', fontWeight: 700, borderRadius: '8px', background: '#0284c7', border: '1px solid #0284c7', color: '#ffffff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
          >
            + Conteo Inventario
          </Link>

          <Link 
            to="/dashboard" 
            className="btn hover-lift" 
            style={{ height: '36px', padding: '0 12px', fontSize: '0.8rem', fontWeight: 700, borderRadius: '8px', background: 'var(--surface-color)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', whiteSpace: 'nowrap' }}
          >
            ← Volver al Panel
          </Link>
        </div>
      </header>

      {/* BARRA DE BOTONES DE FILTRO Y BÚSQUEDA */}
      <div className="card" style={{ padding: '16px', marginBottom: '24px', borderRadius: '12px' }}>
        <div className="flex justify-between items-center flex-wrap gap-4">
          
          {/* PESTAÑAS TIPO DE REGISTRO */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className="btn"
              style={{
                padding: '6px 14px',
                fontSize: '0.82rem',
                fontWeight: 800,
                borderRadius: '8px',
                background: activeTab === 'all' ? '#009C48' : 'var(--surface-color)',
                color: activeTab === 'all' ? '#ffffff' : 'var(--text-primary)',
                border: `1px solid ${activeTab === 'all' ? '#009C48' : 'var(--border-color)'}`
              }}
            >
              🌐 Todos ({evaluations.length + inventories.length})
            </button>

            <button
              onClick={() => setActiveTab('evaluations')}
              className="btn"
              style={{
                padding: '6px 14px',
                fontSize: '0.82rem',
                fontWeight: 800,
                borderRadius: '8px',
                background: activeTab === 'evaluations' ? '#009C48' : 'var(--surface-color)',
                color: activeTab === 'evaluations' ? '#ffffff' : 'var(--text-primary)',
                border: `1px solid ${activeTab === 'evaluations' ? '#009C48' : 'var(--border-color)'}`
              }}
            >
              📝 Evaluaciones ({evaluations.length})
            </button>

            <button
              onClick={() => setActiveTab('inventories')}
              className="btn"
              style={{
                padding: '6px 14px',
                fontSize: '0.82rem',
                fontWeight: 800,
                borderRadius: '8px',
                background: activeTab === 'inventories' ? '#0284c7' : 'var(--surface-color)',
                color: activeTab === 'inventories' ? '#ffffff' : 'var(--text-primary)',
                border: `1px solid ${activeTab === 'inventories' ? '#0284c7' : 'var(--border-color)'}`
              }}
            >
              📦 Inventarios ({inventories.length})
            </button>
          </div>

          {/* CONTROLES BÚSQUEDA Y SELECCIÓN DE ISLA */}
          <div className="flex items-center gap-3 flex-wrap" style={{ minWidth: '280px' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
              <input 
                type="text"
                placeholder="Buscar isla o evaluador..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="form-control"
                style={{ paddingLeft: '32px', fontSize: '0.82rem', height: '36px' }}
              />
            </div>

            <div style={{ position: 'relative', minWidth: '150px' }}>
              <select
                value={selectedIslaFilter}
                onChange={e => setSelectedIslaFilter(e.target.value)}
                className="form-control"
                style={{ fontSize: '0.82rem', height: '36px' }}
              >
                <option value="">Todas las Islas</option>
                {mockIslas.map(i => (
                  <option key={i.id} value={i.name}>Isla {i.name}</option>
                ))}
              </select>
            </div>
          </div>

        </div>
      </div>

      {/* TABLA PRINCIPAL DE REGISTROS */}
      <div className="card" style={{ padding: '0', overflow: 'hidden', borderRadius: '12px' }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p className="text-muted">Cargando historial de auditorías e inventarios...</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '960px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ background: 'var(--surface-color)', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>Tipo</th>
                  <th style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>Fecha</th>
                  <th style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>Isla</th>
                  <th style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>Evaluador / Auditor</th>
                  <th style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>Resultado / Métrica</th>
                  <th style={{ padding: '12px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>Estado RLS</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right', whiteSpace: 'nowrap' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map(item => {
                  const isInv = item.record_type === 'inventory';
                  const dateStr = item.created_at ? new Date(item.created_at).toLocaleString() : item.date;
                  const isValid = item.is_valid !== false;

                  return (
                    <tr 
                      key={`${item.record_type}_${item.id}`} 
                      style={{ 
                        borderBottom: '1px solid var(--border-color)', 
                        opacity: isValid ? 1 : 0.5,
                        background: isInv ? 'rgba(2, 132, 199, 0.02)' : 'transparent'
                      }}
                    >
                      {/* TIPO */}
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        {isInv ? (
                          <span style={{ 
                            padding: '4px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 800,
                            background: 'rgba(2, 132, 199, 0.12)', color: '#0284c7', border: '1px solid rgba(2, 132, 199, 0.3)',
                            display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap'
                          }}>
                            <Package size={13} /> Inventario
                          </span>
                        ) : item.evaluator_role === 'ghost' ? (
                          <span style={{ 
                            padding: '4px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 800,
                            background: 'rgba(247, 181, 0, 0.15)', color: '#b45309', border: '1px solid rgba(247, 181, 0, 0.4)',
                            display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap'
                          }}>
                            👻 Fantasma
                          </span>
                        ) : (
                          <span style={{ 
                            padding: '4px 8px', borderRadius: '6px', fontSize: '0.74rem', fontWeight: 800,
                            background: 'rgba(0, 156, 72, 0.1)', color: '#009C48', border: '1px solid rgba(0, 156, 72, 0.3)',
                            display: 'inline-flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap'
                          }}>
                            📝 Auditoría
                          </span>
                        )}
                      </td>

                      {/* FECHA */}
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap', fontWeight: 600 }}>
                        {dateStr}
                      </td>

                      {/* ISLA */}
                      <td style={{ padding: '12px 14px', fontWeight: 800, color: '#009C48', whiteSpace: 'nowrap' }}>
                        ISLA {item.isla_name}
                      </td>

                      {/* EVALUADOR */}
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontWeight: 700, display: 'block', whiteSpace: 'nowrap' }}>{item.evaluator_name}</span>
                        {item.evaluated_employee && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', whiteSpace: 'nowrap' }}>
                            Evaluado: {item.evaluated_employee}
                          </span>
                        )}
                      </td>

                      {/* RESULTADO / MÉTRICA */}
                      <td style={{ padding: '12px 14px', whiteSpace: 'nowrap' }}>
                        {isInv ? (
                          <div>
                            <span style={{ 
                              fontWeight: 800, 
                              color: Number(item.total_missing || 0) > 0 ? '#ef4444' : '#009C48',
                              whiteSpace: 'nowrap'
                            }}>
                              {Number(item.total_missing || 0) > 0 ? `Faltantes: ${item.total_missing} un. ($${Number(item.total_missing_dollars || 0).toFixed(2)})` : '✓ 100% Conforme'}
                            </span>
                            <span style={{ display: 'block', fontSize: '0.74rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                              OK: {item.total_match || 0} prod. | Sobrantes: +{item.total_surplus || 0}
                            </span>
                          </div>
                        ) : (
                          <span style={{ 
                            fontWeight: 900, fontSize: '0.95rem',
                            color: Number(item.total_score || 0) >= 85 ? '#009C48' : Number(item.total_score || 0) >= 70 ? '#f59e0b' : '#ef4444',
                            whiteSpace: 'nowrap'
                          }}>
                            {Number(item.total_score || 0).toFixed(2)}%
                          </span>
                        )}
                      </td>

                      {/* ESTADO VALIDACIÓN RLS */}
                      <td style={{ padding: '12px 14px', textAlign: 'center', whiteSpace: 'nowrap' }}>
                        {isValid ? (
                          <span className="text-success flex items-center justify-center gap-1" style={{ fontWeight: 700, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                            <CheckCircle size={14}/> Válido
                          </span>
                        ) : (
                          <span className="text-danger flex items-center justify-center gap-1" style={{ fontWeight: 700, fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                            <AlertCircle size={14}/> Anulado
                          </span>
                        )}

                        {isInv && (
                          <button
                            onClick={() => toggleInvDiscount(item.id, !!item.is_discounted)}
                            style={{
                              marginTop: '4px',
                              padding: '2px 6px',
                              fontSize: '0.68rem',
                              fontWeight: 800,
                              borderRadius: '4px',
                              background: item.is_discounted ? 'rgba(0, 156, 72, 0.15)' : 'rgba(247, 181, 0, 0.15)',
                              color: item.is_discounted ? '#009C48' : '#b45309',
                              border: 'none',
                              cursor: 'pointer',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {item.is_discounted ? '✓ Descontado' : '⚠️ Pendiente'}
                          </button>
                        )}
                      </td>

                      {/* ACCIONES */}
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div className="flex gap-1.5 justify-end items-center" style={{ flexWrap: 'nowrap' }}>
                          
                          {/* BOTÓN VER DETALLE */}
                          <button 
                            onClick={() => isInv ? viewInvDetails(item) : viewEvalDetails(item)} 
                            className="btn hover-lift" 
                            style={{ padding: '5px 8px', fontSize: '0.78rem', background: 'rgba(0, 156, 72, 0.08)', color: '#009C48', border: '1px solid rgba(0, 156, 72, 0.2)', borderRadius: '6px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Eye size={14} /> Ver
                          </button>

                          {/* BOTÓN EDITAR VALORES (SOLO ROL ADMIN) */}
                          {isAdmin && (
                            <button
                              onClick={() => isInv ? openEditInvModal(item) : openEditEvalModal(item)}
                              className="btn hover-lift"
                              style={{ padding: '5px 8px', fontSize: '0.78rem', background: 'rgba(2, 132, 199, 0.12)', color: '#0284c7', border: '1px solid rgba(2, 132, 199, 0.3)', borderRadius: '6px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              title="Editar valores de este registro (Exclusivo Administrador)"
                            >
                              <Pencil size={14} /> Editar
                            </button>
                          )}

                          {/* BOTÓN INFORME PDF */}
                          <button 
                            onClick={() => isInv ? downloadInventoryPDFDirect(item) : viewEvalDetails(item)} 
                            className="btn hover-lift" 
                            style={{ padding: '5px 8px', fontSize: '0.78rem', background: 'var(--surface-color)', color: 'var(--text-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            title="Descargar Informe PDF"
                          >
                            <Download size={14} /> PDF
                          </button>

                          {/* BOTÓN ANULAR / ACTIVAR */}
                          <button 
                            onClick={() => isInv ? toggleInvValidation(item.id, isValid) : toggleEvalValidation(item.id, isValid)} 
                            className="btn hover-lift"
                            style={{ 
                              padding: '5px 8px', fontSize: '0.75rem', fontWeight: 700, borderRadius: '6px',
                              color: isValid ? 'var(--danger)' : '#009C48', 
                              border: `1px solid ${isValid ? 'rgba(239, 68, 68, 0.3)' : 'rgba(0, 156, 72, 0.3)'}`,
                              background: 'transparent',
                              whiteSpace: 'nowrap',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            {isValid ? 'Anular' : 'Activar'}
                          </button>

                          {/* BOTÓN ELIMINAR (SOLO ADMIN) */}
                          {isAdmin && (
                            <button 
                              onClick={() => isInv ? handleDeleteInventory(item.id, item.isla_name) : handleDeleteEvaluation(item.id, item.isla_name)} 
                              className="btn hover-lift"
                              style={{ 
                                padding: '5px 8px', fontSize: '0.75rem', fontWeight: 700, borderRadius: '6px',
                                color: '#ef4444', 
                                border: '1px solid rgba(239, 68, 68, 0.4)',
                                background: 'rgba(239, 68, 68, 0.08)',
                                whiteSpace: 'nowrap',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="Eliminar registro permanentemente (Administrador)"
                            >
                              <Trash2 size={13} /> Eliminar
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })}

                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No se encontraron registros de auditorías ni inventarios con los criterios seleccionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL VER DETALLE DE EVALUACIÓN */}
      {selectedEval && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          padding: '20px'
        }}>
          <div className="card" style={{ 
            width: '100%', maxWidth: '820px', maxHeight: '90vh', 
            overflowY: 'auto', position: 'relative', borderRadius: '16px' 
          }}>
            <button 
              onClick={() => setSelectedEval(null)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}
            >
              <X size={24} />
            </button>
            
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl" style={{ fontWeight: 800, color: '#009C48' }}>Detalle de Evaluación de Desempeño</h2>
              {!loadingDetails && (
                <button 
                  onClick={() => generatePDF(selectedEval, evalResponses)}
                  className="btn btn-outline hover-lift"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '40px', fontSize: '0.82rem' }}
                >
                  <Download size={16} />
                  <span>Descargar PDF</span>
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '20px', padding: '16px', background: 'var(--surface-color)', borderRadius: '10px', border: '1px solid var(--border-color)', fontSize: '0.88rem' }}>
              <div><strong>Isla:</strong> ISLA {selectedEval.isla_name}</div>
              <div><strong>Evaluador:</strong> {selectedEval.evaluator_name}</div>
              <div><strong>Fecha:</strong> {new Date(selectedEval.created_at || selectedEval.date).toLocaleString()}</div>
              <div><strong>Puntaje Obtenido:</strong> <span style={{ fontWeight: 900, color: '#009C48' }}>{Number(selectedEval.total_score || 0).toFixed(2)}%</span></div>
            </div>

            <h3 className="text-lg mb-3" style={{ fontWeight: 700 }}>Respuestas y Evidencias Registradas</h3>
            {loadingDetails ? (
              <p className="text-muted">Cargando respuestas de la evaluación...</p>
            ) : (
              <div className="flex flex-col gap-4">
                {evalResponses.map((resp, i) => (
                  <div key={resp.id || i} style={{ padding: '14px', background: 'var(--surface-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <p style={{ fontWeight: 700, marginBottom: '6px', fontSize: '0.88rem' }}>{i + 1}. {resp.question_text}</p>
                    <p className="text-primary" style={{ fontWeight: 800, marginBottom: '6px', fontSize: '0.85rem' }}>Respuesta: {resp.value}</p>
                    
                    {resp.observation && (
                      <p className="text-muted" style={{ fontStyle: 'italic', marginBottom: '6px', fontSize: '0.82rem' }}>
                        Observación: {resp.observation}
                      </p>
                    )}
                    
                    {resp.photo_data && (
                      <div style={{ marginTop: '10px' }}>
                        <p style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '4px' }}>Evidencia Fotográfica:</p>
                        <img 
                          src={resp.photo_data} 
                          alt="Evidencia" 
                          style={{ maxWidth: '100%', maxHeight: '280px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                        />
                      </div>
                    )}
                  </div>
                ))}
                {evalResponses.length === 0 && (
                  <p className="text-muted" style={{ padding: '12px' }}>No hay detalle de preguntas registrado para esta evaluación.</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL VER DETALLE DE INVENTARIO */}
      {selectedInv && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          padding: '20px'
        }}>
          <div className="card" style={{ 
            width: '100%', maxWidth: '900px', maxHeight: '90vh', 
            overflowY: 'auto', position: 'relative', borderRadius: '16px' 
          }}>
            <button 
              onClick={() => setSelectedInv(null)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}
            >
              <X size={24} />
            </button>
            
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl" style={{ fontWeight: 800, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Package size={22} /> Detalle de Conteo de Inventario Físico
                </h2>
                <p className="text-muted" style={{ fontSize: '0.82rem' }}>
                  Resumen de diferencias de existencias entre sistema y conteo físico en isla
                </p>
              </div>

              {!loadingDetails && (
                <button 
                  onClick={() => generateInventoryPDF(selectedInv, invItems)}
                  className="btn btn-outline hover-lift"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '40px', fontSize: '0.82rem', borderColor: '#0284c7', color: '#0284c7' }}
                >
                  <FileText size={16} />
                  <span>Descargar Reporte PDF</span>
                </button>
              )}
            </div>
            
            {/* TARJETAS DE RESUMEN KPI DEL INVENTARIO */}
            <div className="grid grid-cols-4 gap-3 mb-4" style={{ background: 'var(--surface-color)', padding: '14px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 700 }}>ISLA & EVALUADOR</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#009C48' }}>ISLA {selectedInv.isla_name}</span>
                <span style={{ fontSize: '0.78rem', display: 'block', color: 'var(--text-primary)' }}>{selectedInv.evaluator_name}</span>
              </div>

              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 700 }}>FALTANTES</span>
                <span style={{ fontSize: '0.92rem', fontWeight: 900, color: Number(selectedInv.total_missing || 0) > 0 ? '#ef4444' : '#009C48' }}>
                  {selectedInv.total_missing || 0} un. (${Number(selectedInv.total_missing_dollars || 0).toFixed(2)})
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 700 }}>PRODUCTOS OK</span>
                <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#0284c7' }}>
                  {selectedInv.total_match || 0} conformes
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', display: 'block', fontWeight: 700 }}>SOBRANTES</span>
                <span style={{ fontSize: '0.92rem', fontWeight: 900, color: '#f59e0b' }}>
                  +{selectedInv.total_surplus || 0} un. (+${Number(selectedInv.total_surplus_dollars || 0).toFixed(2)})
                </span>
              </div>
            </div>

            <h3 className="text-md mb-3" style={{ fontWeight: 800 }}>Desglose de Productos e Impacto ($)</h3>
            
            {loadingDetails ? (
              <p className="text-muted" style={{ padding: '20px', textAlign: 'center' }}>Cargando detalle de ítems de inventario...</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-color)', borderBottom: '1px solid var(--border-color)' }}>
                      <th style={{ padding: '10px 12px' }}>Producto</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>Sistema</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>Físico</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>Diferencia</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Costo Un.</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>Impacto Total ($)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invItems.map((it, idx) => {
                      const diff = Number(it.diff_qty || (it.physical_qty - it.system_qty) || 0);
                      const isMissing = diff < 0;
                      const isSurplus = diff > 0;
                      const impact = Number(it.total_cost_impact || (diff * Number(it.cost || 0)));

                      return (
                        <tr key={it.id || idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '10px 12px', fontWeight: 700 }}>
                            {it.name}
                            {it.category && <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', fontWeight: 400 }}>{it.category}</span>}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>{it.system_qty}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 800 }}>{it.physical_qty}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 900, color: isMissing ? '#ef4444' : isSurplus ? '#f59e0b' : '#009C48' }}>
                            {diff > 0 ? `+${diff}` : diff}
                          </td>
                          <td style={{ padding: '10px 12px', textAlign: 'right' }}>${Number(it.cost || 0).toFixed(2)}</td>
                          <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 800, color: isMissing ? '#ef4444' : isSurplus ? '#f59e0b' : '#009C48' }}>
                            ${Number(impact).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                    {invItems.length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                          No hay detalle de productos guardado para este conteo de inventario.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

          </div>
        </div>
      )}

      {/* MODAL EDICIÓN DE EVALUACIÓN (SOLO ADMIN) */}
      {editingEval && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1100,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', borderRadius: '16px' }}>
            <button 
              onClick={() => setEditingEval(null)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}
            >
              <X size={24} />
            </button>

            <h2 className="text-xl mb-1" style={{ fontWeight: 800, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Pencil size={20} /> Edición de Evaluación / Cliente Fantasma
            </h2>
            <p className="text-muted mb-4" style={{ fontSize: '0.82rem' }}>
              Modificación de valores por Administrador (Cambios reflejados en tiempo real)
            </p>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>Isla</label>
                <select 
                  className="form-control"
                  value={editingEval.isla_name}
                  onChange={(e) => {
                    const found = mockIslas.find(i => i.name === e.target.value);
                    setEditingEval({
                      ...editingEval,
                      isla_name: e.target.value,
                      isla_id: found ? found.id : editingEval.isla_id
                    });
                  }}
                  style={{ fontSize: '0.85rem' }}
                >
                  {mockIslas.map(i => (
                    <option key={i.id} value={i.name}>Isla {i.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>Evaluador / Auditor</label>
                <input 
                  type="text"
                  className="form-control"
                  value={editingEval.evaluator_name || ''}
                  onChange={(e) => setEditingEval({ ...editingEval, evaluator_name: e.target.value })}
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>Empleado Evaluado</label>
                <input 
                  type="text"
                  className="form-control"
                  value={editingEval.evaluated_employee || ''}
                  onChange={(e) => setEditingEval({ ...editingEval, evaluated_employee: e.target.value })}
                  placeholder="Nombre del empleado"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>Puntaje Total (%)</label>
                <input 
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  className="form-control"
                  value={editingEval.total_score || 0}
                  onChange={(e) => setEditingEval({ ...editingEval, total_score: parseFloat(e.target.value) || 0 })}
                  style={{ fontSize: '0.85rem', fontWeight: 800 }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>Estado Ránking / Interpretación</label>
                <input 
                  type="text"
                  className="form-control"
                  value={editingEval.status || ''}
                  onChange={(e) => setEditingEval({ ...editingEval, status: e.target.value })}
                  placeholder="Ej. Excelente, Aceptable, Bajo"
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>Rol de Evaluación</label>
                <select 
                  className="form-control"
                  value={editingEval.evaluator_role || 'evaluator'}
                  onChange={(e) => setEditingEval({ ...editingEval, evaluator_role: e.target.value })}
                  style={{ fontSize: '0.85rem' }}
                >
                  <option value="evaluator">Auditoría Interna / Supervisor</option>
                  <option value="ghost">Cliente Fantasma</option>
                </select>
              </div>
            </div>

            {/* PREGUNTAS EDITABLES DE LA EVALUACIÓN */}
            {editingResponses.length > 0 && (
              <div style={{ marginTop: '16px', marginBottom: '20px' }}>
                <h3 className="text-md mb-2" style={{ fontWeight: 700 }}>Editar Respuestas de Preguntas</h3>
                <div className="flex flex-col gap-3" style={{ maxHeight: '250px', overflowY: 'auto', paddingRight: '6px' }}>
                  {editingResponses.map((r, index) => (
                    <div key={r.id || index} style={{ padding: '10px', background: 'var(--surface-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <p style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px' }}>{index + 1}. {r.question_text}</p>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Respuesta</label>
                          <input 
                            type="text"
                            className="form-control"
                            value={r.value || ''}
                            onChange={(e) => {
                              const updated = [...editingResponses];
                              updated[index].value = e.target.value;
                              setEditingResponses(updated);
                            }}
                            style={{ fontSize: '0.8rem' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Observación</label>
                          <input 
                            type="text"
                            className="form-control"
                            value={r.observation || ''}
                            onChange={(e) => {
                              const updated = [...editingResponses];
                              updated[index].observation = e.target.value;
                              setEditingResponses(updated);
                            }}
                            style={{ fontSize: '0.8rem' }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-4">
              <button 
                onClick={() => setEditingEval(null)}
                className="btn btn-outline"
                style={{ fontSize: '0.85rem' }}
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveEvaluationEdit}
                disabled={savingEdit}
                className="btn hover-lift"
                style={{ background: '#0284c7', color: '#ffffff', border: 'none', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Save size={16} />
                {savingEdit ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDICIÓN DE INVENTARIO (SOLO ADMIN) */}
      {editingInv && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1100,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          padding: '20px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto', position: 'relative', borderRadius: '16px' }}>
            <button 
              onClick={() => setEditingInv(null)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}
            >
              <X size={24} />
            </button>

            <h2 className="text-xl mb-1" style={{ fontWeight: 800, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package size={22} /> Edición de Conteo de Inventario (Administrador)
            </h2>
            <p className="text-muted mb-4" style={{ fontSize: '0.82rem' }}>
              Modificación de existencias, totales de faltantes ($) y visto de descuento en nómina
            </p>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>Isla</label>
                <select 
                  className="form-control"
                  value={editingInv.isla_name}
                  onChange={(e) => {
                    const found = mockIslas.find(i => i.name === e.target.value);
                    setEditingInv({
                      ...editingInv,
                      isla_name: e.target.value,
                      isla_id: found ? found.id : editingInv.isla_id
                    });
                  }}
                  style={{ fontSize: '0.85rem' }}
                >
                  {mockIslas.map(i => (
                    <option key={i.id} value={i.name}>Isla {i.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>Evaluador / Auditor</label>
                <input 
                  type="text"
                  className="form-control"
                  value={editingInv.evaluator_name || ''}
                  onChange={(e) => setEditingInv({ ...editingInv, evaluator_name: e.target.value })}
                  style={{ fontSize: '0.85rem' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700, fontSize: '0.8rem' }}>Fecha del Conteo</label>
                <input 
                  type="text"
                  className="form-control"
                  value={editingInv.date || ''}
                  onChange={(e) => setEditingInv({ ...editingInv, date: e.target.value })}
                  style={{ fontSize: '0.85rem' }}
                />
              </div>
            </div>

            {/* CAMPOS KPI DEL INVENTARIO */}
            <div className="grid grid-cols-4 gap-3 mb-4" style={{ background: 'var(--surface-color)', padding: '12px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#ef4444' }}>Faltantes (Unid.)</label>
                <input 
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={editingInv.total_missing ?? 0}
                  onChange={(e) => setEditingInv({ ...editingInv, total_missing: parseFloat(e.target.value.replace(',', '.')) || 0 })}
                  style={{ fontSize: '0.85rem', fontWeight: 800 }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#ef4444' }}>Faltantes Total ($)</label>
                <input 
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={editingInv.total_missing_dollars ?? 0}
                  onChange={(e) => setEditingInv({ ...editingInv, total_missing_dollars: parseFloat(e.target.value.replace(',', '.')) || 0 })}
                  style={{ fontSize: '0.85rem', fontWeight: 800 }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#0284c7' }}>Conformes (Prod.)</label>
                <input 
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={editingInv.total_match ?? 0}
                  onChange={(e) => setEditingInv({ ...editingInv, total_match: parseFloat(e.target.value.replace(',', '.')) || 0 })}
                  style={{ fontSize: '0.85rem', fontWeight: 800 }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 700, color: '#f59e0b' }}>Sobrantes ($)</label>
                <input 
                  type="number"
                  step="0.01"
                  className="form-control"
                  value={editingInv.total_surplus_dollars ?? 0}
                  onChange={(e) => setEditingInv({ ...editingInv, total_surplus_dollars: parseFloat(e.target.value.replace(',', '.')) || 0 })}
                  style={{ fontSize: '0.85rem', fontWeight: 800 }}
                />
              </div>
            </div>

            {/* TABLA DE PRODUCTOS DE INVENTARIO EDITABLES */}
            {editingInvItems.length > 0 && (
              <div style={{ marginTop: '16px', marginBottom: '20px' }}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-md" style={{ fontWeight: 800 }}>Editar Conteo Físico por Producto</h3>
                  <button 
                    onClick={() => recalculateInvTotals(editingInvItems)}
                    className="btn btn-outline"
                    style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                  >
                    🔄 Recalcular Totales
                  </button>
                </div>

                <div style={{ overflowX: 'auto', maxHeight: '260px' }}>
                  <table style={{ width: '100%', minWidth: '720px', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ background: 'var(--surface-color)', borderBottom: '1px solid var(--border-color)' }}>
                        <th style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>Producto</th>
                        <th style={{ padding: '8px 10px', width: '95px', whiteSpace: 'nowrap' }}>Sistema</th>
                        <th style={{ padding: '8px 10px', width: '95px', whiteSpace: 'nowrap' }}>Físico</th>
                        <th style={{ padding: '8px 10px', width: '95px', whiteSpace: 'nowrap' }}>Diferencia</th>
                        <th style={{ padding: '8px 10px', width: '95px', whiteSpace: 'nowrap' }}>Costo ($)</th>
                        <th style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>Observación</th>
                      </tr>
                    </thead>
                    <tbody>
                      {editingInvItems.map((item, idx) => {
                        const diff = Number((Number(item.physical_qty || 0) - Number(item.system_qty || 0)).toFixed(2));
                        return (
                          <tr key={item.id || idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '6px 8px', fontWeight: 700, whiteSpace: 'nowrap' }}>{item.name}</td>
                            <td style={{ padding: '6px 8px' }}>
                              <input 
                                type="number"
                                step="0.01"
                                className="form-control"
                                value={item.system_qty ?? 0}
                                onChange={(e) => {
                                  const updated = [...editingInvItems];
                                  const val = e.target.value.replace(',', '.');
                                  updated[idx].system_qty = val === '' ? 0 : parseFloat(val) || 0;
                                  setEditingInvItems(updated);
                                }}
                                style={{ fontSize: '0.8rem', height: '30px' }}
                              />
                            </td>
                            <td style={{ padding: '6px 8px' }}>
                              <input 
                                type="number"
                                step="0.01"
                                className="form-control"
                                value={item.physical_qty ?? 0}
                                onChange={(e) => {
                                  const updated = [...editingInvItems];
                                  const val = e.target.value.replace(',', '.');
                                  updated[idx].physical_qty = val === '' ? 0 : parseFloat(val) || 0;
                                  setEditingInvItems(updated);
                                }}
                                style={{ fontSize: '0.8rem', height: '30px', fontWeight: 800 }}
                              />
                            </td>
                            <td style={{ padding: '6px 8px', fontWeight: 900, textAlign: 'center', whiteSpace: 'nowrap', color: diff < 0 ? '#ef4444' : diff > 0 ? '#f59e0b' : '#009C48' }}>
                              {diff > 0 ? `+${diff}` : diff}
                            </td>
                            <td style={{ padding: '6px 8px' }}>
                              <input 
                                type="number"
                                step="0.01"
                                className="form-control"
                                value={item.cost ?? 0}
                                onChange={(e) => {
                                  const updated = [...editingInvItems];
                                  const val = e.target.value.replace(',', '.');
                                  updated[idx].cost = val === '' ? 0 : parseFloat(val) || 0;
                                  setEditingInvItems(updated);
                                }}
                                style={{ fontSize: '0.8rem', height: '30px' }}
                              />
                            </td>
                            <td style={{ padding: '6px 8px' }}>
                              <input 
                                type="text"
                                className="form-control"
                                value={item.observation || ''}
                                onChange={(e) => {
                                  const updated = [...editingInvItems];
                                  updated[idx].observation = e.target.value;
                                  setEditingInvItems(updated);
                                }}
                                style={{ fontSize: '0.8rem', height: '30px' }}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-4">
              <button 
                onClick={() => setEditingInv(null)}
                className="btn btn-outline"
                style={{ fontSize: '0.85rem' }}
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveInventoryEdit}
                disabled={savingEdit}
                className="btn hover-lift"
                style={{ background: '#0284c7', color: '#ffffff', border: 'none', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Save size={16} />
                {savingEdit ? 'Guardando...' : 'Guardar Cambios de Inventario'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
