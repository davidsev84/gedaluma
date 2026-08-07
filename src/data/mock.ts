import type { User, Isla, Category } from '../types';

export const mockUsers: User[] = [
  { id: '1', name: 'Admin', role: 'admin', pin: '1234' },
  { id: '2', name: 'Supervisor Richard', role: 'evaluator', pin: '5678' },
  { id: '3', name: 'Cliente Fantasma', role: 'ghost', pin: '0000' },
];

export const mockIslas: Isla[] = [
  { id: '1', name: 'ALBAN', location: 'Guayaquil', manager: 'N/A' },
  { id: '2', name: 'JUAN TANCA', location: 'Guayaquil', manager: 'N/A' },
  { id: '3', name: 'CALIFORNIA', location: 'Guayaquil', manager: 'N/A' },
  { id: '4', name: 'DAULE', location: 'Daule', manager: 'N/A' },
  { id: '5', name: 'PASEO DAULE', location: 'Daule', manager: 'N/A' },
  { id: '6', name: 'TERMINAL', location: 'Guayaquil', manager: 'N/A' },
  { id: '7', name: 'SALINAS', location: 'Salinas', manager: 'N/A' },
  { id: '8', name: 'PUERTO AZUL', location: 'Guayaquil', manager: 'N/A' },
];

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

export const penaltyPolicies = {
  'Leve': {
    name: 'Leve',
    impact: 'Estética y Disciplina',
    options: [
      '2. Atrasos', 
      '5. Orden de Isla', 
      '6. Implementos', 
      '7. Atención', 
      '19. Uniforme'
    ],
    amounts: [0, 1.50]
  },
  'Moderada': {
    name: 'Moderada',
    impact: 'Trazabilidad Operativa',
    options: [
      '3. Notificaciones', 
      '10. Cierres', 
      '11. Abastecimiento', 
      '12. Soporte', 
      '17. Entrega de Cierres',
      '20. Depósitos',
      '21. Ingreso al Sistema'
    ],
    amounts: [3.00, 5.00]
  },
  'Grave': {
    name: 'Grave',
    impact: 'Rentabilidad y Seguridad',
    options: [
      '4. Facturación',
      '8. Internet',
      '9. Abandono',
      '13. Inventario Físico',
      '14. Secuencia',
      '15. Novedades',
      '18. Verificación',
      '25. Mala Manipulación de Producto',
      '26. Registro Recurrente e Incorrecto de Información en el Sistema de Punto de Venta (PDV)'
    ],
    amounts: [10.00, 14.00]
  },
  'Crítica': {
    name: 'Crítica',
    impact: 'Integridad Ética (Despido)',
    options: [
      '1. Respeto',
      '16. Engaño',
      '22. Sustracción',
      '23. Sistemas',
      '24. Calidad/Caducidad'
    ],
    amounts: [0]
  }
};
