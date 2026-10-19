import type { CategoryV3 } from '../types';

export const categoriesV3: CategoryV3[] = [
  {
    "id": "A",
    "code": "A",
    "name": "A. ORDEN, LIMPIEZA Y PRESENTACIÓN",
    "weight": 20,
    "questions": [
      {
        "id": "a1",
        "code": "A1",
        "text": "A1. Exteriores de isla inferiores limpios.",
        "isCritical": false,
        "rubrics": {
          "0": "Existe suciedad evidente, acumulada o generalizada en las superficies inferiores, incompatible con el estándar de presentación GEDALUMA.",
          "40": "Se observan varias zonas con polvo, manchas o residuos visibles que deterioran la presentación y requieren limpieza específica.",
          "70": "Se identifica una mancha o suciedad menor, localizada y de corrección inmediata, sin afectar de forma relevante la imagen general.",
          "100": "Todas las superficies exteriores inferiores están limpias, sin polvo, residuos, derrames, grasa ni suciedad visible.",
          "NA": "Solo si la configuración física de la isla no posee superficies inferiores evaluables."
        }
      },
      {
        "id": "a2",
        "code": "A2",
        "text": "A2. Exteriores de isla superiores limpios.",
        "isCritical": false,
        "rubrics": {
          "0": "Existe suciedad evidente, acumulada o generalizada que afecta directamente la presentación e higiene visual de la isla.",
          "40": "Se observan varias zonas con polvo, manchas o residuos, o una zona claramente descuidada y visible para el cliente.",
          "70": "Existe una condición menor y localizada (polvo o una mancha puntual), fácilmente corregible y sin impacto significativo en la imagen.",
          "100": "Toda la superficie exterior superior está limpia, libre de polvo, residuos, manchas, grasa u objetos ajenos a la operación.",
          "NA": "Solo si la configuración física de la isla no posee superficies superiores evaluables."
        }
      },
      {
        "id": "a3",
        "code": "A3",
        "text": "A3. Paneles de vidrio sin manchas.",
        "isCritical": false,
        "rubrics": {
          "0": "Los vidrios presentan suciedad notoria, generalizada o acumulada que afecta claramente la imagen de la isla.",
          "40": "Existen varias huellas, manchas o marcas claramente visibles en uno o varios paneles y requieren limpieza.",
          "70": "Se observa una huella, marca o mancha menor y localizada, poco perceptible en la presentación general.",
          "100": "Todos los paneles visibles están transparentes y limpios, sin huellas, grasa, polvo, salpicaduras, residuos ni marcas visibles.",
          "NA": "Solo si la isla evaluada no dispone de paneles de vidrio."
        }
      },
      {
        "id": "a4",
        "code": "A4",
        "text": "A4. Rejillas de equipos y luminarias limpias.",
        "isCritical": false,
        "rubrics": {
          "0": "Existe suciedad abundante, grasa o acumulación generalizada, o la condición puede afectar ventilación, iluminación o higiene.",
          "40": "Hay suciedad visible en varios elementos o acumulación que requiere limpieza programada prioritaria.",
          "70": "Existe acumulación leve y localizada en un elemento, sin obstrucción ni impacto relevante.",
          "100": "Todas las rejillas y luminarias observables están libres de polvo, grasa, residuos y acumulaciones.",
          "NA": "Solo si la isla no dispone del elemento evaluado."
        }
      },
      {
        "id": "a5",
        "code": "A5",
        "text": "A5. Mesones limpios y ordenados.",
        "isCritical": false,
        "rubrics": {
          "0": "El mesón presenta suciedad, residuos, derrames o desorden generalizado que compromete la operación o la imagen.",
          "40": "Hay desorden o suciedad visible en parte del mesón que reduce el espacio útil o deteriora la presentación.",
          "70": "Existe un elemento fuera de lugar o una marca menor, corregible de inmediato sin afectar la atención.",
          "100": "Todos los mesones están limpios, secos, despejados y con únicamente los elementos necesarios para la operación.",
          "NA": "Solo si la isla no cuenta con mesón evaluable."
        }
      },
      {
        "id": "a6",
        "code": "A6",
        "text": "A6. Cajoneras limpias y ordenadas.",
        "isCritical": false,
        "rubrics": {
          "0": "Existe suciedad o desorden generalizado, residuos acumulados o almacenamiento incompatible con el estándar.",
          "40": "Varias cajoneras presentan desorden, residuos o mezcla de elementos que dificulta el control y requiere reorganización.",
          "70": "Una cajonera presenta desorden o suciedad menor y localizada, sin afectar el control general.",
          "100": "Las cajoneras revisadas están limpias, sin residuos, con insumos organizados y acceso funcional.",
          "NA": "Solo si la isla no posee cajoneras."
        }
      },
      {
        "id": "a7",
        "code": "A7",
        "text": "A7. Paños (2) / trapeador limpios.",
        "isCritical": false,
        "rubrics": {
          "0": "Los implementos están sucios, contaminados, con mal olor o no aptos para limpieza; o faltan los implementos requeridos.",
          "40": "Uno o más elementos presentan suciedad evidente o condición deficiente que limita su uso higiénico.",
          "70": "Uno de los elementos presenta desgaste o suciedad leve, pero sigue apto y puede corregirse/cambiarse inmediatamente.",
          "100": "Los dos paños y el trapeador están limpios, en condición higiénica y disponibles para su uso correspondiente.",
          "NA": "Solo si GEDALUMA determina formalmente que alguno de estos implementos no corresponde a esa isla."
        }
      },
      {
        "id": "a8",
        "code": "A8",
        "text": "A8. Piso limpio.",
        "isCritical": false,
        "rubrics": {
          "0": "Existe suciedad o derrame generalizado, acumulación de residuos o una condición que además genera riesgo de caída.",
          "40": "Se observan varias áreas sucias, húmedas o con residuos que requieren intervención y afectan la presentación.",
          "70": "Existe una mancha o residuo menor y localizado, sin riesgo y corregible inmediatamente.",
          "100": "Todo el piso del área de la isla está limpio, seco, sin residuos, manchas, derrames ni obstáculos.",
          "NA": "Solo si el piso del área no está bajo responsabilidad operativa de la isla y esto está previamente definido."
        }
      },
      {
        "id": "a9",
        "code": "A9",
        "text": "A9. Área de lavabo limpia y seca.",
        "isCritical": false,
        "rubrics": {
          "0": "Existe suciedad, residuos, acumulación, mal olor o condición antihigiénica evidente en el área.",
          "40": "Hay humedad persistente, manchas, residuos o desorden visible que requiere limpieza específica.",
          "70": "Existe humedad o una marca menor y localizada, sin residuos ni condición antihigiénica.",
          "100": "Lavabo, grifería y superficie inmediata están limpios, secos, sin residuos, manchas, acumulación ni objetos impropios.",
          "NA": "Solo si la isla no dispone de lavabo propio."
        }
      },
      {
        "id": "a10",
        "code": "A10",
        "text": "A10. Neveras limpias.",
        "isCritical": false,
        "rubrics": {
          "0": "Existe suciedad generalizada, residuos acumulados, derrames antiguos, olores o condición que compromete higiene del equipo.",
          "40": "Existe suciedad visible en varias zonas o un derrame/residuo que requiere limpieza prioritaria.",
          "70": "Se detecta una marca o suciedad menor localizada que no entra en contacto con producto y es corregible de inmediato.",
          "100": "Interior y exterior observable de las neveras están limpios, sin derrames, residuos, manchas, olores ni acumulación.",
          "NA": "Solo si la isla no dispone de neveras."
        }
      },
      {
        "id": "a11",
        "code": "A11",
        "text": "A11. Congelador con filos limpios.",
        "isCritical": false,
        "rubrics": {
          "0": "Hay acumulación evidente o generalizada de suciedad/residuos en filos y uniones, incompatible con higiene esperada.",
          "40": "Se observan varios bordes con suciedad o residuos visibles que requieren limpieza detallada.",
          "70": "Existe suciedad leve y localizada en un borde, corregible inmediatamente.",
          "100": "Todos los filos, bordes y uniones visibles del congelador están limpios y sin residuos, grasa o acumulación.",
          "NA": "Solo si la isla no dispone de congelador."
        }
      },
      {
        "id": "a12",
        "code": "A12",
        "text": "A12. Sobre de documentos legales completos.",
        "isCritical": false,
        "rubrics": {
          "0": "No se dispone del sobre/documentación esencial, o existe documentación legal obligatoria vencida o no disponible.",
          "40": "Faltan varios documentos requeridos, hay documentos desactualizados o el expediente está incompleto y requiere regularización.",
          "70": "Está disponible y vigente lo esencial, pero falta un documento secundario/copia o existe una necesidad menor de actualización.",
          "100": "El sobre contiene todos los documentos legales exigidos para la isla, vigentes, legibles, organizados y disponibles.",
          "NA": "Solo si un documento específico no es exigible a esa isla; debe justificarse."
        }
      },
      {
        "id": "a13",
        "code": "A13",
        "text": "A13. Bitácoras al día (limpieza y equipos).",
        "isCritical": false,
        "rubrics": {
          "0": "Las bitácoras no existen, no se usan o presentan vacíos generalizados que impiden demostrar el control.",
          "40": "Hay varios vacíos, retrasos o inconsistencias que impiden un seguimiento confiable de parte del período.",
          "70": "Existe uno o pocos registros pendientes o incompletos recientes, sin pérdida del seguimiento general.",
          "100": "Las bitácoras requeridas están completas hasta la fecha/turno correspondiente, legibles, coherentes y con registros verificables.",
          "NA": "Solo si una bitácora específica no corresponde al equipo/proceso existente en esa isla."
        }
      }
    ]
  },
  {
    "id": "B",
    "code": "B",
    "name": "B. BPM – MANEJO DE ALIMENTOS",
    "weight": 20,
    "questions": [
      {
        "id": "b1",
        "code": "B1",
        "text": "B1. Conos protegidos con capucha.",
        "isCritical": true,
        "rubrics": {
          "0": "Los conos están expuestos sin protección o en una condición que compromete su higiene.",
          "40": "Varios conos o un recipiente permanecen parcialmente expuestos o la protección se aplica de manera inconsistente.",
          "70": "Se detecta una desviación puntual de protección, corregida inmediatamente, sin evidencia de contaminación.",
          "100": "Todos los conos almacenados/expuestos están protegidos correctamente con la capucha definida, sin exposición innecesaria.",
          "NA": "Solo si no hay conos disponibles/operativos durante toda la evaluación."
        }
      },
      {
        "id": "b2",
        "code": "B2",
        "text": "B2. Productos sin caducar.",
        "isCritical": true,
        "rubrics": {
          "0": "Se encuentra al menos un producto caducado disponible para uso/venta o sin posibilidad razonable de verificar su vigencia.",
          "40": "Se detectan fallas relevantes de rotación o identificación que dificultan asegurar el control de vigencia, aunque no se confirma producto caducado.",
          "70": "Todos están vigentes, pero se detecta una desviación menor de rotación/identificación o un producto próximo a vencer que requiere gestión.",
          "100": "Todos los productos revisados están dentro de su fecha de vigencia y correctamente identificados para control.",
          "NA": "Solo si no existe producto sujeto a fecha de caducidad en el momento de la evaluación."
        }
      },
      {
        "id": "b3",
        "code": "B3",
        "text": "B3. Uso correcto de guantes (jugo – base – conos).",
        "isCritical": true,
        "rubrics": {
          "0": "No se usan cuando corresponde, se reutilizan de forma inadecuada o existe una práctica que compromete directamente la inocuidad.",
          "40": "El uso es inconsistente en varias oportunidades o existe una práctica que aumenta el riesgo y requiere reentrenamiento inmediato.",
          "70": "Se observa una desviación menor y aislada en técnica/cambio, corregida inmediatamente y sin contaminación del producto.",
          "100": "En todas las manipulaciones observadas que requieren guantes, se usan correctamente, se cambian cuando corresponde y no hay contaminación cruzada observable.",
          "NA": "Solo si durante la evaluación no ocurre ninguna manipulación que requiera guantes."
        }
      },
      {
        "id": "b4",
        "code": "B4",
        "text": "B4. Manos limpias - uñas cortas - sin esmalte.",
        "isCritical": true,
        "rubrics": {
          "0": "Se manipulan alimentos con manos visiblemente sucias, uñas incompatibles con el estándar o esmalte, sin corrección.",
          "40": "Existe una desviación evidente en una o más personas que requiere corrección antes de continuar la manipulación.",
          "70": "Se detecta una desviación menor de presentación en una persona que puede corregirse antes de manipular alimentos.",
          "100": "Todo el personal manipulador observado presenta manos limpias, uñas cortas y sin esmalte, conforme al estándar.",
          "NA": "Solo si no hay personal manipulador presente durante la evaluación."
        }
      },
      {
        "id": "b5",
        "code": "B5",
        "text": "B5. Bandeja y/o gaveta de conos limpios y en buen estado (Pendiente confirmación)",
        "isCritical": false,
        "rubrics": {
          "0": "PENDIENTE DE CONFIRMACIÓN DEL TEXTO ORIGINAL.",
          "40": "PENDIENTE DE CONFIRMACIÓN DEL TEXTO ORIGINAL.",
          "70": "PENDIENTE DE CONFIRMACIÓN DEL TEXTO ORIGINAL.",
          "100": "PENDIENTE DE CONFIRMACIÓN DEL TEXTO ORIGINAL.",
          "NA": "No programar ni puntuar hasta recuperar el texto original del KPI B5."
        },
        "pendingConfirmation": true
      },
      {
        "id": "b6",
        "code": "B6",
        "text": "B6. Tachos limpios y completos (jugo – base).",
        "isCritical": true,
        "rubrics": {
          "0": "Los tachos están sucios, incompletos, no aptos o su condición compromete la higiene del proceso.",
          "40": "Uno o más tachos presentan suciedad visible, faltantes o armado deficiente que requiere intervención antes de continuar normalmente.",
          "70": "Un tacho presenta una condición menor de limpieza/armado, corregible inmediatamente sin comprometer el producto.",
          "100": "Todos los tachos requeridos para jugo/base están limpios, completos, correctamente armados y disponibles para uso.",
          "NA": "Solo si ese proceso/producto no se maneja en la isla evaluada."
        }
      },
      {
        "id": "b7",
        "code": "B7",
        "text": "B7. Productos reportados como devolución identificados.",
        "isCritical": true,
        "rubrics": {
          "0": "Los productos de devolución no están identificados/separados o existe riesgo real de reincorporarlos a venta/uso.",
          "40": "Hay productos de devolución con identificación incompleta o separación deficiente que puede generar confusión.",
          "70": "Existe una desviación menor de rotulado/ubicación, pero el producto permanece separado y reconocible.",
          "100": "Todo producto destinado a devolución está claramente separado, identificado y controlado para evitar uso o venta accidental.",
          "NA": "Si no existen productos reportados como devolución al momento de la evaluación."
        }
      },
      {
        "id": "b8",
        "code": "B8",
        "text": "B8. Tacho en buen estado (tapas).",
        "isCritical": true,
        "rubrics": {
          "0": "El tacho/tapa está roto, no cierra, no es higiénicamente utilizable o representa riesgo de contaminación.",
          "40": "Una tapa o tacho presenta daño funcional parcial que requiere reparación/reemplazo próximo.",
          "70": "Existe desgaste menor que no impide el cierre, higiene ni uso correcto.",
          "100": "Todos los tachos evaluados y sus tapas están íntegros, funcionales, limpios y cierran/operan correctamente.",
          "NA": "Solo si el tipo de tacho no requiere tapa según estándar previamente definido."
        }
      },
      {
        "id": "b9",
        "code": "B9",
        "text": "B9. Cajoneras organizadas por insumo.",
        "isCritical": true,
        "rubrics": {
          "0": "La organización es inexistente o hay mezclas/ubicaciones que generan riesgo de contaminación o pérdida de control.",
          "40": "Hay mezcla o desorganización de varios insumos que dificulta control, reposición o higiene.",
          "70": "Existe uno o pocos insumos fuera de ubicación, sin riesgo de contaminación y corregibles inmediatamente.",
          "100": "Cada insumo está ubicado en la cajonera/espacio asignado, separado, identificado cuando corresponde y sin mezclas impropias.",
          "NA": "Solo si la isla no utiliza cajoneras para almacenamiento de insumos."
        }
      }
    ]
  },
  {
    "id": "C",
    "code": "C",
    "name": "C. EQUIPOS DE FRÍO",
    "weight": 10,
    "questions": [
      {
        "id": "c1",
        "code": "C1",
        "text": "C1. Neveras con nivel de temperatura correcta (verificado por supervisor).",
        "isCritical": true,
        "rubrics": {
          "0": "Una nevera está claramente fuera del rango permitido o la condición compromete la conservación/cadena de frío.",
          "40": "Una lectura está fuera del rango por desviación moderada o hay inestabilidad que requiere intervención y seguimiento inmediato.",
          "70": "Se detecta una lectura cercana al límite del rango, sin producto comprometido, y se corrige/monitorea de inmediato.",
          "100": "Todas las neveras verificadas se encuentran dentro del rango de temperatura oficialmente definido por GEDALUMA para el producto almacenado.",
          "NA": "Solo si no existe nevera operativa o producto que requiera ese control durante la evaluación."
        }
      },
      {
        "id": "c2",
        "code": "C2",
        "text": "C2. Neveras con botellas correctamente perchadas y flujo de aire libre.",
        "isCritical": true,
        "rubrics": {
          "0": "El perchado bloquea claramente la circulación de aire o impide una conservación adecuada.",
          "40": "Varias botellas están mal ubicadas o reducen parcialmente el flujo de aire y requieren reorganización.",
          "70": "Existe una botella/sector ligeramente fuera de orden, sin bloquear de forma relevante el flujo de aire.",
          "100": "Las botellas están ordenadas según estándar y ninguna obstruye rejillas/salidas, permitiendo circulación de aire adecuada.",
          "NA": "Solo si la nevera no almacena botellas."
        }
      },
      {
        "id": "c3",
        "code": "C3",
        "text": "C3. Congeladoras sin acumulación de hielo.",
        "isCritical": true,
        "rubrics": {
          "0": "La acumulación es severa, afecta cierre, producto, funcionamiento o evidencia falta de mantenimiento.",
          "40": "Hay acumulación visible que reduce espacio/eficiencia y requiere descongelación programada.",
          "70": "Existe formación leve y localizada de hielo, sin afectar cierre, espacio útil ni operación.",
          "100": "Las congeladoras no presentan acumulación anormal de hielo y permiten cierre, circulación y uso normal.",
          "NA": "Solo si la isla no dispone de congeladora."
        }
      },
      {
        "id": "c4",
        "code": "C4",
        "text": "C4. Cauchos de neveras en buen estado.",
        "isCritical": true,
        "rubrics": {
          "0": "El caucho está roto, desprendido o no sella, comprometiendo la conservación/eficiencia del equipo.",
          "40": "Hay deterioro visible o sello parcial que requiere mantenimiento/reemplazo próximo.",
          "70": "Existe desgaste menor sin pérdida apreciable de sello.",
          "100": "Todos los cauchos están íntegros, limpios, correctamente fijados y sellan completamente.",
          "NA": "Solo si el equipo no utiliza este tipo de sello."
        }
      },
      {
        "id": "c5",
        "code": "C5",
        "text": "C5. Extractores de aire funcionando.",
        "isCritical": true,
        "rubrics": {
          "0": "Uno o más extractores requeridos no funcionan o la ventilación queda comprometida.",
          "40": "Funcionan parcialmente, con rendimiento reducido o falla intermitente que requiere mantenimiento.",
          "70": "Funcionan, pero presentan una anomalía menor que no reduce significativamente su función.",
          "100": "Todos los extractores requeridos en la isla encienden y funcionan de manera normal, sin ruido/falla evidente.",
          "NA": "Solo si la isla no dispone ni requiere extractor."
        }
      },
      {
        "id": "c6",
        "code": "C6",
        "text": "C6. Perillas de control equipos de frío en buen estado.",
        "isCritical": true,
        "rubrics": {
          "0": "Falta una perilla, está rota o no permite controlar correctamente el equipo.",
          "40": "Una perilla está floja, poco legible o parcialmente deteriorada, aunque aún permite operar con dificultad.",
          "70": "Una perilla presenta desgaste menor, pero mantiene control completo y seguro.",
          "100": "Todas las perillas están completas, firmes, legibles y permiten regular correctamente el equipo.",
          "NA": "Solo si el equipo no utiliza perillas de control."
        }
      },
      {
        "id": "c7",
        "code": "C7",
        "text": "C7. Perillas de equipos de frío en el nivel correcto de temperatura.",
        "isCritical": true,
        "rubrics": {
          "0": "La configuración es claramente incorrecta y coincide con una condición que compromete la temperatura/conservación.",
          "40": "Una o más perillas están en nivel incorrecto y requieren ajuste para asegurar el rango esperado.",
          "70": "Existe una variación menor respecto del nivel definido, sin temperatura fuera de rango, corregida al detectar.",
          "100": "Todas las perillas están configuradas en el nivel definido por GEDALUMA para la operación y producto correspondiente.",
          "NA": "Solo si el equipo no utiliza perilla o control manual equivalente."
        }
      },
      {
        "id": "c8",
        "code": "C8",
        "text": "C8. Neveras identificadas (bodega y venta).",
        "isCritical": false,
        "rubrics": {
          "0": "No existe identificación o la existente induce a error operativo.",
          "40": "Falta o es confusa la identificación de una parte de los equipos y requiere corrección.",
          "70": "Una identificación presenta desgaste menor pero sigue siendo legible e inequívoca.",
          "100": "Todas las neveras están identificadas claramente según su función (bodega/venta) conforme al estándar.",
          "NA": "Solo si existe un único equipo y GEDALUMA ha definido que no requiere diferenciación."
        }
      },
      {
        "id": "c9",
        "code": "C9",
        "text": "C9. Congeladores perchados según nivel de altura indicado de cada equipo.",
        "isCritical": true,
        "rubrics": {
          "0": "El nivel de carga excede claramente el máximo, afecta cierre/circulación o compromete conservación.",
          "40": "Varios productos superan parcialmente el nivel indicado y requieren redistribución.",
          "70": "Existe una desviación mínima/localizada sin afectar cierre ni circulación y se corrige de inmediato.",
          "100": "El producto está almacenado sin superar el nivel máximo de altura definido para cada congelador.",
          "NA": "Solo si no hay congelador o no contiene producto al momento de la evaluación."
        }
      }
    ]
  },
  {
    "id": "D",
    "code": "D",
    "name": "D. INVENTARIOS",
    "weight": 15,
    "questions": [
      {
        "id": "d1",
        "code": "D1",
        "text": "D1. Caja chica completa y variada por denominación de moneda.",
        "isCritical": false,
        "rubrics": {
          "0": "La caja chica está incompleta de forma relevante o no permite operar adecuadamente.",
          "40": "Existe insuficiente variedad o una diferencia que dificulta entregar cambio y requiere reposición/regularización.",
          "70": "El monto está completo, pero existe una carencia menor de alguna denominación que no impide operar normalmente.",
          "100": "La caja chica contiene el monto definido y una combinación suficiente de denominaciones para operar y entregar cambio.",
          "NA": "Solo si la isla no maneja caja chica por disposición formal."
        }
      },
      {
        "id": "d2",
        "code": "D2",
        "text": "D2. Control de inventario según cuaderno de novedades.",
        "isCritical": false,
        "rubrics": {
          "0": "El cuaderno no refleja el inventario/movimientos, hay diferencias significativas sin explicación o no se lleva el control.",
          "40": "Se observan varias diferencias/registros omitidos que reducen la confiabilidad del control y requieren conciliación.",
          "70": "Existe una diferencia o registro menor pendiente, identificable y corregible sin perder trazabilidad.",
          "100": "El inventario físico revisado es coherente con el cuaderno de novedades y los movimientos relevantes están registrados.",
          "NA": "Solo si GEDALUMA utiliza formalmente otro sistema que sustituye este control en esa isla."
        }
      },
      {
        "id": "d3",
        "code": "D3",
        "text": "D3. Stock de productos suficiente.",
        "isCritical": false,
        "rubrics": {
          "0": "Existen quiebres de stock relevantes que impiden atender productos principales o afectan significativamente las ventas.",
          "40": "Hay varios productos con stock bajo o faltantes que limitan opciones de venta y requieren reposición prioritaria.",
          "70": "Existe faltante o nivel bajo de un producto secundario, sin afectar de forma relevante la oferta/venta inmediata.",
          "100": "Los productos definidos como necesarios para la operación están disponibles en cantidad suficiente para la demanda prevista del período.",
          "NA": "Solo para productos que oficialmente no correspondan al surtido de esa isla."
        }
      }
    ]
  },
  {
    "id": "E",
    "code": "E",
    "name": "E. IMAGEN DE MARCA",
    "weight": 5,
    "questions": [
      {
        "id": "e1",
        "code": "E1",
        "text": "E1. Material gráfico actualizado y en buen estado.",
        "isCritical": false,
        "rubrics": {
          "0": "Predomina material desactualizado, roto, ilegible o incompatible con la imagen vigente.",
          "40": "Hay material deteriorado, desactualizado o mal colocado en parte de la isla y requiere reemplazo/corrección.",
          "70": "Existe desgaste menor o un detalle de colocación que no altera el mensaje ni la imagen general.",
          "100": "Todo el material gráfico exhibido corresponde a campañas/imagen vigentes y está limpio, completo, legible y sin deterioro.",
          "NA": "Si no existe material gráfico requerido para el período por disposición de la marca."
        }
      },
      {
        "id": "e2",
        "code": "E2",
        "text": "E2. Acrílicos en buen estado.",
        "isCritical": false,
        "rubrics": {
          "0": "Hay acrílicos rotos, faltantes o en condición que afecta claramente imagen o seguridad.",
          "40": "Uno o más acrílicos presentan deterioro visible, opacidad, fisura menor o fijación deficiente.",
          "70": "Existe rayón/desgaste menor que no afecta presentación ni función.",
          "100": "Todos los acrílicos están limpios, transparentes, completos, firmes y sin roturas o daños visibles.",
          "NA": "Solo si la isla no dispone de acrílicos."
        }
      },
      {
        "id": "e3",
        "code": "E3",
        "text": "E3. Uniforme completo y en buen estado.",
        "isCritical": false,
        "rubrics": {
          "0": "Existe incumplimiento evidente/generalizado del uniforme o una condición incompatible con la imagen de marca.",
          "40": "Una o más personas presentan uniforme incompleto, deteriorado o presentación inconsistente que requiere corrección.",
          "70": "Se observa una desviación menor y aislada en una persona, corregible y sin deterioro significativo de imagen.",
          "100": "Todo el personal presente usa el uniforme completo definido, limpio, en buen estado y con presentación consistente.",
          "NA": "Solo si no hay personal operativo presente, situación que debe justificarse."
        }
      },
      {
        "id": "e4",
        "code": "E4",
        "text": "E4. Stickers de equipos actualizados y en buen estado.",
        "isCritical": false,
        "rubrics": {
          "0": "Los stickers requeridos están ausentes, ilegibles o mayoritariamente desactualizados.",
          "40": "Faltan o están deteriorados/desactualizados algunos stickers y requieren reposición.",
          "70": "Existe desgaste menor en un sticker, manteniéndose legible y funcional.",
          "100": "Todos los stickers requeridos están presentes, vigentes, legibles, bien adheridos y sin deterioro.",
          "NA": "Solo en equipos para los cuales no se exige sticker."
        }
      },
      {
        "id": "e5",
        "code": "E5",
        "text": "E5. Menú de productos actualizado.",
        "isCritical": false,
        "rubrics": {
          "0": "El menú está sustancialmente desactualizado, ausente o contiene información que induce a error en la compra.",
          "40": "Hay varias inconsistencias, productos/precios desactualizados o información faltante que puede generar confusión.",
          "70": "Existe un detalle menor de actualización/formato que no induce al cliente a error relevante.",
          "100": "El menú exhibe correctamente productos, presentaciones y precios vigentes definidos para la isla.",
          "NA": "Solo si por disposición formal no corresponde exhibir menú en esa isla."
        }
      }
    ]
  },
  {
    "id": "F",
    "code": "F",
    "name": "F. SEGURIDAD – TECNOLOGÍA Y CONTROL",
    "weight": 10,
    "questions": [
      {
        "id": "f1",
        "code": "F1",
        "text": "F1. Tomacorrientes en buen estado.",
        "isCritical": true,
        "rubrics": {
          "0": "Existe tomacorriente roto, flojo, quemado, con partes expuestas o condición que representa riesgo eléctrico.",
          "40": "Se observa deterioro que requiere mantenimiento preventivo/prioritario, aunque no hay exposición inmediata evidente.",
          "70": "Existe desgaste superficial menor sin afectar fijación, contacto ni seguridad.",
          "100": "Todos los tomacorrientes observados están firmes, completos, sin daño, calentamiento, piezas expuestas ni señales de riesgo.",
          "NA": "Solo si no existen tomacorrientes bajo responsabilidad de la isla."
        }
      },
      {
        "id": "f2",
        "code": "F2",
        "text": "F2. Cables en buen estado.",
        "isCritical": true,
        "rubrics": {
          "0": "Existe cable pelado, conductor expuesto, empalme inseguro o condición con riesgo eléctrico inmediato.",
          "40": "Se observan cables con deterioro, tensión, desorden o protección deficiente que requiere corrección prioritaria.",
          "70": "Existe desgaste superficial/orden menor que no compromete aislamiento ni seguridad.",
          "100": "Todos los cables visibles están íntegros, correctamente aislados, ordenados y sin empalmes o daños inseguros.",
          "NA": "Solo si no hay cableado evaluable bajo responsabilidad de la isla."
        }
      },
      {
        "id": "f3",
        "code": "F3",
        "text": "F3. Ubicación adecuada de extintor (si aplica).",
        "isCritical": true,
        "rubrics": {
          "0": "No está disponible cuando corresponde, está inaccesible/obstruido o su ubicación impide respuesta adecuada.",
          "40": "Está disponible pero parcialmente obstruido, mal señalizado o en ubicación que dificulta acceso rápido.",
          "70": "Existe una desviación menor de señalización/posición, manteniéndose accesible y utilizable.",
          "100": "El extintor requerido está visible, señalizado, accesible, sin obstrucciones y ubicado en el punto definido.",
          "NA": "Cuando el extintor no corresponde a la isla según la responsabilidad formal del establecimiento/centro comercial."
        }
      },
      {
        "id": "f4",
        "code": "F4",
        "text": "F4. Equipos tecnológicos protegidos (con UPS).",
        "isCritical": false,
        "rubrics": {
          "0": "Los equipos críticos que requieren UPS están sin protección o la UPS no funciona.",
          "40": "Parte de los equipos requeridos carece de protección o la UPS presenta funcionamiento dudoso y requiere revisión.",
          "70": "Existe una desviación menor en un equipo secundario o en orden de conexión, sin pérdida relevante de protección.",
          "100": "Todos los equipos definidos por GEDALUMA que requieren UPS están conectados y protegidos mediante UPS funcional.",
          "NA": "Solo si no existen equipos que requieran UPS según estándar GEDALUMA."
        }
      },
      {
        "id": "f5",
        "code": "F5",
        "text": "F5. Cobertores en buen estado.",
        "isCritical": false,
        "rubrics": {
          "0": "Faltan cobertores requeridos o están inutilizables y no protegen los equipos/elementos.",
          "40": "Uno o más cobertores presentan roturas/desgaste que reduce parcialmente la protección.",
          "70": "Existe desgaste menor que no reduce la función protectora.",
          "100": "Todos los cobertores requeridos están completos, limpios, sin roturas y protegen correctamente el elemento asignado.",
          "NA": "Solo si la isla no utiliza cobertores por diseño."
        }
      },
      {
        "id": "f6",
        "code": "F6",
        "text": "F6. Candados y llaves en buen estado.",
        "isCritical": true,
        "rubrics": {
          "0": "Falta un elemento crítico, no funciona o impide asegurar correctamente la isla/equipo.",
          "40": "Un candado/llave presenta funcionamiento deficiente o control incompleto que requiere reposición/corrección.",
          "70": "Existe desgaste menor o detalle de identificación sin afectar cierre ni disponibilidad.",
          "100": "Todos los candados y llaves requeridos funcionan correctamente, están identificados/controlados y permiten cierre seguro.",
          "NA": "Solo si la isla no utiliza candados/llaves bajo este esquema."
        }
      },
      {
        "id": "f7",
        "code": "F7",
        "text": "F7. Conexiones eléctricas en buen estado.",
        "isCritical": true,
        "rubrics": {
          "0": "Existe condición insegura evidente: sobrecarga, calentamiento, chispa, partes expuestas o conexión improvisada peligrosa.",
          "40": "Hay conexiones improvisadas, sobrecarga potencial o deterioro que requiere revisión técnica prioritaria.",
          "70": "Existe un detalle menor de orden/fijación sin riesgo eléctrico apreciable.",
          "100": "Las conexiones visibles están firmes, protegidas, ordenadas y sin sobrecarga, improvisaciones ni señales de calentamiento.",
          "NA": "Solo si no existen conexiones evaluables bajo responsabilidad de la isla."
        }
      }
    ]
  },
  {
    "id": "G",
    "code": "G",
    "name": "G. CICLO DE VENTA Y GENERACIÓN DE INGRESOS",
    "weight": 20,
    "questions": [
      {
        "id": "g1",
        "code": "G1",
        "text": "G1. La vendedora se comunica de forma respetuosa durante toda la interacción.",
        "isCritical": false,
        "rubrics": {
          "0": "Se observa trato irrespetuoso, confrontativo, despectivo o claramente incompatible con el estándar de servicio.",
          "40": "En varias interacciones el trato es frío, poco cordial o inconsistente y requiere coaching.",
          "70": "Presenta una desviación menor y aislada de tono/forma, sin generar trato inadecuado al cliente.",
          "100": "En todas las interacciones observadas mantiene tono cordial, lenguaje respetuoso, disposición y trato profesional.",
          "NA": "Solo si no se observa ninguna interacción con clientes durante el período definido."
        }
      },
      {
        "id": "g2",
        "code": "G2",
        "text": "G2. La vendedora saluda y reconoce la presencia del cliente al llegar.",
        "isCritical": false,
        "rubrics": {
          "0": "No saluda ni reconoce sistemáticamente la llegada de clientes durante las observaciones.",
          "40": "Omite el saludo/reconocimiento en varias oportunidades o lo realiza de manera tardía/inconsistente.",
          "70": "Omite o retrasa el saludo en una oportunidad aislada, manteniendo buen reconocimiento general.",
          "100": "Reconoce y saluda oportunamente a todos o prácticamente todos los clientes observados, aun cuando esté atendiendo a otra persona.",
          "NA": "Solo si no ingresa ningún cliente durante el período de observación."
        }
      },
      {
        "id": "g3",
        "code": "G3",
        "text": "G3. La vendedora mantiene enfocada la atención, sin distracciones personales o actividades irrelevantes.\".",
        "isCritical": false,
        "rubrics": {
          "0": "Las distracciones son frecuentes o provocan abandono, demora significativa o mala experiencia del cliente.",
          "40": "Se observan varias distracciones que interrumpen o reducen la calidad/rapidez de atención.",
          "70": "Existe una distracción breve y aislada que no afecta de manera relevante el servicio.",
          "100": "Durante las interacciones observadas mantiene atención en el cliente y evita celular, conversaciones personales u otras distracciones irrelevantes.",
          "NA": "Solo si no existe oportunidad real de observar atención al cliente."
        }
      },
      {
        "id": "g4",
        "code": "G4",
        "text": "G4. Explica las opciones o características del producto de manera clara.",
        "isCritical": false,
        "rubrics": {
          "0": "No puede/no intenta explicar opciones relevantes o entrega información incorrecta que afecta la decisión.",
          "40": "Las explicaciones son repetidamente incompletas, confusas o requieren que el cliente insista para obtener información.",
          "70": "Brinda información correcta pero incompleta o poco proactiva en una oportunidad aislada.",
          "100": "Cuando el cliente requiere orientación, explica con claridad las opciones/características relevantes y facilita la decisión de compra.",
          "NA": "Si ningún cliente solicita orientación y no existe una oportunidad razonable de explicar opciones durante la observación."
        }
      },
      {
        "id": "g5",
        "code": "G5",
        "text": "G5. Ofrece espontáneamente un producto complementario específico y relacionado con la compra.",
        "isCritical": false,
        "rubrics": {
          "0": "No ofrece complementos en oportunidades claras o realiza propuestas inadecuadas que deterioran la experiencia.",
          "40": "Solo realiza venta cruzada en pocas oportunidades o de manera mecánica/poco relacionada con la compra.",
          "70": "Realiza venta cruzada en la mayoría de oportunidades, pero omite una oportunidad clara o la recomendación es ocasionalmente genérica.",
          "100": "En las oportunidades pertinentes observadas, propone de forma natural y específica un complemento coherente con la compra, sin presión.",
          "NA": "Solo si durante la observación no existe ninguna compra con oportunidad razonable de producto complementario."
        }
      },
      {
        "id": "g6",
        "code": "G6",
        "text": "G6. Luego de al menos 10 observaciones en venta, se evalúa la atención que brinda al cliente.\".",
        "isCritical": false,
        "rubrics": {
          "0": "En las observaciones predomina una atención deficiente o se identifican conductas graves incompatibles con el estándar.",
          "40": "En las 10 o más ventas, se repiten varias brechas de atención que evidencian inconsistencia y requieren coaching.",
          "70": "En las 10 o más ventas, el servicio es adecuado en general con pocas desviaciones menores y aisladas.",
          "100": "En al menos 10 ventas observadas, la atención cumple consistentemente los comportamientos de servicio definidos por GEDALUMA en la gran mayoría de interacciones.",
          "NA": "Si no fue posible completar el mínimo de 10 observaciones; debe registrarse el número observado y reprogramarse la medición."
        }
      },
      {
        "id": "g7",
        "code": "G7",
        "text": "G7. Pregunta si el cliente desea factura con datos o consumidor final y entrega el ticket o comprobante impreso adecuadamente.",
        "isCritical": true,
        "rubrics": {
          "0": "No aplica el procedimiento de facturación/comprobante de forma sistemática o se detecta una práctica contraria al control establecido.",
          "40": "Se repiten varias omisiones en preguntar/entregar comprobante, evidenciando aplicación inconsistente del procedimiento.",
          "70": "Existe una omisión aislada en la pregunta o entrega, sin patrón recurrente y corregible mediante recordatorio.",
          "100": "En todas las ventas observadas aplicables, consulta correctamente el tipo de factura y entrega el comprobante según procedimiento.",
          "NA": "Solo en transacciones donde legal/operativamente el procedimiento no sea aplicable; justificar."
        }
      },
      {
        "id": "g8",
        "code": "G8",
        "text": "G8. La vendedora confirma y facilita adecuadamente la forma de pago (tarjeta de crédito/débito, efectivo).\".",
        "isCritical": false,
        "rubrics": {
          "0": "No informa/procesa correctamente un medio disponible o genera una falla atribuible al procedimiento que impide/deteriora el cierre.",
          "40": "Se observan dificultades repetidas, información incompleta o manejo poco ágil de los medios de pago.",
          "70": "Existe una demora o explicación menor aislada, sin afectar significativamente el cierre.",
          "100": "Comunica y procesa correctamente las formas de pago disponibles, confirma el medio elegido y facilita el cierre sin fricción evitable.",
          "NA": "Solo si no se concreta ninguna transacción durante el período de observación."
        }
      },
      {
        "id": "g9",
        "code": "G9",
        "text": "G9. La vendedora ofrece una alternativa adecuada de manera proactiva cuando el producto solicitado no está disponible.",
        "isCritical": false,
        "rubrics": {
          "0": "No ofrece alternativa ante faltantes claros y deja finalizar la interacción sin intentar una solución comercial.",
          "40": "Solo propone alternativas ocasionalmente o las opciones ofrecidas son poco pertinentes, perdiéndose oportunidades de venta.",
          "70": "Propone alternativa en la mayoría de casos, pero en una oportunidad requiere que el cliente pregunte o la propuesta es poco específica.",
          "100": "Ante cada falta observada, propone inmediatamente una alternativa pertinente y explica opciones para conservar la intención de compra.",
          "NA": "Si durante la observación no se presenta ningún producto solicitado sin disponibilidad."
        }
      },
      {
        "id": "g10",
        "code": "G10",
        "text": "G10. Observación cualitativa (no puntúa): Describir una conducta concreta que podría mejorar.",
        "isCritical": false,
        "rubrics": {
          "0": "",
          "40": "",
          "70": "",
          "100": "",
          "NA": ""
        },
        "type": "text"
      }
    ]
  }
];
