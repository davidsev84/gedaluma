import type { User, Isla, Category } from '../types';

export const mockUsers: User[] = [
  { id: '1', name: 'Admin', role: 'admin', pin: '1234' },
  { id: '2', name: 'Supervisor Richard', role: 'evaluator', pin: '5678' },
  { id: '3', name: 'Cliente Fantasma', role: 'ghost', pin: '0000' },
];

export const initialMockIslas: Isla[] = [
  { id: '1', name: 'ALBAN', location: 'Guayaquil', manager: 'N/A' },
  { id: '2', name: 'JUAN TANCA', location: 'Guayaquil', manager: 'N/A' },
  { id: '3', name: 'CALIFORNIA', location: 'Guayaquil', manager: 'N/A' },
  { id: '4', name: 'PASEO DAULE', location: 'Daule', manager: 'N/A' },
  { id: '5', name: 'TERMINAL', location: 'Guayaquil', manager: 'N/A' },
  { id: '6', name: 'SALINAS', location: 'Salinas', manager: 'N/A' },
  { id: '7', name: 'PUERTO AZUL', location: 'Guayaquil', manager: 'N/A' },
];

export const getStoredIslas = (): Isla[] => {
  const saved = localStorage.getItem('gedaluma_islas_v2');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {}
  }
  return initialMockIslas;
};

export const saveStoredIslas = (islas: Isla[]): void => {
  localStorage.setItem('gedaluma_islas_v2', JSON.stringify(islas));
};

export const mockIslas: Isla[] = getStoredIslas();

export const mockEmployees = [
  { id: 'e1', name: 'Gabriel Perero' },
  { id: 'e2', name: 'Shirley Reyes' },
  { id: 'e3', name: 'Yamilet Delgado' },
  { id: 'e4', name: 'Virginia Miño' },
  { id: 'e5', name: 'Johanna Mendoza' },
  { id: 'e6', name: 'Dayse Rodriguez' },
  { id: 'e7', name: 'Teresa Vargas' },
  { id: 'e8', name: 'Carmen Larenas' },
  { id: 'e9', name: 'Liliana Estrada' },
  { id: 'e10', name: 'Jackeline Mera Collazo' },
  { id: 'e11', name: 'Andrea Meza Saltos' },
  { id: 'e12', name: 'Maritza Cedeño' },
  { id: 'e13', name: 'Jackie Rodriguez' }
];

export const defaultIslaEmployeeMap: Record<string, string[]> = {
  '1': ['Carmen Larenas', 'Liliana Estrada'], // ALBAN
  '2': ['Yamilet Delgado', 'Virginia Miño', 'Jackeline Mera Collazo'], // JUAN TANCA
  '3': ['Johanna Mendoza', 'Dayse Rodriguez'], // CALIFORNIA
  '4': ['Yamilet Delgado', 'Teresa Vargas'], // PASEO DAULE (Unificada Daule y Paseo Daule)
  '5': ['Liliana Estrada', 'Jackeline Mera Collazo', 'Jackie Rodriguez'], // TERMINAL
  '6': ['Gabriel Perero', 'Shirley Reyes'], // SALINAS
  '7': ['Andrea Meza Saltos', 'Maritza Cedeño'] // PUERTO AZUL
};

export const getStoredIslaEmployeeMap = (): Record<string, string[]> => {
  const saved = localStorage.getItem('gedaluma_isla_emp_map_v5');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {}
  }
  return defaultIslaEmployeeMap;
};

