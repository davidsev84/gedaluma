import { jsPDF } from 'jspdf';
import { categories, ghostCategories } from '../data/mock';

export const generatePDF = (
  evaluation: any, 
  responses: any[], 
  evaluatorSignature?: string
) => {
  try {
    const doc = new jsPDF();
    const isGhost = evaluation.evaluator_role === 'ghost';
    
    // Header Title
    doc.setFontSize(18);
    doc.setTextColor(0, 156, 72); // Coco Express Green
    doc.text(isGhost ? 'Reporte Cliente Fantasma - GEDALUMA' : 'Reporte de Evaluación - GEDALUMA v3.0', 20, 18);
    
    // Subencabezado destacado con el nombre del empleado evaluado
    const empName = evaluation.evaluated_employee || evaluation.employee_name || 'N/A';
    doc.setFontSize(13);
    doc.setTextColor(2, 132, 199); // Azul destacado
    doc.text(`EMPLEADO / VENDEDORA EVALUADA: ${empName.toUpperCase()}`, 20, 27);

    doc.setFontSize(10.5);
    doc.setTextColor(50, 50, 50);
    doc.text(`Isla: ISLA ${evaluation.isla_name || 'Desconocida'}`, 20, 36);

    const finalScore = Number(evaluation.total_score || 0);

    if (!isGhost) {
      doc.text(`Evaluador / Auditor: ${evaluation.evaluator_name || 'N/A'}`, 20, 43);
      doc.text(`Fecha de Evaluación: ${new Date(evaluation.date || evaluation.created_at || Date.now()).toLocaleDateString()}`, 20, 50);
      doc.setFontSize(13);
      doc.setTextColor(0, 156, 72);
      doc.text(`Puntaje Total Ponderado: ${finalScore.toFixed(2)}%`, 20, 58);
      doc.setFontSize(10.5);
      doc.setTextColor(50, 50, 50);
      doc.text(`Estado / Dictamen: ${evaluation.status || 'Completado'}`, 20, 65);
    } else {
      doc.text(`Evaluador (Cliente Fantasma): ${evaluation.evaluator_name || 'N/A'}`, 20, 43);
      doc.text(`Fecha de la visita: ${evaluation.date || new Date(evaluation.created_at).toLocaleDateString()}`, 20, 50);
      doc.text(`Horario de la visita: ${evaluation.start_time || ''} a ${evaluation.end_time || ''} (${evaluation.time_slot || 'N/A'})`, 20, 57);
      
      let bonoText = 'Califica 100% al bono de calidad';
      let accionText = 'Reconocimiento en acta mensual.';
      if (finalScore < 75) {
        bonoText = 'No califica al bono en el periodo';
        accionText = 'Capacitación obligatoria y auditoría de seguimiento.';
      } else if (finalScore < 90) {
        bonoText = 'Califica 50% del bono';
        accionText = 'Plan de refuerzo individual por Richard.';
      }

      doc.setFontSize(12);
      doc.setTextColor(0, 156, 72);
      doc.text(`Calificacion Final: ${finalScore.toFixed(2)}%`, 20, 69);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Formula: (Puntos Obtenidos / Puntos Maximos Evaluables Excluyendo NE/NA) x 100`, 20, 75);
      doc.text(`Bono: ${bonoText}`, 20, 81);
      doc.text(`Accion Requerida: ${accionText}`, 20, 87);
    }

    let currentY = isGhost ? 97 : 75;

    // 2. ALERTAS CRÍTICAS (Sección resaltada en rojo si hay KPIs críticos con 40% o 0%)
    if (!isGhost) {
      const criticalFindings: any[] = [];
      categories.forEach((cat: any) => {
        cat.questions.forEach((q: any) => {
          if (q.isCritical) {
            const resp = responses.find(r => r.question_id === q.id || r.id === q.id);
            const val = resp?.value;
            if (val === 40 || val === '40' || val === '40%' || val === 0 || val === '0' || val === '0%' || val === 'NO') {
              criticalFindings.push({
                category: cat.name,
                question: q,
                value: val,
                observation: resp?.observation || 'Sin observación registrada',
                photo: resp?.photo_data || resp?.photoData
              });
            }
          }
        });
      });

      if (criticalFindings.length > 0) {
        // Red alert box
        doc.setFillColor(254, 242, 242);
        doc.setDrawColor(239, 68, 68);
        doc.rect(18, currentY, 174, 12 + (criticalFindings.length * 10), 'FD');

        doc.setFontSize(11);
        doc.setTextColor(185, 28, 28);
        doc.text(`⚠️ ALERTAS CRÍTICAS DETECTADAS (${criticalFindings.length} Indicador(es) con 40% o 0%):`, 22, currentY + 7);

        let alertItemY = currentY + 13;
        doc.setFontSize(9);
        criticalFindings.forEach((cf) => {
          doc.setTextColor(153, 27, 27);
          const alertLine = `• [${cf.question.code}] ${cf.question.text} -> Calificación: ${cf.value}% | Acción: ${cf.observation}`;
          const splitAlert = doc.splitTextToSize(alertLine, 166);
          doc.text(splitAlert, 24, alertItemY);
          alertItemY += splitAlert.length * 4.5;
        });

        currentY = alertItemY + 6;
      }
    }

    if (currentY > 260) {
      doc.addPage();
      currentY = 20;
    }

    // 3. CUERPO DEL REPORTE: Desglose por categoría (ocultando N/A del cuerpo principal)
    doc.setFontSize(13);
    doc.setTextColor(0, 0, 0);
    doc.text(isGhost ? 'Detalle de Cuestionario:' : 'Desglose de Evaluación por Categoría:', 20, currentY);
    currentY += 8;
    
    const activeCategories = isGhost ? ghostCategories : categories;
    const naFindings: any[] = [];
    const photoFindings: any[] = [];

    activeCategories.forEach((cat: any, catIdx: number) => {
      // Filtrar preguntas evaluadas (no N/A para auditoría V3)
      const nonNAQuestions = !isGhost 
        ? cat.questions.filter((q: any) => {
            const resp = responses.find(r => r.question_id === q.id || r.id === q.id);
            const val = resp?.value;
            if (val === 'NA' || val === 'N/A' || val === null) {
              if (resp?.observation) {
                naFindings.push({
                  category: cat.name,
                  question: q,
                  justification: resp.observation
                });
              }
              const photoData = resp?.photo_data || resp?.photoData;
              if (photoData) {
                photoFindings.push({
                  code: q.code || q.id,
                  text: q.text,
                  score: 'N/A',
                  observation: resp?.observation || 'Sin justificación registrada',
                  photoData
                });
              }
              return false;
            }
            return true;
          })
        : cat.questions;

      if (nonNAQuestions.length === 0 && !isGhost) return;

      if (currentY > 250) {
        doc.addPage();
        currentY = 20;
      }

      doc.setFontSize(11);
      doc.setTextColor(0, 156, 72);
      
      const catCode = cat.id ? `CAT-${cat.id}` : `CAT-${catIdx + 1}`;
      const catHeader = !isGhost
        ? `Categoría ${cat.name} (Peso: ${cat.weight}%)`
        : `Categoría ${catIdx + 1} [${catCode}]: ${cat.name}`;
      
      doc.text(catHeader, 20, currentY);
      currentY += 7;
      
      doc.setFontSize(9);
      nonNAQuestions.forEach((q: any, idx: number) => {
        const resp = responses.find(r => r.question_id === q.id || r.id === q.id); 
        const answerVal = resp ? (resp.value ?? 'Sin respuesta') : 'Sin respuesta';
        const obsVal = resp ? resp.observation : null;
        const photoData = resp?.photo_data || resp?.photoData;

        // Collect photos for findings table (40%, 0%, 70%, or any evaluated score if photo uploaded)
        if (!isGhost && photoData) {
          photoFindings.push({
            code: q.code || q.id,
            text: q.text,
            score: answerVal,
            observation: obsVal || 'Sin observación registrada',
            photoData
          });
        }

        const qCode = q.code ? `[${q.code}] ` : (q.id ? `[${q.id.toUpperCase()}] ` : '');
        const critTag = q.isCritical ? ' 🚨 [CRÍTICO]' : '';
        const splitTitle = doc.splitTextToSize(`${idx + 1}. ${qCode}${q.text}${critTag}`, 170);
        
        doc.setTextColor(q.isCritical ? 180 : 0, 0, 0);
        doc.text(splitTitle, 20, currentY);
        currentY += splitTitle.length * 4.2;
        
        // Formatear respuesta visual
        doc.setFontSize(8.5);
        let valFormatted = `${answerVal}`;
        if (!isGhost && typeof answerVal === 'number') {
          valFormatted = `${answerVal}%`;
        }
        
        let colorAns = [2, 132, 199];
        if (answerVal === 100 || answerVal === '100%') colorAns = [0, 156, 72];
        else if (answerVal === 70 || answerVal === '70%') colorAns = [2, 132, 199];
        else if (answerVal === 40 || answerVal === '40%') colorAns = [245, 158, 11];
        else if (answerVal === 0 || answerVal === '0%') colorAns = [239, 68, 68];

        doc.setTextColor(colorAns[0], colorAns[1], colorAns[2]);
        doc.text(`Calificación: ${valFormatted}`, 26, currentY);
        currentY += 4.2;

        if (obsVal) {
          doc.setTextColor(100, 100, 100);
          const splitObs = doc.splitTextToSize(`Observación / Acción: ${obsVal}`, 164);
          doc.text(splitObs, 26, currentY);
          currentY += (splitObs.length * 4.2);
        }
        currentY += 2.5;
        
        if (currentY > 270) {
          doc.addPage();
          currentY = 20;
        }
      });
      currentY += 3;
    });

    // ANEXO: KPIs MARCADOS COMO N/A (Justificación documentada)
    if (!isGhost && naFindings.length > 0) {
      if (currentY > 230) {
        doc.addPage();
        currentY = 20;
      } else {
        currentY += 6;
      }

      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      doc.text('Anexo: Indicadores no aplicables (N/A) con Justificación:', 20, currentY);
      currentY += 6;

      doc.setFontSize(8.5);
      naFindings.forEach((na) => {
        doc.setTextColor(80, 80, 80);
        const naLine = `• [${na.question.code}] ${na.question.text} -> Justificación: ${na.justification}`;
        const splitNA = doc.splitTextToSize(naLine, 170);
        doc.text(splitNA, 24, currentY);
        currentY += splitNA.length * 4.2;

        if (currentY > 270) {
          doc.addPage();
          currentY = 20;
        }
      });
    }

    // 4. ANEXO FOTOGRÁFICO DE EVIDENCIAS Y HALLAZGOS
    if (!isGhost && photoFindings.length > 0) {
      doc.addPage();
      currentY = 20;

      doc.setFontSize(14);
      doc.setTextColor(0, 156, 72);
      doc.text('Anexo Fotográfico de Evidencias', 20, currentY);
      currentY += 10;

      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text('A continuación se detallan las evidencias fotográficas registradas en la evaluación con su respectiva observación o justificación:', 20, currentY);
      currentY += 8;

      photoFindings.forEach((pf, pIdx) => {
        if (currentY > 210) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.rect(18, currentY, 174, 55, 'FD');

        // Draw thumbnail image
        try {
          doc.addImage(pf.photoData, 'JPEG', 22, currentY + 5, 55, 45);
        } catch (e) {
          console.warn('Error embedding photo in PDF:', e);
        }

        // Details next to image
        doc.setFontSize(9.5);
        const isZero = pf.score === 0 || pf.score === '0' || pf.score === '0%';
        const isForty = pf.score === 40 || pf.score === '40' || pf.score === '40%';
        const isSeventy = pf.score === 70 || pf.score === '70' || pf.score === '70%';
        const isNA = pf.score === 'NA' || pf.score === 'N/A';

        if (isZero) {
          doc.setTextColor(239, 68, 68); // Red
        } else if (isForty) {
          doc.setTextColor(245, 158, 11); // Amber
        } else if (isSeventy) {
          doc.setTextColor(2, 132, 199); // Blue
        } else {
          doc.setTextColor(100, 116, 139); // Gray
        }

        const scoreDisplay = isNA ? 'N/A' : (typeof pf.score === 'number' ? `${pf.score}%` : (String(pf.score).includes('%') ? pf.score : `${pf.score}%`));
        doc.text(`Evidencia #${pIdx + 1}: [${pf.code}] (${scoreDisplay})`, 82, currentY + 10);

        doc.setFontSize(8.5);
        doc.setTextColor(30, 41, 59);
        const splitTitle = doc.splitTextToSize(pf.text, 106);
        doc.text(splitTitle, 82, currentY + 16);

        const actionY = currentY + 16 + (splitTitle.length * 4.2) + 2;
        doc.setFontSize(8.5);
        doc.setTextColor(71, 85, 105);
        const prefix = isNA ? 'Justificación: ' : (isSeventy ? 'Desviación breve: ' : 'Acción Correctiva: ');
        const splitObs = doc.splitTextToSize(`${prefix}${pf.observation}`, 106);
        doc.text(splitObs, 82, actionY);

        currentY += 60;
      });
    }

    // Firmas
    if (evaluatorSignature) {
      if (currentY > 220) {
        doc.addPage();
        currentY = 30;
      } else {
        currentY += 10;
      }
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('Firma de Conformidad del Evaluador:', 20, currentY);
      currentY += 10;
      doc.addImage(evaluatorSignature, 'PNG', 20, currentY, 60, 20);
    }

    const islaNameSafe = (evaluation.isla_name || 'Isla').replace(/ /g, '_');
    const docPrefix = isGhost ? 'cliente_fantasma' : 'evaluacion_v3';
    doc.save(`${docPrefix}_${islaNameSafe}_${new Date().getTime()}.pdf`);
    
    return true;
  } catch (error) {
    console.error('Error generando PDF:', error);
    alert('Hubo un problema al generar el PDF.');
    return false;
  }
};

