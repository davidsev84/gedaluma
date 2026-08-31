import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getStoredIslas } from '../data/mock';
import { supabase } from '../lib/supabase';
import type { LogbookEntry } from '../types';
import { 
  Calendar as CalendarIcon, Plus, CheckCircle2, PlayCircle,
  Trash2, Edit3
} from 'lucide-react';

export const LOGBOOK_CATEGORIES = [
  {
    id: '1',
    title: '1. Ejecución de Auditorías Tácticas',
    subtasks: [
      'Realizar visitas aleatorias semanales'
    ]
  },
  {
    id: '2',
    title: '2. Acompañamiento y re-entrenamiento en Campo',
    subtasks: [
      'Tiempo presencial en islas para validar el standard de ventas y de calidad'
    ]
  },
  {
    id: '3',
    title: '3. Análisis y Validación de Inventarios',
    subtasks: [
      'Supervisar y validar físicamente las existencias en bodega e islas'
    ]
  },
  {
    id: '4',
    title: '4. Gestión del Semáforo de Gestión',
    subtasks: [
      'Actividades de apoyo logístico en isla',
      'Actividades de apoyo logístico a GEDALUMA'
    ]
  },
  {
    id: '5',
    title: '5. Control Logístico',
    subtasks: [
      'Verificar la correcta cadena de frío y estiba de productos'
    ]
  },
  {
    id: '6',
    title: '6. Desarrollo de Competencias',
    subtasks: [
      'Capacitar al personal nuevo en el Manual Operativo'
    ]
  }
];

export const TIME_SLOTS = [
  '06:00 AM', '06:30 AM',
  '07:00 AM', '07:30 AM',
  '08:00 AM', '08:30 AM',
  '09:00 AM', '09:30 AM',
  '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM',
  '01:00 PM', '01:30 PM',
  '02:00 PM', '02:30 PM',
  '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM',
  '05:00 PM', '05:30 PM',
  '06:00 PM', '06:30 PM',
  '07:00 PM', '07:30 PM',
  '08:00 PM', '08:30 PM',
  '09:00 PM', '09:30 PM',
  '10:00 PM'
];