export const categories: Category[] = [
  {
    id: 'A',
    name: 'A. ORDEN, LIMPIEZA Y PRESENTACIÓN',
    weight: 20,
    questions: [
      { id: 'a1', text: 'Exteriores de isla inferiores limpios.' },
      { id: 'a2', text: 'Exteriores de isla superiores limpios.' },
      { id: 'a3', text: 'Paneles de vidrio sin manchas.' },
      { id: 'a4', text: 'Rejillas de equipos y luminarias limpias.' },
      { id: 'a5', text: 'Mesones limpios y ordenados.' },
      { id: 'a6', text: 'Cajoneras limpias y ordenadas.' },
      { id: 'a7', text: 'Paño (2) / trapeador limpios.' },
      { id: 'a8', text: 'Piso limpio.' },
      { id: 'a9', text: 'Área de lavabo limpio y seco.' },
      { id: 'a10', text: 'Neveras limpias.' },
      { id: 'a11', text: 'Congelador con filos limpios.' },
      { id: 'a12', text: 'Sobre de documentos legales completos.' },
      { id: 'a13', text: 'Bitácoras al día (limpieza y equipos).' }
    ]
  },
  {
    id: 'B',
    name: 'B. BPM – MANEJO DE ALIMENTOS',
    weight: 20,
    questions: [
      { id: 'b1', text: 'Conos protegidos con capucha.' },
      { id: 'b2', text: 'Productos sin caducar.' },
      { id: 'b3', text: 'Uso correcto de guantes (jugo – base - conos).' },
      { id: 'b4', text: 'Manos Limpias - uñas cortas - sin esmalte.' },
      { id: 'b5', text: 'Bandeja y/o gaveta de conos limpios y en buen estado.' },
      { id: 'b6', text: 'Tachos limpios y completos (jugo – base).' },
      { id: 'b7', text: 'Productos reportados como devolución identificados.' },
      { id: 'b8', text: 'Tacho en buen estado (tapas).' },
      { id: 'b9', text: 'Cajoneras organizadas por insumo.' }
    ]
  },
  {
    id: 'C',
    name: 'C. EQUIPOS DE FRÍO',
    weight: 10,
    questions: [
      { id: 'c1', text: 'Neveras con nivel de temperatura correcta. (verificado por supervisor)' },
      { id: 'c2', text: 'Neveras con botellas correctamente perchadas y flujo de aire libre.' },
      { id: 'c3', text: 'Congeladoras sin acumulación de hielo.' },
      { id: 'c4', text: 'Cauchos de neveras en buen estado.' },
      { id: 'c5', text: 'Extractores de aire funcionando.' },
      { id: 'c6', text: 'Perillas de control equipos de frío en buen estado.' },
      { id: 'c7', text: 'Perillas de equipos de frío en el nivel correcto de temperatura.' },
      { id: 'c8', text: 'Neveras identificadas (bodega y venta).' },
      { id: 'c9', text: 'Congeladores perchados según nivel de altura indicado de cada equipo.' }
    ]
  },
  {
    id: 'D',
    name: 'D. INVENTARIOS',
    weight: 15,
    questions: [
      { id: 'd1', text: 'Caja chica completa y variada por denominación de moneda.' },
      { id: 'd2', text: 'Control de inventario según cuaderno de novedades.' },
      { id: 'd3', text: 'Stock de productos suficiente.' }
    ]
  },
  {
    id: 'E',
    name: 'E. IMAGEN DE MARCA',
    weight: 5,
    questions: [
      { id: 'e1', text: 'Material gráfico actualizado y en buen estado.' },
      { id: 'e2', text: 'Acrílicos en buen estado.' },
      { id: 'e3', text: 'Uniforme completo y en buen estado.' },
      { id: 'e4', text: 'Stickers de equipos actualizado en buen estado.' },
      { id: 'e5', text: 'Menú de productos actualizados.' }
    ]
  },
  {
    id: 'F',
    name: 'F. SEGURIDAD – TECNOLOGÍA Y CONTROL',
    weight: 10,
    questions: [
      { id: 'f1', text: 'Tomacorrientes en buen estado.' },
      { id: 'f2', text: 'Cables en buen estado.' },
      { id: 'f3', text: 'Ubicación adecuada de Extintor (si aplica).' },
      { id: 'f4', text: 'Equipos tecnológicos protegidos ( con UPS).' },
      { id: 'f5', text: 'Cobertores en buen estado.' },
      { id: 'f6', text: 'Candados y llaves en buen estado.' },
      { id: 'f7', text: 'Conexiones eléctricas en buen estado.' }
    ]
  },
  {
    id: 'G',
    name: 'G. CICLO DE VENTA Y GENERACIÓN DE INGRESOS',
    weight: 20,
    questions: [
      { id: 'g1', text: 'Saludo cordial y amable al cliente.' },
      { id: 'g2', text: 'Contacto visual y sonrisa.' },
      { id: 'g3', text: 'Explica opciones y tamaños.' },
      { id: 'g4', text: 'Ofrece producto adicional.' },
      { id: 'g5', text: 'Recomienda producto más vendido y/o promociones.' },
      { id: 'g6', text: 'Despacho ágil.' },
      { id: 'g7', text: 'Entrega producto correctamente.' },
      { id: 'g8', text: 'Solicita datos para factura.' },
      { id: 'g9', text: 'Entrega factura.' },
      { id: 'g10', text: 'Cierre amable y despedida.' }
    ]
  }
];

