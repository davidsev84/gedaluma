import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Eye, AlertCircle, CheckCircle, X, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { generatePDF } from '../lib/pdfGenerator';

export function History() {
  const [evaluations, setEvaluations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEval, setSelectedEval] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchEvaluations();
  }, []);

  const fetchEvaluations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('evaluations')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setEvaluations(data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleValidation = async (id: string, currentStatus: boolean) => {
    // Optimistic UI update for better UX
    setEvaluations(prev => prev.map(e => 
      e.id === id ? { ...e, is_valid: !currentStatus } : e
    ));

    try {
      const { data, error } = await supabase
        .from('evaluations')
        .update({ is_valid: !currentStatus })
        .eq('id', id)
        .select();
        
      if (error) {
        throw error;
      }
      if (!data || data.length === 0) {
        throw new Error("Supabase bloqueó la actualización (Permisos RLS).");
      }
    } catch (err: any) {
      console.error('Error al actualizar estado:', err);
      alert(err.message === "Supabase bloqueó la actualización (Permisos RLS)." 
        ? "¡Aviso Crítico! Supabase no guardó tu cambio por falta de permisos. Por favor, asegúrate de haber ejecutado el script 'schema_rls_fix.sql' en Supabase para habilitar las actualizaciones."
        : 'Hubo un problema de conexión al cambiar el estado. Intentando recargar...');
      // Revert on error by refetching
      fetchEvaluations();
    }
  };

  const viewDetails = async (evaluation: any) => {
    setSelectedEval(evaluation);
    setLoadingDetails(true);
    try {
      const { data, error } = await supabase
        .from('responses')
        .select('*')
        .eq('evaluation_id', evaluation.id);
      if (error) throw error;
      setResponses(data || []);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '1200px' }}>
      <header className="flex justify-between items-center" style={{ marginBottom: '32px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <h1 className="text-2xl">Historial de Evaluaciones</h1>
          <p className="text-muted">Revisión y auditoría de registros</p>
        </div>
        <Link to="/dashboard" className="btn btn-outline">
          Volver al Panel
        </Link>
      </header>

      <div className="card">
        {loading ? (
          <p>Cargando datos...</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '12px' }}>Fecha</th>
                  <th style={{ padding: '12px' }}>Isla</th>
                  <th style={{ padding: '12px' }}>Evaluador</th>
                  <th style={{ padding: '12px' }}>Rol</th>
                  <th style={{ padding: '12px' }}>Puntaje</th>
                  <th style={{ padding: '12px' }}>Estado Ránking</th>
                  <th style={{ padding: '12px' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {evaluations.map(e => {
                  const date = new Date(e.created_at).toLocaleString();
                  const isValid = e.is_valid !== false;
                  
                  return (
                    <tr key={e.id} style={{ borderBottom: '1px solid var(--border-color)', opacity: isValid ? 1 : 0.5 }}>
                      <td style={{ padding: '12px' }}>{date}</td>
                      <td style={{ padding: '12px' }}>{e.isla_name}</td>
                      <td style={{ padding: '12px' }}>{e.evaluator_name}</td>
                      <td style={{ padding: '12px' }}>{e.evaluator_role === 'ghost' ? 'Fantasma' : 'Auditor'}</td>
                      <td style={{ padding: '12px', fontWeight: 'bold' }}>{e.total_score ? Number(e.total_score).toFixed(2) : '0.00'}%</td>
                      <td style={{ padding: '12px' }}>
                        {isValid ? (
                          <span className="text-success flex items-center gap-1"><CheckCircle size={16}/> Válido</span>
                        ) : (
                          <span className="text-danger flex items-center gap-1"><AlertCircle size={16}/> Anulado</span>
                        )}
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div className="flex gap-2">
                          <button onClick={() => viewDetails(e)} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                            <Eye size={16} /> Ver
                          </button>
                          <button 
                            onClick={() => toggleValidation(e.id, isValid)} 
                            className={`btn ${isValid ? 'btn-outline' : 'btn-ghost'}`}
                            style={{ padding: '6px 12px', fontSize: '0.85rem', color: isValid ? 'var(--danger)' : 'var(--success)', borderColor: isValid ? 'var(--danger)' : 'transparent' }}
                          >
                            {isValid ? 'Anular' : 'Activar'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {evaluations.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: '24px', textAlign: 'center' }}>No hay evaluaciones registradas.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Detalles */}
      {selectedEval && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          padding: '20px'
        }}>
          <div className="card" style={{ 
            width: '100%', maxWidth: '800px', maxHeight: '90vh', 
            overflowY: 'auto', position: 'relative' 
          }}>
            <button 
              onClick={() => setSelectedEval(null)}
              style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              <X size={24} />
            </button>
            
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl">Detalle de Evaluación</h2>
              {!loadingDetails && (
                <button 
                  onClick={() => generatePDF(selectedEval, responses)}
                  className="btn btn-outline"
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '40px' }}
                >
                  <Download size={18} />
                  <span>Descargar PDF</span>
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4" style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
              <div><strong>Isla:</strong> {selectedEval.isla_name}</div>
              <div><strong>Evaluador:</strong> {selectedEval.evaluator_name}</div>
              <div><strong>Fecha:</strong> {new Date(selectedEval.created_at).toLocaleString()}</div>
              <div><strong>Puntaje:</strong> {Number(selectedEval.total_score || 0).toFixed(2)}%</div>
            </div>

            <h3 className="text-xl mb-4">Respuestas y Evidencias</h3>
            {loadingDetails ? (
              <p>Cargando respuestas...</p>
            ) : (
              <div className="flex flex-col gap-6">
                {responses.map((resp, i) => (
                  <div key={resp.id} style={{ padding: '16px', background: 'var(--surface-color)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                    <p style={{ fontWeight: 500, marginBottom: '8px' }}>{i + 1}. {resp.question_text}</p>
                    <p className="text-primary" style={{ fontWeight: 'bold', marginBottom: '8px' }}>R: {resp.value}</p>
                    
                    {resp.observation && (
                      <p className="text-muted" style={{ fontStyle: 'italic', marginBottom: '8px' }}>
                        Comentario: {resp.observation}
                      </p>
                    )}
                    
                    {resp.photo_data && (
                      <div style={{ marginTop: '12px' }}>
                        <p style={{ fontSize: '0.85rem', marginBottom: '4px' }}>Evidencia Fotográfica:</p>
                        <img 
                          src={resp.photo_data} 
                          alt="Evidencia" 
                          style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