export function Logbook() {
  const { user } = useAuth();
  const islands = getStoredIslas();

  // State
  const [entries, setEntries] = useState<LogbookEntry[]>([]);
  const [viewMode, setViewMode] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('weekly');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  
  // Modals & Form
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<LogbookEntry | null>(null);

  const [formIsla, setFormIsla] = useState('');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formCategory, setFormCategory] = useState(LOGBOOK_CATEGORIES[0].title);
  const [formSubtask, setFormSubtask] = useState(LOGBOOK_CATEGORIES[0].subtasks[0]);
  const [formDescription, setFormDescription] = useState('');
  const [formStartTime, setFormStartTime] = useState<string>('09:00 AM');
  const [formEndTime, setFormEndTime] = useState<string>('');

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const { data, error } = await supabase
        .from('logbook_entries')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setEntries(data);
      } else {
        const savedOffline = localStorage.getItem('gedaluma_offline_logbook');
        if (savedOffline) {
          try { setEntries(JSON.parse(savedOffline)); } catch(e){}
        }
      }
    } catch (err) {
      console.warn('Error cargando bitácora de Supabase:', err);
      const savedOffline = localStorage.getItem('gedaluma_offline_logbook');
      if (savedOffline) {
        try { setEntries(JSON.parse(savedOffline)); } catch(e){}
      }
    }
  };

  const handleStartTask = async () => {
    if (!formIsla) return alert('Por favor selecciona una isla.');
    const islaObj = islands.find(i => i.id === formIsla || i.name === formIsla);

    const startTimeToUse = formStartTime || '09:00 AM';
    const isCompleted = !!formEndTime;

    const newPayload: LogbookEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      isla_id: formIsla,
      isla_name: islaObj?.name || formIsla,
      task_category: formCategory,
      task_subcategory: formSubtask,
      description: formDescription,
      date: formDate || selectedDate,
      start_time: startTimeToUse,
      end_time: formEndTime || '',
      status: isCompleted ? 'completed' : 'scheduled',
      created_by: user?.name || 'Supervisor',
      is_valid: true,
      created_at: new Date().toISOString()
    };

    // Optimistic UI
    setEntries(prev => [newPayload, ...prev]);

    try {
      const { data, error } = await supabase.from('logbook_entries').insert([newPayload]).select().single();
      if (error) throw error;
      if (data) {
        setEntries(prev => prev.map(e => e.id === newPayload.id ? data : e));
      }
    } catch (err) {
      console.warn("Fallback offline bitácora:", err);
      const existingOffline = JSON.parse(localStorage.getItem('gedaluma_offline_logbook') || '[]');
      localStorage.setItem('gedaluma_offline_logbook', JSON.stringify([newPayload, ...existingOffline]));
    }

    setShowFormModal(false);
    resetForm();
    alert(isCompleted ? '✅ Tarea agendada y completada.' : '✅ Tarea agendada exitosamente en la agenda.');
  };

  const handleStartScheduledTask = async (entry: LogbookEntry) => {
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, start_time: nowTime, status: 'in_progress' } : e));

    try {
      const { error } = await supabase
        .from('logbook_entries')
        .update({ start_time: nowTime, status: 'in_progress' })
        .eq('id', entry.id);

      if (error) throw error;
    } catch (err) {
      const offline = JSON.parse(localStorage.getItem('gedaluma_offline_logbook') || '[]');
      const updated = offline.map((o: any) => o.id === entry.id ? { ...o, start_time: nowTime, status: 'in_progress' } : o);
      localStorage.setItem('gedaluma_offline_logbook', JSON.stringify(updated));
    }
  };

  const handleFinishTask = async (entry: LogbookEntry) => {
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, end_time: nowTime, status: 'completed' } : e));

    try {
      const { error } = await supabase
        .from('logbook_entries')
        .update({ end_time: nowTime, status: 'completed' })
        .eq('id', entry.id);

      if (error) throw error;
    } catch (err) {
      const offline = JSON.parse(localStorage.getItem('gedaluma_offline_logbook') || '[]');
      const updated = offline.map((o: any) => o.id === entry.id ? { ...o, end_time: nowTime, status: 'completed' } : o);
      localStorage.setItem('gedaluma_offline_logbook', JSON.stringify(updated));
    }
  };

  const handleSaveEdit = async () => {
    if (!editingEntry) return;

    const isCompleted = !!formEndTime;
    const updatedPayload: LogbookEntry = {
      ...editingEntry,
      task_category: formCategory,
      task_subcategory: formSubtask,
      description: formDescription,
      isla_id: formIsla,
      isla_name: islands.find(i => i.id === formIsla)?.name || formIsla,
      date: formDate,
      start_time: formStartTime,
      end_time: formEndTime || '',
      status: isCompleted ? 'completed' : editingEntry.status
    };

    setEntries(prev => prev.map(e => e.id === editingEntry.id ? updatedPayload : e));

    try {
      const { error } = await supabase
        .from('logbook_entries')
        .update({
          task_category: formCategory,
          task_subcategory: formSubtask,
          description: formDescription,
          isla_id: formIsla,
          isla_name: updatedPayload.isla_name,
          date: formDate,
          start_time: formStartTime,
          end_time: formEndTime || '',
          status: isCompleted ? 'completed' : editingEntry.status
        })
        .eq('id', editingEntry.id);

      if (error) throw error;
    } catch (err) {
      const offline = JSON.parse(localStorage.getItem('gedaluma_offline_logbook') || '[]');
      const updated = offline.map((o: any) => o.id === editingEntry.id ? updatedPayload : o);
      localStorage.setItem('gedaluma_offline_logbook', JSON.stringify(updated));
    }

    setEditingEntry(null);
    setShowFormModal(false);
    resetForm();
    alert('✅ Tarea actualizada correctamente.');
  };

  const handleDeleteTask = async (id: string) => {
    if (!isAdmin) {
      return alert('⛔ Únicamente el usuario Administrador tiene permisos para eliminar tareas de la bitácora.');
    }
    if (!window.confirm('¿Estás seguro de eliminar esta tarea definitivamente?')) return;

    setEntries(prev => prev.filter(e => e.id !== id));

    try {
      const { error } = await supabase.from('logbook_entries').delete().eq('id', id);
      if (error) throw error;
    } catch (err) {
      const offline = JSON.parse(localStorage.getItem('gedaluma_offline_logbook') || '[]');
      const updated = offline.filter((o: any) => o.id !== id);
      localStorage.setItem('gedaluma_offline_logbook', JSON.stringify(updated));
    }
  };

  const openEditModal = (entry: LogbookEntry) => {
    setEditingEntry(entry);
    setFormIsla(entry.isla_id || '');
    setFormDate(entry.date || selectedDate);
    setFormCategory(entry.task_category || LOGBOOK_CATEGORIES[0].title);
    setFormSubtask(entry.task_subcategory || LOGBOOK_CATEGORIES[0].subtasks[0]);
    setFormDescription(entry.description || '');
    setFormStartTime(entry.start_time || '09:00 AM');
    setFormEndTime(entry.end_time || '');
    setShowFormModal(true);
  };

  const resetForm = () => {
    setFormIsla('');
    setFormDate(selectedDate);
    setFormCategory(LOGBOOK_CATEGORIES[0].title);
    setFormSubtask(LOGBOOK_CATEGORIES[0].subtasks[0]);
    setFormDescription('');
    setFormStartTime('09:00 AM');
    setFormEndTime('');
    setEditingEntry(null);
  };

  // Helper date calculations for Weekly, Monthly, Yearly views
  const currDateObj = new Date(selectedDate + 'T12:00:00');

  // Generate 7 days for current week
  const getWeekDays = () => {
    const day = currDateObj.getDay();
    const diff = currDateObj.getDate() - day + (day === 0 ? -6 : 1); // Monday
    const monday = new Date(currDateObj.setDate(diff));
    const week = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      week.push(nextDay.toISOString().split('T')[0]);
    }
    return week;
  };

  const weekDays = getWeekDays();

  return (
    <div className="container" style={{ maxWidth: '1240px', paddingBottom: '60px' }}>
      {/* HEADER PRINCIPAL */}
      <header className="flex justify-between items-center header-flex-mobile" style={{ marginBottom: '28px', paddingBottom: '16px', borderBottom: '1px solid var(--border-color)' }}>
        <div>
          <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#009C48', textTransform: 'uppercase', letterSpacing: '1px' }}>
            Informe Diario & Agenda de Supervisión
          </span>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ marginTop: '4px' }}>
            <CalendarIcon size={28} style={{ color: '#009C48' }} /> Novedades y Solicitudes (Bitácora)
          </h1>
        </div>

        <div className="flex gap-2 items-center flex-wrap header-actions-mobile">
          <button
            onClick={() => {
              resetForm();
              setShowFormModal(true);
            }}
            className="btn hover-lift"
            style={{ 
              background: '#009C48', 
              borderColor: '#009C48', 
              color: '#ffffff', 
              fontWeight: 800, 
              padding: '10px 18px', 
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Plus size={18} /> + Registrar Nueva Actividad
          </button>
        </div>
      </header>

      {/* SELECTOR DE VISTAS Y NAVEGACIÓN DE FECHA */}
      <div className="card mb-6" style={{ background: 'var(--surface-color)', padding: '16px 20px', borderRadius: '14px', border: '1px solid var(--border-color)' }}>
        <div className="flex justify-between items-center flex-wrap gap-4">
          
          {/* BOTONES DE CAMBIO DE VISTA (DIARIO, SEMANAL, MENSUAL, ANUAL) */}
          <div className="flex items-center gap-2" style={{ background: 'var(--bg-color)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
            <button
              onClick={() => setViewMode('daily')}
              className="btn"
              style={{
                padding: '6px 14px',
                fontSize: '0.85rem',
                fontWeight: 800,
                borderRadius: '8px',
                background: viewMode === 'daily' ? '#009C48' : 'transparent',
                color: viewMode === 'daily' ? '#ffffff' : 'var(--text-primary)',
                border: 'none'
              }}
            >
              📅 Diario
            </button>

            <button
              onClick={() => setViewMode('weekly')}
              className="btn"
              style={{
                padding: '6px 14px',
                fontSize: '0.85rem',
                fontWeight: 800,
                borderRadius: '8px',
                background: viewMode === 'weekly' ? '#009C48' : 'transparent',
                color: viewMode === 'weekly' ? '#ffffff' : 'var(--text-primary)',
                border: 'none'
              }}
            >
              🗓️ Semanal (Cuadro 7 Días)
            </button>

            <button
              onClick={() => setViewMode('monthly')}
              className="btn"
              style={{
                padding: '6px 14px',
                fontSize: '0.85rem',
                fontWeight: 800,
                borderRadius: '8px',
                background: viewMode === 'monthly' ? '#009C48' : 'transparent',
                color: viewMode === 'monthly' ? '#ffffff' : 'var(--text-primary)',
                border: 'none'
              }}
            >
              📆 Mensual
            </button>

            <button
              onClick={() => setViewMode('yearly')}
              className="btn"
              style={{
                padding: '6px 14px',
                fontSize: '0.85rem',
                fontWeight: 800,
                borderRadius: '8px',
                background: viewMode === 'yearly' ? '#009C48' : 'transparent',
                color: viewMode === 'yearly' ? '#ffffff' : 'var(--text-primary)',
                border: 'none'
              }}
            >
              📊 Anual
            </button>
          </div>

          {/* SELECTOR DE FECHA */}
          <div className="flex items-center gap-2">
            <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Fecha de Referencia:</label>
            <input 
              type="date"
              className="form-control"
              style={{ width: 'auto', padding: '6px 12px', fontSize: '0.88rem' }}
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* VISTA 1: AGENDA SEMANAL EN CUADRO (7 COLUMNAS DÍAS DE LA SEMANA) */}
      {viewMode === 'weekly' && (
        <div className="card mb-6" style={{ padding: '20px' }}>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#009C48' }}>
            <CalendarIcon size={20} /> Cuadro Semanal de Novedades (Semana del {weekDays[0]} al {weekDays[6]})
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(115px, 1fr))', gap: '10px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '8px' }}>
            {weekDays.map((dayStr) => {
              const dayObj = new Date(dayStr + 'T12:00:00');
              const dayName = dayObj.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase();
              const dayNum = dayObj.getDate();
              const dayEntries = entries.filter(e => e.date === dayStr);

              const isToday = dayStr === new Date().toISOString().split('T')[0];

              return (
                <div 
                  key={dayStr}
                  style={{
                    border: `1px solid ${isToday ? '#009C48' : 'var(--border-color)'}`,
                    borderRadius: '12px',
                    padding: '10px',
                    background: isToday ? 'rgba(0, 156, 72, 0.04)' : 'var(--surface-color)',
                    minHeight: '380px',
                    display: 'flex',
                    flexDirection: 'column'
                  }}
                >
                  <div style={{ textAlign: 'center', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)', marginBottom: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: isToday ? '#009C48' : 'var(--text-secondary)' }}>
                      {dayName}
                    </span>
                    <p style={{ margin: '2px 0 6px 0', fontWeight: 800, fontSize: '1.1rem', color: isToday ? '#009C48' : 'var(--text-primary)' }}>
                      {dayNum}
                    </p>
                    <button
                      onClick={() => {
                        setSelectedDate(dayStr);
                        resetForm();
                        setShowFormModal(true);
                      }}
                      className="btn"
                      style={{
                        padding: '3px 8px',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        background: 'rgba(0, 156, 72, 0.12)',
                        color: '#009C48',
                        border: '1px solid rgba(0, 156, 72, 0.3)',
                        borderRadius: '6px',
                        width: '100%'
                      }}
                      title="Crear tarea para este día"
                    >
                      + Tarea Directa
                    </button>
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto' }}>
                    {dayEntries.map(entry => (
                      <div 
                        key={entry.id} 
                        style={{ 
                          padding: '10px', 
                          border: `1px solid ${entry.status === 'in_progress' ? '#f7b500' : 'var(--border-color)'}`, 
                          borderRadius: '10px',
                          background: entry.status === 'in_progress' ? 'rgba(247, 181, 0, 0.08)' : 'var(--bg-color)',
                          fontSize: '0.78rem'
                        }}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span style={{ fontWeight: 800, color: '#009C48' }}>ISLA {entry.isla_name}</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>{entry.start_time}</span>
                        </div>
                        <p style={{ margin: '2px 0 6px 0', fontWeight: 600, fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                          {entry.task_category}
                        </p>

                        {/* ESTADO 1: AGENDADA / PENDIENTE DE INICIAR */}
                        {entry.status === 'scheduled' || (!entry.status && !entry.end_time) ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                            <button 
                              onClick={() => handleStartScheduledTask(entry)}
                              className="btn hover-lift"
                              style={{ 
                                padding: '8px 10px', 
                                fontSize: '0.82rem', 
                                fontWeight: 800, 
                                background: '#009C48', 
                                color: '#ffffff', 
                                borderRadius: '8px',
                                border: 'none',
                                width: '100%',
                                textAlign: 'center',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px'
                              }}
                              title="Haz clic para iniciar la tarea ahora"
                            >
                              <PlayCircle size={16} /> ▶️ Iniciar Tarea
                            </button>

                            {/* SIGUIENTE LÍNEA: BOTONES EDITAR Y BORRAR */}
                            <div className="flex justify-between items-center pt-1" style={{ borderTop: '1px dashed var(--border-color)', marginTop: '4px' }}>
                              <button 
                                onClick={() => openEditModal(entry)}
                                className="btn"
                                style={{ padding: '3px 8px', fontSize: '0.72rem', background: 'rgba(2, 132, 199, 0.12)', color: '#0284c7', border: 'none', borderRadius: '6px', fontWeight: 700 }}
                                title="Modificar tarea"
                              >
                                ✏️ Editar
                              </button>
                              {isAdmin && (
                                <button 
                                  onClick={() => handleDeleteTask(entry.id)}
                                  className="btn"
                                  style={{ padding: '3px 8px', fontSize: '0.72rem', background: 'rgba(239, 68, 68, 0.12)', color: 'var(--danger)', border: 'none', borderRadius: '6px', fontWeight: 700 }}
                                  title="Eliminar tarea"
                                >
                                  🗑️ Borrar
                                </button>
                              )}
                            </div>
                          </div>
                        ) : entry.status === 'in_progress' ? (
                          /* ESTADO 2: EN CURSO (INICIADA) */
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                            <button 
                              onClick={() => handleFinishTask(entry)}
                              className="btn hover-lift"
                              style={{ 
                                padding: '8px 10px', 
                                fontSize: '0.82rem', 
                                fontWeight: 800, 
                                background: '#0284c7', 
                                color: '#ffffff', 
                                borderRadius: '8px',
                                border: 'none',
                                width: '100%',
                                textAlign: 'center',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '4px'
                              }}
                              title="Haz clic para finalizar la tarea ahora"
                            >
                              <CheckCircle2 size={16} /> ✓ Finalizar Tarea
                            </button>

                            {/* SIGUIENTE LÍNEA: BOTONES EDITAR Y BORRAR */}
                            <div className="flex justify-between items-center pt-1" style={{ borderTop: '1px dashed var(--border-color)', marginTop: '4px' }}>
                              <button 
                                onClick={() => openEditModal(entry)}
                                className="btn"
                                style={{ padding: '3px 8px', fontSize: '0.72rem', background: 'rgba(2, 132, 199, 0.12)', color: '#0284c7', border: 'none', borderRadius: '6px', fontWeight: 700 }}
                                title="Modificar tarea"
                              >
                                ✏️ Editar
                              </button>
                              {isAdmin && (
                                <button 
                                  onClick={() => handleDeleteTask(entry.id)}
                                  className="btn"
                                  style={{ padding: '3px 8px', fontSize: '0.72rem', background: 'rgba(239, 68, 68, 0.12)', color: 'var(--danger)', border: 'none', borderRadius: '6px', fontWeight: 700 }}
                                  title="Eliminar tarea"
                                >
                                  🗑️ Borrar
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          /* ESTADO 3: COMPLETADA */
                          <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed var(--border-color)' }}>
                            <div className="flex justify-between items-center mb-1">
                              <span style={{ fontSize: '0.72rem', color: '#009C48', fontWeight: 800 }}>
                                ✓ Fin: {entry.end_time || 'Completado'}
                              </span>
                            </div>
                            {/* SIGUIENTE LÍNEA: EDITAR Y BORRAR */}
                            <div className="flex justify-between items-center mt-1">
                              <button 
                                onClick={() => openEditModal(entry)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0284c7', fontSize: '0.72rem', fontWeight: 700 }}
                              >
                                ✏️ Editar
                              </button>
                              {isAdmin && (
                                <button 
                                  onClick={() => handleDeleteTask(entry.id)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '0.72rem', fontWeight: 700 }}
                                >
                                  🗑️ Borrar
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {dayEntries.length === 0 && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textAlign: 'center', margin: 'auto' }}>
                        Sin tareas
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VISTA 2: DIARIA (LISTA DETALLADA HORA A HORA) */}
      {viewMode === 'daily' && (
        <div className="card mb-6" style={{ padding: '24px' }}>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#009C48' }}>
            📅 Detalle de Actividades Diarias ({selectedDate})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {entries.filter(e => e.date === selectedDate).map(entry => (
              <div key={entry.id} style={{ padding: '16px', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--surface-color)' }}>
                <div className="flex justify-between items-center flex-wrap gap-2 mb-2">
                  <div className="flex items-center gap-3">
                    <span style={{ padding: '4px 12px', background: 'rgba(0, 156, 72, 0.12)', color: '#009C48', fontWeight: 800, borderRadius: '8px', fontSize: '0.85rem' }}>
                      ISLA {entry.isla_name}
                    </span>
                    <h4 className="text-lg font-bold" style={{ margin: 0 }}>{entry.task_category}</h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                      🕒 {entry.start_time} {entry.end_time ? `- ${entry.end_time}` : '(En progreso)'}
                    </span>
                    <button onClick={() => openEditModal(entry)} className="btn btn-ghost" style={{ padding: '4px 8px' }} title="Editar">
                      <Edit3 size={16} />
                    </button>
                    {isAdmin && (
                      <button onClick={() => handleDeleteTask(entry.id)} className="btn btn-ghost text-danger" style={{ padding: '4px 8px' }} title="Eliminar">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                <p style={{ margin: '4px 0', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                  📌 Subtarea: <strong>{entry.task_subcategory}</strong>
                </p>

                {entry.description && (
                  <p style={{ margin: '8px 0 0 0', fontSize: '0.88rem', color: 'var(--text-secondary)', background: 'var(--bg-color)', padding: '10px', borderRadius: '8px' }}>
                    📝 {entry.description}
                  </p>
                )}

                <div className="flex justify-between items-center mt-3 pt-2" style={{ borderTop: '1px dashed var(--border-color)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  <span>Registrado por: <strong>{entry.created_by}</strong></span>
                  {entry.status === 'in_progress' ? (
                    <button onClick={() => handleFinishTask(entry)} className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '0.78rem', background: '#009C48', borderColor: '#009C48' }}>
                      <CheckCircle2 size={14} /> Finalizar Tarea
                    </button>
                  ) : (
                    <span style={{ color: '#009C48', fontWeight: 800 }}>✓ Completada</span>
                  )}
                </div>
              </div>
            ))}

            {entries.filter(e => e.date === selectedDate).length === 0 && (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                No hay actividades o novedades registradas para la fecha seleccionada.
              </div>
            )}
          </div>
        </div>
      )}

      {/* VISTA 3: MENSUAL */}
      {viewMode === 'monthly' && (
        <div className="card mb-6" style={{ padding: '24px' }}>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#009C48' }}>
            📆 Resumen Mensual de Bitácoras
          </h3>
          <p className="text-muted" style={{ fontSize: '0.88rem', marginBottom: '16px' }}>
            Total de tareas e informes diarios registrados por día durante el mes.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {entries.slice(0, 30).map(entry => (
              <div key={entry.id} className="flex justify-between items-center" style={{ padding: '12px 16px', border: '1px solid var(--border-color)', borderRadius: '10px', background: 'var(--surface-color)' }}>
                <div>
                  <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#009C48' }}>{entry.date} - ISLA {entry.isla_name}</span>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>{entry.task_category} ({entry.task_subcategory})</p>
                </div>

                <div className="flex items-center gap-3">
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{entry.start_time} - {entry.end_time || 'En curso'}</span>
                  <button onClick={() => openEditModal(entry)} className="btn btn-ghost" style={{ padding: '4px' }}><Edit3 size={16} /></button>
                  {isAdmin && <button onClick={() => handleDeleteTask(entry.id)} className="btn btn-ghost text-danger" style={{ padding: '4px' }}><Trash2 size={16} /></button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VISTA 4: ANUAL */}
      {viewMode === 'yearly' && (
        <div className="card mb-6" style={{ padding: '24px' }}>
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2" style={{ color: '#009C48' }}>
            📊 Consolidado Anual de Bitácoras y Presencia en Campo
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div style={{ padding: '20px', background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <span className="text-muted" style={{ fontSize: '0.85rem' }}>Total Actividades Registradas</span>
              <h4 className="text-3xl font-bold" style={{ color: '#009C48', marginTop: '4px' }}>{entries.length} Tareas</h4>
            </div>
            <div style={{ padding: '20px', background: 'var(--bg-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
              <span className="text-muted" style={{ fontSize: '0.85rem' }}>Tareas Completadas</span>
              <h4 className="text-3xl font-bold" style={{ color: '#0284c7', marginTop: '4px' }}>
                {entries.filter(e => e.status === 'completed').length} Completadas
              </h4>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA CREAR / EDITAR TAREA DE LA BITÁCORA */}
      {showFormModal && (
        <div className="mobile-menu-overlay flex items-center justify-center" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, padding: '20px' }}>
          <div className="card modal-card-mobile" style={{ width: '100%', maxWidth: '560px', background: 'var(--surface-color)', padding: '24px', borderRadius: '16px' }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: '#009C48' }}>
              {editingEntry ? '✏️ Modificar Actividad (Bitácora)' : '➕ Registrar Nueva Tarea Diario'}
            </h3>

            <form onSubmit={e => {
              e.preventDefault();
              if (editingEntry) handleSaveEdit();
              else handleStartTask();
            }}>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>📅 Fecha de la Tarea:</label>
                  <input 
                    type="date"
                    className="form-control"
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>🕒 Hora Inicio (Desplegable):</label>
                  <select 
                    className="form-control"
                    value={formStartTime}
                    onChange={e => setFormStartTime(e.target.value)}
                    required
                  >
                    {TIME_SLOTS.map(slot => (
                      <option key={slot} value={slot}>{slot}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group mb-4">
                <label className="form-label" style={{ fontWeight: 700 }}>🏁 Hora Finalización (Opcional si inicia ahora):</label>
                <select 
                  className="form-control"
                  value={formEndTime}
                  onChange={e => setFormEndTime(e.target.value)}
                >
                  <option value="">-- En Progreso (Se finaliza después) --</option>
                  {TIME_SLOTS.map(slot => (
                    <option key={`end_${slot}`} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>

              <div className="form-group mb-4">
                <label className="form-label" style={{ fontWeight: 700 }}>Isla donde se realiza la tarea:</label>
                <select 
                  className="form-control"
                  value={formIsla}
                  onChange={e => setFormIsla(e.target.value)}
                  required
                >
                  <option value="" disabled>-- Selecciona una Isla --</option>
                  {islands.map(i => (
                    <option key={i.id} value={i.id}>ISLA {i.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group mb-4">
                <label className="form-label" style={{ fontWeight: 700 }}>Categoría de la Tarea:</label>
                <select 
                  className="form-control"
                  value={formCategory}
                  onChange={e => {
                    setFormCategory(e.target.value);
                    const catObj = LOGBOOK_CATEGORIES.find(c => c.title === e.target.value);
                    if (catObj && catObj.subtasks.length > 0) {
                      setFormSubtask(catObj.subtasks[0]);
                    }
                  }}
                  required
                >
                  {LOGBOOK_CATEGORIES.map(c => (
                    <option key={c.id} value={c.title}>{c.title}</option>
                  ))}
                </select>
              </div>

              <div className="form-group mb-4">
                <label className="form-label" style={{ fontWeight: 700 }}>Actividad Específica:</label>
                <select 
                  className="form-control"
                  value={formSubtask}
                  onChange={e => setFormSubtask(e.target.value)}
                  required
                >
                  {LOGBOOK_CATEGORIES.find(c => c.title === formCategory)?.subtasks.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="form-group mb-4">
                <label className="form-label" style={{ fontWeight: 700 }}>Observaciones / Detalle:</label>
                <textarea 
                  className="form-control"
                  rows={3}
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  placeholder="Detalla las novedades o solicitudes atendidas..."
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowFormModal(false)} className="btn btn-ghost">
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#009C48', borderColor: '#009C48' }}>
                  {editingEntry ? 'Guardar Cambios' : '▶️ Iniciar Tarea'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
