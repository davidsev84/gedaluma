import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { mockIslas, mockEmployees, categories, ghostCategories } from '../data/mock';
import { LogOut, Camera, ChevronRight, Check, Loader2 } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { supabase } from '../lib/supabase';
import { generatePDF } from '../lib/pdfGenerator';

export function NewEvaluation() {
  const { user, logout } = useAuth();
  const [selectedIsla, setSelectedIsla] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [auditorType, setAuditorType] = useState('');
  const [customAuditorName, setCustomAuditorName] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [step, setStep] = useState(0); 
  const [responses, setResponses] = useState<Record<string, { 
    value?: string | number; 
    score?: number; 
    photo?: string;
    photoData?: string;
    observation?: string;
  }>>({});
  const [isSaving, setIsSaving] = useState(false);
  
  const evalSigRef = useRef<SignatureCanvas>(null);

  const activeCategories = user?.role === 'ghost' ? ghostCategories : categories;

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    const isGhost = user?.role === 'ghost';
    const hasEmployee = isGhost || selectedEmployee !== '';
    const hasAuditor = isGhost || (auditorType !== '' && (auditorType !== 'otro' || customAuditorName.trim() !== ''));
    const hasTimeSlot = !isGhost || timeSlot !== '';

    if (selectedIsla && hasEmployee && hasAuditor && hasTimeSlot) {
      setStep(1);
    }
  };

  const handleAnswer = (qId: string, value: string | number) => {
    setResponses(prev => ({
      ...prev,
      [qId]: { ...prev[qId], value, score: typeof value === 'number' ? value : undefined }
    }));
  };

  const handleObservation = (qId: string, observation: string) => {
    setResponses(prev => ({
      ...prev,
      [qId]: { ...prev[qId], observation }
    }));
  };

  const handlePhoto = (qId: string, file: File) => {
    const url = URL.createObjectURL(file);
    
    // Compress and convert to base64 for DB
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        let scaleSize = 1;
        if (img.width > MAX_WIDTH) {
          scaleSize = MAX_WIDTH / img.width;
        }
        canvas.width = img.width * scaleSize;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        const base64 = canvas.toDataURL('image/jpeg', 0.6);
        
        setResponses(prev => ({
          ...prev,
          [qId]: { ...prev[qId], photo: url, photoData: base64 }
        }));
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const calculateScore = () => {
    if (user?.role === 'ghost') {
      let ghostScore = 0;
      const scoredQuestionsCount = 11; // 11 choice questions
      activeCategories.forEach(cat => {
        cat.questions.forEach(q => {
          if (q.type === 'choice') {
            const val = responses[q.id]?.value as string;
            if (['Sí', 'Bueno', 'Muy Bueno', 'Sí, ofreció factura y pidió los datos'].includes(val)) {
              ghostScore += 1;
            } else if (['Más o menos', 'Regular', 'Poco', 'Ofreció factura, pero no pidió los datos'].includes(val)) {
              ghostScore += 0.5;
            }
          }
        });
      });
      return Number(((ghostScore / scoredQuestionsCount) * 100).toFixed(2));
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
    if (score >= 90) return { text: 'Isla Excelente', color: 'var(--success)' };
    if (score >= 80) return { text: 'Isla Buena', color: 'var(--primary)' };
    if (score >= 70) return { text: 'Isla en mejora', color: 'var(--warning)' };
    return { text: 'Isla crítica', color: 'var(--danger)' };
  };

  const handleFinish = async () => {
    setIsSaving(true);
    try {
      const finalScore = calculateScore();
      const interpretation = getInterpretation(finalScore);
      const isla = mockIslas.find(i => i.id === selectedIsla);
      const employee = mockEmployees.find(e => e.id === selectedEmployee);

      const auditorName = auditorType === 'supervisor' ? 'Supervisor Richard' : 
                          auditorType === 'fernando' ? 'Fernando Brito' : 
                          customAuditorName;
                          
      // 1. Guardar en Supabase
      const { data: evalData, error: evalError } = await supabase
        .from('evaluations')
        .insert({
          isla_id: selectedIsla,
          isla_name: isla?.name || 'Desconocida',
          evaluator_name: user?.role === 'ghost' ? user?.name : auditorName,
          evaluator_role: user?.role,
          evaluated_employee: user?.role === 'ghost' ? null : employee?.name,
          auditor_type: auditorType,
          time_slot: timeSlot,
          total_score: finalScore,
          status: interpretation.text
        })
        .select()
        .single();

      if (evalError) throw evalError;

      // 2. Guardar respuestas
      const responsesToInsert = activeCategories.flatMap(cat => 
        cat.questions.map(q => ({
          evaluation_id: evalData.id,
          question_id: q.id,
          question_text: q.text,
          value: String(responses[q.id]?.value || ''),
          observation: responses[q.id]?.observation || null,
          photo_data: responses[q.id]?.photoData || null
        }))
      );

      const { error: respError } = await supabase
        .from('responses')
        .insert(responsesToInsert);

      if (respError) throw respError;

      alert('Auditoría guardada en la base de datos exitosamente.');

      const wantsPDF = window.confirm('¿Desea generar y descargar el documento PDF en este momento? (También podrá descargarlo después desde el Historial)');
      
      if (wantsPDF) {
        // 3. Generar PDF
        let evalDataSig = undefined;
        
        if (evalSigRef.current && !evalSigRef.current.isEmpty()) {
          evalDataSig = evalSigRef.current.getCanvas().toDataURL('image/png');
        }
        
        // Convert state responses back to array format expected by generatePDF
        const formResponsesArr = activeCategories.flatMap(cat => 
          cat.questions.map(q => ({
            question_id: q.id,
            question_text: q.text,
            value: String(responses[q.id]?.value || ''),
            observation: responses[q.id]?.observation || null
          }))
        );

        generatePDF(evalData, formResponsesArr, evalDataSig);
      }
      
      window.location.href = '/dashboard';
    } catch (error) {
      console.error("Error guardando la auditoría:", error);
      alert('Ocurrió un error al guardar o generar el PDF. Revisa la consola.');
    } finally {
      setIsSaving(false);
    }
  };

  // Validate that all questions have an answer, and 1 or 2 have photos and observations (for internal)
  const isValid = activeCategories.every(cat => 
    cat.questions.every(q => {
      const resp = responses[q.id];
      if (!resp || resp.value === undefined || resp.value === '') return false;
      if (user?.role !== 'ghost' && typeof resp.value === 'number' && resp.value <= 2) {
        if (!resp.photo || !resp.observation || resp.observation.trim() === '') return false;
      }
      return true;
    })
  );

  return (
    <div className="container">
      <header className="flex justify-between items-center" style={{ marginBottom: '32px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <h1 className="text-2xl">Nueva Evaluación</h1>
          <p className="text-muted">Evaluador: {user?.name}</p>
        </div>
        <button onClick={logout} className="btn btn-ghost">
          <LogOut size={20} />
          <span>Salir</span>
        </button>
      </header>

      {step === 0 && (
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 className="text-xl" style={{ marginBottom: '24px' }}>Configuración de la Auditoría</h2>
          <form onSubmit={handleStart} className="flex flex-col gap-4">
            <div className="form-group">
              <label className="form-label">Punto de Venta (Isla)</label>
              <select 
                className="form-control"
                value={selectedIsla}
                onChange={(e) => setSelectedIsla(e.target.value)}
                required
              >
                <option value="" disabled>Seleccione una isla...</option>
                {mockIslas.map(isla => (
                  <option key={isla.id} value={isla.id}>{isla.name} - {isla.location}</option>
                ))}
              </select>
            </div>

            {user?.role !== 'ghost' && (
              <>
                <div className="form-group">
                  <label className="form-label">¿Quién realiza la auditoría?</label>
                  <select 
                    className="form-control"
                    value={auditorType}
                    onChange={(e) => setAuditorType(e.target.value)}
                    required
                  >
                    <option value="" disabled>Seleccione el auditor...</option>
                    <option value="supervisor">Supervisor (Richard)</option>
                    <option value="fernando">Fernando Brito</option>
                    <option value="otro">Otra persona (Ingresar nombre)</option>
                  </select>
                </div>

                {auditorType === 'otro' && (
                  <div className="form-group">
                    <label className="form-label">Nombre del Auditor</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      value={customAuditorName}
                      onChange={(e) => setCustomAuditorName(e.target.value)}
                      placeholder="Ej. María López"
                      required
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Empleado a Evaluar</label>
                  <select 
                    className="form-control"
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    required
                  >
                    <option value="" disabled>Seleccione el empleado...</option>
                    {mockEmployees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {user?.role === 'ghost' && (
              <div className="form-group">
                <label className="form-label">Horario de Visita</label>
                <div className="flex flex-col gap-3" style={{ marginTop: '8px' }}>
                  <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="timeSlot" 
                      value="Mañana (10am - 12h30)"
                      checked={timeSlot === 'Mañana (10am - 12h30)'}
                      onChange={(e) => setTimeSlot(e.target.value)}
                      required
                    />
                    <span>Mañana (10am - 12h30)</span>
                  </label>
                  <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="timeSlot" 
                      value="Mediodía (12h30-14h00)"
                      checked={timeSlot === 'Mediodía (12h30-14h00)'}
                      onChange={(e) => setTimeSlot(e.target.value)}
                      required
                    />
                    <span>Mediodía (12h30-14h00)</span>
                  </label>
                  <label className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="timeSlot" 
                      value="Tarde (14h00-17h30)"
                      checked={timeSlot === 'Tarde (14h00-17h30)'}
                      onChange={(e) => setTimeSlot(e.target.value)}
                      required
                    />
                    <span>Tarde (14h00-17h30)</span>
                  </label>
                </div>
              </div>
            )}
            
            <div className="form-group">
              <label className="form-label">Fecha y Hora de Inicio</label>
              <input type="text" className="form-control" value={new Date().toLocaleString()} disabled />
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '16px' }}>
              Iniciar Evaluación <ChevronRight size={20} />
            </button>
          </form>
        </div>
      )}

      {step === 1 && (
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl">Cuestionario</h2>
            <span className="text-muted">Progreso actual: {Object.keys(responses).length} / {activeCategories.reduce((acc, cat) => acc + cat.questions.length, 0)}</span>
          </div>
          
          <div className="flex flex-col gap-8">
            {activeCategories.map(cat => (
              <div key={cat.id} style={{ padding: '24px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--surface-color)' }}>
                <h3 className="text-xl" style={{ marginBottom: '20px', color: 'var(--primary)' }}>{cat.name} <span className="text-muted" style={{fontSize: '1rem'}}>({cat.weight}%)</span></h3>
                
                {cat.questions.map((q, idx) => (
                  <div key={q.id} className="flex flex-col gap-3" style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px dashed var(--border-color)' }}>
                    <p style={{ fontWeight: 500 }}>{idx + 1}. {q.text}</p>
                    <div className="flex gap-2 flex-wrap">
                      {(!q.type || q.type === 'rating') && [1, 2, 3, 4, 5].map(score => (
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

                      {q.type === 'choice' && q.options?.map(opt => (
                        <button 
                          key={opt} 
                          type="button" 
                          onClick={() => handleAnswer(q.id, opt)}
                          className={`btn ${responses[q.id]?.value === opt ? 'btn-primary' : 'btn-ghost'}`} 
                          style={{ padding: '10px 16px', flex: 1, minWidth: '120px' }}
                        >
                          {opt}
                        </button>
                      ))}

                      {q.type === 'text' && (
                        <textarea
                          className="form-control"
                          rows={3}
                          placeholder="Escribe tu respuesta aquí..."
                          value={(responses[q.id]?.value as string) || ''}
                          onChange={(e) => handleAnswer(q.id, e.target.value)}
                          style={{ width: '100%' }}
                        />
                      )}
                    </div>
                    
                    {/* Ghost Client observation per question */}
                    {user?.role === 'ghost' && q.type !== 'text' && (
                      <textarea
                        className="form-control"
                        rows={2}
                        placeholder="Comentario o justificación adicional..."
                        value={responses[q.id]?.observation || ''}
                        onChange={(e) => handleObservation(q.id, e.target.value)}
                        style={{ marginTop: '8px', width: '100%' }}
                      />
                    )}
                    
                    {/* Require Photo and Observation if score is 1 or 2 (Only for rating/internal) */}
                    {user?.role !== 'ghost' && typeof responses[q.id]?.value === 'number' && (responses[q.id].value as number) <= 2 && (
                      <div style={{ marginTop: '8px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', borderRadius: '8px' }}>
                        <p className="text-danger" style={{ fontSize: '0.9rem', marginBottom: '8px', fontWeight: 500 }}>
                          * Puntuación baja. Se requiere fotografía y comentario justificativo obligatorio.
                        </p>
                        
                        <div className="flex flex-col gap-3">
                          <textarea
                            className="form-control"
                            rows={2}
                            placeholder="Escribe el motivo de esta calificación..."
                            value={responses[q.id]?.observation || ''}
                            onChange={(e) => handleObservation(q.id, e.target.value)}
                            required
                          />
                          
                          <div className="flex items-center gap-4">
                            <label className="btn btn-ghost" style={{ border: '1px dashed var(--danger)', color: 'var(--danger)', cursor: 'pointer' }}>
                              <Camera size={18} /> Subir Evidencia
                              <input 
                                type="file" 
                                accept="image/*" 
                                capture="environment" 
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    handlePhoto(q.id, e.target.files[0]);
                                  }
                                }}
                              />
                            </label>
                            {responses[q.id]?.photo && (
                              <img src={responses[q.id]?.photo} alt="Evidencia" style={{ height: '40px', borderRadius: '4px' }} />
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                
                <div className="form-group" style={{ marginTop: '16px' }}>
                  <label className="form-label">Observaciones generales de {cat.name}</label>
                  <textarea className="form-control" rows={2} placeholder="Opcional..."></textarea>
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex justify-between items-center mt-8">
            <div>
              {user?.role !== 'ghost' && (
                <p className="text-xl">Puntaje Parcial: <span style={{fontWeight: 'bold', color: 'var(--primary)'}}>{calculateScore()} / 100</span></p>
              )}
            </div>
            <button 
              onClick={() => setStep(2)} 
              className="btn btn-primary"
              disabled={!isValid}
              title={!isValid ? "Responde todas las preguntas y adjunta las fotos necesarias" : ""}
            >
              Siguiente: Firmas <ChevronRight size={20} />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h2 className="text-xl" style={{ marginBottom: '24px' }}>Firmas y Reporte Final</h2>
          
          <div style={{ marginBottom: '24px', padding: '16px', background: 'var(--bg-color)', borderRadius: '8px' }}>
            {user?.role !== 'ghost' ? (
              <>
                <p className="text-xl mb-2">Puntaje Final Obtenido: <span style={{fontWeight: 'bold', color: 'var(--primary)'}}>{calculateScore()} / 100</span></p>
                <p className="text-lg" style={{ color: getInterpretation(calculateScore()).color }}>
                  Estado: {getInterpretation(calculateScore()).text}
                </p>
              </>
            ) : (
              <p className="text-xl">Evaluación Fantasma Completada</p>
            )}
          </div>
          
          <div className="flex flex-col gap-6">
            <div className="form-group">
              <label className="form-label">Firma Evaluador</label>
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-color)' }}>
                <SignatureCanvas ref={evalSigRef} penColor="black" canvasProps={{width: 500, height: 150, className: 'sigCanvas'}} />
              </div>
              <button type="button" onClick={() => evalSigRef.current?.clear()} className="btn btn-ghost" style={{ alignSelf: 'flex-start', marginTop: '8px', padding: '4px 8px', fontSize: '0.8rem' }}>Limpiar Firma</button>
            </div>



            <div className="flex gap-4 mt-4">
              <button onClick={() => setStep(1)} className="btn btn-ghost" style={{ flex: 1 }}>
                Volver
              </button>
              <button className="btn btn-success" style={{ flex: 2 }} onClick={handleFinish} disabled={isSaving}>
                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                {isSaving ? 'Guardando...' : 'Finalizar y Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
