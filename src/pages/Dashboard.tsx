import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LogOut, BarChart3, TrendingUp, Users, Loader2, 
  UserCheck, ShieldAlert, Plus, Trash2, ArrowLeft, Store, 
  MapPin, CheckCircle2, ChevronRight, FileText
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { mockIslas, mockEmployees, categories, ghostCategories, penaltyPolicies } from '../data/mock';

export function Dashboard() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  
  // State for selected Island (null = view all islands grid)
  const [selectedIslaId, setSelectedIslaId] = useState<string | null>(null);
  
  // Active tab within selected island
  const [islaTab, setIslaTab] = useState<'auditoria' | 'fantasma' | 'responsabilidad' | 'personal'>('auditoria');

  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>(mockEmployees);
  const [penalties, setPenalties] = useState<any[]>([]);
  
  // Modal state for registering a penalty
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [penaltyForm, setPenaltyForm] = useState({
    employee_id: '',
    severity: 'Leve',
    reason: '',
    amount: 0,
    observation: ''
  });

  // Assign default islands to employees if not specified
  const employeeIslaMapping: Record<string, string[]> = {
    '1': ['Gabriel Perero', 'Shirley Reyes'], // ALBAN
    '2': ['Yamilet Delgado', 'Virginia Miño'], // JUAN TANCA
    '3': ['Johanna Mendoza', 'Dayse Rodriguez'], // CALIFORNIA
    '4': ['Teresa Vargas', 'Carmen Larenas'], // DAULE
    '5': ['Liliana Estrada', 'Jackeline Mera Collazo'], // TERMINAL
    '6': ['Andrea Meza Saltos', 'Maritza Cedeño'], // SALINAS
    '7': ['Jackie Rodriguez', 'Gabriel Perero'] // PUERTO AZUL
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: evalsData, error: evalsError } = await supabase
        .from('evaluations')
        .select('*')
        .neq('is_valid', false);
      if (evalsError) throw evalsError;
      
      const { data: respData, error: respError } = await supabase
        .from('responses')
        .select('evaluation_id, question_id, value');
      if (respError) throw respError;

      setEvaluations(evalsData || []);
      setResponses(respData || []);

      // Fetch v3 data safely
      try {
        const { data: empData, error: empErr } = await supabase.from('employees').select('*');
        if (!empErr && empData && empData.length > 0) {
          setEmployees(empData);
        }
        
        const { data: penData, error: penErr } = await supabase.from('penalties').select('*, employees(name)');
        if (!penErr && penData) {
          setPenalties(penData);
        }
      } catch (e) {
        console.warn('V3 tables might not exist yet', e);
      }
      
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePenalty = async (id: string) => {
    if (!window.confirm('¿Eliminar esta falta?')) return;
    try {
      const { error } = await supabase.from('penalties').delete().eq('id', id);
      if (error) throw error;
      setPenalties(penalties.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
      alert('Error al eliminar');
    }
  };

  const handleSavePenalty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!penaltyForm.employee_id || !penaltyForm.reason) return alert('Completa los campos');
    
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
      
      if (data) {
        setPenalties([...penalties, data[0]]);
      }
      setShowPenaltyModal(false);
      setPenaltyForm({ employee_id: '', severity: 'Leve', reason: '', amount: 0, observation: '' });
    } catch (err: any) {
      console.error(err);
      alert('Error guardando la falta. Asegúrate de haber creado las tablas en Supabase.');
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
    const islaEvals = evaluations.filter(e => e.isla_id === islaId);
    const audEvals = islaEvals.filter(e => e.evaluator_role !== 'ghost');
    const ghostEvals = islaEvals.filter(e => e.evaluator_role === 'ghost');

    const audAvg = audEvals.length > 0
      ? audEvals.reduce((sum, e) => sum + Number(e.total_score || 0), 0) / audEvals.length
      : 0;

    const ghostAvg = ghostEvals.length > 0
      ? ghostEvals.reduce((sum, e) => sum + Number(e.total_score || 0), 0) / ghostEvals.length
      : 0;

    // Get employees for this island
    const assignedNames = employeeIslaMapping[islaId] || [];
    const islaEmployees = employees.filter(emp => 
      assignedNames.includes(emp.name) || emp.isla_id === islaId
    );

    // Get penalties for employees of this island
    const empIds = islaEmployees.map(e => e.id);
    const empNames = islaEmployees.map(e => e.name);
    const islaPenalties = penalties.filter(p => 
      empIds.includes(p.employee_id) || empNames.includes(p.employees?.name)
    );
    
    const totalAdjustments = islaPenalties.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    return {
      audAvg,
      audCount: audEvals.length,
      ghostAvg,
      ghostCount: ghostEvals.length,
      islaEmployees,
      islaPenalties,
      totalAdjustments,
      audEvals,
      ghostEvals
    };
  };

  const selectedIsla = mockIslas.find(i => i.id === selectedIslaId);
  const selectedIslaStats = selectedIslaId ? getIslaStats(selectedIslaId) : null;

  const getGhostOptionPercent = (val: string) => {
    const v = val.toLowerCase();
    if (v.includes('sí, ofreció') || v.includes('muy bueno') || v === 'sí' || v === 'bueno') return 100;
    if (v.includes('más o menos') || v.includes('regular') || v.includes('poco') || v.includes('ofreció factura, pero')) return 50;
    return 0;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: '100vh', flexDirection: 'column', gap: '16px' }}>
        <Loader2 className="animate-spin" style={{ color: '#009C48' }} size={48} />
        <p className="text-muted">Cargando panel de control de islas...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '1200px', paddingBottom: '60px' }}>
      {/* Header General */}
      <header className="flex justify-between items-center" style={{ marginBottom: '28px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
        <div className="flex items-center gap-3">
          <img src="/logo-wide.png" alt="Gedaluma Logo" style={{ height: '40px', width: 'auto' }} />
          <div style={{ height: '24px', width: '1px', background: 'var(--border-color)' }}></div>
          <div>
            <h1 className="text-2xl" style={{ lineHeight: 1.2 }}>Panel Administrativo de Islas</h1>
            <p className="text-muted" style={{ fontSize: '0.88rem' }}>Bienvenido, {user?.name || 'Administrador'}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Link to="/history" className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--border-color)' }}>
            <FileText size={18} />
            <span>Historial Global</span>
          </Link>
          <button onClick={logout} className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)' }}>
            <LogOut size={18} />
            <span>Salir</span>
          </button>
        </div>
      </header>

      {/* ======================================================== */}
      {/* VISTA 1: GRILLA DE ISLAS (SELECCIÓN PRIMERA VENTANA)     */}
      {/* ======================================================== */}
      {!selectedIslaId ? (
        <div>
          {/* Banner introductorio */}
          <div className="glass-panel" style={{ 
            marginBottom: '32px', 
            background: 'linear-gradient(135deg, rgba(0, 156, 72, 0.1) 0%, rgba(247, 181, 0, 0.08) 100%)',
            border: '1px solid rgba(0, 156, 72, 0.25)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '24px 32px'
          }}>
            <div>
              <span style={{ 
                display: 'inline-block', padding: '4px 12px', background: '#009C48', 
                color: '#fff', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '8px' 
              }}>
                PUNTOS DE VENTA DE COCO EXPRESS ®
              </span>
              <h2 className="text-2xl" style={{ margin: '4px 0 6px 0' }}>Selecciona una Isla para ver su información</h2>
              <p className="text-muted" style={{ fontSize: '0.95rem' }}>
                Haz clic en cualquiera de las islas para desplegar sus resultados de auditoría, cliente fantasma, responsabilidad y personal.
              </p>
            </div>
            <div className="hidden-mobile">
              <Store size={48} style={{ color: '#009C48', opacity: 0.8 }} />
            </div>
          </div>

          {/* Grilla de Islas */}
          <div className="grid grid-cols-3 gap-6">
            {mockIslas.map((isla) => {
              const stats = getIslaStats(isla.id);
              return (
                <div 
                  key={isla.id} 
                  onClick={() => { setSelectedIslaId(isla.id); setIslaTab('auditoria'); }}
                  className="card hover-lift" 
                  style={{ 
                    cursor: 'pointer', 
                    position: 'relative',
                    overflow: 'hidden',
                    border: '1px solid var(--border-color)',
                    transition: 'all 0.25s ease'
                  }}
                >
                  {/* Accent bar */}
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#009C48' }}></div>

                  <div className="flex justify-between items-start" style={{ marginTop: '8px', marginBottom: '16px' }}>
                    <div>
                      <h3 className="text-xl" style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Store size={22} style={{ color: '#009C48' }} />
                        ISLA {isla.name}
                      </h3>
                      <p className="text-muted" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                        <MapPin size={14} /> {isla.location}
                      </p>
                    </div>

                    <span style={{ 
                      padding: '4px 10px', 
                      borderRadius: '20px', 
                      fontSize: '0.8rem', 
                      fontWeight: 700,
                      background: 'rgba(0, 156, 72, 0.12)',
                      color: '#009C48',
                      border: '1px solid rgba(0, 156, 72, 0.25)'
                    }}>
                      Activa
                    </span>
                  </div>

                  {/* Resumen de métricas principales */}
                  <div className="grid grid-cols-2 gap-3" style={{ background: 'var(--bg-color)', padding: '14px', borderRadius: '10px', marginBottom: '16px' }}>
                    <div>
                      <p className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Auditoría</p>
                      <p style={{ fontSize: '1.25rem', fontWeight: 800, color: getScoreColor(stats.audAvg) }}>
                        {stats.audCount > 0 ? `${stats.audAvg.toFixed(1)}%` : 'Sin datos'}
                      </p>
                    </div>

                    <div>
                      <p className="text-muted" style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Cliente Fantasma</p>
                      <p style={{ fontSize: '1.25rem', fontWeight: 800, color: getScoreColor(stats.ghostAvg) }}>
                        {stats.ghostCount > 0 ? `${stats.ghostAvg.toFixed(1)}%` : 'Sin datos'}
                      </p>
                    </div>
                  </div>

                  {/* Detalle secundario */}
                  <div className="flex justify-between items-center text-muted" style={{ fontSize: '0.85rem' }}>
                    <span>👥 {stats.islaEmployees.length} Empleados</span>
                    <span style={{ color: stats.totalAdjustments > 0 ? 'var(--danger)' : 'inherit', fontWeight: stats.totalAdjustments > 0 ? 'bold' : 'normal' }}>
                      ⚠️ {stats.islaPenalties.length} Faltas (${stats.totalAdjustments.toFixed(2)})
                    </span>
                  </div>

                  {/* Botón de ingreso */}
                  <button className="btn btn-block" style={{ marginTop: '16px', background: '#009C48', color: '#fff', fontSize: '0.9rem', justifyContent: 'center' }}>
                    Ver Información Desplegada <ChevronRight size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ======================================================== */
        /* VISTA 2: INFORMACIÓN DESPLEGADA DE LA ISLA SELECCIONADA  */
        /* ======================================================== */
        <div>
          {/* Header de la Isla Seleccionada */}
          <div className="flex justify-between items-center" style={{ marginBottom: '24px' }}>
            <button 
              onClick={() => setSelectedIslaId(null)}
              className="btn btn-ghost hover-lift"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--border-color)' }}
            >
              <ArrowLeft size={18} />
              <span>Volver a todas las Islas</span>
            </button>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '0.85rem', color: '#009C48', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                Detalle Completo de Punto de Venta
              </span>
              <h2 className="text-3xl" style={{ margin: 0, fontWeight: 800 }}>ISLA {selectedIsla?.name}</h2>
            </div>
          </div>

          {/* Tarjetas de Resumen Rápido de la Isla */}
          {selectedIslaStats && (
            <div className="grid grid-cols-4 gap-6" style={{ marginBottom: '28px' }}>
              <div className="card flex flex-col gap-1" style={{ borderLeft: '4px solid #009C48' }}>
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>Promedio Auditorías</span>
                <p className="text-3xl" style={{ color: getScoreColor(selectedIslaStats.audAvg), fontWeight: 800 }}>
                  {selectedIslaStats.audAvg > 0 ? `${selectedIslaStats.audAvg.toFixed(1)}%` : 'N/A'}
                </p>
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>{selectedIslaStats.audCount} evaluaciones registradas</span>
              </div>

              <div className="card flex flex-col gap-1" style={{ borderLeft: '4px solid #f7b500' }}>
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>Cliente Fantasma</span>
                <p className="text-3xl" style={{ color: getScoreColor(selectedIslaStats.ghostAvg), fontWeight: 800 }}>
                  {selectedIslaStats.ghostAvg > 0 ? `${selectedIslaStats.ghostAvg.toFixed(1)}%` : 'N/A'}
                </p>
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>{selectedIslaStats.ghostCount} visitas de supervisión</span>
              </div>

              <div className="card flex flex-col gap-1" style={{ borderLeft: '4px solid var(--danger)' }}>
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>Responsabilidad / Faltas</span>
                <p className="text-3xl" style={{ color: selectedIslaStats.totalAdjustments > 0 ? 'var(--danger)' : '#009C48', fontWeight: 800 }}>
                  ${selectedIslaStats.totalAdjustments.toFixed(2)}
                </p>
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>{selectedIslaStats.islaPenalties.length} avisos / sanciones</span>
              </div>

              <div className="card flex flex-col gap-1" style={{ borderLeft: '4px solid #0284c7' }}>
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>Personal Asignado</span>
                <p className="text-3xl" style={{ color: '#0284c7', fontWeight: 800 }}>
                  {selectedIslaStats.islaEmployees.length}
                </p>
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>Empleados laborando en esta isla</span>
              </div>
            </div>
          )}

          {/* Navegación por pestañas de la Isla */}
          <div className="flex gap-3" style={{ marginBottom: '28px' }}>
            <button 
              onClick={() => setIslaTab('auditoria')}
              className={`btn ${islaTab === 'auditoria' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ flex: 1, justifyContent: 'center', gap: '8px', background: islaTab === 'auditoria' ? '#009C48' : 'transparent', borderColor: '#009C48' }}
            >
              <BarChart3 size={18} />
              Resultados Auditoría
            </button>
            <button 
              onClick={() => setIslaTab('fantasma')}
              className={`btn ${islaTab === 'fantasma' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ flex: 1, justifyContent: 'center', gap: '8px', background: islaTab === 'fantasma' ? '#009C48' : 'transparent', borderColor: '#009C48' }}
            >
              <UserCheck size={18} />
              Cliente Fantasma
            </button>
            <button 
              onClick={() => setIslaTab('responsabilidad')}
              className={`btn ${islaTab === 'responsabilidad' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ flex: 1, justifyContent: 'center', gap: '8px', background: islaTab === 'responsabilidad' ? '#009C48' : 'transparent', borderColor: '#009C48' }}
            >
              <ShieldAlert size={18} />
              Responsabilidad & Ajustes
            </button>
            <button 
              onClick={() => setIslaTab('personal')}
              className={`btn ${islaTab === 'personal' ? 'btn-primary' : 'btn-ghost'}`}
              style={{ flex: 1, justifyContent: 'center', gap: '8px', background: islaTab === 'personal' ? '#009C48' : 'transparent', borderColor: '#009C48' }}
            >
              <Users size={18} />
              Personal que Labora ({selectedIslaStats?.islaEmployees.length})
            </button>
          </div>

          {/* TAB 1: RESULTADOS AUDITORÍA DE LA ISLA */}
          {islaTab === 'auditoria' && selectedIslaStats && (
            <div className="grid grid-cols-2 gap-6">
              <div className="card">
                <h3 className="text-xl" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <TrendingUp size={20} style={{ color: '#009C48' }} />
                  Desempeño por Categorías en Isla {selectedIsla?.name}
                </h3>
                <div style={{ maxHeight: '450px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                        <th style={{ padding: '10px' }}>Categoría</th>
                        <th style={{ padding: '10px', textAlign: 'right' }}>Puntaje</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map(cat => {
                        const qIds = cat.questions.map(q => q.id);
                        const validEvalIds = selectedIslaStats.audEvals.map(e => e.id);
                        const catResponses = responses.filter(r => qIds.includes(r.question_id) && validEvalIds.includes(r.evaluation_id));
                        
                        let totalScore = 0;
                        let maxPossible = 0;
                        catResponses.forEach(r => {
                          totalScore += Number(r.value || 0);
                          maxPossible += 5;
                        });

                        const scorePercent = maxPossible > 0 ? (totalScore / maxPossible) * 100 : 0;
                        return (
                          <tr key={cat.name} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '12px 10px' }}>{cat.name}</td>
                            <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 'bold', color: getScoreColor(scorePercent) }}>
                              {catResponses.length > 0 ? `${scorePercent.toFixed(1)}%` : 'Sin registros'}
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
                  <FileText size={20} style={{ color: '#009C48' }} />
                  Historial de Auditorías de la Isla
                </h3>
                <div style={{ maxHeight: '450px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedIslaStats.audEvals.map((ev) => (
                    <div key={ev.id} style={{ padding: '14px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--surface-color)' }}>
                      <div className="flex justify-between items-center" style={{ marginBottom: '6px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{ev.evaluated_employee || 'Personal de Isla'}</span>
                        <span style={{ padding: '4px 10px', borderRadius: '12px', fontWeight: 800, background: 'rgba(0, 156, 72, 0.15)', color: getScoreColor(ev.total_score) }}>
                          {Number(ev.total_score).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-muted" style={{ fontSize: '0.82rem' }}>
                        <span>Evaluador: {ev.evaluator_name || 'Supervisor'}</span>
                        <span>{new Date(ev.date || ev.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                  {selectedIslaStats.audEvals.length === 0 && (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      Aún no hay auditorías registradas en esta isla.
                    </div>
                  )}
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
                  Éxito por Pregunta (Cliente Fantasma - Isla {selectedIsla?.name})
                </h3>
                <div style={{ maxHeight: '450px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                        <th style={{ padding: '10px' }}>Pregunta Evaluada</th>
                        <th style={{ padding: '10px', textAlign: 'right', width: '100px' }}>% Éxito</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ghostCategories[0].questions.filter(q => q.type !== 'text').map((q) => {
                        const validEvalIds = selectedIslaStats.ghostEvals.map(e => e.id);
                        const qResponses = responses.filter(r => r.question_id === q.id && validEvalIds.includes(r.evaluation_id));
                        let totalPoints = 0;
                        qResponses.forEach(r => {
                          totalPoints += getGhostOptionPercent(r.value || '');
                        });
                        const avg = qResponses.length > 0 ? totalPoints / qResponses.length : 0;
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
                  <CheckCircle2 size={20} style={{ color: '#f7b500' }} />
                  Observaciones y Comentarios Recientes
                </h3>
                <div style={{ maxHeight: '450px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedIslaStats.ghostEvals.map((ev) => (
                    <div key={ev.id} style={{ padding: '14px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--surface-color)' }}>
                      <div className="flex justify-between items-center" style={{ marginBottom: '6px' }}>
                        <span style={{ fontWeight: 700 }}>Visita Cliente Fantasma</span>
                        <span style={{ fontWeight: 800, color: getScoreColor(ev.total_score) }}>{Number(ev.total_score).toFixed(1)}%</span>
                      </div>
                      <p className="text-muted" style={{ fontSize: '0.85rem', fontStyle: 'italic', marginBottom: '6px' }}>
                        "{ev.notes || ev.comments || 'Sin comentarios adicionales'}"
                      </p>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        Fecha: {new Date(ev.date || ev.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                  {selectedIslaStats.ghostEvals.length === 0 && (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                      No hay visitas de cliente fantasma registradas para esta isla.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RESPONSABILIDAD (FALTAS Y AJUSTES DE LA ISLA) */}
          {islaTab === 'responsabilidad' && selectedIslaStats && (
            <div className="card">
              <div className="flex justify-between items-center" style={{ marginBottom: '20px' }}>
                <div>
                  <h3 className="text-xl flex items-center gap-2" style={{ color: 'var(--danger)' }}>
                    <ShieldAlert size={22} /> Faltas y Responsabilidad en Isla {selectedIsla?.name}
                  </h3>
                  <p className="text-muted" style={{ fontSize: '0.9rem' }}>Avisos y ajustes económicos de esta isla</p>
                </div>
                
                <button 
                  onClick={() => setShowPenaltyModal(true)} 
                  className="btn btn-danger"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                  <Plus size={18} />
                  Registrar Falta en esta Isla
                </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Resumen por Empleado de la Isla */}
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px' }}>
                  <h4 className="text-lg" style={{ marginBottom: '12px' }}>Ajustes por Empleado de la Isla</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                        <th style={{ padding: '8px' }}>Empleado</th>
                        <th style={{ padding: '8px', textAlign: 'center' }}>Faltas</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>Ajuste Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedIslaStats.islaEmployees.map(emp => {
                        const empPenalties = selectedIslaStats.islaPenalties.filter(p => 
                          p.employee_id === emp.id || p.employees?.name === emp.name
                        );
                        const totalDeductions = empPenalties.reduce((sum, p) => sum + Number(p.amount || 0), 0);
                        return (
                          <tr key={emp.name} style={{ borderBottom: '1px solid var(--border-color)' }}>
                            <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>{emp.name}</td>
                            <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                              <span style={{ background: empPenalties.length > 0 ? 'var(--warning)' : 'var(--bg-color)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>
                                {empPenalties.length} avisos
                              </span>
                            </td>
                            <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: totalDeductions > 0 ? 'var(--danger)' : 'inherit' }}>
                              ${totalDeductions.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Historial de Faltas */}
                <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px' }}>
                  <h4 className="text-lg" style={{ marginBottom: '12px' }}>Historial de Faltas en esta Isla</h4>
                  <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {selectedIslaStats.islaPenalties.map((p) => (
                      <div key={p.id} style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', position: 'relative' }}>
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
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {selectedIslaStats.islaPenalties.length === 0 && (
                      <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        No hay faltas ni sanciones en esta isla.
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
              <h3 className="text-xl" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={22} style={{ color: '#009C48' }} />
                Personal Asignado y Laborando en Isla {selectedIsla?.name}
              </h3>

              <div className="grid grid-cols-2 gap-6">
                {selectedIslaStats.islaEmployees.map((emp) => {
                  const empEvals = selectedIslaStats.audEvals.filter(e => e.evaluated_employee === emp.name || e.evaluated_employee_id === emp.id);
                  const empAvg = empEvals.length > 0 
                    ? empEvals.reduce((sum, e) => sum + Number(e.total_score || 0), 0) / empEvals.length
                    : 0;

                  const empPenalties = selectedIslaStats.islaPenalties.filter(p => p.employee_id === emp.id || p.employees?.name === emp.name);
                  const totalPenaltyAmount = empPenalties.reduce((sum, p) => sum + Number(p.amount || 0), 0);

                  return (
                    <div key={emp.name} className="glass-panel" style={{ border: '1px solid var(--border-color)', borderRadius: '12px', padding: '20px' }}>
                      <div className="flex justify-between items-start" style={{ marginBottom: '14px' }}>
                        <div>
                          <h4 className="text-xl" style={{ fontWeight: 800 }}>{emp.name}</h4>
                          <span style={{ fontSize: '0.82rem', color: '#009C48', fontWeight: 600 }}>Atención & Operaciones</span>
                        </div>

                        <span style={{ 
                          padding: '6px 14px', borderRadius: '20px', fontWeight: 800, fontSize: '0.9rem',
                          background: 'rgba(0, 156, 72, 0.12)', color: getScoreColor(empAvg), border: '1px solid rgba(0, 156, 72, 0.2)'
                        }}>
                          {empAvg > 0 ? `${empAvg.toFixed(1)}% Promed.` : 'Sin eval.'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3" style={{ background: 'var(--bg-color)', padding: '12px', borderRadius: '8px', fontSize: '0.85rem' }}>
                        <div>
                          <span className="text-muted">Auditorías Validadas:</span>
                          <p style={{ fontWeight: 700, fontSize: '1rem' }}>{empEvals.length}</p>
                        </div>
                        <div>
                          <span className="text-muted">Ajustes / Faltas:</span>
                          <p style={{ fontWeight: 700, fontSize: '1rem', color: totalPenaltyAmount > 0 ? 'var(--danger)' : '#009C48' }}>
                            ${totalPenaltyAmount.toFixed(2)} ({empPenalties.length})
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}

      {/* MODAL PARA REGISTRAR NUEVA FALTA */}
      {showPenaltyModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 className="text-xl mb-4" style={{ color: 'var(--danger)' }}>Registrar Falta a Personal de Isla</h2>
            <form onSubmit={handleSavePenalty} className="flex flex-col gap-4">
              
              <div className="form-group">
                <label>Empleado</label>
                <select 
                  className="form-control" 
                  required
                  value={penaltyForm.employee_id}
                  onChange={e => setPenaltyForm({...penaltyForm, employee_id: e.target.value})}
                >
                  <option value="">Seleccionar...</option>
                  {(selectedIslaStats?.islaEmployees || employees).map(e => (
                    <option key={e.id || e.name} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Nivel de Gravedad</label>
                <select 
                  className="form-control" 
                  value={penaltyForm.severity}
                  onChange={e => setPenaltyForm({...penaltyForm, severity: e.target.value, reason: '', amount: 0})}
                >
                  {Object.values(penaltyPolicies).map(p => (
                    <option key={p.name} value={p.name}>{p.name} ({p.impact})</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Falta Específica</label>
                <select 
                  className="form-control" 
                  required
                  value={penaltyForm.reason}
                  onChange={e => setPenaltyForm({...penaltyForm, reason: e.target.value})}
                >
                  <option value="">Seleccionar...</option>
                  {((penaltyPolicies as any)[penaltyForm.severity]?.options || []).map((opt: string) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Ajuste / Descuento ($)</label>
                <select 
                  className="form-control" 
                  required
                  value={penaltyForm.amount}
                  onChange={e => setPenaltyForm({...penaltyForm, amount: Number(e.target.value)})}
                >
                  <option value="" disabled>Seleccionar monto sugerido...</option>
                  {((penaltyPolicies as any)[penaltyForm.severity]?.amounts || []).map((amt: number) => (
                    <option key={amt} value={amt}>{amt === 0 ? 'Aviso ($0.00)' : `$${amt.toFixed(2)}`}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Observaciones</label>
                <textarea 
                  className="form-control"
                  rows={3}
                  value={penaltyForm.observation}
                  onChange={e => setPenaltyForm({...penaltyForm, observation: e.target.value})}
                  placeholder="Detalles adicionales sobre la falta..."
                ></textarea>
              </div>

              <div className="flex gap-4" style={{ marginTop: '16px' }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowPenaltyModal(false)} style={{ flex: 1 }}>Cancelar</button>
                <button type="submit" className="btn btn-danger" style={{ flex: 1 }}>Registrar Falta</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