export interface GhostOption {
  label: string;
  points: number | null; // null means excluded (NE or N/A)
}

export interface GhostQuestion {
  id: string;
  code: string;
  text: string;
  type: 'ghost_choice' | 'text';
  ghostOptions?: GhostOption[];
}

export const ghostCategories = [
  {
    id: 'GHOST_1',
    name: 'Módulo Cliente Fantasma GEDALUMA (P1 - P12)',
    weight: 100,
    questions: [
      {
        id: 'p1',
        code: 'P1',
        text: 'P1. ¿La vendedora se comunicó de forma respetuosa durante toda la interacción?',
        type: 'ghost_choice',
        ghostOptions: [
          { label: 'Sí', points: 2 },
          { label: 'Parcial', points: 1 },
          { label: 'No', points: 0 },
          { label: 'NE: Interacción demasiado breve', points: null }
        ]
      },
      {
        id: 'p2',
        code: 'P2',
        text: 'P2. ¿La vendedora te saludó o reconoció tu presencia al llegar?',
        type: 'ghost_choice',
        ghostOptions: [
          { label: 'Sí por iniciativa propia', points: 2 },
          { label: 'Solo después de que yo iniciara interacción', points: 1 },
          { label: 'No saludó', points: 0 },
          { label: 'NE: No pudo evaluarse', points: null }
        ]
      },
      {
        id: 'p3',
        code: 'P3',
        text: 'P3. ¿La vendedora se mantuvo enfocada en la atención, sin distracciones personales o actividades irrelevantes?',
        type: 'ghost_choice',
        ghostOptions: [
          { label: 'Sí', points: 2 },
          { label: 'Parcial', points: 1 },
          { label: 'No', points: 0 },
          { label: 'NE: Interacción demasiado breve', points: null }
        ]
      },
      {
        id: 'p4',
        code: 'P4',
        text: 'P4. ¿Explicó las opciones o características del producto de manera clara?',
        type: 'ghost_choice',
        ghostOptions: [
          { label: 'Sí', points: 2 },
          { label: 'Parcial', points: 1 },
          { label: 'No', points: 0 },
          { label: 'N/A: No requería explicación', points: null },
          { label: 'NE: No se planteó pregunta', points: null }
        ]
      },
      {
        id: 'p5',
        code: 'P5',
        text: 'P5. ¿Recomendó un producto coherente con la necesidad expresada?',
        type: 'ghost_choice',
        ghostOptions: [
          { label: 'Sí', points: 2 },
          { label: 'Parcial', points: 1 },
          { label: 'No', points: 0 },
          { label: 'N/A: Pidió producto específico directamente', points: null },
          { label: 'NE: Escenario no ejecutado', points: null }
        ]
      },
      {
        id: 'p6',
        code: 'P6',
        text: 'P6. ¿Ofreció espontáneamente un producto complementario específico y relacionado con la compra?',
        type: 'ghost_choice',
        ghostOptions: [
          { label: 'Sí', points: 2 },
          { label: 'Parcial', points: 1 },
          { label: 'No', points: 0 },
          { label: 'NE: Interacción terminó imprevistamente', points: null }
        ]
      },
      {
        id: 'p7',
        code: 'P7',
        text: 'P7. Considerando toda la experiencia, ¿cómo calificarías la atención recibida?',
        type: 'ghost_choice',
        ghostOptions: [
          { label: 'Excelente', points: 2 },
          { label: 'Aceptable', points: 1 },
          { label: 'Deficiente', points: 0 }
        ]
      },
      {
        id: 'p8',
        code: 'P8',
        text: 'P8. ¿Preguntó "Desea factura con datos o consumidor final"?',
        type: 'ghost_choice',
        ghostOptions: [
          { label: 'Sí', points: 2 },
          { label: 'No', points: 0 },
          { label: 'NE: Pago no completado', points: null }
        ]
      },
      {
        id: 'p9',
        code: 'P9',
        text: 'P9. ¿La vendedora confirmó y facilitó adecuadamente la forma de pago?',
        type: 'ghost_choice',
        ghostOptions: [
          { label: 'Sí confirmó y procesó fluido', points: 2 },
          { label: 'Parcial o lento sin errores', points: 1 },
          { label: 'No/Errores/Molestia', points: 0 },
          { label: 'NE: Pago no completado', points: null }
        ]
      },
      {
        id: 'p10',
        code: 'P10',
        text: 'P10. ¿La vendedora te entregó el ticket o comprobante de venta impreso?',
        type: 'ghost_choice',
        ghostOptions: [
          { label: 'Sí', points: 2 },
          { label: 'No entregó/Dijo que no imprimía', points: 0 }
        ]
      },
      {
        id: 'p11',
        code: 'P11',
        text: 'P11. ¿El producto requerido estaba disponible o se ofreció alternativa adecuada proactivamente?',
        type: 'ghost_choice',
        ghostOptions: [
          { label: 'Sí/Alternativa exitosa', points: 2 },
          { label: 'Parcial/Alternativa pasiva', points: 1 },
          { label: 'No hay', points: 0 },
          { label: 'N/A: No aplica', points: null }
        ]
      },
      {
        id: 'p12',
        code: 'P12',
        text: 'P12. Observaciones: Describe una conducta concreta que podría mejorar: qué hizo o dejó de hacer y qué habría sido preferible.',
        type: 'text'
      }
    ]
  }
];

