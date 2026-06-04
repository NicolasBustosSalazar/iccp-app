import { pdf } from '@react-pdf/renderer';
import { ICCPReportPDF } from '../components/ICCPReportPDF';
import React from 'react';

export const generatePDF = async (scores, patientData = {}) => {
  try {
    const document = <ICCPReportPDF scores={scores} patientData={patientData} />;
    const asPdf = pdf();
    asPdf.updateContainer(document);
    const blob = await asPdf.toBlob();
    
    // Create a temporary link to download the blob
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement('a');
    link.href = url;
    
    // Generate filename based on patient name and date
    const nameStr = patientData.nombre ? `_${patientData.nombre}` : '';
    const dateStr = patientData.fechaEvaluacion ? `_${patientData.fechaEvaluacion}` : '';
    link.download = `ICCP${nameStr}${dateStr}.pdf`;
    
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error generating vector PDF:', error);
    throw error;
  }
};
