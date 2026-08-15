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
    doc.text(isGhost ? 'Reporte Cliente Fantasma - GEDALUMA' : 'Reporte de Auditoria - GEDALUMA', 20, 20);
    
    doc.setFontSize(11);
    doc.setTextColor(50, 50, 50);
    doc.text(`Isla: ISLA ${evaluation.isla_name || 'Desconocida'}`, 20, 32);

    if (!isGhost) {
      doc.text(`Empleado Evaluado: ${evaluation.evaluated_employee || 'N/A'}`, 20, 39);
      doc.text(`Evaluador: ${evaluation.evaluator_name || 'N/A'}`, 20, 46);
      doc.text(`Fecha: ${new Date(evaluation.date || evaluation.created_at || Date.now()).toLocaleDateString()}`, 20, 53);
      doc.text(`Puntaje Final: ${Number(evaluation.total_score || 0).toFixed(2)}%`, 20, 60);
      doc.text(`Estado: ${evaluation.status || 'Completado'}`, 20, 67);
    } else {
      doc.text(`Evaluada (Vendedora): ${evaluation.evaluated_employee || 'N/A'}`, 20, 39);
      doc.text(`Evaluador (Cliente Fantasma): ${evaluation.evaluator_name || 'N/A'}`, 20, 46);
      doc.text(`Fecha de la visita: ${evaluation.date || new Date(evaluation.created_at).toLocaleDateString()}`, 20, 53);
      doc.text(`Horario de la visita: ${evaluation.start_time || ''} a ${evaluation.end_time || ''} (${evaluation.time_slot || 'N/A'})`, 20, 60);
      
      const score = Number(evaluation.total_score || 0);
      let bonoText = 'Califica 100% al bono de calidad';
      let accionText = 'Reconocimiento en acta mensual.';
      if (score < 75) {
        bonoText = 'No califica al bono en el periodo';
        accionText = 'Capacitación obligatoria y auditoría de seguimiento.';
      } else if (score < 90) {
        bonoText = 'Califica 50% del bono';
        accionText = 'Plan de refuerzo individual por Richard.';
      }

      doc.setFontSize(12);
      doc.setTextColor(0, 156, 72);
      doc.text(`Calificacion Final: ${score.toFixed(2)}%`, 20, 69);
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Formula: (Puntos Obtenidos / Puntos Maximos Evaluables Excluyendo NE/NA) x 100`, 20, 75);
      doc.text(`Bono: ${bonoText}`, 20, 81);
      doc.text(`Accion Requerida: ${accionText}`, 20, 87);
    }

    let currentY = isGhost ? 97 : 77;
    
    doc.setFontSize(13);
    doc.setTextColor(0, 0, 0);
    doc.text('Detalle de Cuestionario:', 20, currentY);
    currentY += 8;
    
    const activeCategories = isGhost ? ghostCategories : categories;

    activeCategories.forEach((cat: any) => {
      doc.setFontSize(11);
      doc.setTextColor(0, 156, 72);
      doc.text(cat.name, 20, currentY);
      currentY += 7;
      
      doc.setFontSize(9.5);
      cat.questions.forEach((q: any, idx: number) => {
        const resp = responses.find(r => r.question_id === q.id) || responses.find(r => r.id === q.id); 
        const answerVal = resp ? (resp.value || 'Sin respuesta') : 'Sin respuesta';
        const obsVal = resp ? resp.observation : null;

        const splitTitle = doc.splitTextToSize(`${idx + 1}. ${q.text}`, 170);
        doc.setTextColor(0, 0, 0);
        doc.text(splitTitle, 20, currentY);
        currentY += splitTitle.length * 4.5;
        
        doc.setTextColor(2, 132, 199);
        const splitAnswer = doc.splitTextToSize(`Respuesta: ${answerVal}`, 160);
        doc.text(splitAnswer, 30, currentY);
        currentY += (splitAnswer.length * 4.5);

        if (obsVal) {
          doc.setTextColor(120, 120, 120);
          const splitObs = doc.splitTextToSize(`Observación: ${obsVal}`, 160);
          doc.text(splitObs, 30, currentY);
          currentY += (splitObs.length * 4.5);
        }
        currentY += 3;
        
        if (currentY > 270) {
          doc.addPage();
          currentY = 20;
        }
      });
      currentY += 4;
      if (currentY > 270) {
        doc.addPage();
        currentY = 20;
      }
    });
    
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
    const docPrefix = isGhost ? 'cliente_fantasma' : 'auditoria';
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
    doc.text(`Fecha y Hora: ${inventory.date || new Date().toLocaleDateString()} (${inventory.start_time || ''} - ${inventory.end_time || ''})`, 20, 46);

    // Summary Card Box
    doc.setFillColor(244, 248, 245);
    doc.rect(20, 52, 170, 26, 'F');
    doc.setFontSize(9.5);
    doc.setTextColor(0, 156, 72);
    doc.text(`Total Productos Evaluados: ${items.length}`, 25, 60);

    const missingUn = inventory.total_missing || 0;
    const missingDol = Number(inventory.total_missing_dollars || missingUn * 1.00).toFixed(2);
    doc.setTextColor(239, 68, 68);
    doc.text(`Total Faltantes: ${missingUn} un. ($${missingDol})`, 25, 67);

    doc.setTextColor(2, 132, 199);
    doc.text(`Total Cuadran: ${inventory.total_match || 0} prod.`, 110, 60);

    const surplusUn = inventory.total_surplus || 0;
    const surplusDol = Number(inventory.total_surplus_dollars || surplusUn * 1.00).toFixed(2);
    doc.setTextColor(247, 181, 0);
    doc.text(`Total Sobran: +${surplusUn} un. (+$${surplusDol})`, 110, 67);

    let currentY = 86;

    // Separate items by Category
    const categoriesList = ['COCOEXPRESS', 'KELAO'];

    categoriesList.forEach((catName) => {
      const catItems = items.filter(it => it.category === catName);
      if (catItems.length === 0) return;

      doc.setFontSize(11.5);
      doc.setTextColor(0, 156, 72);
      doc.text(`CATEGORIA: ${catName}`, 20, currentY);
      currentY += 8;

      // Table Header
      doc.setFontSize(8.5);
      doc.setTextColor(255, 255, 255);
      doc.setFillColor(0, 156, 72);
      doc.rect(20, currentY, 170, 7, 'F');
      doc.text('Producto', 22, currentY + 5);
      doc.text('U/M', 80, currentY + 5);
      doc.text('Costo', 93, currentY + 5);
      doc.text('Sistema', 110, currentY + 5);
      doc.text('Fisico', 126, currentY + 5);
      doc.text('Diferencia ($)', 142, currentY + 5);
      doc.text('Obs.', 175, currentY + 5);
      currentY += 9;

      doc.setFontSize(8);

      catItems.forEach((it: any) => {
        const sys = Number(it.system_qty || 0);
        const phys = Number(it.physical_qty || 0);
        const diff = phys - sys;
        const unitCost = Number(it.cost || 1.00);
        const diffDollars = diff * unitCost;

        let diffText = 'Cuadra ($0)';
        if (diff < 0) {
          diffText = `Falta (${diff} / -$${Math.abs(diffDollars).toFixed(2)})`;
        } else if (diff > 0) {
          diffText = `Sobra (+${diff} / +$${diffDollars.toFixed(2)})`;
        }

        // Draw row background for Faltantes
        if (diff < 0) {
          doc.setFillColor(254, 242, 242);
          doc.rect(20, currentY - 3, 170, 6, 'F');
          doc.setTextColor(185, 28, 28);
        } else if (diff > 0) {
          doc.setFillColor(240, 249, 255);
          doc.rect(20, currentY - 3, 170, 6, 'F');
          doc.setTextColor(3, 105, 161);
        } else {
          doc.setTextColor(50, 50, 50);
        }

        const prodNameTruncated = doc.splitTextToSize(it.name, 56);
        doc.text(prodNameTruncated[0], 22, currentY);
        doc.text(String(it.unit || 'UN'), 80, currentY);
        doc.text(`$${unitCost.toFixed(2)}`, 93, currentY);
        doc.text(String(sys), 112, currentY);
        doc.text(String(phys), 128, currentY);
        doc.text(diffText, 142, currentY);
        
        const obsTrunc = doc.splitTextToSize(it.observation || '-', 15);
        doc.text(obsTrunc[0], 175, currentY);

        currentY += 6;

        if (currentY > 270) {
          doc.addPage();
          currentY = 20;
        }
      });

      currentY += 6;
      if (currentY > 270) {
        doc.addPage();
        currentY = 20;
      }
    });

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