export function calculateGhostKPI(responsesMap: Record<string, { value?: string | number }>) {
  let puntosObtenidos = 0;
  let puntosMaximos = 0;

  const questions = ghostCategories[0].questions;
  questions.forEach(q => {
    if (q.type === 'ghost_choice' && q.ghostOptions) {
      const selectedValue = responsesMap[q.id]?.value;
      const matchedOpt = q.ghostOptions.find(opt => opt.label === selectedValue);
      
      if (matchedOpt && matchedOpt.points !== null && matchedOpt.points !== undefined) {
        puntosObtenidos += matchedOpt.points;
        puntosMaximos += 2; // Each evaluable question has max 2 points
      }
    }
  });

  const percentage = puntosMaximos > 0 ? Number(((puntosObtenidos / puntosMaximos) * 100).toFixed(2)) : 0;
  
  let rango = '';
  let bono = '';
  let accion = '';
  let color = '';

  if (percentage >= 90) {
    rango = '90% - 100%';
    bono = 'Califica 100% al bono de calidad';
    accion = 'Reconocimiento en acta mensual.';
    color = '#009C48';
  } else if (percentage >= 75) {
    rango = '75% - 89%';
    bono = 'Califica 50% del bono';
    accion = 'Plan de refuerzo individual por Richard.';
    color = '#f7b500';
  } else {
    rango = 'Menor a 75%';
    bono = 'No califica al bono en el periodo';
    accion = 'Capacitación obligatoria y auditoría de seguimiento.';
    color = 'var(--danger)';
  }

  return {
    puntosObtenidos,
    puntosMaximos,
    percentage,
    rango,
    bono,
    accion,
    color
  };
}

export interface PenaltyItem {
  id: number;
  severity: 'Leve' | 'Moderada' | 'Grave' | 'Crítica';
  title: string;
  description: string;
}

