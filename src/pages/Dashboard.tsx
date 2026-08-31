import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  BarChart3, TrendingUp, Users, Loader2, 
  UserCheck, ShieldAlert, Trash2, ArrowLeft, Store, 
  MapPin, CheckCircle2, ChevronRight, FileText, UserPlus, UserMinus, Gift, Package, Tag, X, Plus, Calendar as CalendarIcon
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { mockIslas, mockEmployees, ghostCategories, penaltyCatalog, calculatePenaltyAmount, getStoredIslas, saveStoredIslas } from '../data/mock';
import type { Isla } from '../types';
import { generateInventoryPDF } from '../lib/pdfGenerator';
import { ProductCatalogModal } from '../components/ProductCatalogModal';

export function Dashboard() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // State for islands & island creation
  const [islands, setIslands] = useState<Isla[]>(() => getStoredIslas());
  const [showAddIslaModal, setShowAddIslaModal] = useState(false);
  const [newIslaName, setNewIslaName] = useState('');
  const [newIslaLocation, setNewIslaLocation] = useState('Guayaquil');

  // State for view mode: 'islands' | 'employees'
  const [viewMode, setViewMode] = useState<'islands' | 'employees'>('islands');

  // State for selected Island (null = view all islands grid)
  const [selectedIslaId, setSelectedIslaId] = useState<string | null>(null);
  
  // Active tab within selected island
  const [islaTab, setIslaTab] = useState<'auditoria' | 'fantasma' | 'responsabilidad' | 'personal' | 'inventario'>('auditoria');

  const [showCatalogModal, setShowCatalogModal] = useState(false);

  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>(mockEmployees.filter(e => !e.name.toLowerCase().includes('susana')));
  const [penalties, setPenalties] = useState<any[]>([]);
  const [inventories, setInventories] = useState<any[]>([]);

  const handleCreateIsla = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIslaName.trim()) return alert('Por favor ingresa un nombre para la nueva isla');

    const newIsla: Isla = {
      id: String(Date.now()),
      name: newIslaName.trim().toUpperCase(),
      location: newIslaLocation.trim() || 'Guayaquil',
      manager: 'N/A'
    };

    const updatedIslas = [...islands, newIsla];
    setIslands(updatedIslas);
    saveStoredIslas(updatedIslas);

    setNewIslaName('');
    setShowAddIslaModal(false);
    alert(`✅ Isla ${newIsla.name} registrada exitosamente.`);
  };

  const toggleInventoryDiscount = async (invId: string, currentDiscounted: boolean) => {
    const updatedStatus = !currentDiscounted;

    setInventories(prev => prev.map(inv => 
      inv.id === invId ? { ...inv, is_discounted: updatedStatus } : inv
    ));

    try {
      await supabase
        .from('inventories')
        .update({ is_discounted: updatedStatus })
        .eq('id', invId);
    } catch (e) {}

    const savedOffline = localStorage.getItem('gedaluma_offline_inventories');
    if (savedOffline) {
      try {
        const offArr = JSON.parse(savedOffline);
        const updated = offArr.map((inv: any) => 
          inv.id === invId ? { ...inv, is_discounted: updatedStatus } : inv
        );
        localStorage.setItem('gedaluma_offline_inventories', JSON.stringify(updated));
      } catch (e) {}
    }
  };
  
  // State for bonuses (persisted in localStorage / Supabase fallback)
  const [bonuses, setBonuses] = useState<any[]>(() => {
    const saved = localStorage.getItem('gedaluma_bonuses_v1');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  const saveBonuses = (newBonuses: any[]) => {
    setBonuses(newBonuses);
    localStorage.setItem('gedaluma_bonuses_v1', JSON.stringify(newBonuses));
  };

  const [showBonusModal, setShowBonusModal] = useState(false);
  const [bonusForm, setBonusForm] = useState({
    employee_id: '',
    month: 'Agosto 2026',
    amount: 50,
    reason: 'Bono de Calidad Cliente Fantasma (100%)',
    observation: ''
  });

  const [selectedConsolidatedMonth, setSelectedConsolidatedMonth] = useState<string>('Agosto 2026');

  const monthsList = [
    'Enero 2026', 'Febrero 2026', 'Marzo 2026', 'Abril 2026', 
    'Mayo 2026', 'Junio 2026', 'Julio 2026', 'Agosto 2026', 
    'Septiembre 2026', 'Octubre 2026', 'Noviembre 2026', 'Diciembre 2026'
  ];

  const handleSaveBonus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bonusForm.employee_id || !bonusForm.amount) return alert('Por favor selecciona la empleada y el monto del bono.');

    const empObj = employees.find(emp => emp.id === bonusForm.employee_id || emp.name === bonusForm.employee_id);
    const empName = empObj?.name || bonusForm.employee_id;

    const newBonus = {
      id: `bonus_${Date.now()}`,
      employee_id: bonusForm.employee_id,
      employee_name: empName,
      month: bonusForm.month,
      amount: Number(bonusForm.amount),
      reason: bonusForm.reason,
      observation: bonusForm.observation,
      reported_by: user?.name || 'Admin',
      created_at: new Date().toISOString()
    };

    try {
      await supabase.from('bonuses').insert([newBonus]);
    } catch (err) {
      console.warn('Tabla de bonos Supabase opcional fallback', err);
    }

    const updated = [newBonus, ...bonuses];
    saveBonuses(updated);
    setShowBonusModal(false);
    setBonusForm({ employee_id: '', month: 'Agosto 2026', amount: 50, reason: 'Bono de Calidad Cliente Fantasma (100%)', observation: '' });
  };

  const handleDeleteBonus = async (id: string) => {
    if (!window.confirm('¿Eliminar este bono registrado?')) return;
    try {
      await supabase.from('bonuses').delete().eq('id', id);
    } catch (err) {}
    const updated = bonuses.filter(b => b.id !== id);
    saveBonuses(updated);
  };
  
  // Modal state for registering a penalty
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [penaltyForm, setPenaltyForm] = useState({
    employee_id: '',
    severity: 'Leve',
    reason: '',
    amount: 0,
    observation: ''
  });

  // Modal state for adding employee to island or general
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [selectedEmpToAssign, setSelectedEmpToAssign] = useState('');
  const [customEmpName, setCustomEmpName] = useState('');
  const [targetIslaForAdd, setTargetIslaForAdd] = useState<string>('');

  // Official initial island to employee assignment mapping (7 official islands)
  const defaultIslaEmployeeMap: Record<string, string[]> = {
    '1': ['Carmen Larenas', 'Liliana Estrada'], // ALBAN
    '2': ['Yamilet Delgado', 'Virginia Miño', 'Jackeline Mera Collazo'], // JUAN TANCA
    '3': ['Johanna Mendoza', 'Dayse Rodriguez'], // CALIFORNIA
    '4': ['Yamilet Delgado', 'Teresa Vargas'], // PASEO DAULE (Unificada Daule y Paseo Daule)
    '5': ['Liliana Estrada', 'Jackeline Mera Collazo', 'Jackie Rodriguez'], // TERMINAL
    '6': ['Gabriel Perero', 'Shirley Reyes'], // SALINAS
    '7': ['Andrea Meza Saltos', 'Maritza Cedeño'] // PUERTO AZUL
  };

  const [islaEmployeeMap, setIslaEmployeeMap] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem('gedaluma_isla_emp_map_v5');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error cargando mapeo de empleados', e);
      }
    }
    return defaultIslaEmployeeMap;
  });

  const saveIslaEmployeeMap = (newMap: Record<string, string[]>) => {
    setIslaEmployeeMap(newMap);
    localStorage.setItem('gedaluma_isla_emp_map_v5', JSON.stringify(newMap));
  };

  const handleAddEmployeeToIsla = (islaId: string, empNameOverride?: string) => {
    const nameToAdd = (empNameOverride || selectedEmpToAssign || customEmpName).trim();
    if (!nameToAdd) {
      alert('Por favor selecciona o escribe el nombre del empleado.');
      return;
    }

    if (islaId) {
      const currentList = islaEmployeeMap[islaId] || [];
      if (currentList.includes(nameToAdd)) {
        alert(`El empleado "${nameToAdd}" ya está asignado a esta isla.`);
        return;
      }

      const updatedList = [...currentList, nameToAdd];
      const newMap = { ...islaEmployeeMap, [islaId]: updatedList };
      saveIslaEmployeeMap(newMap);
    }

    // Make sure employee is in master employee list
    if (!employees.some(e => e.name.toLowerCase() === nameToAdd.toLowerCase())) {
      setEmployees(prev => [...prev, { id: `e_${Date.now()}`, name: nameToAdd }]);
    }

    setSelectedEmpToAssign('');
    setCustomEmpName('');
    setTargetIslaForAdd('');
    setShowAddEmpModal(false);
  };

  const handleRemoveEmployeeFromIsla = (islaId: string, employeeName: string) => {
    if (!window.confirm(`¿Quitar a "${employeeName}" de la isla?`)) return;
    const currentList = islaEmployeeMap[islaId] || [];
    const updatedList = currentList.filter(n => n !== employeeName);
    const newMap = { ...islaEmployeeMap, [islaId]: updatedList };
    saveIslaEmployeeMap(newMap);
  };

  const handleDeleteEmployeeCompletely = (employeeName: string) => {
    if (!window.confirm(`¿Eliminar completamente a "${employeeName}" del sistema GEDALUMA?`)) return;
    
    // Remove from master list
    setEmployees(prev => prev.filter(e => e.name !== employeeName));

    // Remove from all island mappings
    const newMap: Record<string, string[]> = {};
    Object.keys(islaEmployeeMap).forEach(key => {
      newMap[key] = (islaEmployeeMap[key] || []).filter(n => n !== employeeName);
    });
    saveIslaEmployeeMap(newMap);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      let dbEvals: any[] = [];
      let dbResp: any[] = [];

      try {
        const { data: evalsData } = await supabase
          .from('evaluations')
          .select('*')
          .neq('is_valid', false);
        dbEvals = evalsData || [];
      } catch (e) {
        console.warn('Supabase evaluations fetch error:', e);
      }
      
      try {
        const { data: respData } = await supabase
          .from('responses')
          .select('evaluation_id, question_id, value');
        dbResp = respData || [];
      } catch (e) {
        console.warn('Supabase responses fetch error:', e);
      }

      // Fusionar evaluaciones de respaldo local
      const savedOfflineEvals = localStorage.getItem('gedaluma_offline_evaluations');
      let offlineEvals: any[] = [];
      if (savedOfflineEvals) {
        try { offlineEvals = JSON.parse(savedOfflineEvals); } catch(e){}
      }

      const combinedEvals = [...dbEvals];
      offlineEvals.forEach(off => {
        if (!combinedEvals.some(e => e.id === off.id)) {
          combinedEvals.push(off);
        }
      });

      setEvaluations(combinedEvals);
      setResponses(dbResp);

      // Cargar empleados y faltas
      try {
        const { data: empData } = await supabase.from('employees').select('*');
        if (empData && empData.length > 0) {
          setEmployees(empData.filter((e: any) => !e.name.toLowerCase().includes('susana')));
        }
      } catch (e) {}

      let dbPenalties: any[] = [];
      try {
        const { data: penData } = await supabase.from('penalties').select('*, employees(name)');
        dbPenalties = penData || [];
      } catch (e) {}

      const savedOfflinePenalties = localStorage.getItem('gedaluma_offline_penalties');
      let offlinePenalties: any[] = [];
      if (savedOfflinePenalties) {
        try { offlinePenalties = JSON.parse(savedOfflinePenalties); } catch(e){}
      }

      const combinedPenalties = [...dbPenalties];
      offlinePenalties.forEach(off => {
        if (!combinedPenalties.some(p => p.id === off.id)) {
          combinedPenalties.push(off);
        }
      });

      setPenalties(combinedPenalties);

      // Cargar inventarios (Supabase + Respaldo Local)
      let dbInventories: any[] = [];
      try {
        const { data: invData, error: invErr } = await supabase.from('inventories').select('*').order('created_at', { ascending: false });
        if (!invErr && invData) {
          dbInventories = invData;
          
          // Intentar auto-sincronizar inventarios guardados localmente si la tabla ya existe
          const savedOfflineInventories = localStorage.getItem('gedaluma_offline_inventories');
          if (savedOfflineInventories) {
            try {
              const offlineArr: any[] = JSON.parse(savedOfflineInventories);
              const offlineItemsMap = JSON.parse(localStorage.getItem('gedaluma_offline_inventory_items') || '{}');
              
              for (const offInv of offlineArr) {
                if (!dbInventories.some(d => d.id === offInv.id)) {
                  const payloadToSync = {
                    id: offInv.id || `inv_sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                    isla_id: String(offInv.isla_id || ''),
                    isla_name: offInv.isla_name || 'Desconocida',
                    evaluator_name: offInv.evaluator_name || 'Auditor',
                    date: offInv.date || new Date().toISOString().split('T')[0],
                    start_time: offInv.start_time || '00:00',
                    end_time: offInv.end_time || '00:00',
                    total_missing: Number(offInv.total_missing || 0),
                    total_missing_dollars: Number(offInv.total_missing_dollars || 0),
                    total_match: Number(offInv.total_match || 0),
                    total_surplus: Number(offInv.total_surplus || 0),
                    total_surplus_dollars: Number(offInv.total_surplus_dollars || 0),
                    is_discounted: !!offInv.is_discounted,
                    created_at: offInv.created_at || new Date().toISOString()
                  };

                  const { data: syncedInv, error: syncErr } = await supabase.from('inventories').insert([payloadToSync]).select().single();
                  if (!syncErr && syncedInv) {
                    const items = offlineItemsMap[offInv.id] || [];
                    if (items.length > 0) {
                      const itemsToInsert = items.map((it: any) => ({ inventory_id: syncedInv.id, ...it }));
                      await supabase.from('inventory_items').insert(itemsToInsert);
                    }
                    dbInventories.unshift(syncedInv);
                  }
                }
              }
            } catch (syncE) {
              console.warn('Auto-sync error:', syncE);
            }
          }
        }
      } catch (e) {}

      const savedOfflineInventories = localStorage.getItem('gedaluma_offline_inventories');
      let offlineInventories: any[] = [];
      if (savedOfflineInventories) {
        try { offlineInventories = JSON.parse(savedOfflineInventories); } catch(e){}
      }

      const combinedInventories = [...dbInventories];
      offlineInventories.forEach(off => {
        if (!combinedInventories.some(inv => inv.id === off.id)) {
          combinedInventories.push(off);
        }
      });

      setInventories(combinedInventories);

    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePenalty = async (id: string) => {
    if (!window.confirm('¿Eliminar esta falta?')) return;
    try {
      await supabase.from('penalties').delete().eq('id', id);
    } catch (err) {}
    setPenalties(prev => prev.filter(p => p.id !== id));
    
    // Clean from offline penalties if present
    const savedOfflinePenalties = localStorage.getItem('gedaluma_offline_penalties');
    if (savedOfflinePenalties) {
      try {
        const offlinePenalties = JSON.parse(savedOfflinePenalties);
        const updated = offlinePenalties.filter((p: any) => p.id !== id);
        localStorage.setItem('gedaluma_offline_penalties', JSON.stringify(updated));
      } catch (e) {}
    }
  };

  const handleSavePenalty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!penaltyForm.employee_id || !penaltyForm.reason) return alert('Por favor completa los campos requeridos.');
    
    const empObj = employees.find(emp => emp.id === penaltyForm.employee_id || emp.name === penaltyForm.employee_id);
    const empName = empObj?.name || penaltyForm.employee_id;

    const penaltyPayload = {
      id: `pen_${Date.now()}`,
      employee_id: penaltyForm.employee_id,
      severity: penaltyForm.severity,
      reason: penaltyForm.reason,
      amount: Number(penaltyForm.amount),
      observation: penaltyForm.observation,
      reported_by: user?.name || 'Admin',
      created_at: new Date().toISOString(),
      employees: { name: empName }
    };

    try {
      const { data, error } = await supabase.from('penalties').insert([{
        employee_id: penaltyForm.employee_id,
        severity: penaltyForm.severity,
        reason: penaltyForm.reason,
        amount: Number(penaltyForm.amount),
        observation: penaltyForm.observation,
        reported_by: user?.name || 'Admin'
      }]).select('*, employees(name)');
      
      if (error) throw error;

      if (data && data.length > 0) {
        setPenalties(prev => [data[0], ...prev]);
      } else {
        setPenalties(prev => [penaltyPayload, ...prev]);
      }
      alert('✅ Falta guardada exitosamente.');
    } catch (err: any) {
      console.warn("Error insertando falta en Supabase, aplicando respaldo local:", err);
      const existingOfflinePenalties = JSON.parse(localStorage.getItem('gedaluma_offline_penalties') || '[]');
      localStorage.setItem('gedaluma_offline_penalties', JSON.stringify([penaltyPayload, ...existingOfflinePenalties]));
      setPenalties(prev => [penaltyPayload, ...prev]);
      alert('✅ Falta guardada exitosamente en el sistema (Respaldo Local).');
    } finally {
      setShowPenaltyModal(false);
      setPenaltyForm({ employee_id: '', severity: 'Leve', reason: '', amount: 0, observation: '' });
    }
  };

  const toggleInventoryValidation = async (invId: string, currentValidStatus: boolean) => {
    const newValidStatus = !currentValidStatus;
    
    // Optimistic UI update
    setInventories(prev => prev.map(inv => 
      inv.id === invId ? { ...inv, is_valid: newValidStatus } : inv
    ));

    try {
      const { error } = await supabase
        .from('inventories')
        .update({ is_valid: newValidStatus })
        .eq('id', invId);

      if (error) throw error;
    } catch (err: any) {
      console.warn("Error actualizando validez de inventario en Supabase:", err);
      const offlineInventories = JSON.parse(localStorage.getItem('gedaluma_offline_inventories') || '[]');
      const updatedOffline = offlineInventories.map((off: any) => 
        off.id === invId ? { ...off, is_valid: newValidStatus } : off
      );
      localStorage.setItem('gedaluma_offline_inventories', JSON.stringify(updatedOffline));
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#009C48';
    if (score >= 75) return '#0284c7';
    if (score >= 60) return '#f7b500';
    if (score === 0) return 'var(--text-secondary)';
    return 'var(--danger)';
  };

  // Helper calculation per island
  const getIslaStats = (islaId: string) => {
    const assignedNames = islaEmployeeMap[islaId] || [];

    // Helper to match island ID or name (unifying DAULE & PASEO DAULE under island id '4')
    const isMatchingIsla = (e: any) => {
      const eIslaIdStr = String(e.isla_id || '').trim();
      const targetIslaIdStr = String(islaId || '').trim();
      if (eIslaIdStr && eIslaIdStr === targetIslaIdStr) return true;

      const eIslaName = String(e.isla_name || '').toUpperCase().trim();
      const currentIslaObj = islands.find(i => String(i.id) === targetIslaIdStr);
      const currentIslaName = String(currentIslaObj?.name || '').toUpperCase().trim();

      if (eIslaName && currentIslaName && (eIslaName.includes(currentIslaName) || currentIslaName.includes(eIslaName))) return true;

      if (islaId === '4' && (eIslaIdStr === '5' || eIslaName.includes('DAULE'))) return true;
      return false;
    };

    // Evaluations matching either isla_id or assigned employees
    const ghostEvals = evaluations.filter(e => 
      e.evaluator_role === 'ghost' && (isMatchingIsla(e) || assignedNames.includes(e.evaluated_employee))
    );
    const audEvals = evaluations.filter(e => 
      e.evaluator_role !== 'ghost' && (isMatchingIsla(e) || assignedNames.includes(e.evaluated_employee))
    );

    const audAvg = audEvals.length > 0
      ? audEvals.reduce((sum, e) => sum + Number(e.total_score || 0), 0) / audEvals.length
      : 0;

    const ghostAvg = ghostEvals.length > 0
      ? ghostEvals.reduce((sum, e) => sum + Number(e.total_score || 0), 0) / ghostEvals.length
      : 0;

    // Get employees assigned to this island
    const islaEmployees = employees.filter(emp => assignedNames.includes(emp.name));
    
    // Add any assigned names not yet in employees list
    assignedNames.forEach(name => {
      if (!islaEmployees.some(e => e.name === name)) {
        islaEmployees.push({ id: name, name });
      }
    });

    // Get penalties for employees of this island
    const empIds = islaEmployees.map(e => e.id);
    const empNames = islaEmployees.map(e => e.name);
    const islaPenalties = penalties.filter(p => 
      empIds.includes(p.employee_id) || empNames.includes(p.employees?.name)
    );
    
    const totalAdjustments = islaPenalties.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    // Get inventories for this island
    const islaInventories = inventories.filter(inv => isMatchingIsla(inv));
    const pendingMissingUnits = islaInventories
      .filter(inv => !inv.is_discounted && inv.is_valid !== false)
      .reduce((sum, inv) => sum + Number(inv.total_missing || 0), 0);
    const pendingMissingDollars = islaInventories
      .filter(inv => !inv.is_discounted && inv.is_valid !== false)
      .reduce((sum, inv) => sum + Number(inv.total_missing_dollars || (inv.total_missing * 1.00) || 0), 0);

    return {
      audAvg,
      audCount: audEvals.length,
      ghostAvg,
      ghostCount: ghostEvals.length,
      islaEmployees,
      islaPenalties,
      totalAdjustments,
      audEvals,
      ghostEvals,
      islaInventories,
      pendingMissingUnits,
      pendingMissingDollars
    };
  };

  const selectedIsla = mockIslas.find(i => i.id === selectedIslaId);
  const selectedIslaStats = selectedIslaId ? getIslaStats(selectedIslaId) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: '100vh', flexDirection: 'column', gap: '16px' }}>
        <Loader2 className="animate-spin" style={{ color: '#009C48' }} size={48} />
        <p className="text-muted">Cargando panel de control de islas...</p>
      </div>
    );
  }

  // Calculate General KPIs across all islands
  const totalAudits = evaluations.filter(e => e.evaluator_role !== 'ghost').length;
  const totalGhostVisits = evaluations.filter(e => e.evaluator_role === 'ghost').length;

  return (
    <div className="container" style={{ maxWidth: '1200px', paddingBottom: '60px' }}>
      <ProductCatalogModal 
        isOpen={showCatalogModal}
        onClose={() => setShowCatalogModal(false)}
        onSave={fetchData}
      />

      {/* HEADER PRINCIPAL */}
      <header 
        className="flex justify-between items-center header-flex-mobile" 
        style={{ 
          marginBottom: '24px', 
          paddingBottom: '16px', 
          borderBottom: '1px solid var(--border-color)',
          gap: '16px'
        }}
      >
        <div>
          <h1 
            className="font-bold flex items-center gap-2" 
            style={{ 
              fontSize: '1.75rem', 
              letterSpacing: '-0.5px' 
            }}
          >
            <Store style={{ color: '#009C48', flexShrink: 0 }} size={30} />
            Panel de Control GEDALUMA
          </h1>
          <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '2px' }}>
            Gestión Operativa, Auditorías y Cliente Fantasma
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap header-actions-mobile" style={{ paddingRight: '60px' }}>
          <button 
            onClick={() => setShowCatalogModal(true)} 
            className="btn" 
            style={{ height: '38px', padding: '0 12px', fontSize: '0.82rem', fontWeight: 700, borderRadius: '8px', background: 'rgba(0, 156, 72, 0.1)', border: '1.5px solid #009C48', color: '#009C48', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            Productos (Costos)
          </button>
          <Link 
            to="/history" 
            className="btn" 
            style={{ height: '38px', padding: '0 12px', fontSize: '0.82rem', fontWeight: 700, borderRadius: '8px', background: '#6366f1', border: '1.5px solid #6366f1', color: '#ffffff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
          >
            Ver Historial
          </Link>
          <Link 
            to="/evaluate" 
            className="btn" 
            style={{ height: '38px', padding: '0 12px', fontSize: '0.82rem', fontWeight: 700, borderRadius: '8px', background: '#009C48', border: '1.5px solid #009C48', color: '#ffffff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
          >
            Evaluación
          </Link>
          <Link 
            to="/evaluate?mode=ghost" 
            className="btn" 
            style={{ height: '38px', padding: '0 12px', fontSize: '0.82rem', fontWeight: 700, borderRadius: '8px', background: '#f7b500', border: '1.5px solid #f7b500', color: '#000000', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
          >
            Cliente Fantasma
          </Link>
          <Link 
            to="/inventory/new" 
            className="btn" 
            style={{ height: '38px', padding: '0 12px', fontSize: '0.82rem', fontWeight: 700, borderRadius: '8px', background: '#0284c7', border: '1.5px solid #0284c7', color: '#ffffff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}
          >
            Nuevo Inventario
          </Link>
          <button 
            onClick={logout} 
            className="btn btn-ghost" 
            style={{ height: '38px', padding: '0 12px', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)' }}
          >
            Salir
          </button>
        </div>
      </header>

      {/* MODAL PARA CREAR NUEVA ISLA */}
      {showAddIslaModal && (
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
          <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '24px', borderRadius: '14px' }}>
            <div className="flex justify-between items-center mb-4" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px' }}>
              <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: '#009C48', margin: 0 }}>
                <Store size={24} /> Registrar Nueva Isla GEDALUMA
              </h3>
              <button onClick={() => setShowAddIslaModal(false)} className="btn btn-ghost" style={{ padding: '4px' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateIsla} className="flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>Nombre de la Isla *</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Ej. MALL DEL SOL, CEIBOS, VÍA SAMBORONDÓN..."
                  value={newIslaName}
                  onChange={e => setNewIslaName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ fontWeight: 700 }}>Ubicación / Ciudad *</label>
                <input 
                  type="text" 
                  className="form-control"
                  placeholder="Ej. Guayaquil, Daule, Samborondón, Quito..."
                  value={newIslaLocation}
                  onChange={e => setNewIslaLocation(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-3 justify-end mt-4">
                <button 
                  type="button" 
                  onClick={() => setShowAddIslaModal(false)} 
                  className="btn btn-ghost"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ background: '#009C48', borderColor: '#009C48', padding: '10px 20px', fontWeight: 800 }}
                >
                  Guardar e Integrar Isla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VISTA GENERAL DE PERSONAL REGISTRADO (TABLA COMPLETA) */}
      {viewMode === 'employees' && (
        <div>
          <button 
            onClick={() => {
              setSelectedIslaId(null);
              setViewMode('islands');
            }} 
            className="btn btn-primary mb-4 flex items-center gap-2"
            style={{ padding: '8px 16px', background: '#009C48', borderColor: '#009C48' }}
          >
            <ArrowLeft size={20} /> Volver a Ver Todas las Islas ({islands.length})
          </button>

          <div className="card mb-6" style={{ background: 'var(--surface-color)', border: '1px solid #009C48' }}>
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2" style={{ color: '#009C48' }}>
                  <Users size={28} /> Tabla General de Personal Registrado y Asignación de Islas
                </h2>
                <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '4px' }}>
                  Gestión integral de las {employees.length} empleadas activas en las islas de GEDALUMA
                </p>
              </div>

              <button 
                onClick={() => {
                  setTargetIslaForAdd('');
                  setShowAddEmpModal(true);
                }} 
                className="btn btn-primary flex items-center gap-2"
                style={{ background: '#009C48', borderColor: '#009C48' }}
              >
                <UserPlus size={18} /> Agregar Nuevo Empleado
              </button>
            </div>
          </div>

          <div className="card table-responsive" style={{ padding: 0 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.92rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-color)', borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                  <th style={{ padding: '14px 16px' }}>Nombre Empleado</th>
                  <th style={{ padding: '14px 16px' }}>Isla(s) Asignada(s)</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center' }}>Prom. Auditoría</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center' }}>Prom. Cliente Fantasma</th>
                  <th style={{ padding: '14px 16px', textAlign: 'center' }}>Faltas / Ajustes</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right' }}>Acciones & Designar Isla</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => {
                  const assignedIslands = islands.filter(i => (islaEmployeeMap[i.id] || []).includes(emp.name));
                  
                  const empAudEvals = evaluations.filter(e => e.evaluator_role !== 'ghost' && e.evaluated_employee === emp.name);
                  const empAudAvg = empAudEvals.length > 0 
                    ? empAudEvals.reduce((sum, e) => sum + Number(e.total_score || 0), 0) / empAudEvals.length 
                    : 0;

                  const empGhostEvals = evaluations.filter(e => e.evaluator_role === 'ghost' && e.evaluated_employee === emp.name);
                  const empGhostAvg = empGhostEvals.length > 0 
                    ? empGhostEvals.reduce((sum, e) => sum + Number(e.total_score || 0), 0) / empGhostEvals.length 
                    : 0;

                  const empPenalties = penalties.filter(p => p.employee_id === emp.id || p.employees?.name === emp.name);
                  const totalPenaltyAmount = empPenalties.reduce((sum, p) => sum + Number(p.amount || 0), 0);

                  return (
                    <tr key={emp.name} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 800, fontSize: '1rem' }}>
                        {emp.name}
                      </td>

                      <td style={{ padding: '14px 16px' }}>
                        <div className="flex flex-wrap gap-2 items-center">
                          {assignedIslands.map(isla => (
                            <span 
                              key={isla.id} 
                              style={{ 
                                background: '#009C48', 
                                color: '#fff', 
                                padding: '4px 10px', 
                                borderRadius: '12px', 
                                fontSize: '0.78rem',
                                fontWeight: 700 
                              }}
                            >
                              ISLA {isla.name}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, color: getScoreColor(empAudAvg) }}>
                        {empAudAvg > 0 ? `${empAudAvg.toFixed(1)}%` : 'Sin datos'}
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, color: getScoreColor(empGhostAvg) }}>
                        {empGhostAvg > 0 ? `${empGhostAvg.toFixed(1)}%` : 'Sin datos'}
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 800, color: totalPenaltyAmount > 0 ? 'var(--danger)' : '#009C48' }}>
                        ${totalPenaltyAmount.toFixed(0)} ({empPenalties.length})
                      </td>

                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div className="flex gap-2 justify-end items-center">
                          <select
                            className="form-control"
                            style={{ fontSize: '0.78rem', padding: '4px 8px', width: 'auto' }}
                            value=""
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAddEmployeeToIsla(e.target.value, emp.name);
                              }
                            }}
                          >
                            <option value="" disabled>+ Asignar Isla...</option>
                            {islands.map(i => (
                              <option key={i.id} value={i.id}>ISLA {i.name}</option>
                            ))}
                          </select>

                          <button 
                            onClick={() => handleDeleteEmployeeCompletely(emp.name)}
                            className="btn btn-ghost text-danger"
                            style={{ padding: '6px' }}
                            title="Eliminar empleado definitivamente"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VISTA 1: GRILLA INICIAL DE ISLAS */}
      {viewMode === 'islands' && !selectedIslaId && (
        <div>
          {/* BANNER DE RESUMEN GLOBAL EN 1 FILA X 4 COLUMNAS (1x4) */}
          <div className="kpi-grid-1x4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '14px', marginBottom: '28px' }}>
            {/* KPI 1: TOTAL ISLAS OPERATIVAS & BOTÓN NUEVA ISLA */}
            <div 
              className="card flex flex-col justify-between items-center text-center" 
              style={{ 
                padding: '20px', 
                background: 'linear-gradient(135deg, rgba(0, 156, 72, 0.14) 0%, rgba(0, 156, 72, 0.04) 100%)', 
                border: '2px solid #009C48',
                borderRadius: '14px',
                minHeight: '145px',
                textAlign: 'center'
              }}
            >
              <div style={{ textAlign: 'center', width: '100%' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#009C48', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', textAlign: 'center' }}>
                  Total Islas Operativas
                </span>
                <p className="text-3xl font-bold" style={{ color: '#009C48', margin: '4px 0', textAlign: 'center' }}>
                  {islands.length} Islas
                </p>
              </div>

              <button 
                onClick={() => setShowAddIslaModal(true)}
                className="btn hover-lift"
                style={{ 
                  width: '100%', 
                  height: '38px', 
                  background: '#009C48', 
                  borderColor: '#009C48', 
                  color: '#ffffff', 
                  fontWeight: 800, 
                  fontSize: '0.85rem', 
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  marginTop: '10px'
                }}
              >
                <Plus size={16} /> + Nueva Isla
              </button>
            </div>

            {/* KPI 2: AUDITORÍAS REALIZADAS */}
            <div 
              className="card flex flex-col justify-between items-center text-center" 
              style={{ 
                padding: '20px', 
                background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.14) 0%, rgba(2, 132, 199, 0.04) 100%)', 
                border: '2px solid #0284c7',
                borderRadius: '14px',
                minHeight: '145px',
                textAlign: 'center'
              }}
            >
              <div style={{ textAlign: 'center', width: '100%' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', textAlign: 'center' }}>
                  Auditorías Realizadas
                </span>
                <p className="text-3xl font-bold" style={{ color: '#0284c7', margin: '4px 0', textAlign: 'center' }}>
                  {totalAudits}
                </p>
              </div>

              <Link 
                to="/history" 
                className="btn hover-lift" 
                style={{ 
                  width: '100%', 
                  height: '38px', 
                  background: '#0284c7', 
                  borderColor: '#0284c7', 
                  color: '#ffffff', 
                  fontWeight: 800, 
                  fontSize: '0.85rem', 
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  marginTop: '10px'
                }}
              >
                Ver todas
              </Link>
            </div>

            {/* KPI 3: VISITAS CLIENTE FANTASMA */}
            <div 
              className="card flex flex-col justify-between items-center text-center" 
              style={{ 
                padding: '20px', 
                background: 'linear-gradient(135deg, rgba(247, 181, 0, 0.18) 0%, rgba(247, 181, 0, 0.06) 100%)', 
                border: '2px solid #f7b500',
                borderRadius: '14px',
                minHeight: '145px',
                textAlign: 'center'
              }}
            >
              <div style={{ textAlign: 'center', width: '100%' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#b48200', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', textAlign: 'center' }}>
                  Visitas Cliente Fantasma
                </span>
                <p className="text-3xl font-bold" style={{ color: '#b48200', margin: '4px 0', textAlign: 'center' }}>
                  {totalGhostVisits}
                </p>
              </div>

              <Link 
                to="/history" 
                className="btn hover-lift" 
                style={{ 
                  width: '100%', 
                  height: '38px', 
                  background: '#f7b500', 
                  borderColor: '#f7b500', 
                  color: '#000000', 
                  fontWeight: 800, 
                  fontSize: '0.85rem', 
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  marginTop: '10px'
                }}
              >
                Ver todas
              </Link>
            </div>
            
            {/* KPI 4: PERSONAL REGISTRADO */}
            <div 
              className="card flex flex-col justify-between items-center text-center hover-lift" 
              onClick={() => setViewMode('employees')}
              style={{ 
                padding: '20px', 
                cursor: 'pointer',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.14) 0%, rgba(99, 102, 241, 0.04) 100%)', 
                border: '2px solid #6366f1',
                borderRadius: '14px',
                minHeight: '145px',
                textAlign: 'center'
              }}
              title="Haz clic para ver la tabla completa de empleadas"
            >
              <div style={{ textAlign: 'center', width: '100%' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#6366f1', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', textAlign: 'center' }}>
                  Personal Registrado
                </span>
                <p className="text-3xl font-bold" style={{ color: '#6366f1', margin: '4px 0', textAlign: 'center' }}>
                  {employees.length} Empleadas
                </p>
              </div>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setViewMode('employees');
                }}
                className="btn hover-lift"
                style={{ 
                  width: '100%', 
                  height: '38px', 
                  background: '#6366f1', 
                  borderColor: '#6366f1', 
                  color: '#ffffff', 
                  fontWeight: 800, 
                  fontSize: '0.85rem', 
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginTop: '10px'
                }}
              >
                Ver todos
              </button>
            </div>
          </div>

          {/* TARJETA DESTACADA DE NOVEDADES Y SOLICITUDES (BITÁCORA DIARIA & AGENDA) */}
          <div 
            className="card mb-6 hover-lift" 
            style={{ 
              padding: '24px', 
              background: 'linear-gradient(135deg, rgba(0, 156, 72, 0.08) 0%, rgba(2, 132, 199, 0.08) 100%)', 
              border: '2px solid #009C48',
              borderRadius: '16px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '16px'
            }}
          >
            <div style={{ flex: '1 1 300px' }}>
              <div className="flex items-center gap-2 mb-1">
                <span style={{ padding: '3px 10px', background: 'rgba(0, 156, 72, 0.15)', color: '#009C48', fontWeight: 800, borderRadius: '12px', fontSize: '0.78rem' }}>
                  NOVEDADES & SOLICITUDES
                </span>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Informe Diario de Campo & Agenda de Supervisión
                </span>
              </div>
              <h3 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)', marginTop: '4px' }}>
                📌 Novedades y Solicitudes (Bitácora Diaria)
              </h3>
              <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '4px', margin: 0 }}>
                Registro de visitas aleatorias, acompañamiento en islas, validación de inventarios, control logístico y agenda semanal.
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <Link 
                to="/logbook" 
                className="btn hover-lift flex items-center gap-2" 
                style={{ 
                  padding: '12px 24px', 
                  background: '#009C48', 
                  borderColor: '#009C48', 
                  color: '#ffffff', 
                  fontWeight: 800, 
                  fontSize: '0.92rem', 
                  borderRadius: '12px',
                  textDecoration: 'none'
                }}
              >
                <CalendarIcon size={20} /> Abrir Bitácora & Calendario
              </Link>
            </div>
          </div>

          <h2 className="text-xl font-bold mb-4" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={22} style={{ color: '#009C48' }} />
            Seleccione una Isla para Desplegar la Información Completa
          </h2>

          <div className="grid grid-cols-3 gap-6">
            {islands.map((isla) => {
              const stats = getIslaStats(isla.id);
              return (
                <div 
                  key={isla.id}
                  onClick={() => {
                    setSelectedIslaId(isla.id);
                    setIslaTab('auditoria');
                  }}
                  className="card hover-lift"
                  style={{ 
                    cursor: 'pointer',
                    border: '1px solid var(--border-color)',
                    borderRadius: '14px',
                    padding: '24px',
                    transition: 'all 0.2s ease',
                    background: 'var(--surface-color)'
                  }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#009C48', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {isla.location}
                      </span>
                      <h3 className="text-2xl font-bold" style={{ marginTop: '2px' }}>ISLA {isla.name}</h3>
                    </div>
                    <ChevronRight size={24} style={{ color: 'var(--text-secondary)' }} />
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4" style={{ background: 'var(--bg-color)', padding: '14px', borderRadius: '10px' }}>
                    <div>
                      <span className="text-muted" style={{ fontSize: '0.78rem' }}>Auditoría Interna</span>
                      <p style={{ fontSize: '1.25rem', fontWeight: 800, color: getScoreColor(stats.audAvg) }}>
                        {stats.audCount > 0 ? `${stats.audAvg.toFixed(1)}%` : 'Sin datos'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted" style={{ fontSize: '0.78rem' }}>Cliente Fantasma</span>
                      <p style={{ fontSize: '1.25rem', fontWeight: 800, color: getScoreColor(stats.ghostAvg) }}>
                        {stats.ghostCount > 0 ? `${stats.ghostAvg.toFixed(1)}%` : 'Sin datos'}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-muted" style={{ fontSize: '0.85rem', borderTop: '1px solid var(--border-color)', paddingTop: '12px', paddingBottom: '12px' }}>
                    <span>👥 Personal: <strong>{stats.islaEmployees.length} empleadas</strong></span>
                    <span>⚠️ Faltas: <strong>${stats.totalAdjustments.toFixed(0)}</strong></span>
                  </div>

                  {/* BOTÓN RESTAURADO: VER INFORMACIÓN COMPLETA */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedIslaId(isla.id);
                      setIslaTab('auditoria');
                    }}
                    className="btn btn-primary flex items-center justify-center gap-2"
                    style={{ width: '100%', marginTop: '12px', background: '#009C48', borderColor: '#009C48' }}
                  >
                    <span>Ver información completa</span> <ChevronRight size={18} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VISTA 2: DETALLE DESPLEGADO DE LA ISLA SELECCIONADA */}
      {viewMode === 'islands' && selectedIslaId && selectedIsla && selectedIslaStats && (
        <div>
          {/* BOTÓN VOLVER Y ENCABEZADO DE LA ISLA */}
          <button 
            onClick={() => {
              setSelectedIslaId(null);
              setViewMode('islands');
            }} 
            className="btn btn-primary mb-4 flex items-center gap-2"
            style={{ padding: '8px 16px', background: '#009C48', borderColor: '#009C48' }}
          >
            <ArrowLeft size={20} /> Volver a Ver Todas las Islas ({mockIslas.length})
          </button>

          <div className="card mb-6" style={{ background: 'linear-gradient(135deg, rgba(0, 156, 72, 0.06) 0%, rgba(247, 181, 0, 0.06) 100%)', border: '1px solid #009C48' }}>
            <div className="flex justify-between items-center">
              <div>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#009C48', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  Isla Seleccionada
                </span>
                <h2 className="text-3xl font-bold" style={{ marginTop: '2px' }}>ISLA {selectedIsla.name} ({selectedIsla.location})</h2>
                <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '4px' }}>
                  Personal asignado: {selectedIslaStats.islaEmployees.map(e => e.name).join(', ') || 'Sin personal asignado'}
                </p>
              </div>

              <div className="flex gap-4">
                <div style={{ textAlign: 'center', background: '#fff', padding: '12px 20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <span className="text-muted" style={{ fontSize: '0.78rem' }}>Promedio Auditoría</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: getScoreColor(selectedIslaStats.audAvg) }}>
                    {selectedIslaStats.audCount > 0 ? `${selectedIslaStats.audAvg.toFixed(1)}%` : 'N/A'}
                  </div>
                </div>

                <div style={{ textAlign: 'center', background: '#fff', padding: '12px 20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <span className="text-muted" style={{ fontSize: '0.78rem' }}>Promedio Cliente Fantasma</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: getScoreColor(selectedIslaStats.ghostAvg) }}>
                    {selectedIslaStats.ghostCount > 0 ? `${selectedIslaStats.ghostAvg.toFixed(1)}%` : 'N/A'}
                  </div>
                </div>

                <div style={{ textAlign: 'center', background: '#fff', padding: '12px 20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <span className="text-muted" style={{ fontSize: '0.78rem' }}>Ajustes por Faltas</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: selectedIslaStats.totalAdjustments > 0 ? 'var(--danger)' : '#009C48' }}>
                    ${selectedIslaStats.totalAdjustments.toFixed(2)}
                  </div>
                </div>

                <div style={{ textAlign: 'center', background: '#fff', padding: '12px 20px', borderRadius: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <span className="text-muted" style={{ fontSize: '0.78rem' }}>Inventario Faltante</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: selectedIslaStats.pendingMissingUnits > 0 ? 'var(--danger)' : '#009C48' }}>
                    {selectedIslaStats.pendingMissingUnits > 0 ? `${selectedIslaStats.pendingMissingUnits} un. ($${selectedIslaStats.pendingMissingDollars.toFixed(2)})` : 'Al día ($0)'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* PESTAÑAS DE NAVEGACIÓN DENTRO DE LA ISLA */}
          <div className="flex gap-2 mb-6 flex-wrap" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
            <button 
              onClick={() => setIslaTab('auditoria')}
              className={`btn ${islaTab === 'auditoria' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ background: islaTab === 'auditoria' ? '#009C48' : 'transparent', borderColor: '#009C48' }}
            >
              <BarChart3 size={18} /> Resultados de Auditoría ({selectedIslaStats.audCount})
            </button>

            <button 
              onClick={() => setIslaTab('fantasma')}
              className={`btn ${islaTab === 'fantasma' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ background: islaTab === 'fantasma' ? '#009C48' : 'transparent', borderColor: '#009C48' }}
            >
              <UserCheck size={18} /> Cliente Fantasma ({selectedIslaStats.ghostCount})
            </button>

            <button 
              onClick={() => setIslaTab('responsabilidad')}
              className={`btn ${islaTab === 'responsabilidad' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ background: islaTab === 'responsabilidad' ? '#009C48' : 'transparent', borderColor: '#009C48' }}
            >
              <Gift size={18} /> Faltas y Bonos (${selectedIslaStats.totalAdjustments.toFixed(0)})
            </button>

            <button 
              onClick={() => setIslaTab('inventario')}
              className={`btn ${islaTab === 'inventario' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ background: islaTab === 'inventario' ? '#009C48' : 'transparent', borderColor: '#009C48' }}
            >
              <Package size={18} /> Inventario ({selectedIslaStats.islaInventories.length})
            </button>

            <button 
              onClick={() => setIslaTab('personal')}
              className={`btn ${islaTab === 'personal' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ background: islaTab === 'personal' ? '#009C48' : 'transparent', borderColor: '#009C48' }}
            >
              <Users size={18} /> Personal que Labora ({selectedIslaStats.islaEmployees.length})
            </button>
          </div>

          {/* TAB 1: RESULTADOS DE AUDITORÍA DE LA ISLA */}
          {islaTab === 'auditoria' && selectedIslaStats && (
            <div className="grid grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-xl" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={20} style={{ color: '#009C48' }} />
                  Desglose de Auditorías Realizadas en Isla {selectedIsla.name}
                </h3>
                <div style={{ maxHeight: '450px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedIslaStats.audEvals.map((ev) => (
                    <div key={ev.id} style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '10px', background: 'var(--surface-color)' }}>
                      <div className="flex justify-between items-center" style={{ marginBottom: '8px' }}>
                        <span style={{ fontWeight: 800, fontSize: '1rem' }}>
                          Auditoría: {ev.evaluator_name || 'Supervisor'}
                        </span>
                        <span style={{ fontWeight: 800, fontSize: '1.2rem', color: getScoreColor(ev.total_score) }}>
                          {Number(ev.total_score).toFixed(1)}%
                        </span>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        Vendedora: <strong>{ev.evaluated_employee || 'N/A'}</strong> | Fecha: {new Date(ev.date || ev.created_at).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: '0.82rem', marginTop: '6px', color: 'var(--text-secondary)' }}>
                        Estado: <span style={{ fontWeight: 700, color: getScoreColor(ev.total_score) }}>{ev.status || 'Completada'}</span>
                      </div>
                    </div>
                  ))}
                  {selectedIslaStats.audEvals.length === 0 && (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No hay auditorías registradas para esta isla.
                    </div>
                  )}
                </div>
              </div>

              <div className="card">
                <h3 className="text-xl" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={20} style={{ color: '#009C48' }} />
                  Resumen de Desempeño General
                </h3>
                <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '16px' }}>
                  Auditorías evaluadas en base a las 7 categorías operativas (A a G).
                </p>

                <div style={{ background: 'var(--bg-color)', padding: '20px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                  <span className="text-muted" style={{ fontSize: '0.85rem' }}>Dictamen Operativo</span>
                  <h4 className="text-2xl font-bold" style={{ color: getScoreColor(selectedIslaStats.audAvg), marginTop: '4px' }}>
                    {selectedIslaStats.audAvg >= 90 ? 'Isla Excelente' : selectedIslaStats.audAvg >= 80 ? 'Isla Buena' : selectedIslaStats.audAvg >= 70 ? 'Isla en Mejora' : 'Requiere Supervisión'}
                  </h4>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                    Basado en {selectedIslaStats.audCount} auditorías completadas por supervisores.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RESULTADOS CLIENTE FANTASMA DE LA ISLA */}
          {islaTab === 'fantasma' && selectedIslaStats && (
            <div className="grid grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-xl" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <UserCheck size={20} style={{ color: '#f7b500' }} />
                  Éxito por Pregunta P1 a P9 (Isla {selectedIsla.name})
                </h3>
                <div style={{ maxHeight: '480px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                        <th style={{ padding: '10px' }}>Pregunta Evaluada</th>
                        <th style={{ padding: '10px', textAlign: 'right', width: '100px' }}>% Éxito</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ghostCategories[0].questions.filter(q => q.type !== 'text').map((q: any) => {
                        const validEvalIds = selectedIslaStats.ghostEvals.map(e => e.id);
                        const qResponses = responses.filter(r => r.question_id === q.id && validEvalIds.includes(r.evaluation_id));
                        let totalPoints = 0;
                        let maxPoints = 0;
                        qResponses.forEach(r => {
                          const val = r.value || '';
                          const matchedOpt = q.ghostOptions?.find((opt: any) => opt.label === val);
                          if (matchedOpt && matchedOpt.points !== null && matchedOpt.points !== undefined) {
                            totalPoints += matchedOpt.points;
                            maxPoints += 2;
                          }
                        });
                        const avg = maxPoints > 0 ? (totalPoints / maxPoints) * 100 : 0;
                        return (
                          <tr key={q.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '12px 10px', lineHeight: 1.4 }}>{q.text}</td>
                            <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 'bold', color: getScoreColor(avg) }}>
                              {qResponses.length > 0 ? `${avg.toFixed(1)}%` : 'N/A'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="card">
                <h3 className="text-xl" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CheckCircle2 size={20} style={{ color: '#009C48' }} />
                  Plan de Acción & Impacto en Bono de Calidad
                </h3>
                <div style={{ maxHeight: '480px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {selectedIslaStats.ghostEvals.map((ev: any) => {
                    const score = Number(ev.total_score || 0);
                    let badge = { bono: '100% Bono Calidad', accion: 'Reconocimiento en acta mensual.', color: '#009C48', bg: 'rgba(0, 156, 72, 0.12)' };
                    if (score < 75) {
                      badge = { bono: 'No Califica al Bono (0%)', accion: 'Capacitación obligatoria y auditoría de seguimiento.', color: 'var(--danger)', bg: 'rgba(239, 68, 68, 0.12)' };
                    } else if (score < 90) {
                      badge = { bono: '50% Bono Calidad', accion: 'Plan de refuerzo individual por Richard.', color: '#f7b500', bg: 'rgba(247, 181, 0, 0.12)' };
                    }

                    return (
                      <div key={ev.id} style={{ padding: '16px', border: `1px solid ${badge.color}`, borderRadius: '10px', background: 'var(--surface-color)' }}>
                        <div className="flex justify-between items-center" style={{ marginBottom: '8px' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>
                            {ev.evaluated_employee ? `Vendedora: ${ev.evaluated_employee}` : 'Visita Cliente Fantasma'}
                          </span>
                          <span style={{ fontWeight: 800, fontSize: '1.2rem', color: badge.color }}>
                            {score.toFixed(1)}%
                          </span>
                        </div>

                        <div className="flex gap-2 items-center" style={{ marginBottom: '8px' }}>
                          <span style={{ padding: '3px 10px', borderRadius: '12px', fontWeight: 700, fontSize: '0.78rem', background: badge.bg, color: badge.color }}>
                            {badge.bono}
                          </span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {ev.time_slot ? `Horario: ${ev.time_slot}` : ''}
                          </span>
                        </div>

                        <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 500, marginBottom: '6px' }}>
                          📌 Acción Operativa: <span className="text-muted" style={{ fontWeight: 400 }}>{badge.accion}</span>
                        </p>

                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          Fecha: {new Date(ev.date || ev.created_at).toLocaleDateString()} | Evaluador: {ev.evaluator_name || 'Fantasma'}
                        </div>
                      </div>
                    );
                  })}
                  {selectedIslaStats.ghostEvals.length === 0 && (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No hay visitas de cliente fantasma registradas para esta isla.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FALTAS Y BONOS DE LA ISLA */}
          {islaTab === 'responsabilidad' && selectedIslaStats && (
            <div className="card">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: '#009C48' }}>
                    <Gift size={24} style={{ color: '#009C48' }} /> Faltas y Bonos de Incentivo en Isla {selectedIsla.name}
                  </h3>
                  <p className="text-muted" style={{ fontSize: '0.88rem' }}>
                    Gestión de penalizaciones y registro manual de bonos de desempeño
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowPenaltyModal(true)} 
                    className="btn btn-danger flex items-center gap-2"
                  >
                    <ShieldAlert size={18} /> Registrar Nueva Falta
                  </button>

                  <button 
                    onClick={() => setShowBonusModal(true)} 
                    className="btn btn-primary flex items-center gap-2"
                    style={{ background: '#009C48', borderColor: '#009C48' }}
                  >
                    <Gift size={18} /> Registrar Nuevo Bono
                  </button>
                </div>
              </div>

              {/* SECCIÓN DE CONSOLIDADO Y CIERRE MENSUAL */}
              <div className="mb-6" style={{ background: 'var(--bg-color)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h4 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                      📊 Cierre Mensual Consolidado (Faltas vs Bonos)
                    </h4>
                    <p className="text-muted" style={{ fontSize: '0.82rem' }}>
                      Cálculo del incentivo neto a pagar por empleada en el periodo seleccionado
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Periodo de Cierre:</label>
                    <select 
                      className="form-control"
                      style={{ width: 'auto', fontSize: '0.88rem', padding: '6px 12px' }}
                      value={selectedConsolidatedMonth}
                      onChange={e => setSelectedConsolidatedMonth(e.target.value)}
                    >
                      <option value="Todos los Meses">-- Todos los Meses --</option>
                      {monthsList.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border-color)', textAlign: 'left', background: 'var(--surface-color)' }}>
                        <th style={{ padding: '10px 12px' }}>Empleado</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center' }}>Bonos Registrados (+)</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center' }}>Ajustes por Faltas (-)</th>
                        <th style={{ padding: '10px 12px', textAlign: 'center' }}>Incentivo Neto a Pagar ($)</th>
                        <th style={{ padding: '10px 12px', textAlign: 'right' }}>Estado del Periodo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedIslaStats.islaEmployees.map(emp => {
                        // Filter penalties for employee in selected month or all
                        const empPenalties = selectedIslaStats.islaPenalties.filter(p => {
                          const matchEmp = p.employee_id === emp.id || p.employees?.name === emp.name;
                          if (!matchEmp) return false;
                          if (selectedConsolidatedMonth === 'Todos los Meses') return true;
                          const pDate = new Date(p.created_at || Date.now());
                          const pMonthName = pDate.toLocaleString('es-ES', { month: 'long' });
                          return selectedConsolidatedMonth.toLowerCase().includes(pMonthName.toLowerCase());
                        });
                        const totalDeductions = empPenalties.reduce((sum, p) => sum + Number(p.amount || 0), 0);

                        // Filter bonuses for employee in selected month or all
                        const empBonuses = bonuses.filter(b => {
                          const matchEmp = b.employee_id === emp.id || b.employee_name === emp.name;
                          if (!matchEmp) return false;
                          if (selectedConsolidatedMonth === 'Todos los Meses') return true;
                          return b.month === selectedConsolidatedMonth;
                        });
                        const totalBonuses = empBonuses.reduce((sum, b) => sum + Number(b.amount || 0), 0);

                        const netIncentive = totalBonuses - totalDeductions;

                        return (
                          <tr key={emp.name} style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--surface-color)' }}>
                            <td style={{ padding: '12px', fontWeight: 'bold' }}>{emp.name}</td>
                            <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#009C48' }}>
                              +${totalBonuses.toFixed(2)} ({empBonuses.length})
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: totalDeductions > 0 ? 'var(--danger)' : 'inherit' }}>
                              -${totalDeductions.toFixed(2)} ({empPenalties.length})
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center', fontWeight: 800, fontSize: '1.05rem', color: netIncentive >= 0 ? '#009C48' : 'var(--danger)' }}>
                              ${netIncentive.toFixed(2)}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'right' }}>
                              <span style={{ 
                                padding: '4px 10px', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 700,
                                background: netIncentive > 0 ? 'rgba(0, 156, 72, 0.12)' : netIncentive === 0 ? 'var(--bg-color)' : 'rgba(239, 68, 68, 0.12)',
                                color: netIncentive > 0 ? '#009C48' : netIncentive === 0 ? 'var(--text-secondary)' : 'var(--danger)'
                              }}>
                                {netIncentive > 0 ? 'Incentivo a Favor' : netIncentive === 0 ? 'Sin Incentivo' : 'Ajuste Negativo'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECCIÓN DE HISTORIALES DE FALTAS Y BONOS */}
              <div className="grid grid-cols-2 gap-6">
                {/* Historial de Faltas */}
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px' }}>
                  <h4 className="text-lg font-bold flex items-center gap-2" style={{ marginBottom: '12px', color: 'var(--danger)' }}>
                    <ShieldAlert size={18} /> Historial de Faltas de la Isla
                  </h4>
                  <div style={{ maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {selectedIslaStats.islaPenalties.map((p) => (
                      <div key={p.id} style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', position: 'relative', background: 'var(--surface-color)' }}>
                        <div className="flex justify-between">
                          <span style={{ fontWeight: 'bold' }}>{p.employees?.name || 'Empleado'}</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {new Date(p.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.88rem', margin: '4px 0' }}>
                          <span style={{ 
                            padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', marginRight: '6px',
                            background: p.severity === 'Crítica' ? 'var(--danger)' : 'rgba(247, 181, 0, 0.2)',
                            color: p.severity === 'Crítica' ? '#fff' : 'inherit'
                          }}>
                            {p.severity}
                          </span>
                          {p.reason}
                        </div>
                        <div className="flex justify-between items-center" style={{ marginTop: '6px', borderTop: '1px dashed var(--border-color)', paddingTop: '6px' }}>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Por: {p.reported_by}</span>
                          <span style={{ fontWeight: 'bold', color: p.amount > 0 ? 'var(--danger)' : 'inherit' }}>
                            {p.amount > 0 ? `-$${Number(p.amount).toFixed(2)}` : 'Aviso Verbal'}
                          </span>
                        </div>
                        <button 
                          onClick={() => handleDeletePenalty(p.id)}
                          style={{ position: 'absolute', top: '8px', right: '8px', color: 'var(--danger)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                          title="Eliminar Falta"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {selectedIslaStats.islaPenalties.length === 0 && (
                      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No hay faltas registradas en esta isla.
                      </div>
                    )}
                  </div>
                </div>

                {/* Historial de Bonos */}
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '10px', padding: '16px' }}>
                  <h4 className="text-lg font-bold flex items-center gap-2" style={{ marginBottom: '12px', color: '#009C48' }}>
                    <Gift size={18} /> Historial de Bonos de Incentivo
                  </h4>
                  <div style={{ maxHeight: '380px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {bonuses.filter(b => selectedIslaStats.islaEmployees.some(e => e.name === b.employee_name || e.id === b.employee_id)).map((b) => (
                      <div key={b.id} style={{ padding: '12px', border: '1px solid #009C48', borderRadius: '8px', position: 'relative', background: 'rgba(0, 156, 72, 0.04)' }}>
                        <div className="flex justify-between">
                          <span style={{ fontWeight: 'bold' }}>{b.employee_name}</span>
                          <span style={{ fontSize: '0.8rem', color: '#009C48', fontWeight: 700 }}>
                            {b.month}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.88rem', margin: '4px 0', fontWeight: 600 }}>
                          🎁 {b.reason}
                        </div>
                        {b.observation && (
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                            {b.observation}
                          </div>
                        )}
                        <div className="flex justify-between items-center" style={{ marginTop: '6px', borderTop: '1px dashed var(--border-color)', paddingTop: '6px' }}>
                          <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Registrado por: {b.reported_by}</span>
                          <span style={{ fontWeight: 800, color: '#009C48', fontSize: '1rem' }}>
                            +${Number(b.amount).toFixed(2)}
                          </span>
                        </div>
                        <button 
                          onClick={() => handleDeleteBonus(b.id)}
                          style={{ position: 'absolute', top: '8px', right: '8px', color: 'var(--danger)', background: 'transparent', border: 'none', cursor: 'pointer' }}
                          title="Eliminar Bono"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {bonuses.filter(b => selectedIslaStats.islaEmployees.some(e => e.name === b.employee_name || e.id === b.employee_id)).length === 0 && (
                      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No hay bonos registrados en esta isla. Presiona "Registrar Nuevo Bono" para otorgar uno.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PERSONAL QUE LABORA EN LA ISLA */}
          {islaTab === 'personal' && selectedIslaStats && (
            <div className="card">
              <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
                <div>
                  <h3 className="text-xl flex items-center gap-2" style={{ color: '#009C48' }}>
                    <Users size={22} /> Personal Asignado a Isla {selectedIsla.name}
                  </h3>
                  <p className="text-muted" style={{ fontSize: '0.88rem' }}>
                    Empleados asignados oficialmente para el cálculo de promedios e indicadores de desempeño.
                  </p>
                </div>

                <button 
                  onClick={() => {
                    setTargetIslaForAdd(selectedIslaId);
                    setShowAddEmpModal(true);
                  }} 
                  className="btn btn-primary flex items-center gap-2"
                  style={{ background: '#009C48', borderColor: '#009C48' }}
                >
                  <UserPlus size={18} /> Agregar Empleado a la Isla
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {selectedIslaStats.islaEmployees.map((emp) => {
                  const empEvals = selectedIslaStats.audEvals.filter(e => e.evaluated_employee === emp.name || e.evaluated_employee_id === emp.id);
                  const empAvg = empEvals.length > 0 
                    ? empEvals.reduce((sum, e) => sum + Number(e.total_score || 0), 0) / empEvals.length
                    : 0;

                  const empGhostEvals = selectedIslaStats.ghostEvals.filter(e => e.evaluated_employee === emp.name);
                  const empGhostAvg = empGhostEvals.length > 0
                    ? empGhostEvals.reduce((sum, e) => sum + Number(e.total_score || 0), 0) / empGhostEvals.length
                    : 0;

                  const empPenalties = selectedIslaStats.islaPenalties.filter(p => p.employee_id === emp.id || p.employees?.name === emp.name);
                  const totalPenaltyAmount = empPenalties.reduce((sum, p) => sum + Number(p.amount || 0), 0);

                  return (
                    <div key={emp.name} className="glass-panel" style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px', position: 'relative' }}>
                      <div className="flex justify-between items-start" style={{ marginBottom: '14px' }}>
                        <div>
                          <h4 className="text-xl" style={{ fontWeight: 800 }}>{emp.name}</h4>
                          <span style={{ fontSize: '0.82rem', color: '#009C48', fontWeight: 600 }}>Atención & Ventas</span>
                        </div>

                        <button 
                          onClick={() => handleRemoveEmployeeFromIsla(selectedIslaId, emp.name)}
                          className="btn btn-ghost text-danger"
                          style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                          title="Quitar empleado de esta isla"
                        >
                          <UserMinus size={16} /> Quitar
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-2" style={{ background: 'var(--bg-color)', padding: '12px', borderRadius: '8px', fontSize: '0.82rem' }}>
                        <div>
                          <span className="text-muted">Prom. Auditoría:</span>
                          <p style={{ fontWeight: 700, fontSize: '0.95rem', color: getScoreColor(empAvg) }}>
                            {empAvg > 0 ? `${empAvg.toFixed(1)}%` : 'Sin datos'}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted">Cliente Fantasma:</span>
                          <p style={{ fontWeight: 700, fontSize: '0.95rem', color: getScoreColor(empGhostAvg) }}>
                            {empGhostAvg > 0 ? `${empGhostAvg.toFixed(1)}%` : 'Sin datos'}
                          </p>
                        </div>
                        <div>
                          <span className="text-muted">Bonos / Faltas:</span>
                          <p style={{ fontWeight: 700, fontSize: '0.95rem', color: totalPenaltyAmount > 0 ? 'var(--danger)' : '#009C48' }}>
                            ${totalPenaltyAmount.toFixed(0)} ({empPenalties.length})
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {selectedIslaStats.islaEmployees.length === 0 && (
                  <div style={{ padding: '40px', gridColumn: 'span 2', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No hay empleados asignados a esta isla. Presiona el botón "Agregar Empleado a la Isla" para registrar el personal.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: INVENTARIOS DE LA ISLA */}
          {islaTab === 'inventario' && selectedIslaStats && (
            <div className="card">
              <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2" style={{ color: '#009C48' }}>
                    <Package size={24} style={{ color: '#009C48' }} /> Control de Inventarios de Isla {selectedIsla.name}
                  </h3>
                  <p className="text-muted" style={{ fontSize: '0.88rem' }}>
                    Registro de conteos físicos vs sistema y gestión mensual de faltantes
                  </p>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowCatalogModal(true)} 
                    className="btn btn-outline flex items-center gap-2"
                    style={{ borderColor: '#009C48', color: '#009C48' }}
                  >
                    <Tag size={18} /> 🏷️ Productos (Costos)
                  </button>

                  <Link 
                    to={`/inventory/new?isla=${selectedIslaId}`}
                    className="btn btn-primary flex items-center gap-2"
                    style={{ background: '#009C48', borderColor: '#009C48' }}
                  >
                    <Package size={18} /> Realizar Nuevo Inventario
                  </Link>
                </div>
              </div>

              {/* TARJETA RESUMEN DE ESTADO DEL INVENTARIO Y VISTO DE DESCUENTO */}
              <div className="mb-6" style={{ background: 'var(--bg-color)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#009C48', textTransform: 'uppercase' }}>
                      Estado del Inventario Mensual
                    </span>
                    <h4 className="text-2xl font-bold" style={{ marginTop: '2px' }}>
                      {selectedIslaStats.pendingMissingUnits > 0 
                        ? `⚠️ Faltantes Pendientes: ${selectedIslaStats.pendingMissingUnits} un. ($${selectedIslaStats.pendingMissingDollars.toFixed(2)})` 
                        : '✅ Inventario al Día (0 Faltantes Pendientes)'}
                    </h4>
                    <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                      {selectedIslaStats.islaInventories.length > 0 
                        ? `Último inventario realizado el: ${new Date(selectedIslaStats.islaInventories[0].date || selectedIslaStats.islaInventories[0].created_at).toLocaleDateString()}` 
                        : 'No se han registrado inventarios en esta isla.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-3" style={{ background: 'var(--surface-color)', padding: '12px 20px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Cierre / Descuento Mensual:
                      </span>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
                        {selectedIslaStats.pendingMissingUnits === 0 ? 'Resuelto a $0.00' : 'Faltantes activos'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* HISTORIAL DE INVENTARIOS DE ESTA ISLA */}
              <h4 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <FileText size={20} /> Historial de Inventarios Realizados
              </h4>

              <div className="table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-color)', borderBottom: '2px solid var(--border-color)', textAlign: 'left' }}>
                      <th style={{ padding: '12px 14px' }}>Fecha</th>
                      <th style={{ padding: '12px 14px' }}>Responsable / Auditor</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>Faltantes (-)</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>Conformes (=)</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>Sobrantes (+)</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>Estado Descuento</th>
                      <th style={{ padding: '12px 14px', textAlign: 'center' }}>Validez</th>
                      <th style={{ padding: '12px 14px', textAlign: 'right' }}>Acciones & PDF</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedIslaStats.islaInventories.map((inv) => {
                      const isDiscounted = !!inv.is_discounted;
                      const isValid = inv.is_valid !== false;
                      const missingUn = inv.total_missing || 0;
                      const missingDol = Number(inv.total_missing_dollars || missingUn * 1.00).toFixed(2);

                      return (
                        <tr key={inv.id} style={{ 
                          borderBottom: '1px solid var(--border-color)', 
                          background: !isValid ? 'rgba(239, 68, 68, 0.06)' : isDiscounted ? 'rgba(0, 156, 72, 0.04)' : 'inherit',
                          opacity: !isValid ? 0.65 : 1
                        }}>
                          <td style={{ padding: '14px', fontWeight: 700 }}>
                            {new Date(inv.date || inv.created_at).toLocaleDateString()}
                          </td>

                          <td style={{ padding: '14px' }}>
                            {inv.evaluator_name || 'Auditor Operativo'}
                          </td>

                          <td style={{ padding: '14px', textAlign: 'center', fontWeight: 800, color: !isValid ? 'var(--text-secondary)' : missingUn > 0 ? 'var(--danger)' : '#009C48' }}>
                            {missingUn} un. <span style={{ fontSize: '0.82rem' }}>(${missingDol})</span>
                          </td>

                          <td style={{ padding: '14px', textAlign: 'center', fontWeight: 700, color: !isValid ? 'var(--text-secondary)' : '#009C48' }}>
                            {inv.total_match || 0} prod.
                          </td>

                          <td style={{ padding: '14px', textAlign: 'center', fontWeight: 700, color: !isValid ? 'var(--text-secondary)' : '#0284c7' }}>
                            +{inv.total_surplus || 0} un.
                          </td>

                          <td style={{ padding: '14px', textAlign: 'center' }}>
                            <button
                              onClick={() => toggleInventoryDiscount(inv.id, isDiscounted)}
                              className="btn"
                              disabled={!isValid}
                              style={{
                                padding: '6px 12px',
                                fontSize: '0.8rem',
                                fontWeight: 800,
                                borderRadius: '20px',
                                background: !isValid ? 'rgba(100, 100, 100, 0.1)' : isDiscounted ? 'rgba(0, 156, 72, 0.15)' : 'rgba(247, 181, 0, 0.15)',
                                color: !isValid ? 'var(--text-secondary)' : isDiscounted ? '#009C48' : '#b48200',
                                border: `1px solid ${!isValid ? 'var(--border-color)' : isDiscounted ? '#009C48' : '#f7b500'}`
                              }}
                              title="Haz clic para cambiar el visto de descuento a 0"
                            >
                              {!isValid ? '🚫 No Aplica' : isDiscounted ? '✓ Descontado (0 Pendiente)' : '⚠️ Pendiente por Descontar'}
                            </button>
                          </td>

                          <td style={{ padding: '14px', textAlign: 'center' }}>
                            <button
                              onClick={() => toggleInventoryValidation(inv.id, isValid)}
                              className="btn"
                              style={{
                                padding: '6px 12px',
                                fontSize: '0.78rem',
                                fontWeight: 800,
                                borderRadius: '16px',
                                background: isValid ? 'rgba(239, 68, 68, 0.12)' : 'rgba(0, 156, 72, 0.15)',
                                color: isValid ? 'var(--danger)' : '#009C48',
                                border: `1px solid ${isValid ? 'var(--danger)' : '#009C48'}`
                              }}
                              title={isValid ? "Anular inventario para no contabilizar sus faltantes" : "Reactivar validez del inventario"}
                            >
                              {isValid ? 'Anular Inventario' : '✓ Reactivar / Validar'}
                            </button>
                          </td>

                          <td style={{ padding: '14px', textAlign: 'right' }}>
                            <button
                              onClick={() => {
                                const offlineItemsMap = JSON.parse(localStorage.getItem('gedaluma_offline_inventory_items') || '{}');
                                const items = offlineItemsMap[inv.id] || [];
                                generateInventoryPDF(inv, items);
                              }}
                              className="btn btn-outline flex items-center gap-1"
                              style={{ padding: '6px 12px', fontSize: '0.8rem', marginLeft: 'auto' }}
                            >
                              <FileText size={16} /> PDF
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {selectedIslaStats.islaInventories.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                          No hay inventarios registrados en esta isla. Presiona "Realizar Nuevo Inventario" para hacer el primer conteo.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* MODAL PARA AGREGAR EMPLEADO A LA ISLA O GENERAL */}
      {showAddEmpModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '480px' }}>
            <h2 className="text-xl mb-4" style={{ color: '#009C48', fontWeight: 800 }}>
              {targetIslaForAdd ? `Agregar Empleado a Isla ${mockIslas.find(i => i.id === targetIslaForAdd)?.name}` : 'Registrar Nuevo Empleado General'}
            </h2>
            
            <div className="flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Seleccionar de Lista Existente</label>
                <select 
                  className="form-control"
                  value={selectedEmpToAssign}
                  onChange={(e) => {
                    setSelectedEmpToAssign(e.target.value);
                    if (e.target.value) setCustomEmpName('');
                  }}
                >
                  <option value="">-- Seleccionar empleado... --</option>
                  {employees.map(e => (
                    <option key={e.id || e.name} value={e.name}>{e.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">O ingresar un nuevo nombre manualmente</label>
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Ej. Nombre Completo del Empleado"
                  value={customEmpName}
                  onChange={(e) => {
                    setCustomEmpName(e.target.value);
                    if (e.target.value) setSelectedEmpToAssign('');
                  }}
                />
              </div>

              {!targetIslaForAdd && (
                <div className="form-group">
                  <label className="form-label">Designar Isla (Opcional)</label>
                  <select 
                    className="form-control"
                    onChange={(e) => setTargetIslaForAdd(e.target.value)}
                    value={targetIslaForAdd}
                  >
                    <option value="">-- Sin asignar isla inicial --</option>
                    {mockIslas.map(i => (
                      <option key={i.id} value={i.id}>ISLA {i.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-4">
                <button 
                  onClick={() => {
                    setShowAddEmpModal(false);
                    setSelectedEmpToAssign('');
                    setCustomEmpName('');
                    setTargetIslaForAdd('');
                  }} 
                  className="btn btn-ghost"
                >
                  Cancelar
                </button>
                <button 
                  onClick={() => handleAddEmployeeToIsla(targetIslaForAdd)}
                  className="btn btn-primary"
                  style={{ background: '#009C48', borderColor: '#009C48' }}
                >
                  Guardar Empleado
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA REGISTRAR NUEVA FALTA (CALCULADORA DE SANCIONES Y ACUMULACIÓN MENSUAL) */}
      {showPenaltyModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '560px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold" style={{ color: 'var(--danger)' }}>
                  ⚖️ Calculadora & Registro de Sanciones
                </h2>
                <p className="text-muted" style={{ fontSize: '0.82rem' }}>
                  Cálculo automático según ocurrencias acumuladas en el mes
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowPenaltyModal(false)}
                className="btn btn-ghost" 
                style={{ fontSize: '1.2rem', padding: '4px 10px' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePenalty} className="flex flex-col gap-4">
              
              <div className="form-group">
                <label className="form-label">Empleado a Sancionar *</label>
                <select 
                  className="form-control" 
                  required
                  value={penaltyForm.employee_id}
                  onChange={e => {
                    const empId = e.target.value;
                    setPenaltyForm({...penaltyForm, employee_id: empId});
                  }}
                >
                  <option value="">Seleccionar empleado...</option>
                  {(selectedIslaStats?.islaEmployees || employees).map(e => (
                    <option key={e.id || e.name} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Seleccionar Falta del Catálogo Oficial (ID y Gravedad) *</label>
                <select 
                  className="form-control" 
                  required
                  value={penaltyForm.reason}
                  onChange={e => {
                    const selectedTitle = e.target.value;
                    const matchedFault = penaltyCatalog.find(f => f.title === selectedTitle);
                    if (!matchedFault) return;

                    // Calculate occurrences for this employee & severity in current month
                    const empObj = employees.find(emp => emp.id === penaltyForm.employee_id || emp.name === penaltyForm.employee_id);
                    const empName = empObj?.name || penaltyForm.employee_id;

                    const now = new Date();
                    const currentMonth = now.getMonth();
                    const currentYear = now.getFullYear();

                    const empPenaltiesThisMonth = penalties.filter(p => {
                      const pDate = new Date(p.created_at || Date.now());
                      const matchEmp = p.employee_id === penaltyForm.employee_id || p.employees?.name === empName;
                      return matchEmp && p.severity === matchedFault.severity && pDate.getMonth() === currentMonth && pDate.getFullYear() === currentYear;
                    });

                    const occurrenceNumber = empPenaltiesThisMonth.length + 1;
                    const calc = calculatePenaltyAmount(matchedFault.severity, occurrenceNumber);

                    setPenaltyForm({
                      ...penaltyForm,
                      severity: matchedFault.severity,
                      reason: matchedFault.title,
                      amount: calc.amount,
                      observation: calc.message
                    });
                  }}
                >
                  <option value="">-- Seleccione una falta del catálogo --</option>
                  
                  <optgroup label="FALTAS LEVES (1ra-2da: $0 | 3ra: $2.00 | 4ta: $3.00 | 5ta: $4.00 | 6ta+: $5.00)">
                    {penaltyCatalog.filter(f => f.severity === 'Leve').map(f => (
                      <option key={f.id} value={f.title}>{f.title}</option>
                    ))}
                  </optgroup>

                  <optgroup label="FALTAS MODERADAS (1ra: $2.00 | 2da: $2.50 | 3ra: $3.00 | 4ta: $3.50 | 5ta: $4.00 | 6ta+: $5.00)">
                    {penaltyCatalog.filter(f => f.severity === 'Moderada').map(f => (
                      <option key={f.id} value={f.title}>{f.title}</option>
                    ))}
                  </optgroup>

                  <optgroup label="FALTAS GRAVES (1ra: $10.00 | 2da: $11.00 | 3ra: $12.00 | 4ta: $13.00 | 5ta+: $14.00)">
                    {penaltyCatalog.filter(f => f.severity === 'Grave').map(f => (
                      <option key={f.id} value={f.title}>{f.title}</option>
                    ))}
                  </optgroup>

                  <optgroup label="FALTAS CRÍTICAS (🚨 Inicio de proceso de desvinculación / Despido)">
                    {penaltyCatalog.filter(f => f.severity === 'Crítica').map(f => (
                      <option key={f.id} value={f.title}>{f.title}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* MOSTRAR INFORMACIÓN DEL CÁLCULO DE OCURRENCIA */}
              {penaltyForm.reason && (
                <div style={{ 
                  padding: '14px', 
                  borderRadius: '8px', 
                  background: penaltyForm.severity === 'Crítica' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(0, 156, 72, 0.08)',
                  border: `1px solid ${penaltyForm.severity === 'Crítica' ? 'var(--danger)' : '#009C48'}`
                }}>
                  <div className="flex justify-between items-center mb-1">
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: penaltyForm.severity === 'Crítica' ? 'var(--danger)' : '#009C48' }}>
                      Nivel: {penaltyForm.severity}
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>
                      Descuento Calculado: ${Number(penaltyForm.amount).toFixed(2)}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-primary)', margin: 0 }}>
                    {penaltyForm.observation}
                  </p>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Descuento / Ajuste Económico Final ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="form-control" 
                  value={penaltyForm.amount}
                  onChange={e => setPenaltyForm({...penaltyForm, amount: Number(e.target.value)})}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Observaciones Adicionales / Detalles de la Evidencia</label>
                <textarea 
                  className="form-control" 
                  rows={3} 
                  placeholder="Detalles sobre lo ocurrido o la evidencia tomada..."
                  value={penaltyForm.observation}
                  onChange={e => setPenaltyForm({...penaltyForm, observation: e.target.value})}
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowPenaltyModal(false)} className="btn btn-ghost">Cancelar</button>
                <button type="submit" className="btn btn-danger">Guardar Falta y Aplicar Sanción</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL PARA REGISTRAR NUEVO BONO */}
      {showBonusModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2" style={{ color: '#009C48' }}>
                  <Gift size={22} /> Registrar Nuevo Bono de Incentivo
                </h2>
                <p className="text-muted" style={{ fontSize: '0.82rem' }}>
                  Otorgar un bono o reconocimiento mensual a una empleada
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setShowBonusModal(false)}
                className="btn btn-ghost" 
                style={{ fontSize: '1.2rem', padding: '4px 10px' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBonus} className="flex flex-col gap-4">
              <div className="form-group">
                <label className="form-label">Empleado a Otorgar el Bono *</label>
                <select 
                  className="form-control" 
                  required
                  value={bonusForm.employee_id}
                  onChange={e => setBonusForm({...bonusForm, employee_id: e.target.value})}
                >
                  <option value="">Seleccionar empleada...</option>
                  {(selectedIslaStats?.islaEmployees || employees).map(e => (
                    <option key={e.id || e.name} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Mes del Bono *</label>
                <select 
                  className="form-control"
                  required
                  value={bonusForm.month}
                  onChange={e => setBonusForm({...bonusForm, month: e.target.value})}
                >
                  {monthsList.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Concepto / Motivo del Bono *</label>
                <select 
                  className="form-control"
                  required
                  value={bonusForm.reason}
                  onChange={e => setBonusForm({...bonusForm, reason: e.target.value})}
                >
                  <option value="Bono de Calidad Cliente Fantasma (100%)">Bono de Calidad Cliente Fantasma (100%)</option>
                  <option value="Bono de Calidad Cliente Fantasma (50%)">Bono de Calidad Cliente Fantasma (50%)</option>
                  <option value="Bono por Cumplimiento de Metas">Bono por Cumplimiento de Metas</option>
                  <option value="Bono de Puntualidad y Asistencia">Bono de Puntualidad y Asistencia</option>
                  <option value="Reconocimiento Especial de Desempeño">Reconocimiento Especial de Desempeño</option>
                  <option value="Otro Incentivo">Otro Incentivo</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Monto del Bono ($) *</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="form-control" 
                  value={bonusForm.amount}
                  onChange={e => setBonusForm({...bonusForm, amount: Number(e.target.value)})}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Observaciones / Detalles</label>
                <textarea 
                  className="form-control" 
                  rows={3} 
                  placeholder="Comentarios adicionales sobre la entrega de este bono..."
                  value={bonusForm.observation}
                  onChange={e => setBonusForm({...bonusForm, observation: e.target.value})}
                />
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowBonusModal(false)} className="btn btn-ghost">Cancelar</button>
                <button type="submit" className="btn btn-primary" style={{ background: '#009C48', borderColor: '#009C48' }}>
                  Guardar Bono
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
