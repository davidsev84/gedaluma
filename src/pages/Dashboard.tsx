import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, BarChart3, TrendingUp, AlertTriangle, Users, Loader2, LayoutDashboard, UserCheck, ShieldAlert, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { mockIslas, mockEmployees, categories, ghostCategories, penaltyPolicies } from '../data/mock';

export function Dashboard() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'auditoria' | 'fantasma' | 'personal'>('auditoria');
  
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [responses, setResponses] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>(mockEmployees);
  const [penalties, setPenalties] = useState<any[]>([]);
  
  // Modal state
  const [showPenaltyModal, setShowPenaltyModal] = useState(false);
  const [penaltyForm, setPenaltyForm] = useState({
    employee_id: '',
    severity: 'Leve',
    reason: '',
    amount: 0,
    observation: ''
  });

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
      alert('Error guardando la falta. Asegurate de haber creado las tablas en Supabase.');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'var(--success)';
    if (score >= 75) return 'var(--primary)';
    if (score >= 60) return 'var(--warning)';
    if (score === 0) return 'var(--border-color)';
    return 'var(--danger)';
  };

  // --- DATOS AUDITORIA ---
  const audEvals = evaluations.filter(e => e.evaluator_role !== 'ghost');
  
  const audOverallAvg = audEvals.length > 0 
    ? audEvals.reduce((sum, e) => sum + Number(e.total_score || 0), 0) / audEvals.length 
    : 0;

  const audIslaScores = mockIslas.map(isla => {
    const islaEvals = audEvals.filter(e => e.isla_id === isla.id);
    const avg = islaEvals.length > 0 
      ? islaEvals.reduce((sum, e) => sum + Number(e.total_score || 0), 0) / islaEvals.length
      : 0;
    return { name: isla.name, score: avg, count: islaEvals.length };
  }).sort((a, b) => b.score - a.score);
  const bestAudIsla = audIslaScores.find(i => i.count > 0) || audIslaScores[0];

  const audEmpScores = employees.map(emp => {
    const empEvals = audEvals.filter(e => e.evaluated_employee === emp.name || e.evaluated_employee_id === emp.id);
    const avg = empEvals.length > 0
      ? empEvals.reduce((sum, e) => sum + Number(e.total_score || 0), 0) / empEvals.length
      : 0;
    return { name: emp.name, score: avg, count: empEvals.length };
  }).sort((a, b) => b.score - a.score);

  // Calcular categorias con respuestas reales
  const audCatScores = categories.map(cat => {
    const qIds = cat.questions.map(q => q.id);
    const validEvalIds = audEvals.map(e => e.id);
    const catResponses = responses.filter(r => qIds.includes(r.question_id) && validEvalIds.includes(r.evaluation_id));
    
    let totalScore = 0;
    let maxPossible = 0;
    catResponses.forEach(r => {
      totalScore += Number(r.value || 0);
      maxPossible += 5;
    });

    const scorePercent = maxPossible > 0 ? (totalScore / maxPossible) * 100 : 0;
    return { name: cat.name, score: scorePercent };
  }).sort((a, b) => b.score - a.score);
  const criticalCat = audCatScores[audCatScores.length - 1] || { name: 'N/A', score: 0 };

  // --- DATOS FANTASMA ---
  const ghostEvals = evaluations.filter(e => e.evaluator_role === 'ghost');
  
  const ghostIslaScores = mockIslas.map(isla => {
    const islaEvals = ghostEvals.filter(e => e.isla_id === isla.id);
    const avg = islaEvals.length > 0 
      ? islaEvals.reduce((sum, e) => sum + Number(e.total_score || 0), 0) / islaEvals.length
      : 0;
    return { name: isla.name, score: avg, count: islaEvals.length };
  }).sort((a, b) => b.score - a.score);
  const bestGhostIsla = ghostIslaScores.find(i => i.count > 0) || ghostIslaScores[0];

  const getGhostOptionPercent = (val: string) => {
    const v = val.toLowerCase();
    if (v.includes('sí, ofreció') || v.includes('muy bueno') || v === 'sí' || v === 'bueno') return 100;
    if (v.includes('más o menos') || v.includes('regular') || v.includes('poco') || v.includes('ofreció factura, pero')) return 50;
    return 0;
  };

  const ghostQuestions = ghostCategories[0].questions.filter(q => q.type !== 'text');
  const ghostQRanking = ghostQuestions.map(q => {
    const validEvalIds = ghostEvals.map(e => e.id);
    const qResponses = responses.filter(r => r.question_id === q.id && validEvalIds.includes(r.evaluation_id));
    let totalPoints = 0;
    qResponses.forEach(r => {
      totalPoints += getGhostOptionPercent(r.value || '');
    });
    const avg = qResponses.length > 0 ? totalPoints / qResponses.length : 0;
    return { text: q.text, score: avg };
  }).sort((a, b) => b.score - a.score);

  // --- DATOS PERSONAL ---
  const personalAjustes = employees.map(emp => {
    const empPenalties = penalties.filter(p => p.employee_id === emp.id);
    const totalDeduction = empPenalties.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const totalWarnings = empPenalties.filter(p => Number(p.amount || 0) === 0).length;
    return { ...emp, totalDeduction, totalWarnings, penaltyCount: empPenalties.length };
  }).sort((a, b) => b.totalDeduction - a.totalDeduction);


  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height: '100vh', flexDirection: 'column', gap: '16px' }}>
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-muted">Cargando panel de control...</p>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: '1200px' }}>
      <header className="flex justify-between items-center" style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <h1 className="text-2xl">Panel de Control General</h1>
          <p className="text-muted">Bienvenido, {user?.name}</p>
        </div>
        <div className="flex gap-4">
          <Link to="/history" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>Ver Historial</span>
          </Link>
          <button onClick={logout} className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LogOut size={20} />
            <span>Salir</span>
          </button>
        </div>
      </header>

      {/* TABS */}
      <div className="flex gap-4" style={{ marginBottom: '32px' }}>
        <button 
          onClick={() => setActiveTab('auditoria')}
          className={`btn ${activeTab === 'auditoria' ? 'btn-primary' : 'btn-outline'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'center' }}
        >
          <LayoutDashboard size={20} />
          Resultados Auditoría
        </button>
        <button 
          onClick={() => setActiveTab('fantasma')}
          className={`btn ${activeTab === 'fantasma' ? 'btn-primary' : 'btn-outline'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'center' }}
        >
          <UserCheck size={20} />
          Resultados Cliente Fantasma
        </button>
        <button 
          onClick={() => setActiveTab('personal')}
          className={`btn ${activeTab === 'personal' ? 'btn-primary' : 'btn-outline'}`}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, justifyContent: 'center' }}
        >
          <ShieldAlert size={20} />
          Responsabilidad y Resultados
        </button>
      </div>

      {activeTab === 'auditoria' && (
        <>
          <div className="grid grid-cols-4 gap-6" style={{ marginBottom: '32px' }}>
            <div className="card flex flex-col gap-2">
              <div className="flex items-center gap-2 text-primary">
                <BarChart3 size={24} />
                <h2 className="text-xl">Promedio Gral.</h2>
              </div>
              <p className="text-3xl">
                {audOverallAvg.toFixed(2)}
                <span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>/100</span>
              </p>
            </div>
            
            {audEvals.length > 0 ? (
              <div className="card flex flex-col gap-2" style={{ border: '1px solid var(--danger)' }}>
                <div className="flex items-center gap-2 text-danger">
                  <AlertTriangle size={24} />
                  <h2 className="text-xl">Alerta Categoría</h2>
                </div>
                <p className="text-xl" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={criticalCat.name}>{criticalCat.name}</p>
                <p className="text-muted" style={{ fontSize: '0.9rem' }}>Puntaje Crítico: {criticalCat.score.toFixed(2)}%</p>
              </div>
            ) : (
              <div className="card flex flex-col gap-2" style={{ border: '1px dashed var(--border-color)', opacity: 0.7 }}>
                <div className="flex items-center gap-2 text-muted">
                  <AlertTriangle size={24} />
                  <h2 className="text-xl">Sin Alertas</h2>
                </div>
                <p className="text-muted">Aún no hay datos</p>
              </div>
            )}

            <div className="card flex flex-col gap-2" style={{ border: '1px solid var(--success)' }}>
              <div className="flex items-center gap-2 text-success">
                <TrendingUp size={24} />
                <h2 className="text-xl">Isla Destacada</h2>
              </div>
              <p className="text-xl">{bestAudIsla?.name || 'N/A'}</p>
              <p className="text-muted" style={{ fontSize: '0.9rem' }}>Puntaje Máximo: {bestAudIsla?.score.toFixed(2)}%</p>
            </div>

            <div className="card flex flex-col gap-2">
              <div className="flex items-center gap-2" style={{ color: 'var(--primary)' }}>
                <Users size={24} />
                <h2 className="text-xl">Personal Eval.</h2>
              </div>
              <p className="text-3xl">{audEvals.length}</p>
              <p className="text-muted" style={{ fontSize: '0.9rem' }}>Auditorías totales validadas</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="card">
              <h2 className="text-xl" style={{ marginBottom: '16px' }}>Desempeño por Categoría</h2>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                      <th style={{ padding: '12px 8px' }}>Categoría</th>
                      <th style={{ padding: '12px 8px', textAlign: 'right' }}>Puntaje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {audCatScores.map(cat => (
                      <tr key={cat.name} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '12px 8px', color: (audEvals.length > 0 && cat.name === criticalCat.name) ? 'var(--danger)' : 'inherit', fontWeight: (audEvals.length > 0 && cat.name === criticalCat.name) ? 'bold' : 'normal' }}>
                          {cat.name}
                          {audEvals.length > 0 && cat.name === criticalCat.name && <AlertTriangle size={14} style={{ display: 'inline', marginLeft: '6px' }} />}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: getScoreColor(cat.score) }}>
                          {audEvals.length > 0 ? `${cat.score.toFixed(2)}%` : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl" style={{ marginBottom: '16px' }}>Ranking de Islas</h2>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                      <th style={{ padding: '12px 8px' }}>Isla</th>
                      <th style={{ padding: '12px 8px', textAlign: 'right' }}>Puntaje</th>
                    </tr>
                  </thead>
                  <tbody>
                    {audIslaScores.map(isla => (
                      <tr key={isla.name} style={{ borderBottom: '1px solid var(--border-color)', background: isla.name === bestAudIsla?.name && isla.count > 0 ? 'rgba(34, 197, 94, 0.1)' : 'transparent' }}>
                        <td style={{ padding: '12px 8px', fontWeight: isla.name === bestAudIsla?.name && isla.count > 0 ? 'bold' : 'normal', color: isla.name === bestAudIsla?.name && isla.count > 0 ? 'var(--success)' : 'inherit' }}>
                          {isla.name}
                          {isla.name === bestAudIsla?.name && isla.count > 0 && <TrendingUp size={14} style={{ display: 'inline', marginLeft: '6px' }} />}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: getScoreColor(isla.score) }}>
                          {isla.count > 0 ? `${isla.score.toFixed(2)}%` : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card">
              <h2 className="text-xl" style={{ marginBottom: '16px' }}>Ranking de Empleados</h2>
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                      <th style={{ padding: '12px 8px' }}>Empleado</th>
                      <th style={{ padding: '12px 8px', textAlign: 'right' }}>Promedio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {audEmpScores.map((emp, i) => (
                      <tr key={emp.name} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '12px 8px' }}>
                          <span style={{ color: 'var(--text-secondary)', marginRight: '8px' }}>#{i+1}</span>
                          {emp.name}
                        </td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: getScoreColor(emp.score) }}>
                          {emp.count > 0 ? `${emp.score.toFixed(2)}%` : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'fantasma' && (
        <div className="grid grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-xl flex items-center gap-2 text-primary" style={{ marginBottom: '16px' }}>
              <TrendingUp size={24} />
              Ranking de Islas (Cliente Fantasma)
            </h2>
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 8px' }}>Posición</th>
                    <th style={{ padding: '12px 8px' }}>Isla</th>
                    <th style={{ padding: '12px 8px', textAlign: 'right' }}>Puntaje Fantasma</th>
                  </tr>
                </thead>
                <tbody>
                  {ghostIslaScores.map((isla, i) => (
                    <tr key={isla.name} style={{ 
                      borderBottom: '1px solid var(--border-color)',
                      background: isla.name === bestGhostIsla?.name && isla.count > 0 ? 'rgba(34, 197, 94, 0.1)' : 'transparent' 
                    }}>
                      <td style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>#{i+1}</td>
                      <td style={{ padding: '12px 8px', fontWeight: isla.name === bestGhostIsla?.name && isla.count > 0 ? 'bold' : 'normal', color: isla.name === bestGhostIsla?.name && isla.count > 0 ? 'var(--success)' : 'inherit' }}>
                        {isla.name}
                      </td>
                      <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: getScoreColor(isla.score) }}>
                        {isla.count > 0 ? `${isla.score.toFixed(2)}%` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl flex items-center gap-2 text-primary" style={{ marginBottom: '16px' }}>
              <BarChart3 size={24} />
              Éxito por Pregunta (Cliente Fantasma)
            </h2>
            <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
              {ghostEvals.length > 0 ? (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                      <th style={{ padding: '12px 8px' }}>Pregunta Evaluada</th>
                      <th style={{ padding: '12px 8px', textAlign: 'right', width: '100px' }}>% Éxito</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ghostQRanking.map((q, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                        <td style={{ padding: '12px 8px', lineHeight: 1.4 }}>{q.text}</td>
                        <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: getScoreColor(q.score) }}>
                          {q.score.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  Aún no hay evaluaciones de Cliente Fantasma.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'personal' && (
        <div className="grid grid-cols-1 gap-6">
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl flex items-center gap-2 text-primary">
                <ShieldAlert size={24} />
                Gestión de Faltas y Ajustes
              </h2>
              <button onClick={() => setShowPenaltyModal(true)} className="btn btn-danger" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={20} />
                Registrar Nueva Falta
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Resumen de Ajustes por Empleado */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px' }}>
                <h3 className="text-lg mb-4">Resumen de Empleados</h3>
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                        <th style={{ padding: '8px' }}>Empleado</th>
                        <th style={{ padding: '8px', textAlign: 'center' }}>Avisos</th>
                        <th style={{ padding: '8px', textAlign: 'right' }}>Ajuste Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {personalAjustes.filter(e => e.penaltyCount > 0).map(emp => (
                        <tr key={emp.name} style={{ borderBottom: '1px solid var(--border-color)' }}>
                          <td style={{ padding: '12px 8px', fontWeight: 'bold' }}>{emp.name}</td>
                          <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                            <span style={{ background: 'var(--warning)', color: '#000', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>
                              {emp.totalWarnings} avisos
                            </span>
                          </td>
                          <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 'bold', color: emp.totalDeduction > 0 ? 'var(--danger)' : 'inherit' }}>
                            ${emp.totalDeduction.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      {personalAjustes.filter(e => e.penaltyCount > 0).length === 0 && (
                        <tr><td colSpan={3} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>No hay faltas registradas.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Historial Detallado */}
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px' }}>
                <h3 className="text-lg mb-4">Historial Reciente</h3>
                <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {penalties.map(p => (
                    <div key={p.id} style={{ padding: '12px', border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--surface-color)', position: 'relative' }}>
                      <div className="flex justify-between">
                        <span style={{ fontWeight: 'bold' }}>{p.employees?.name || 'Desconocido'}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {new Date(p.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.9rem', margin: '4px 0' }}>
                        <span style={{ 
                          padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', marginRight: '8px',
                          background: p.severity === 'Crítica' ? 'var(--danger)' : p.severity === 'Grave' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                          color: p.severity === 'Crítica' ? '#fff' : 'inherit'
                        }}>
                          {p.severity}
                        </span>
                        {p.reason}
                      </div>
                      {p.observation && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>"{p.observation}"</p>}
                      <div className="flex justify-between items-center" style={{ marginTop: '8px', borderTop: '1px dashed var(--border-color)', paddingTop: '8px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Por: {p.reported_by}</span>
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
                  {penalties.length === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>No hay faltas registradas.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL NUEVA FALTA */}
      {showPenaltyModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 className="text-xl mb-4" style={{ color: 'var(--danger)' }}>Registrar Falta a Personal</h2>
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
                  {employees.map(e => (
                    <option key={e.id || e.name} value={e.id}>{e.name}</option>
                  ))}
                </select>
                {employees === mockEmployees && <p style={{fontSize: '0.8rem', color: 'var(--warning)', marginTop: '4px'}}>* Usando lista estática, crea la tabla employees.</p>}
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