export const penaltyCatalog: PenaltyItem[] = [
  // FALTAS LEVES
  { id: 2, severity: 'Leve', title: 'ID 2: Atrasos (Hasta 3 por mes)', description: 'Atrasos (Hasta 3 por mes).' },
  { id: 5, severity: 'Leve', title: 'ID 5: Dejar sucia la isla al cierre', description: 'Dejar sucia la isla al cierre.' },
  { id: 6, severity: 'Leve', title: 'ID 6: Dejar implementos sobre el mostrador', description: 'Dejar implementos sobre el mostrador.' },
  { id: 7, severity: 'Leve', title: 'ID 7: Conversar con amigos/familiares en horario laboral', description: 'Conversar con amigos/familiares en horario laboral.' },
  { id: 19, severity: 'Leve', title: 'ID 19: No uso correcto del uniforme completo', description: 'No uso correcto del uniforme completo.' },

  // FALTAS MODERADAS
  { id: 3, severity: 'Moderada', title: 'ID 3: No avisar cambios de turno', description: 'No avisar cambios de turno.' },
  { id: 10, severity: 'Moderada', title: 'ID 10: Cierres con información incompleta o desordenados', description: 'Cierres con información incompleta o desordenados.' },
  { id: 11, severity: 'Moderada', title: 'ID 11: No prever cantidades adecuadas de producto (Abastecimiento)', description: 'No prever cantidades adecuadas de producto (Abastecimiento).' },
  { id: 12, severity: 'Moderada', title: 'ID 12: Omitir adjuntar recibos/ingresos en cierres', description: 'Omitir adjuntar recibos/ingresos en cierres.' },
  { id: 17, severity: 'Moderada', title: 'ID 17: Olvidar entregar cierres a oficina', description: 'Olvidar entregar cierres a oficina.' },
  { id: 20, severity: 'Moderada', title: 'ID 20: No realizar depósitos en los días asignados', description: 'No realizar depósitos en los días asignados.' },
  { id: 21, severity: 'Moderada', title: 'ID 21: No ingresar productos recibidos al sistema', description: 'No ingresar productos recibidos al sistema.' },

  // FALTAS GRAVES
  { id: 4, severity: 'Grave', title: 'ID 4: No facturar al momento de la venta', description: 'No facturar al momento de la venta.' },
  { id: 8, severity: 'Grave', title: 'ID 8: Mal uso del enlace de puntos de venta (Internet)', description: 'Mal uso del enlace de puntos de venta (Internet).' },
  { id: 9, severity: 'Grave', title: 'ID 9: Salir del lugar sin autorización (Abandono)', description: 'Salir del lugar sin autorización (Abandono).' },
  { id: 13, severity: 'Grave', title: 'ID 13: No contar inventario al inicio/cierre', description: 'No contar inventario al inicio/cierre.' },
  { id: 14, severity: 'Grave', title: 'ID 14: Seguir secuencia numérica sin conteo físico real', description: 'Seguir secuencia numérica sin conteo físico real.' },
  { id: 15, severity: 'Grave', title: 'ID 15: No reportar novedades (merma, devoluciones) en canales oficiales', description: 'No reportar novedades (merma, devoluciones) en canales oficiales.' },
  { id: 18, severity: 'Grave', title: 'ID 18: Firmar facturas sin verificar la mercadería completa', description: 'Firmar facturas sin verificar la mercadería completa.' },
  { id: 25, severity: 'Grave', title: 'ID 25: Daño o pérdida de producto por negligencia o romper cadena de frío', description: 'Daño o pérdida de producto por negligencia o romper cadena de frío.' },
  { id: 26, severity: 'Grave', title: 'ID 26: Ingreso de datos erróneos en PDV (3 o más veces/mes) u omisiones', description: 'Ingreso de datos erróneos en PDV (3 o más veces/mes) u omisiones.' },

  // FALTAS CRÍTICAS
  { id: 1, severity: 'Crítica', title: 'ID 1: Falta de autoridad o respeto a superiores/compañeros', description: 'Falta de autoridad o respeto a superiores/compañeros.' },
  { id: 16, severity: 'Crítica', title: 'ID 16: Engañar al cliente en el cobro', description: 'Engañar al cliente en el cobro.' },
  { id: 22, severity: 'Crítica', title: 'ID 22: Sustraer valores de caja chica', description: 'Sustraer valores de caja chica.' },
  { id: 23, severity: 'Crítica', title: 'ID 23: Alteración o manipulación de sistemas de venta', description: 'Alteración o manipulación de sistemas de venta.' },
  { id: 24, severity: 'Crítica', title: 'ID 24: Venta con fechas borradas, calidad alterada o reutilización de envases', description: 'Venta con fechas borradas, calidad alterada o reutilización de envases.' }
];

