import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, BarChart3, TrendingUp, AlertTriangle, Users, Loader2, LayoutDashboard, UserCheck } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { mockIslas, mockEmployees, categories, ghostCategories } from '../data/mock';

export function Dashboard() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'auditoria' | 'fantasma'>('auditoria');
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [responses, setResponses] = useState<any[]>([]);

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
    } catch (err) {
      console.error('Error cargando datos:', err);
    } finally {
      setLoading(false);
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

  const audEmpScores = mockEmployees.map(emp => {
    const empEvals = audEvals.filter(e => e.evaluated_employee === emp.name);
    const avg = empEvals.length > 0
      ? empEvals.reduce((sum, e) => sum + Number(e.total_score || 0), 0) / empEvals.length
      : 0;
    return { name: emp.name, score: avg, count: empEvals.length };
  }).sort((a, b) => b.score - a.score);

  // Calcular categorias con respuestas reales
  const audCatScores = categories.map(cat => {
    // Buscar todas las respuestas para las preguntas de esta categoria en las evaluaciones de auditoria
    const qIds = cat.questions.map(q => q.id);
    const validEvalIds = audEvals.map(e => e.id);
    
    const catResponses = responses.filter(r => qIds.includes(r.question_id) && validEvalIds.includes(r.evaluation_id));
    
    let totalScore = 0;
    let maxPossible = 0;
    
    catResponses.forEach(r => {
      totalScore += Number(r.value || 0);
      maxPossible += 5; // En auditoria las preguntas valen 5
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

  // Ranking por pregunta fantasma
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
    </div>
  );
}