export const generateInventoryPDF = (
  inventory: any,
  items: any[],
  evaluatorSignature?: string
) => {
  try {
    const doc = new jsPDF();

    // Header Title
    doc.setFontSize(18);
    doc.setTextColor(0, 156, 72); // Coco Express Green
    doc.text('Reporte de Inventario Fisico vs Sistema - GEDALUMA', 20, 20);

    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    doc.text(`Isla: ISLA ${inventory.isla_name || 'Desconocida'}`, 20, 32);
    doc.text(`Responsable / Evaluador: ${inventory.evaluator_name || 'N/A'}`, 20, 39);

    let boxY = 52;
    if (inventory.evaluated_employee) {
      doc.text(`Evaluado: ${inventory.evaluated_employee}`, 20, 46);
      doc.text(`Fecha y Hora: ${inventory.date || new Date().toLocaleDateString()} (${inventory.start_time || ''} - ${inventory.end_time || ''})`, 20, 53);
      boxY = 59;
    } else {
      doc.text(`Fecha y Hora: ${inventory.date || new Date().toLocaleDateString()} (${inventory.start_time || ''} - ${inventory.end_time || ''})`, 20, 46);
    }

    // Summary Card Box
    doc.setFillColor(244, 248, 245);
    doc.rect(20, boxY, 170, 26, 'F');
    doc.setFontSize(9.5);
    doc.setTextColor(0, 156, 72);
    doc.text(`Total Productos Evaluados: ${items.length}`, 25, boxY + 8);

    const missingUn = Number(inventory.total_missing || 0).toFixed(2);
    doc.setTextColor(239, 68, 68);
    doc.text(`Total Faltantes: ${missingUn} un.`, 25, boxY + 15);

    doc.setTextColor(2, 132, 199);
    doc.text(`Total Conformes: ${Number(inventory.total_match || 0).toFixed(2)} prod.`, 110, boxY + 8);

    const surplusUn = Number(inventory.total_surplus || 0).toFixed(2);
    doc.setTextColor(247, 181, 0);
    doc.text(`Total Sobrantes: +${surplusUn} un.`, 110, boxY + 15);

    let currentY = boxY + 34;

    // Group items dynamically by Category
    const categoryMap: Record<string, any[]> = {};
    if (items && items.length > 0) {
      items.forEach((it: any) => {
        const cat = String(it.category || 'GENERAL').toUpperCase().trim();
        if (!categoryMap[cat]) categoryMap[cat] = [];
        categoryMap[cat].push(it);
      });
    }

    const categoryKeys = Object.keys(categoryMap);

    if (categoryKeys.length === 0) {
      doc.setFontSize(11);
      doc.setTextColor(100, 100, 100);
      doc.text('No hay productos registrados en este inventario.', 20, currentY);
    } else {
      categoryKeys.forEach((catName) => {
        const catItems = categoryMap[catName];
        if (!catItems || catItems.length === 0) return;

        doc.setFontSize(11.5);
        doc.setTextColor(0, 156, 72);
        doc.text(`CATEGORIA: ${catName}`, 20, currentY);
        currentY += 8;

        // Table Header
        doc.setFontSize(8.5);
        doc.setTextColor(255, 255, 255);
        doc.setFillColor(0, 156, 72);
        doc.rect(14, currentY, 184, 7, 'F');
        doc.text('Producto', 16, currentY + 5);
        doc.text('U/M', 86, currentY + 5);
        doc.text('Sistema', 102, currentY + 5);
        doc.text('Físico', 122, currentY + 5);
        doc.text('Diferencia', 142, currentY + 5);
        doc.text('Observaciones Completa', 166, currentY + 5);
        currentY += 9;

        doc.setFontSize(8);

        catItems.forEach((it: any) => {
          const sys = Number(it.system_qty || 0);
          const phys = Number(it.physical_qty || 0);
          const diff = phys - sys;

          let diffText = 'Conforme';
          if (diff < 0) {
            diffText = `Falta (${diff.toFixed(2)})`;
          } else if (diff > 0) {
            diffText = `Sobrante (+${diff.toFixed(2)})`;
          }

          const prodLines = doc.splitTextToSize(it.name || '', 65);
          const obsLines = doc.splitTextToSize(it.observation || '-', 30);
          const maxLines = Math.max(prodLines.length, obsLines.length, 1);
          const rowHeight = Math.max(maxLines * 4.5, 6.5);

          if (currentY + rowHeight > 275) {
            doc.addPage();
            currentY = 20;
          }

          // Draw row background for Faltantes
          if (diff < 0) {
            doc.setFillColor(254, 242, 242);
            doc.rect(14, currentY - 3, 184, rowHeight, 'F');
            doc.setTextColor(185, 28, 28);
          } else if (diff > 0) {
            doc.setFillColor(240, 249, 255);
            doc.rect(14, currentY - 3, 184, rowHeight, 'F');
            doc.setTextColor(3, 105, 161);
          } else {
            doc.setTextColor(50, 50, 50);
          }

          doc.text(prodLines, 16, currentY);
          doc.text(String(it.unit || 'UN'), 86, currentY);
          doc.text(sys.toFixed(2), 102, currentY);
          doc.text(phys.toFixed(2), 122, currentY);
          doc.text(diffText, 142, currentY);
          
          // Imprimir TODAS las líneas de observación sin truncar
          doc.text(obsLines, 166, currentY);

          currentY += rowHeight + 1.5;
        });

        currentY += 6;
        if (currentY > 270) {
          doc.addPage();
          currentY = 20;
        }
      });
    }

    // Signature Block
    if (evaluatorSignature) {
      if (currentY > 220) {
        doc.addPage();
        currentY = 30;
      } else {
        currentY += 10;
      }
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text('Firma de Conformidad del Responsable de Inventario:', 20, currentY);
      currentY += 8;
      doc.addImage(evaluatorSignature, 'PNG', 20, currentY, 60, 20);
    }

    const islaNameSafe = (inventory.isla_name || 'Isla').replace(/ /g, '_');
    doc.save(`inventario_${islaNameSafe}_${new Date().getTime()}.pdf`);

    return true;
  } catch (error) {
    console.error('Error generando PDF de inventario:', error);
    alert('Hubo un problema al generar el PDF del inventario.');
    return false;
  }
};