export function calculatePenaltyAmount(
  severity: 'Leve' | 'Moderada' | 'Grave' | 'Crítica',
  occurrenceIndex: number
): { amount: number; isCriticalAlert: boolean; message: string } {
  if (severity === 'Leve') {
    // 1ra y 2da vez: $0.00 (Registro preventivo). 3ra: $2.00, 4ta: $3.00, 5ta: $4.00, 6ta o más: $5.00 c/u.
    const rates = [0, 0, 2.00, 3.00, 4.00, 5.00];
    const amount = occurrenceIndex <= rates.length ? rates[occurrenceIndex - 1] : 5.00;
    const message = (occurrenceIndex === 1 || occurrenceIndex === 2)
      ? `Ocurrencia #${occurrenceIndex} del mes en Faltas Leves -> $0.00 (Registro preventivo)`
      : `Ocurrencia #${occurrenceIndex} del mes en Faltas Leves -> Ajuste: $${amount.toFixed(2)}`;
    return { amount, isCriticalAlert: false, message };
  }

  if (severity === 'Moderada') {
    // 1ra: $2.00, 2da: $2.50, 3ra: $3.00, 4ta: $3.50, 5ta: $4.00, 6ta o más: $5.00 c/u.
    const rates = [2.00, 2.50, 3.00, 3.50, 4.00, 5.00];
    const amount = occurrenceIndex <= rates.length ? rates[occurrenceIndex - 1] : 5.00;
    const message = `Ocurrencia #${occurrenceIndex} del mes en Faltas Moderadas -> Ajuste: $${amount.toFixed(2)}`;
    return { amount, isCriticalAlert: false, message };
  }

  if (severity === 'Grave') {
    // 1ra: $10.00, 2da: $11.00, 3ra: $12.00, 4ta: $13.00, 5ta o más: $14.00.
    const rates = [10.00, 11.00, 12.00, 13.00, 14.00];
    const amount = occurrenceIndex <= rates.length ? rates[occurrenceIndex - 1] : 14.00;
    const message = `Ocurrencia #${occurrenceIndex} del mes en Faltas Graves -> Ajuste: $${amount.toFixed(2)}`;
    return { amount, isCriticalAlert: false, message };
  }

  if (severity === 'Crítica') {
    return { 
      amount: 0, 
      isCriticalAlert: true, 
      message: '🚨 Visto bueno inmediato para inicio de proceso de desvinculación (Tolerancia Cero / Despido).' 
    };
  }

  return { amount: 0, isCriticalAlert: false, message: '' };
}

export const penaltyPolicies = {
  'Leve': { name: 'Leve', impact: 'Estética y Disciplina' },
  'Moderada': { name: 'Moderada', impact: 'Trazabilidad Operativa' },
  'Grave': { name: 'Grave', impact: 'Rentabilidad y Seguridad' },
  'Crítica': { name: 'Crítica', impact: 'Integridad Ética (Despido)' }
};

export interface InventoryProduct {
  id: string;
  category: 'COCOEXPRESS' | 'KELAO';
  name: string;
  unit: 'UN' | 'LT' | 'GR';
  cost: number;
}

