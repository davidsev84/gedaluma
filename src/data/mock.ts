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
  { id: '4', name: 'DAULE', location: 'Guayaquil', manager: 'N/A' },
  { id: '5', name: 'TERMINAL', location: 'Guayaquil', manager: 'N/A' },
  { id: '6', name: 'SALINAS', location: 'Salinas', manager: 'N/A' },
  { id: '7', name: 'PUERTO AZUL', location: 'Guayaquil', manager: 'N/A' },
];

export const mockEmployees = [
  { id: 'e1', name: 'Virginia' },
  { id: 'e2', name: 'Susana' },
  { id: 'e3', name: 'Yamile' },
  { id: 'e4', name: 'Teresa' },
  { id: 'e5', name: 'Johana' },
  { id: 'e6', name: 'Daysy' },
  { id: 'e7', name: 'Liliana' },
  { id: 'e8', name: 'Carmen' },
  { id: 'e9', name: 'Jackie' },
  { id: 'e10', name: 'Andrea' },
  { id: 'e11', name: 'Maritza' },
  { id: 'e12', name: 'Gabriel' },
  { id: 'e13', name: 'Shirley' }
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

export const ghostCategories: Category[] = [
  {
    id: 'GHOST_1',
    name: 'Experiencia del Cliente Fantasma',
    weight: 0, // No percentage calculation for ghost client for now
    questions: [
      { id: 'gh1', text: '¿La vendedora usa el uniforme completo y limpio?', type: 'choice', options: ['Sí', 'Más o menos', 'No'] },
      { id: 'gh2', text: '¿La presentación personal es adecuada (orden, aseo)?', type: 'choice', options: ['Sí', 'Más o menos', 'No'] },
      { id: 'gh3', text: '¿La actitud fue amable y respetuosa durante toda la atención?', type: 'choice', options: ['Sí', 'Más o menos', 'No'] },
      { id: 'gh4', text: '¿Saludó al cliente al llegar?', type: 'choice', options: ['Sí', 'No'] },
      { id: 'gh5', text: '¿Mantuvo contacto visual y trato cordial?', type: 'choice', options: ['Sí', 'Más o menos', 'No'] },
      { id: 'gh6', text: '¿Interactuó durante la compra (preguntó, explicó, sugirió)?', type: 'choice', options: ['Sí', 'No', 'Poco'] },
      { id: 'gh7', text: '¿Ofreció algún producto adicional o complemento?', type: 'choice', options: ['Sí', 'No', 'Lo pensó pero no lo hizo'] },
      { id: 'gh8', text: '¿Transmitió seguridad al momento de atender y vender?', type: 'choice', options: ['Sí', 'Más o menos', 'No'] },
      { id: 'gh9', text: 'En general, ¿cómo calificas el trato recibido?', type: 'choice', options: ['Malo', 'Regular', 'Bueno', 'Muy Bueno'] },
      { id: 'gh10', text: '¿Te sentiste cómodo y bien atendido durante toda la compra?', type: 'choice', options: ['Sí', 'Más o menos', 'No'] },
      { id: 'gh11', text: '¿La vendedora te ofreció factura y solicitó tus datos para emitirla?', type: 'choice', options: ['No ofreció factura', 'Ofreció factura, pero no pidió los datos', 'Sí, ofreció factura y pidió los datos'] },
      { id: 'gh12', text: '¿Qué fue lo mejor de la atención?', type: 'text' },
      { id: 'gh13', text: '¿Qué podría mejorar?', type: 'text' }
    ]
  }
];

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
