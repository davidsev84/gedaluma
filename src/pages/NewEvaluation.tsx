import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { mockIslas, mockEmployees, categories, ghostCategories } from '../data/mock';
import { LogOut, Camera, ChevronRight, Check } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { jsPDF } from 'jspdf';

export function NewEvaluation() {
  const { user, logout } = useAuth();
  const [selectedIsla, setSelectedIsla] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [auditorType, setAuditorType] = useState('');
  const [customAuditorName, setCustomAuditorName] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [step, setStep] = useState(0); 
  const [responses, setResponses] = useState<Record<string, { value?: string | number; score?: number; photo?: string }>>({});
  
  const evalSigRef = useRef<SignatureCanvas>(null);
  const respSigRef = useRef<SignatureCanvas>(null);

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

  const handlePhoto = (qId: string, file: File) => {
    // Mock photo upload, using object URL for preview
    const url = URL.createObjectURL(file);
    setResponses(prev => ({
      ...prev,
      [qId]: { ...prev[qId], photo: url }
    }));
  };

  const calculateScore = () => {
    if (user?.role === 'ghost') return 0; // Ghost doesn't calculate numerical score for now
    
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

  const generatePDF = () => {
    try {
      const doc = new jsPDF();
      const finalScore = calculateScore();
      const interpretation = getInterpretation(finalScore);
      const isla = mockIslas.find(i => i.id === selectedIsla);
      const employee = mockEmployees.find(e => e.id === selectedEmployee);

      const auditorName = auditorType === 'supervisor' ? 'Supervisor Richard' : 
                          auditorType === 'fernando' ? 'Fernando Brito' : 
                          customAuditorName;

      doc.setFontSize(18);
      doc.text('Reporte de Auditoria - Gestion de Gedaluma', 20, 20);
      
      doc.setFontSize(12);
      doc.text(`Isla: ${isla?.name} (${isla?.location})`, 20, 35);
      if (user?.role !== 'ghost') {
        doc.text(`Empleado Evaluado: ${employee?.name}`, 20, 42);
        doc.text(`Evaluador: ${auditorName}`, 20, 49);
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, 56);
        doc.text(`Puntaje Final: ${finalScore} / 100`, 20, 63);
        doc.text(`Estado: ${interpretation.text}`, 20, 70);
      } else {
        doc.text(`Horario: ${timeSlot}`, 20, 42);
        doc.text(`Evaluador: ${user?.name}`, 20, 49);
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, 56);
        doc.text(`Puntaje Final: ${finalScore} / 100`, 20, 63);
        doc.text(`Estado: ${interpretation.text}`, 20, 70);
      }

      doc.text('Firmas:', 20, 85);
      
      let currentY = 130;
      if (user?.role === 'ghost') {
        doc.setFontSize(14);
        doc.text('Respuestas de Auditoría Fantasma:', 20, currentY);
        currentY += 10;
        doc.setFontSize(10);
        
        activeCategories.forEach(cat => {
          cat.questions.forEach((q, idx) => {
            const answer = responses[q.id]?.value || 'Sin respuesta';
            const splitTitle = doc.splitTextToSize(`${idx + 1}. ${q.text}`, 170);
            doc.text(splitTitle, 20, currentY);
            currentY += splitTitle.length * 5;
            
            doc.setTextColor(0, 100, 200);
            const splitAnswer = doc.splitTextToSize(`R: ${answer}`, 160);
            doc.text(splitAnswer, 30, currentY);
            doc.setTextColor(0, 0, 0);
            currentY += (splitAnswer.length * 5) + 5;
            
            if (currentY > 270) {
              doc.addPage();
              currentY = 20;
            }
          });
        });
        currentY += 10;
      }
      
      if (evalSigRef.current && !evalSigRef.current.isEmpty()) {
        const evalData = evalSigRef.current.getCanvas().toDataURL('image/png');
        doc.text('Evaluador:', 20, 95);
        doc.addImage(evalData, 'PNG', 20, 100, 60, 20);
      }

      if (respSigRef.current && !respSigRef.current.isEmpty()) {
        const respData = respSigRef.current.getCanvas().toDataURL('image/png');
        doc.text('Encargado/Evaluado:', 100, 95);
        doc.addImage(respData, 'PNG', 100, 100, 60, 20);
      }

      const islaName = isla?.name || 'Isla';
      doc.save(`auditoria_${islaName.replace(/ /g, '_')}_${new Date().getTime()}.pdf`);
      alert('PDF Generado exitosamente.');
      window.location.href = '/dashboard';
    } catch (error) {
      console.error("Error generando el PDF:", error);
      alert('Ocurrió un error al generar el PDF. Revisa la consola para más detalles.');
    }
  };

  // Validate that all questions have an answer, and 1 or 2 have photos (for internal)
  const isValid = activeCategories.every(cat => 
    cat.questions.every(q => {
      const resp = responses[q.id];
      if (!resp || resp.value === undefined || resp.value === '') return false;
      if (user?.role !== 'ghost' && typeof resp.value === 'number' && resp.value <= 2 && !resp.photo) return false;
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
                    
                    {/* Require Photo if score is 1 or 2 (Only for rating/internal) */}
                    {user?.role !== 'ghost' && typeof responses[q.id]?.value === 'number' && (responses[q.id].value as number) <= 2 && (
                      <div style={{ marginTop: '8px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', borderRadius: '8px' }}>
                        <p className="text-danger" style={{ fontSize: '0.9rem', marginBottom: '8px', fontWeight: 500 }}>
                          * Puntuación baja. Se requiere fotografía obligatoria.
                        </p>
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

            <div className="form-group">
              <label className="form-label">Firma Evaluada (Encargado de Isla)</label>
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-color)' }}>
                <SignatureCanvas ref={respSigRef} penColor="black" canvasProps={{width: 500, height: 150, className: 'sigCanvas'}} />
              </div>
              <button type="button" onClick={() => respSigRef.current?.clear()} className="btn btn-ghost" style={{ alignSelf: 'flex-start', marginTop: '8px', padding: '4px 8px', fontSize: '0.8rem' }}>Limpiar Firma</button>
            </div>

            <div className="flex gap-4 mt-4">
              <button onClick={() => setStep(1)} className="btn btn-ghost" style={{ flex: 1 }}>
                Volver
              </button>
              <button className="btn btn-success" style={{ flex: 2 }} onClick={generatePDF}>
                <Check size={20} /> Finalizar y Descargar PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