export const inventoryProductsCatalog: InventoryProduct[] = [
  // CATEGORÍA 1: COCOEXPRESS (45 Productos)
  { id: 'inv_coco_1', category: 'COCOEXPRESS', name: 'Aceite Coco Express 200ml', unit: 'UN', cost: 9.00 },
  { id: 'inv_coco_2', category: 'COCOEXPRESS', name: 'Aceite Coco Express 400ml', unit: 'UN', cost: 16.50 },
  { id: 'inv_coco_3', category: 'COCOEXPRESS', name: 'Agua Botella 1lt', unit: 'UN', cost: 5.00 },
  { id: 'inv_coco_4', category: 'COCOEXPRESS', name: 'Agua Botella 250', unit: 'UN', cost: 1.50 },
  { id: 'inv_coco_5', category: 'COCOEXPRESS', name: 'Agua Botella 370', unit: 'UN', cost: 2.00 },
  { id: 'inv_coco_6', category: 'COCOEXPRESS', name: 'Agua Botella 500', unit: 'UN', cost: 2.50 },
  { id: 'inv_coco_7', category: 'COCOEXPRESS', name: 'Agua Botella Vidrio 310', unit: 'UN', cost: 2.00 },
  { id: 'inv_coco_8', category: 'COCOEXPRESS', name: 'Alfajor Blanco', unit: 'UN', cost: 1.30 },
  { id: 'inv_coco_9', category: 'COCOEXPRESS', name: 'Alfajor Chocolate', unit: 'UN', cost: 1.30 },
  { id: 'inv_coco_10', category: 'COCOEXPRESS', name: 'Alfajor Grande', unit: 'UN', cost: 1.55 },
  { id: 'inv_coco_11', category: 'COCOEXPRESS', name: 'Alfajor Pequeño', unit: 'UN', cost: 1.10 },
  { id: 'inv_coco_12', category: 'COCOEXPRESS', name: 'Base Soft Coco', unit: 'LT', cost: 5.89 },
  { id: 'inv_coco_13', category: 'COCOEXPRESS', name: 'Bolitas De Coco', unit: 'UN', cost: 1.80 },
  { id: 'inv_coco_14', category: 'COCOEXPRESS', name: 'Botella 250 Refresco Lleno', unit: 'UN', cost: 1.80 },
  { id: 'inv_coco_15', category: 'COCOEXPRESS', name: 'Botella 370 Refresco Lleno', unit: 'UN', cost: 2.30 },
  { id: 'inv_coco_16', category: 'COCOEXPRESS', name: 'Cocada Manjar', unit: 'UN', cost: 0.80 },
  { id: 'inv_coco_17', category: 'COCOEXPRESS', name: 'Cocada Volcan', unit: 'UN', cost: 1.00 },
  { id: 'inv_coco_18', category: 'COCOEXPRESS', name: 'Cono', unit: 'UN', cost: 1.25 },
  { id: 'inv_coco_19', category: 'COCOEXPRESS', name: 'Galleta Avena', unit: 'UN', cost: 1.55 },
  { id: 'inv_coco_20', category: 'COCOEXPRESS', name: 'Galleta Coco', unit: 'UN', cost: 0.95 },
  { id: 'inv_coco_21', category: 'COCOEXPRESS', name: 'Helado Chocolate Medio lt', unit: 'UN', cost: 4.60 },
  { id: 'inv_coco_22', category: 'COCOEXPRESS', name: 'Helado Coco Medio lt', unit: 'UN', cost: 4.60 },
  { id: 'inv_coco_23', category: 'COCOEXPRESS', name: 'Helado Cremoso Medio lt', unit: 'UN', cost: 5.70 },
  { id: 'inv_coco_24', category: 'COCOEXPRESS', name: 'Helado Paleta Chocolate', unit: 'UN', cost: 1.25 },
  { id: 'inv_coco_25', category: 'COCOEXPRESS', name: 'Helado Paleta Coco Clasica', unit: 'UN', cost: 1.30 },
  { id: 'inv_coco_26', category: 'COCOEXPRESS', name: 'Helado Paleta Coco Cuadrada', unit: 'UN', cost: 1.25 },
  { id: 'inv_coco_27', category: 'COCOEXPRESS', name: 'Helado Paleta Coco/Menta', unit: 'UN', cost: 1.30 },
  { id: 'inv_coco_28', category: 'COCOEXPRESS', name: 'Helado Paleta Vegana', unit: 'UN', cost: 1.50 },
  { id: 'inv_coco_29', category: 'COCOEXPRESS', name: 'Helado Vasito Chocolate', unit: 'UN', cost: 1.55 },
  { id: 'inv_coco_30', category: 'COCOEXPRESS', name: 'Helado Vasito Coco', unit: 'UN', cost: 1.55 },
  { id: 'inv_coco_31', category: 'COCOEXPRESS', name: 'Helado Vasito Cremoso', unit: 'UN', cost: 1.80 },
  { id: 'inv_coco_32', category: 'COCOEXPRESS', name: 'Helado Vasito Vegano', unit: 'UN', cost: 1.80 },
  { id: 'inv_coco_33', category: 'COCOEXPRESS', name: 'Helado Vegano Medio lt', unit: 'UN', cost: 5.70 },
  { id: 'inv_coco_34', category: 'COCOEXPRESS', name: 'Jalea ChocoAvellana', unit: 'GR', cost: 10.95 },
  { id: 'inv_coco_35', category: 'COCOEXPRESS', name: 'Jalea Maracuya', unit: 'GR', cost: 3.60 },
  { id: 'inv_coco_36', category: 'COCOEXPRESS', name: 'Jalea Mora', unit: 'GR', cost: 3.60 },
  { id: 'inv_coco_37', category: 'COCOEXPRESS', name: 'Jugo Coco Stevia 250', unit: 'UN', cost: 2.00 },
  { id: 'inv_coco_38', category: 'COCOEXPRESS', name: 'Jugo Coco Stevia 370', unit: 'UN', cost: 2.50 },
  { id: 'inv_coco_39', category: 'COCOEXPRESS', name: 'Leche Coco 1lt', unit: 'UN', cost: 10.00 },
  { id: 'inv_coco_40', category: 'COCOEXPRESS', name: 'Paleta Madera', unit: 'UN', cost: 0.0276 },
  { id: 'inv_coco_41', category: 'COCOEXPRESS', name: 'Refresco Leche/Coco Al Granel', unit: 'LT', cost: 2.415 },
  { id: 'inv_coco_42', category: 'COCOEXPRESS', name: 'Vaso 4oz Soft', unit: 'UN', cost: 0.096 },
  { id: 'inv_coco_43', category: 'COCOEXPRESS', name: 'Vaso 6oz Soft', unit: 'UN', cost: 2.00 },
  { id: 'inv_coco_44', category: 'COCOEXPRESS', name: 'Vaso 7oz Sundae Avellana', unit: 'UN', cost: 2.50 },
  { id: 'inv_coco_45', category: 'COCOEXPRESS', name: 'Vaso 8oz', unit: 'UN', cost: 1.45 },

  // CATEGORÍA 2: KELAO (8 Productos)
  { id: 'inv_kelao_1', category: 'KELAO', name: 'Choco rocher 1/8', unit: 'UN', cost: 3.25 },
  { id: 'inv_kelao_2', category: 'KELAO', name: 'Chocolate brownie 1/8', unit: 'UN', cost: 2.75 },
  { id: 'inv_kelao_3', category: 'KELAO', name: 'Coco maracuya 1/8', unit: 'UN', cost: 2.75 },
  { id: 'inv_kelao_4', category: 'KELAO', name: 'Coco sin azucar 1/8', unit: 'UN', cost: 3.25 },
  { id: 'inv_kelao_5', category: 'KELAO', name: 'Coffe tiramisu 1/8', unit: 'UN', cost: 2.75 },
  { id: 'inv_kelao_6', category: 'KELAO', name: 'Cookies & cream 1/8', unit: 'UN', cost: 3.25 },
  { id: 'inv_kelao_7', category: 'KELAO', name: 'Maracuya sin Azucar 1/8', unit: 'UN', cost: 3.25 },
  { id: 'inv_kelao_8', category: 'KELAO', name: 'Mocha latte 1/8', unit: 'UN', cost: 3.25 }
];

export const getStoredInventoryProducts = (): InventoryProduct[] => {
  const saved = localStorage.getItem('gedaluma_inventory_products_v2');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    } catch (e) {}
  }
  return inventoryProductsCatalog;
};

export const saveStoredInventoryProducts = (products: InventoryProduct[]) => {
  localStorage.setItem('gedaluma_inventory_products_v2', JSON.stringify(products));
};
