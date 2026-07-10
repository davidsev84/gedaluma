import { jsPDF } from 'jspdf';
import { categories, ghostCategories } from '../data/mock';

export const generatePDF = (
  evaluation: any, 
  responses: any[], 
  evaluatorSignature?: string
) => {
  try {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Reporte de Auditoria - Gestion de Gedaluma', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Isla: ${evaluation.isla_name}`, 20, 35);

    if (evaluation.evaluator_role !== 'ghost') {
      doc.text(`Empleado Evaluado: ${evaluation.evaluated_employee || 'N/A'}`, 20, 42);
      doc.text(`Evaluador: ${evaluation.evaluator_name || 'N/A'}`, 20, 49);
      doc.text(`Fecha: ${new Date(evaluation.created_at || Date.now()).toLocaleDateString()}`, 20, 56);
      doc.text(`Puntaje Final: ${Number(evaluation.total_score || 0).toFixed(2)} / 100`, 20, 63);
      doc.text(`Estado: ${evaluation.status || 'Completado'}`, 20, 70);
    } else {
      doc.text(`Horario: ${evaluation.time_slot || 'N/A'}`, 20, 42);
      doc.text(`Evaluador: ${evaluation.evaluator_name || 'N/A'}`, 20, 49);
      doc.text(`Fecha: ${new Date(evaluation.created_at || Date.now()).toLocaleDateString()}`, 20, 56);
      doc.text(`Puntaje Final: ${Number(evaluation.total_score || 0).toFixed(2)} / 100`, 20, 63);
      doc.text(`Estado: ${evaluation.status || 'Completado'}`, 20, 70);
    }

    let currentY = 85;
    
    // Iterate through all questions for PDF
    doc.setFontSize(14);
    doc.text('Detalle de Respuestas:', 20, currentY);
    currentY += 10;
    
    // Determinar qué categorías usar basado en el rol
    const activeCategories = evaluation.evaluator_role === 'ghost' ? ghostCategories : categories;

    activeCategories.forEach((cat: any) => {
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(cat.name, 20, currentY);
      currentY += 8;
      
      doc.setFontSize(10);
      cat.questions.forEach((q: any, idx: number) => {
        // Encontrar la respuesta correspondiente en la base de datos o estado actual
        const resp = responses.find(r => r.question_id === q.id) || responses.find(r => r.id === q.id); 
        
        const answerVal = resp ? (resp.value || 'Sin respuesta') : 'Sin respuesta';
        const obsVal = resp ? resp.observation : null;

        const splitTitle = doc.splitTextToSize(`${idx + 1}. ${q.text}`, 170);
        doc.text(splitTitle, 20, currentY);
        currentY += splitTitle.length * 5;
        
        doc.setTextColor(0, 100, 200);
        const splitAnswer = doc.splitTextToSize(`R: ${answerVal}`, 160);
        doc.text(splitAnswer, 30, currentY);
        doc.setTextColor(0, 0, 0);
        currentY += (splitAnswer.length * 5);

        if (obsVal) {
          doc.setTextColor(100, 100, 100);
          const splitObs = doc.splitTextToSize(`Comentario: ${obsVal}`, 160);
          doc.text(splitObs, 30, currentY);
          doc.setTextColor(0, 0, 0);
          currentY += (splitObs.length * 5);
        }
        currentY += 4;
        
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
    
    // Firmas (si están disponibles)
    if (evaluatorSignature) {
      doc.addPage();
      currentY = 30;
      doc.setFontSize(14);
      doc.text('Firmas de Responsabilidad:', 20, currentY);
      currentY += 15;
      
      doc.setFontSize(12);
      doc.text('Evaluador:', 20, currentY);
      doc.addImage(evaluatorSignature, 'PNG', 20, currentY + 5, 60, 20);
    }

    const islaNameSafe = (evaluation.isla_name || 'Isla').replace(/ /g, '_');
    doc.save(`auditoria_${islaNameSafe}_${new Date().getTime()}.pdf`);
    
    return true;
  } catch (error) {
    console.error('Error generando PDF:', error);
    alert('Hubo un problema específico al generar el documento PDF.');
    return false;
  }
};
