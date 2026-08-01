import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { questions } from './questions';

const OPTIONS_MAP = {
  0: 'COMPLETAMENTE FALSO',
  1: 'BASTANTE FALSO',
  2: 'ALGO FALSO',
  3: 'ALGO VERDADERO',
  4: 'BASTANTE VERDADERO',
  5: 'COMPLETAMENTE VERDADERO',
};

export const generateResponsesPDF = (answers, patientData) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(18);
  doc.setTextColor(37, 99, 235); // text-blue-600
  doc.text('Inventario ICCP - Respuestas', 14, 22);
  
  // Patient Info
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);
  
  const startY = 32;
  const lineHeight = 6;
  
  const drawText = (label, value, x, y) => {
    doc.setFont(undefined, 'bold');
    doc.text(`${label}:`, x, y);
    doc.setFont(undefined, 'normal');
    const labelWidth = doc.getTextWidth(`${label}: `);
    doc.text(value || 'N/A', x + labelWidth, y);
  };

  drawText('Nombre', patientData.nombre, 14, startY);
  drawText('Edad', patientData.edad, 120, startY);
  drawText('Sexo', patientData.sexo, 14, startY + lineHeight);
  drawText('Fecha', patientData.fechaEvaluacion, 120, startY + lineHeight);
  drawText('Nivel Educativo', patientData.nivelEducativo, 14, startY + lineHeight * 2);

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(14, startY + lineHeight * 3, 196, startY + lineHeight * 3);

  // Table Data
  const tableData = questions.map((q, idx) => {
    const answerVal = answers[idx];
    const answerText = answerVal !== undefined ? `${OPTIONS_MAP[answerVal]} (${answerVal})` : 'Sin responder';
    const cleanQuestion = q.replace(/^\d+\.\s*/, '');
    return [
      (idx + 1).toString(),
      cleanQuestion,
      answerText
    ];
  });
  
  // AutoTable
  autoTable(doc, {
    startY: startY + lineHeight * 4,
    head: [['#', 'Pregunta', 'Respuesta']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [37, 99, 235],
      textColor: 255,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 110 },
      2: { cellWidth: 'auto', halign: 'center' }
    },
    margin: { top: 20 }
  });

  // Name formatting
  const nameStr = patientData.nombre ? `_${patientData.nombre.replace(/\s+/g, '_')}` : '';
  const dateStr = patientData.fechaEvaluacion ? `_${patientData.fechaEvaluacion}` : '';
  
  doc.save(`Respuestas_ICCP${nameStr}${dateStr}.pdf`);
};
