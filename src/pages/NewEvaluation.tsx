import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { mockIslas, mockEmployees, categories, ghostCategories, calculateGhostKPI, getStoredIslaEmployeeMap } from '../data/mock';
import { LogOut, Camera, ChevronRight, Check, Loader2, Award, ArrowLeft, Package, Tag, Plus, UserCheck } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { supabase } from '../lib/supabase';
import { generatePDF } from '../lib/pdfGenerator';
import { ProductCatalogModal } from '../components/ProductCatalogModal';

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
  const [employees, setEmployees] = useState<any[]>(mockEmployees.filter(e => !e.name.toLowerCase().includes('susana')));
  
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const { data, error } = await supabase.from('employees').select('*');
        if (!error && data && data.length > 0) {
          setEmployees(data.filter((e: any) => !e.name.toLowerCase().includes('susana')));
        }
      } catch (err) {
        console.warn('V3 tables might not exist yet', err);
      }
    };
    fetchEmployees();
  }, []);
  
  const evalSigRef = useRef<SignatureCanvas>(null);

  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const searchParams = new URLSearchParams(window.location.search);
  const isGhostModeParam = searchParams.get('mode') === 'ghost' || searchParams.get('role') === 'ghost';
  const hasDirectMode = isGhostModeParam || searchParams.has('isla') || searchParams.has('employee');

  const [entryMode, setEntryMode] = useState<'selection' | 'form'>(hasDirectMode ? 'form' : 'selection');
  const isGhost = user?.role === 'ghost' || isGhostModeParam;
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

    // Record start time from system
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

  // KPI Calculation for Ghost Client
  const ghostKPI = isGhost ? calculateGhostKPI(responses) : null;

  const calculateScore = () => {
    if (isGhost) {
      return ghostKPI ? ghostKPI.percentage : 0;
    }
    
    let totalScore = 0;
    activeCategories.forEach(cat => {
      let catScore = 0;
      let maxCatScore = cat.questions.length; // Each question is worth 1 point max (SÍ = 1, NO = 0)
      cat.questions.forEach(q => {
        const val = responses[q.id]?.value;
        if (val === 'SÍ' || val === 1) {
          catScore += 1;
        }
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
    let savedEvalRecord: any = null;

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
                          
      // 1. Guardar en Supabase con fallback local
      try {
        const insertPayload: any = {
          isla_id: selectedIsla,
          isla_name: isla?.name || 'Desconocida',
          evaluator_name: auditorName,
          evaluator_role: isGhost ? 'ghost' : user?.role,
          evaluated_employee: evaluatedName,
          total_score: finalScore,
          status: interpretation.text,
          date: visitDate || new Date().toISOString().split('T')[0]
        };

        if (auditorType) insertPayload.auditor_type = auditorType;
        if (timeSlot) insertPayload.time_slot = timeSlot;
        if (startTime) insertPayload.start_time = startTime;
        if (autoEndTime) insertPayload.end_time = autoEndTime;

        const { data: evalData, error: evalError } = await supabase
          .from('evaluations')
          .insert([insertPayload])
          .select()
          .single();

        if (evalError) {
          console.warn("Supabase evaluations insert warning, reintentando payload básico:", evalError);
          const { data: retryData, error: retryError } = await supabase
            .from('evaluations')
            .insert([{
              isla_id: selectedIsla,
              isla_name: isla?.name || 'Desconocida',
              evaluator_name: auditorName,
              evaluator_role: isGhost ? 'ghost' : user?.role,
              evaluated_employee: evaluatedName,
              total_score: finalScore,
              status: interpretation.text
            }])
            .select()
            .single();

          if (retryError) {
            const causeMsg = retryError.message || retryError.details || retryError.hint || JSON.stringify(retryError);
            throw new Error(`Error en Tabla evaluations: ${causeMsg} (Código DB: ${retryError.code || 'N/A'})`);
          }
          savedEvalRecord = retryData;
        } else {
          savedEvalRecord = evalData;
        }

        // Guardar respuestas en Supabase
        if (savedEvalRecord && savedEvalRecord.id) {
          const responsesToInsert = activeCategories.flatMap(cat => {
            const qResponses = cat.questions.map(q => ({
              evaluation_id: savedEvalRecord.id,
              question_id: q.id,
              question_text: q.text,
              value: String(responses[q.id]?.value || ''),
              observation: responses[q.id]?.observation || null,
              photo_data: responses[q.id]?.photoData || null
            }));
            
            if (responses[cat.id]?.observation || responses[cat.id]?.photoData) {
              qResponses.push({
                evaluation_id: savedEvalRecord.id,
                question_id: cat.id,
                question_text: `[Evidencia General] ${cat.name}`,
                value: 'Evidencia adjunta',
                observation: responses[cat.id]?.observation || null,
                photo_data: responses[cat.id]?.photoData || null
              });
            }
            return qResponses;
          });

          const { error: respError } = await supabase
            .from('responses')
            .insert(responsesToInsert);

          if (respError) {
            console.warn("Error guardando respuestas individuales en Supabase:", respError);
            const causeMsg = respError.message || respError.details || respError.hint || JSON.stringify(respError);
            throw new Error(`Error en Tabla responses: ${causeMsg} (Código DB: ${respError.code || 'N/A'})`);
          }
        }

        alert('✅ Evaluación guardada exitosamente en la base de datos Supabase.');

      } catch (dbError: any) {
        const errorCause = dbError.message || dbError.details || dbError.hint || String(dbError);
        console.error("Error conectando con Supabase:", dbError);
        
        savedEvalRecord = {
          id: `eval_offline_${Date.now()}`,
          isla_id: selectedIsla,
          isla_name: isla?.name || 'Desconocida',
          evaluator_name: auditorName,
          evaluator_role: isGhost ? 'ghost' : user?.role,
          evaluated_employee: evaluatedName,
          auditor_type: auditorType || null,
          time_slot: timeSlot || null,
          start_time: startTime || null,
          end_time: autoEndTime || null,
          date: visitDate || new Date().toISOString().split('T')[0],
          total_score: finalScore,
          status: interpretation.text,
          created_at: new Date().toISOString()
        };

        const existingOffline = JSON.parse(localStorage.getItem('gedaluma_offline_evaluations') || '[]');
        localStorage.setItem('gedaluma_offline_evaluations', JSON.stringify([savedEvalRecord, ...existingOffline]));

        alert(`⚠️ NOTA: La evaluación fue guardada en el respaldo local del navegador para no perder tu información.\n\n📌 CAUSA DEL ERROR AL GUARDAR EN SUPABASE:\n${errorCause}`);
      }

      // Preguntar por PDF
      const wantsPDF = window.confirm('¿Desea generar y descargar el documento PDF en este momento?');
      
      if (wantsPDF && savedEvalRecord) {
        let evalDataSig = undefined;
        if (evalSigRef.current && !evalSigRef.current.isEmpty()) {
          evalDataSig = evalSigRef.current.getCanvas().toDataURL('image/png');
        }
        
        const formResponsesArr = activeCategories.flatMap(cat => {
          const qArr = cat.questions.map(q => ({
            question_id: q.id,
            question_text: q.text,
            value: String(responses[q.id]?.value || ''),
            observation: responses[q.id]?.observation || null
          }));
          if (responses[cat.id]?.observation || responses[cat.id]?.photoData) {
            qArr.push({
              question_id: cat.id,
              question_text: `[Evidencia General] ${cat.name}`,
              value: 'Evidencia adjunta',
              observation: responses[cat.id]?.observation || null
            });
          }
          return qArr;
        });

        generatePDF(savedEvalRecord, formResponsesArr, evalDataSig);
      }
      
      if (user?.role === 'admin') {
        window.location.href = '/dashboard';
      } else {
        window.location.href = '/evaluate';
      }
    } catch (error: any) {
      console.error("Error en flujo de guardado:", error);
      alert(`Ocurrió un detalle al procesar la evaluación: ${error?.message || String(error)}`);
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

        // Mandatory justification for "NO" responses in regular audit
        if (!isGhost && (resp.value === 'NO' || resp.value === 0)) {
          if (!resp.observation || resp.observation.trim() === '') {
            alert(`Para respuestas "NO" (No cumple), debes escribir un comentario justificativo obligatorio.\nFalta en: "${q.text}" (${cat.name}).`);
            return;
          }
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
      <ProductCatalogModal 
        isOpen={showCatalogModal}
        onClose={() => setShowCatalogModal(false)}
      />

      <header className="flex justify-between items-center header-flex-mobile" style={{ marginBottom: '32px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <h1 className="text-2xl">{isGhost ? 'Módulo Cliente Fantasma GEDALUMA' : 'Panel Operativo de Evaluaciones e Inventarios'}</h1>
          <p className="text-muted">Evaluador / Supervisor: {user?.name}</p>
        </div>
        <div className="flex gap-2 items-center header-actions-mobile" style={{ paddingRight: '90px' }}>
          <button 
            onClick={() => setShowCatalogModal(true)} 
            className="btn btn-outline flex items-center gap-1"
            style={{ padding: '8px 12px', fontSize: '0.85rem', borderColor: '#009C48', color: '#009C48' }}
          >
            <Tag size={16} /> 🏷️ Productos (Costos)
          </button>

          <Link 
            to="/evaluate" 
            className="btn btn-outline flex items-center gap-1"
            style={{ padding: '8px 12px', fontSize: '0.85rem', borderColor: '#009C48', color: '#009C48', fontWeight: 700 }}
          >
            <Plus size={16} /> 📋 Evaluación
          </Link>

          <Link 
            to="/evaluate?mode=ghost" 
            className="btn btn-outline flex items-center gap-1"
            style={{ padding: '8px 12px', fontSize: '0.85rem', borderColor: '#f7b500', color: '#b48200', fontWeight: 700 }}
          >
            <UserCheck size={16} /> 🕵️ Cliente Fantasma
          </Link>

          <Link 
            to="/inventory/new" 
            className="btn btn-outline flex items-center gap-1"
            style={{ padding: '8px 12px', fontSize: '0.85rem', borderColor: '#0284c7', color: '#0284c7', fontWeight: 700 }}
          >
            <Package size={16} /> 📦 Inventario
          </Link>

          {user?.role === 'admin' && (
            <Link to="/dashboard" className="btn btn-outline flex items-center gap-2" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
              <ArrowLeft size={18} /> Volver al Panel
            </Link>
          )}
          <button onClick={logout} className="btn btn-ghost">
            <LogOut size={20} />
            <span>Salir</span>
          </button>
        </div>
      </header>

      {/* SELECCIÓN INICIAL DE PROCESO PARA EL EVALUADOR */}
      {step === 0 && entryMode === 'selection' && (
        <div className="card" style={{ maxWidth: '780px', margin: '0 auto', textAlign: 'center', padding: '32px 20px' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#009C48', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Portal Operativo GEDALUMA
          </span>
          <h2 className="text-2xl font-bold mt-2 mb-2" style={{ color: 'var(--text-primary)' }}>
            Selecciona la Gestión a Realizar
          </h2>
          <p className="text-muted mb-8" style={{ fontSize: '0.9rem' }}>
            Escoge entre Evaluación de Auditoría Interna, Evaluación de Cliente Fantasma o Conteo de Inventario:
          </p>

          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => setEntryMode('form')}
              className="btn hover-lift"
              style={{
                padding: '20px 12px',
                borderRadius: '14px',
                border: '2px solid #009C48',
                background: 'rgba(0, 156, 72, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              <Award size={38} style={{ color: '#009C48' }} />
              <div>
                <h3 className="font-bold text-base" style={{ margin: 0, color: '#009C48' }}>📋 Evaluación</h3>
                <p className="text-muted" style={{ fontSize: '0.78rem', marginTop: '4px' }}>
                  Auditoría interna de desempeño e isla
                </p>
              </div>
            </button>

            <Link
              to="/evaluate?mode=ghost"
              className="btn hover-lift"
              style={{
                padding: '20px 12px',
                borderRadius: '14px',
                border: '2px solid #f7b500',
                background: 'rgba(247, 181, 0, 0.06)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                textDecoration: 'none',
                textAlign: 'center'
              }}
            >
              <UserCheck size={38} style={{ color: '#b48200' }} />
              <div>
                <h3 className="font-bold text-base" style={{ margin: 0, color: '#b48200' }}>🕵️ Cliente Fantasma</h3>
                <p className="text-muted" style={{ fontSize: '0.78rem', marginTop: '4px' }}>
                  Evaluación de experiencia de compra y bonos
                </p>
              </div>
            </Link>

            <Link
              to="/inventory/new"
              className="btn hover-lift"
              style={{
                padding: '20px 12px',
                borderRadius: '14px',
                border: '2px solid #0284c7',
                background: 'rgba(2, 132, 199, 0.05)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '10px',
                textDecoration: 'none',
                textAlign: 'center'
              }}
            >
              <Package size={38} style={{ color: '#0284c7' }} />
              <div>
                <h3 className="font-bold text-base" style={{ margin: 0, color: '#0284c7' }}>📦 Inventario</h3>
                <p className="text-muted" style={{ fontSize: '0.78rem', marginTop: '4px' }}>
                  Conteo físico vs sistema y montos PVP ($)
                </p>
              </div>
            </Link>
          </div>
        </div>
      )}

      {/* STEP 0: CHECKLIST MAESTRO / CABECERA */}
      {step === 0 && entryMode === 'form' && (
        <div className="card" style={{ maxWidth: '650px', margin: '0 auto' }}>
          <div className="flex justify-between items-center mb-4">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Award size={24} style={{ color: '#009C48' }} />
              <h2 className="text-xl">Variables de Cabecera (Checklist Maestro)</h2>
            </div>
            {!hasDirectMode && (
              <button 
                type="button" 
                onClick={() => setEntryMode('selection')}
                className="btn btn-ghost text-muted"
                style={{ fontSize: '0.82rem' }}
              >
                ← Cambiar opción
              </button>
            )}
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

            {isGhost && (
              <div className="form-group">
                <label className="form-label">Nombre del Evaluador *</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={customAuditorName || user?.name || ''}
                  onChange={(e) => setCustomAuditorName(e.target.value)}
                  placeholder="Nombre completo del evaluador"
                  required
                />
              </div>
            )}

            {!isGhost && (
              <div className="form-group">
                <label className="form-label">Nombre del Evaluador *</label>
                <select 
                  className="form-control"
                  value={auditorType}
                  onChange={(e) => setAuditorType(e.target.value)}
                  required
                >
                  <option value="" disabled>Seleccione el evaluador...</option>
                  <option value="supervisor">Supervisor (Richard)</option>
                  <option value="fernando">Fernando Brito</option>
                  <option value="otro">Otra persona (Ingresar nombre)</option>
                </select>
              </div>
            )}

            {!isGhost && auditorType === 'otro' && (
              <div className="form-group">
                <label className="form-label">Nombre del Evaluador Manual *</label>
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

            {/* DESPLEGABLE DE EMPLEADOS FILTRADOS POR LA ISLA SELECCIONADA */}
            <div className="form-group">
              <label className="form-label font-bold">
                Empleado / Vendedora a Evaluar {isGhost ? '(Opcional)' : '*'}
              </label>
              <select 
                className="form-control"
                value={selectedEmployee}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedEmployee(val);
                  if (val !== 'otro') {
                    setCustomEmployeeName(val);
                  } else {
                    setCustomEmployeeName('');
                  }
                }}
                required={!isGhost}
                disabled={!selectedIsla}
              >
                {!selectedIsla ? (
                  <option value="" disabled>-- Primero seleccione una isla evaluada --</option>
                ) : (
                  <>
                    <option value="">
                      {isGhost ? '-- No identificada / No especificada (Opcional) --' : 'Seleccione la empleada de esta isla...'}
                    </option>

                    {/* Empleados oficialmente asignados a la isla seleccionada */}
                    {(getStoredIslaEmployeeMap()[selectedIsla] || []).map(empName => (
                      <option key={empName} value={empName}>
                        👤 {empName}
                      </option>
                    ))}

                    <option value="otro">-- Otra empleada (Ingresar nombre manualmente) --</option>
                  </>
                )}
              </select>
            </div>

            {(selectedEmployee === 'otro' || isGhost) && (
              <div className="form-group">
                <label className="form-label">Escribir nombre de la empleada (Ingreso manual)</label>
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

      {/* STEP 1: CUESTIONARIO DE EVALUACIÓN CON CATEGORÍAS */}
      {step === 1 && (
        <div className="card">
          <div className="flex justify-between items-center mb-6" style={{ paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
            <div>
              <h2 className="text-xl font-bold">{isGhost ? 'Protocolo Cliente Fantasma GEDALUMA' : 'Cuestionario de Auditoría Interna por Categorías'}</h2>
              <p className="text-muted" style={{ fontSize: '0.88rem' }}>
                {isGhost ? 'Responda objetivamente cada ítem. Los marcados como NE o N/A se excluyen del denominador.' : 'Evalúe cada ítem de 1 a 5. Para notas <= 2 es obligatorio justificar y opcionalmente adjuntar foto.'}
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

          {/* RENDERING CATEGORIES & QUESTIONS */}
          <div className="flex flex-col gap-8">
            {activeCategories.map((cat) => {

              return (
                <div key={cat.id} style={{ padding: '24px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--surface-color)' }}>
                  {/* CATEGORY HEADER */}
                  <h3 className="text-xl font-bold" style={{ marginBottom: '20px', color: '#009C48', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{cat.name}</span>
                    {!isGhost && <span className="text-muted" style={{ fontSize: '0.95rem', fontWeight: 500 }}>Peso: {cat.weight}%</span>}
                  </h3>

                  {/* PREGUNTAS DE LA CATEGORÍA */}
                  {cat.questions.map((q: any, idx: number) => {
                    const questionCode = !isGhost ? `${cat.id}${idx + 1}` : q.code || `P${idx + 1}`;
                    
                    return (
                      <div key={q.id} className="flex flex-col gap-3" style={{ marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px dashed var(--border-color)' }}>
                        <p style={{ fontWeight: 600, fontSize: '1.05rem' }}>
                          <span style={{ color: '#009C48', fontWeight: 800, marginRight: '6px' }}>{questionCode}.</span>
                          {q.text.startsWith(questionCode) ? q.text.replace(`${questionCode}.`, '').trim() : q.text}
                        </p>

                        {/* RATING SÍ / NO PARA AUDITORÍA NORMAL */}
                        {(!q.type || q.type === 'rating') && (
                          <div className="flex gap-3 mt-2">
                            <button 
                              type="button" 
                              onClick={() => handleAnswer(q.id, 'SÍ')}
                              className={`btn ${responses[q.id]?.value === 'SÍ' || responses[q.id]?.value === 1 ? 'btn-primary' : 'btn-ghost'}`} 
                              style={{ 
                                padding: '12px 24px', 
                                flex: 1, 
                                fontWeight: 800,
                                fontSize: '1rem',
                                background: responses[q.id]?.value === 'SÍ' || responses[q.id]?.value === 1 ? '#009C48' : 'var(--bg-color)', 
                                borderColor: responses[q.id]?.value === 'SÍ' || responses[q.id]?.value === 1 ? '#009C48' : 'var(--border-color)',
                                color: responses[q.id]?.value === 'SÍ' || responses[q.id]?.value === 1 ? '#fff' : 'inherit'
                              }}
                            >
                              ✓ SÍ (Cumple)
                            </button>

                            <button 
                              type="button" 
                              onClick={() => handleAnswer(q.id, 'NO')}
                              className={`btn ${responses[q.id]?.value === 'NO' || responses[q.id]?.value === 0 ? 'btn-danger' : 'btn-ghost'}`} 
                              style={{ 
                                padding: '12px 24px', 
                                flex: 1, 
                                fontWeight: 800,
                                fontSize: '1rem',
                                background: responses[q.id]?.value === 'NO' || responses[q.id]?.value === 0 ? 'var(--danger)' : 'var(--bg-color)', 
                                borderColor: responses[q.id]?.value === 'NO' || responses[q.id]?.value === 0 ? 'var(--danger)' : 'var(--border-color)',
                                color: responses[q.id]?.value === 'NO' || responses[q.id]?.value === 0 ? '#fff' : 'inherit'
                              }}
                            >
                              ✕ NO (No cumple)
                            </button>
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

                        {/* P12 / TEXTO LIBRE */}
                        {q.type === 'text' && (
                          <textarea
                            className="form-control"
                            rows={3}
                            placeholder="Describe una conducta concreta que podría mejorar..."
                            value={(responses[q.id]?.value as string) || ''}
                            onChange={(e) => handleAnswer(q.id, e.target.value)}
                            style={{ width: '100%' }}
                          />
                        )}

                        {/* COMENTARIO Y FOTO OBLIGATORIA SI LA RESPUESTA ES 'NO' (AUDITORÍA INTERNA) */}
                        {!isGhost && (responses[q.id]?.value === 'NO' || responses[q.id]?.value === 0) && (
                          <div style={{ marginTop: '10px', padding: '14px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid var(--danger)', borderRadius: '8px' }}>
                            <p className="text-danger" style={{ fontSize: '0.9rem', marginBottom: '8px', fontWeight: 700 }}>
                              ⚠️ Respuesta "NO" (No cumple). Se requiere comentario justificativo obligatorio:
                            </p>
                            
                            <div className="flex flex-col gap-3">
                              <textarea
                                className="form-control"
                                rows={2}
                                placeholder="Describe el hallazgo o motivo por el cual no cumple este requisito..."
                                value={responses[q.id]?.observation || ''}
                                onChange={(e) => handleObservation(q.id, e.target.value)}
                                required
                              />
                              
                              <div className="flex items-center gap-4">
                                <label className="btn btn-ghost" style={{ border: '1px dashed var(--danger)', color: 'var(--danger)', cursor: 'pointer' }}>
                                  <Camera size={18} /> Subir Evidencia Fotográfica (Opcional)
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
                                  <img src={responses[q.id]?.photo} alt="Evidencia de Pregunta" style={{ height: '45px', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* COMENTARIO GENERAL Y ADJUNTAR FOTO DE LA CATEGORÍA (AUDITORÍA INTERNA) */}
                  {!isGhost && (
                    <div className="form-group" style={{ marginTop: '16px', padding: '16px', background: 'var(--bg-color)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                      <label className="form-label" style={{ fontWeight: 700 }}>Observaciones generales y Evidencia de la Categoría {cat.name} (Opcional)</label>
                      <div className="flex flex-col gap-3">
                        <textarea 
                          className="form-control" 
                          rows={2} 
                          placeholder={`Escribe un comentario o hallazgo general sobre la categoría ${cat.name}...`}
                          value={responses[cat.id]?.observation || ''}
                          onChange={(e) => handleObservation(cat.id, e.target.value)}
                        />
                        <div className="flex items-center gap-4">
                          <label className="btn btn-outline" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Camera size={18} /> Adjuntar Foto de la Categoría
                            <input 
                              type="file" 
                              accept="image/*" 
                              capture="environment" 
                              style={{ display: 'none' }}
                              onChange={(e) => {
                                if (e.target.files && e.target.files[0]) {
                                  handlePhoto(cat.id, e.target.files[0]);
                                }
                              }}
                            />
                          </label>
                          {responses[cat.id]?.photo && (
                            <img src={responses[cat.id]?.photo} alt="Evidencia de Categoría" style={{ height: '55px', borderRadius: '4px', border: '1px solid var(--border-color)' }} />
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-between items-center mt-8" style={{ paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
            <div>
              <p className="text-xl" style={{ fontWeight: 800 }}>
                Calificación Calculada: <span style={{ color: isGhost && ghostKPI ? ghostKPI.color : 'var(--primary)' }}>{calculateScore()}%</span>
              </p>
              <p className="text-muted" style={{ fontSize: '0.85rem' }}>
                {isGhost ? 'Los ítems marcados NE o N/A han sido excluidos del denominador.' : 'Promedio ponderado según pesos de cada categoría.'}
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
