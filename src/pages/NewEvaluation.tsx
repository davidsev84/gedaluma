import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { mockIslas, mockEmployees, categories, ghostCategories, calculateGhostKPI } from '../data/mock';
import { LogOut, ChevronRight, Check, Loader2, Award } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { supabase } from '../lib/supabase';
import { generatePDF } from '../lib/pdfGenerator';

export function NewEvaluation() {
  const { user, logout } = useAuth();
  
  // Header variables
  const [selectedIsla, setSelectedIsla] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [customEmployeeName, setCustomEmployeeName] = useState('');
  const [auditorType, setAuditorType] = useState('');
  const [customAuditorName, setCustomAuditorName] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState('Mañana (10am - 12h30)');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  
  const [step, setStep] = useState(0); 
  const [responses, setResponses] = useState<Record<string, { 
    value?: string | number; 
    score?: number; 
    photo?: string;
    photoData?: string;
    observation?: string;
  }>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [employees, setEmployees] = useState<any[]>(mockEmployees);
  
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const { data, error } = await supabase.from('employees').select('*');
        if (!error && data && data.length > 0) {
          setEmployees(data);
        }
      } catch (err) {
        console.warn('V3 tables might not exist yet', err);
      }
    };
    fetchEmployees();
  }, []);
  
  const evalSigRef = useRef<SignatureCanvas>(null);

  const isGhost = user?.role === 'ghost';
  const activeCategories = isGhost ? ghostCategories : categories;

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIsla) {
      alert('Por favor selecciona la isla evaluada.');
      return;
    }
    if (!isGhost && (!selectedEmployee || !auditorType)) {
      alert('Por favor completa todos los datos de cabecera de auditoría.');
      return;
    }

    // Automatically record start time from system
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setStartTime(nowTime);

    setStep(1);
  };

  const handleAnswer = (qId: string, value: string | number) => {
    setResponses(prev => ({
      ...prev,
      [qId]: { ...prev[qId], value, score: typeof value === 'number' ? value : undefined }
    }));
  };

  // KPI Calculation for Ghost Client
  const ghostKPI = isGhost ? calculateGhostKPI(responses) : null;

  const calculateScore = () => {
    if (isGhost) {
      return ghostKPI ? ghostKPI.percentage : 0;
    }
    
    let totalScore = 0;
    activeCategories.forEach(cat => {
      let catScore = 0;
      let maxCatScore = cat.questions.length * 5;
      cat.questions.forEach(q => {
        catScore += (typeof responses[q.id]?.value === 'number') ? (responses[q.id].value as number) : 0;
      });
      if (maxCatScore > 0) {
        let percentage = (catScore / maxCatScore) * 100;
        totalScore += (percentage * (cat.weight / 100));
      }
    });
    return Number(totalScore.toFixed(2));
  };

  const getInterpretation = (score: number) => {
    if (isGhost && ghostKPI) {
      return { 
        text: `${ghostKPI.rango} | ${ghostKPI.bono}`, 
        color: ghostKPI.color,
        action: ghostKPI.accion
      };
    }
    if (score >= 90) return { text: 'Isla Excelente', color: '#009C48', action: 'Mantener estándar' };
    if (score >= 80) return { text: 'Isla Buena', color: '#0284c7', action: 'Supervisión regular' };
    if (score >= 70) return { text: 'Isla en mejora', color: '#f7b500', action: 'Plan de acción' };
    return { text: 'Isla crítica', color: 'var(--danger)', action: 'Auditoría urgente' };
  };

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      const autoEndTime = endTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const finalScore = calculateScore();
      const interpretation = getInterpretation(finalScore);
      const isla = mockIslas.find(i => i.id === selectedIsla);
      
      const employeeObj = employees.find(e => e.id === selectedEmployee || e.name === selectedEmployee);
      const evaluatedName = selectedEmployee || customEmployeeName.trim() || employeeObj?.name || 'No especificada';

      const auditorName = isGhost ? (user?.name || 'Cliente Fantasma') : 
                          (auditorType === 'supervisor' ? 'Supervisor Richard' : 
                          auditorType === 'fernando' ? 'Fernando Brito' : 
                          customAuditorName);
                          
      // 1. Guardar en Supabase
      const { data: evalData, error: evalError } = await supabase
        .from('evaluations')
        .insert({
          isla_id: selectedIsla,
          isla_name: isla?.name || 'Desconocida',
          evaluator_name: auditorName,
          evaluator_role: user?.role,
          evaluated_employee: evaluatedName,
          auditor_type: auditorType,
          time_slot: timeSlot,
          start_time: startTime,
          end_time: autoEndTime,
          date: visitDate,
          total_score: finalScore,
          status: interpretation.text
        })
        .select()
        .single();

      if (evalError) throw evalError;

      // 2. Guardar respuestas
      const responsesToInsert = activeCategories.flatMap(cat => {
        const qResponses = cat.questions.map(q => ({
          evaluation_id: evalData.id,
          question_id: q.id,
          question_text: q.text,
          value: String(responses[q.id]?.value || ''),
          observation: responses[q.id]?.observation || null,
          photo_data: responses[q.id]?.photoData || null
        }));
        
        return qResponses;
      });

      const { error: respError } = await supabase
        .from('responses')
        .insert(responsesToInsert);

      if (respError) throw respError;

      alert('Evaluación guardada en la base de datos exitosamente.');

      const wantsPDF = window.confirm('¿Desea generar y descargar el documento PDF en este momento?');
      
      if (wantsPDF) {
        let evalDataSig = undefined;
        if (evalSigRef.current && !evalSigRef.current.isEmpty()) {
          evalDataSig = evalSigRef.current.getCanvas().toDataURL('image/png');
        }
        
        const formResponsesArr = activeCategories.flatMap(cat => {
          return cat.questions.map(q => ({
            question_id: q.id,
            question_text: q.text,
            value: String(responses[q.id]?.value || ''),
            observation: responses[q.id]?.observation || null
          }));
        });

        generatePDF(evalData, formResponsesArr, evalDataSig);
      }
      
      window.location.href = '/dashboard';
    } catch (error) {
      console.error("Error guardando la evaluación:", error);
      alert('Ocurrió un error al guardar o generar el PDF. Revisa la consola.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleNextStep = () => {
    for (const cat of activeCategories) {
      for (const q of cat.questions) {
        const resp = responses[q.id];
        if (!resp || resp.value === undefined || resp.value === '') {
          alert(`Falta responder la pregunta: "${q.text}".`);
          return;
        }
      }
    }
    // Automatically record end time from system
    const autoEndTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setEndTime(autoEndTime);

    setStep(2);
  };

  return (
    <div className="container" style={{ maxWidth: '900px', paddingBottom: '60px' }}>
      <header className="flex justify-between items-center" style={{ marginBottom: '32px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <h1 className="text-2xl">{isGhost ? 'Módulo Cliente Fantasma GEDALUMA' : 'Nueva Evaluación de Auditoría'}</h1>
          <p className="text-muted">Evaluador: {user?.name}</p>
        </div>
        <button onClick={logout} className="btn btn-ghost">
          <LogOut size={20} />
          <span>Salir</span>
        </button>
      </header>

      {/* STEP 0: CHECKLIST MAESTRO / CABECERA */}
      {step === 0 && (
        <div className="card" style={{ maxWidth: '650px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Award size={24} style={{ color: '#009C48' }} />
            <h2 className="text-xl">Variables de Cabecera (Checklist Maestro)</h2>
          </div>

          <form onSubmit={handleStart} className="flex flex-col gap-4">
            <div className="form-group">
              <label className="form-label">Isla evaluada *</label>
              <select 
                className="form-control"
                value={selectedIsla}
                onChange={(e) => setSelectedIsla(e.target.value)}
                required
              >
                <option value="" disabled>Seleccione una isla...</option>
                {mockIslas.map(isla => (
                  <option key={isla.id} value={isla.id}>ISLA {isla.name} - {isla.location}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Fecha de la visita *</label>
              <input 
                type="date" 
                className="form-control" 
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
                required
              />
            </div>

            {/* SECCIÓN HORARIO DE VISITA (CLIENTE FANTASMA) */}
            {isGhost && (
              <div className="form-group">
                <label className="form-label">Horario de Visita *</label>
                <select 
                  className="form-control"
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  required
                >
                  <option value="Mañana (10am - 12h30)">Mañana (10am - 12h30)</option>
                  <option value="Mediodía (12h30-14h00)">Mediodía (12h30-14h00)</option>
                  <option value="Tarde (14h00-17h30)">Tarde (14h00-17h30)</option>
                </select>
              </div>
            )}

            {/* AVISO HORA AUTOMÁTICA DE SISTEMA */}
            {isGhost && (
              <div className="form-group" style={{ background: 'rgba(0, 156, 72, 0.08)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(0, 156, 72, 0.2)' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#009C48', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  ⏱️ Registro de Hora Automático por el Sistema
                </span>
                <p className="text-muted" style={{ fontSize: '0.82rem', marginTop: '4px' }}>
                  La hora exacta de inicio y finalización será capturada automáticamente por la plataforma al avanzar y guardar la evaluación.
                </p>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Nombre del Evaluador *</label>
              <input 
                type="text" 
                className="form-control" 
                value={user?.role === 'ghost' ? (customAuditorName || user?.name) : (auditorType === 'otro' ? customAuditorName : (auditorType === 'supervisor' ? 'Supervisor Richard' : 'Fernando Brito'))}
                onChange={(e) => setCustomAuditorName(e.target.value)}
                placeholder="Nombre completo del evaluador"
                required
              />
            </div>

            {!isGhost && (
              <div className="form-group">
                <label className="form-label">¿Tipo de Evaluador?</label>
                <select 
                  className="form-control"
                  value={auditorType}
                  onChange={(e) => setAuditorType(e.target.value)}
                  required
                >
                  <option value="" disabled>Seleccione el auditor...</option>
                  <option value="supervisor">Supervisor (Richard)</option>
                  <option value="fernando">Fernando Brito</option>
                  <option value="otro">Otra persona</option>
                </select>
              </div>
            )}

            {/* DESPLEGABLE DE EMPLEADOS (OPCIONAL PARA CLIENTE FANTASMA) */}
            <div className="form-group">
              <label className="form-label">
                Empleado / Vendedora a Evaluar {isGhost ? '(Opcional)' : '*'}
              </label>
              <select 
                className="form-control"
                value={selectedEmployee}
                onChange={(e) => {
                  setSelectedEmployee(e.target.value);
                  setCustomEmployeeName(e.target.value);
                }}
                required={!isGhost}
              >
                <option value="">
                  {isGhost ? '-- No identificada / No especificada (Opcional) --' : 'Seleccione la empleada...'}
                </option>
                {employees.map(emp => (
                  <option key={emp.id || emp.name} value={emp.name}>{emp.name}</option>
                ))}
              </select>
            </div>

            {isGhost && (
              <div className="form-group">
                <label className="form-label">O escribir nombre manual (Opcional si no está en la lista)</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={customEmployeeName}
                  onChange={(e) => setCustomEmployeeName(e.target.value)}
                  placeholder="Ej. Shirley Reyes (Dejar en blanco si no se conoce el nombre)"
                />
              </div>
            )}

            <button type="submit" className="btn btn-primary hover-lift" style={{ marginTop: '16px', background: '#009C48', borderColor: '#009C48', justifyContent: 'center' }}>
              Iniciar Cuestionario <ChevronRight size={20} />
            </button>
          </form>
        </div>
      )}

      {/* STEP 1: CUESTIONARIO DE EVALUACIÓN */}
      {step === 1 && (
        <div className="card">
          <div className="flex justify-between items-center mb-6" style={{ paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
            <div>
              <h2 className="text-xl font-bold">{isGhost ? 'Protocolo Cliente Fantasma GEDALUMA' : 'Cuestionario de Auditoría'}</h2>
              <p className="text-muted" style={{ fontSize: '0.88rem' }}>
                Responda objetivamente cada ítem. Los marcados como NE o N/A no se cuentan en el denominador.
              </p>
            </div>
            
            <span className="text-muted" style={{ fontSize: '0.9rem' }}>
              Progreso: {Object.keys(responses).length} / {activeCategories.reduce((acc, cat) => acc + cat.questions.length, 0)}
            </span>
          </div>

          {/* Tarjeta flotante de resumen en tiempo real para Cliente Fantasma */}
          {isGhost && ghostKPI && (
            <div className="glass-panel" style={{ 
              marginBottom: '24px', 
              padding: '16px 20px', 
              background: 'linear-gradient(135deg, rgba(0, 156, 72, 0.08) 0%, rgba(247, 181, 0, 0.08) 100%)',
              border: `1px solid ${ghostKPI.color}`,
              borderRadius: '12px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-secondary)' }}>
                  KPI Cliente Fantasma en Tiempo Real (Hora inicio: {startTime})
                </span>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: ghostKPI.color }}>
                  {ghostKPI.percentage}% <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>({ghostKPI.puntosObtenidos} / {ghostKPI.puntosMaximos} pts evaluables)</span>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <span style={{ 
                  display: 'inline-block', padding: '4px 10px', borderRadius: '12px', 
                  fontSize: '0.8rem', fontWeight: 700, background: ghostKPI.color, color: '#fff' 
                }}>
                  {ghostKPI.bono}
                </span>
                <p style={{ fontSize: '0.82rem', marginTop: '4px', color: 'var(--text-secondary)' }}>
                  Acción: {ghostKPI.accion}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-6">
            {activeCategories.map((cat) => (
              <div key={cat.id} className="flex flex-col gap-6">
                {cat.questions.map((q: any) => (
                  <div key={q.id} style={{ padding: '20px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--surface-color)' }}>
                    <p style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '14px', lineHeight: 1.4 }}>
                      {q.text}
                    </p>

                    {/* RATING 1-5 PARA AUDITORÍA NORMAL */}
                    {(!q.type || q.type === 'rating') && (
                      <div className="flex gap-2 flex-wrap">
                        {[1, 2, 3, 4, 5].map(score => (
                          <button 
                            key={score} 
                            type="button" 
                            onClick={() => handleAnswer(q.id, score)}
                            className={`btn ${responses[q.id]?.value === score ? 'btn-primary' : 'btn-ghost'}`} 
                            style={{ padding: '10px 16px', flex: 1, minWidth: '40px' }}
                          >
                            {score}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* OPCIONES DE CLIENTE FANTASMA P1 a P11 */}
                    {q.type === 'ghost_choice' && q.ghostOptions && (
                      <div className="grid grid-cols-2 gap-3">
                        {q.ghostOptions.map((opt: any) => {
                          const isSelected = responses[q.id]?.value === opt.label;
                          const isExcluded = opt.points === null;
                          return (
                            <button
                              key={opt.label}
                              type="button"
                              onClick={() => handleAnswer(q.id, opt.label)}
                              className={`btn ${isSelected ? 'btn-primary' : 'btn-ghost'}`}
                              style={{ 
                                textAlign: 'left', 
                                padding: '12px 14px', 
                                justifyContent: 'space-between',
                                background: isSelected ? '#009C48' : 'var(--bg-color)',
                                borderColor: isSelected ? '#009C48' : 'var(--border-color)',
                                color: isSelected ? '#fff' : 'inherit'
                              }}
                            >
                              <span>{opt.label}</span>
                              <span style={{ 
                                fontSize: '0.75rem', 
                                padding: '2px 6px', 
                                borderRadius: '4px', 
                                background: isSelected ? 'rgba(255,255,255,0.2)' : 'var(--border-color)',
                                color: isSelected ? '#fff' : 'var(--text-secondary)',
                                fontWeight: 700
                              }}>
                                {isExcluded ? 'Excluido' : `${opt.points} pts`}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* P12: OBSERVACIONES TEXTO ABIERTO */}
                    {q.type === 'text' && (
                      <textarea
                        className="form-control"
                        rows={4}
                        placeholder="Describe una conducta concreta que podría mejorar: qué hizo o dejó de hacer y qué habría sido preferible..."
                        value={(responses[q.id]?.value as string) || ''}
                        onChange={(e) => handleAnswer(q.id, e.target.value)}
                        style={{ width: '100%' }}
                      />
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center mt-8" style={{ paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
            <div>
              <p className="text-xl" style={{ fontWeight: 800 }}>
                Calificación Calculada: <span style={{ color: isGhost && ghostKPI ? ghostKPI.color : 'var(--primary)' }}>{calculateScore()}%</span>
              </p>
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                {isGhost ? 'Los ítems marcados NE o N/A han sido excluidos del denominador.' : 'Promedio ponderado.'}
              </p>
            </div>

            <button onClick={handleNextStep} className="btn btn-primary hover-lift" style={{ background: '#009C48', borderColor: '#009C48' }}>
              Siguiente: Finalizar y Firmas <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: FIRMAS Y FINALIZACIÓN */}
      {step === 2 && (
        <div className="card" style={{ maxWidth: '650px', margin: '0 auto' }}>
          <h2 className="text-xl mb-4" style={{ fontWeight: 800 }}>Resumen y Firma de Evaluación</h2>
          
          <div style={{ marginBottom: '24px', padding: '20px', background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <p className="text-2xl font-bold" style={{ color: getInterpretation(calculateScore()).color, marginBottom: '8px' }}>
              Puntaje Obtenido: {calculateScore()}%
            </p>

            <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Dictamen: {getInterpretation(calculateScore()).text}
            </p>

            {isGhost && (
              <div style={{ marginTop: '10px', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                <span>⏱️ Duración de Visita (Automática): {startTime} a {endTime}</span><br />
                <span>📅 Horario Seleccionado: {timeSlot}</span>
              </div>
            )}
            
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
              Acción Operativa: {getInterpretation(calculateScore()).action}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="form-group">
              <label className="form-label">Firma del Evaluador</label>
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', background: '#fff' }}>
                <SignatureCanvas ref={evalSigRef} penColor="black" canvasProps={{ width: 500, height: 140, className: 'sigCanvas' }} />
              </div>
              <button type="button" onClick={() => evalSigRef.current?.clear()} className="btn btn-ghost" style={{ alignSelf: 'flex-start', marginTop: '6px', fontSize: '0.8rem' }}>
                Limpiar Firma
              </button>
            </div>

            <div className="flex gap-4" style={{ marginTop: '16px' }}>
              <button onClick={() => setStep(1)} className="btn btn-ghost" style={{ flex: 1 }}>
                Volver al Cuestionario
              </button>
              <button className="btn btn-success" style={{ flex: 2, background: '#009C48', borderColor: '#009C48', justifyContent: 'center' }} onClick={handleFinish} disabled={isSaving}>
                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                {isSaving ? 'Guardando...' : 'Finalizar y Guardar Evaluación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
