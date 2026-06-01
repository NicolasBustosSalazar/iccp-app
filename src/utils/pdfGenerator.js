/**
 * pdfGenerator.js
 * Generates a professional ICCP clinical report PDF using jsPDF + Chart.js.
 * Tables show PB (Puntuación Bruta) and T (Puntuación T) columns.
 * Two horizontal profile charts include diagnostic zone bands.
 */

import jsPDF from 'jspdf';
import { Chart as ChartJS, registerables } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';

ChartJS.register(...registerables, annotationPlugin);

// ─── Chart.js Custom Plugins ──────────────────────────────────────────────────

const whiteBackgroundPlugin = {
  id: 'custom_canvas_background',
  beforeDraw: (chart) => {
    const { ctx } = chart;
    ctx.save();
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, chart.width, chart.height);
    ctx.restore();
  }
};

// ─── Constants ────────────────────────────────────────────────────────────────

const COLORS = {
  primary:   [37,  99,  235],   // blue-600
  secondary: [30,  64,  175],   // blue-800
  header:    [15,  23,  42],    // slate-900
  row1:      [248, 250, 252],   // slate-50
  row2:      [255, 255, 255],
  border:    [203, 213, 225],   // slate-300
  text:      [30,  41,  59],    // slate-800
  muted:     [100, 116, 139],   // slate-500
  validez:   [14,  116, 144],   // cyan-700
  globales:  [21,  128, 61],    // green-700
  criterioA: [124, 58,  237],   // violet-600
  criterioB: [194, 65,  12],    // orange-700
};

// Clinical scale labels — exact nomenclature
const LABELS = {
  // Validez
  AR:    'Ausencia de Respuesta',
  INC:   'Inconsistencia',
  MGPAT: 'Magnificación de Psicopatología',
  MNPAT: 'Minimización de Psicopatología',
  MGPOS: 'Magnificación de Rasgos Positivos',
  // Globales
  IFP:   'Índice de Funcionamiento de la Personalidad',
  IPAT:  'Índice de Rasgos Patológicos de la Personalidad',
  IPOS:  'Índice de Rasgos Positivos de la Personalidad',
  IAP:   'Índice de Ajuste de la Personalidad',
  IEXT:  'Índice de Conductas Externalizantes',
  IINT:  'Índice de Conductas Internalizantes',
  // Criterio A
  FS:    'Funcionamiento del Sí-mismo',
  FI:    'Funcionamiento Interpersonal',
  // Criterio B
  AF:    'Afecto Negativo',
  SE:    'Serenidad',
  DA:    'Desapego',
  HU:    'Humanidad',
  AN:    'Antagonismo',
  IN:    'Integridad',
  DI:    'Desinhibición',
  MO:    'Moderación',
  PS:    'Psicoticismo',
  VF:    'Vivacidad y Foco',
};

// ─── Normative Data (Baremos) ────────────────────────────────────────────────

/**
 * Normative means and standard deviations for the ICCP.
 * MNPAT has a negative SD: this is intentional — it inverts the scale so that
 * higher raw minimisation scores produce lower T scores (clinically correct).
 */
const ICCP_NORMS = {
  // Continuos de Rasgos (Criterio B)
  AF:    { mean: 1.7027, sd:  0.86837 },
  SE:    { mean: 3.1972, sd:  0.85966 },
  DA:    { mean: 1.3390, sd:  0.84765 },
  HU:    { mean: 3.1821, sd:  0.90954 },
  AN:    { mean: 1.4948, sd:  0.85790 },
  IN:    { mean: 3.7201, sd:  0.80498 },
  DI:    { mean: 1.2942, sd:  0.84407 },
  MO:    { mean: 3.0909, sd:  0.89303 },
  PS:    { mean: 0.5117, sd:  0.68247 },
  VF:    { mean: 3.3939, sd:  0.83598 },
  // Criterio A
  FS:    { mean: 1.2000, sd:  1.01500 },
  FI:    { mean: 1.0150, sd:  1.01000 },
  // Índices Globales
  IFP:   { mean: 1.1100, sd:  0.76000 },
  IPAT:  { mean: 1.2650, sd:  0.58500 },
  IPOS:  { mean: 3.3200, sd:  0.73000 },
  IEXT:  { mean: 1.3900, sd:  0.71000 },
  IINT:  { mean: 1.5200, sd:  0.74000 },
  // Escalas de Validez (con baremo)
  MGPAT: { mean: 1.0850, sd:  0.80000 },
  MNPAT: { mean: 1.7950, sd: -0.84000 },  // negative sd = inverted scale
  MGPOS: { mean: 3.2900, sd:  0.64000 },
  // AR e INC: NO tienen Puntuación T (se interpretan por PB directo)
};

// ─── T-Score Transformation ───────────────────────────────────────────────────

/**
 * Converts a raw score to a Puntuación T using the standard formula:
 *   T = 50 + ((PB - mean) / sd) × 10
 *
 * Returns null when:
 *  - rawScore is missing/null (scale not scorable)
 *  - the scale has no normative entry (AR, INC, IAP)
 * The result is clamped to [20, 100] to stay within chart bounds.
 */
export const transformToTScore = (rawScore, scaleKey) => {
  if (rawScore === null || rawScore === undefined || isNaN(rawScore)) return null;
  const norms = ICCP_NORMS[scaleKey];
  if (!norms) return null;   // no norms defined (e.g. AR, INC, IAP)
  const t = 50 + ((rawScore - norms.mean) / norms.sd) * 10;
  return Math.round(Math.min(100, Math.max(20, t)));
};

// ─── Formatting helpers ────────────────────────────────────────────────────────

const fmtPB = (val) =>
  val === null || val === undefined || isNaN(val) ? 'N/C' : Number(val).toFixed(2);

// '—' for null (no T score applicable); numeric string otherwise
const fmtT = (val) =>
  val === null || val === undefined ? '—' : String(val);

// ─── PDF drawing helpers ───────────────────────────────────────────────────────

/**
 * Draws a section header bar.
 */
function drawSectionHeader(doc, y, title, color) {
  const pw = doc.internal.pageSize.width;
  const margin = 14;
  doc.setFillColor(...color);
  doc.roundedRect(margin, y, pw - margin * 2, 8, 1.5, 1.5, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(title, margin + 4, y + 5.5);
  return y + 12;
}

/**
 * Draws a 3-column clinical table: Escala | Acrónimo | PB | T
 * Returns Y position after the table.
 */
function drawTable(doc, startY, rows) {
  const margin = 14;
  const pw = doc.internal.pageSize.width;
  const tableW = pw - margin * 2;

  // Column widths
  const colAcro = 14;
  const colT    = 16;
  const colPB   = 20;
  const colName = tableW - colAcro - colPB - colT;

  const rowH = 7.5;
  const headerH = 8;

  let y = startY;

  // Header row
  doc.setFillColor(71, 85, 105);
  doc.rect(margin, y, tableW, headerH, 'F');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Escala', margin + 3, y + 5.5);
  doc.text('PB', margin + colName + colAcro + colPB / 2, y + 5.5, { align: 'center' });
  doc.text('T',  margin + colName + colAcro + colPB + colT / 2, y + 5.5, { align: 'center' });
  y += headerH;

  // Data rows
  rows.forEach((row, i) => {
    const fill = i % 2 === 0 ? COLORS.row1 : COLORS.row2;
    doc.setFillColor(...fill);
    doc.rect(margin, y, tableW, rowH, 'F');

    // Grid lines
    doc.setDrawColor(...COLORS.border);
    doc.setLineWidth(0.2);
    doc.rect(margin, y, tableW, rowH, 'S');

    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.text);

    // Acronym badge
    doc.setFont('helvetica', 'bold');
    doc.text(row.acronym, margin + colAcro / 2, y + 5, { align: 'center' });

    // Scale name
    doc.setFont('helvetica', 'normal');
    doc.text(row.name, margin + colAcro + 3, y + 5);

    // PB
    doc.text(row.pb, margin + colName + colAcro + colPB / 2, y + 5, { align: 'center' });

    // T
    doc.setFont('helvetica', 'bold');
    if (row.t === 'N/C') {
      doc.setTextColor(160, 160, 160);
    } else {
      doc.setTextColor(...COLORS.primary);
    }
    doc.text(row.t, margin + colName + colAcro + colPB + colT / 2, y + 5, { align: 'center' });

    y += rowH;
  });

  return y + 6;
}

// ─── Validity alerts ─────────────────────────────────────────────────────────────

/**
 * Draws a coloured alert block after the Escalas de Validez table.
 * Returns the new Y position after the block.
 */
function drawValidityAlerts(doc, y, scores) {
  const { AR, INC, MGPAT, MGPOS } = scores.validez;
  const tMGPAT = transformToTScore(MGPAT, 'MGPAT');
  const tMGPOS = transformToTScore(MGPOS, 'MGPOS');

  const mg      = 14;
  const pw      = doc.internal.pageSize.width;
  const tableW  = pw - mg * 2;
  const lineH   = 5.5;

  // ── Determine alerts ──
  const isInvalid  = AR >= 12 || (INC !== null && INC >= 7);
  const warnMGPAT  = tMGPAT !== null && tMGPAT >= 70;
  const warnMGPOS  = tMGPOS !== null && tMGPOS >= 65;
  const allClear   = !isInvalid && !warnMGPAT && !warnMGPOS;

  const alerts = [];
  if (isInvalid) alerts.push({
    icon: '\u26D4',  // ⛔
    text: 'PROTOCOLO INV\u00c1LIDO. El evaluado ha dejado demasiadas preguntas sin responder o ha respondido de forma inconsistente. No se recomienda interpretar los resultados.',
    lvl:  'invalid',
  });
  if (warnMGPAT) alerts.push({
    icon: '\u26A0\uFE0F',  // ⚠️
    text: 'Posible exageraci\u00f3n de s\u00edntomas o simulaci\u00f3n de patolog\u00eda (MGPAT T =' + tMGPAT + ').',
    lvl:  'warn',
  });
  if (warnMGPOS) alerts.push({
    icon: '\u26A0\uFE0F',
    text: 'Posible magnificaci\u00f3n de rasgos positivos — imagen socialmente deseable (MGPOS T =' + tMGPOS + ').',
    lvl:  'warn',
  });
  if (allClear) alerts.push({
    icon: '\u2705',  // ✅
    text: 'Protocolo v\u00e1lido. Estilos de respuesta dentro de los par\u00e1metros normales.',
    lvl:  'ok',
  });

  // ── Box background ──
  const boxH = alerts.length * lineH + 9;
  let bgR, bgG, bgB;
  if      (isInvalid) { bgR = 254; bgG = 226; bgB = 226; } // red-100
  else if (warnMGPAT || warnMGPOS) { bgR = 255; bgG = 251; bgB = 235; } // amber-50
  else    { bgR = 240; bgG = 253; bgB = 244; } // green-50

  doc.setFillColor(bgR, bgG, bgB);
  doc.setDrawColor(isInvalid ? 220 : (allClear ? 134 : 217),
                   isInvalid ?  38 : (allClear ? 239 : 119),
                   isInvalid ?  38 : (allClear ?  78 :  22));
  doc.setLineWidth(0.4);
  doc.roundedRect(mg, y, tableW, boxH, 2, 2, 'FD');

  // ── Alert lines ──
  let ay = y + 6;
  alerts.forEach(({ text, lvl }) => {
    if      (lvl === 'invalid') { doc.setTextColor(185, 28, 28); }
    else if (lvl === 'warn')   { doc.setTextColor(146, 64, 14); }
    else                       { doc.setTextColor( 20, 83, 45); }

    doc.setFontSize(7.5);
    doc.setFont('helvetica', lvl === 'invalid' ? 'bold' : 'normal');

    // Prefix bullet
    const prefix = lvl === 'invalid' ? '\u25CF ' : (lvl === 'warn' ? '\u25B2 ' : '\u2714 ');
    doc.text(prefix + text, mg + 3, ay, { maxWidth: tableW - 6 });
    ay += lineH;
  });

  // Reset text colour
  doc.setTextColor(...COLORS.text);
  return y + boxH + 5;
}

// ─── Chart rendering ──────────────────────────────────────────────────────────

/**
 * Renders a horizontal profile chart (indexAxis: 'y') off-screen
 * and returns a base64 PNG.
 */
async function renderProfileChart({ labels, tScores, title, canvasW, canvasH }) {
  const canvas = document.createElement('canvas');
  canvas.width  = canvasW;
  canvas.height = canvasH;
  Object.assign(canvas.style, {
    position: 'absolute', left: '-99999px', top: '-99999px',
  });
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');

  // Background white
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasW, canvasH);

  const chart = new ChartJS(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        data: tScores,
        borderColor:           '#2563eb',
        backgroundColor:       '#2563eb',
        pointBackgroundColor: (context) => {
          const tScore = context.raw;
          if (tScore === undefined || tScore === null) return '#2563eb';
          const label = labels[context.dataIndex];
          const patologicas = ['AF', 'DA', 'AN', 'DI', 'PS', 'IEXT', 'IINT', 'IFP', 'IPAT'];
          const positivas = ['SE', 'HU', 'IN', 'MO', 'VF', 'IPOS'];
          
          if (patologicas.includes(label)) {
            if (tScore >= 60) return '#ef4444'; // Rojo
            if (tScore >= 40 && tScore < 60) return '#eab308'; // Amarillo
            return '#22c55e'; // Verde
          } else if (positivas.includes(label)) {
            if (tScore >= 60) return '#22c55e'; // Verde
            if (tScore >= 40 && tScore < 60) return '#eab308'; // Amarillo
            return '#ef4444'; // Rojo
          }
          return '#2563eb';
        },
        pointBorderColor: (context) => {
          const tScore = context.raw;
          if (tScore === undefined || tScore === null) return '#2563eb';
          const label = labels[context.dataIndex];
          const patologicas = ['AF', 'DA', 'AN', 'DI', 'PS', 'IEXT', 'IINT', 'IFP', 'IPAT'];
          const positivas = ['SE', 'HU', 'IN', 'MO', 'VF', 'IPOS'];
          
          if (patologicas.includes(label)) {
            if (tScore >= 60) return '#ef4444'; // Rojo
            if (tScore >= 40 && tScore < 60) return '#eab308'; // Amarillo
            return '#22c55e'; // Verde
          } else if (positivas.includes(label)) {
            if (tScore >= 60) return '#22c55e'; // Verde
            if (tScore >= 40 && tScore < 60) return '#eab308'; // Amarillo
            return '#ef4444'; // Rojo
          }
          return '#2563eb';
        },
        pointBorderWidth:      2,
        pointRadius:           6,
        pointHoverRadius:      8,
        tension:               0,
        fill:                  false,
        borderWidth:           2.5,
      }],
    },
    options: {
      indexAxis: 'y',
      animation:  false,
      responsive: false,
      layout: { padding: { top: 30, right: 20, bottom: 20, left: 10 } },
      plugins: {
        legend: { display: false },
        title: {
          display:  true,
          text:     title,
          font:     { size: 15, weight: 'bold', family: 'Arial' },
          color:    '#0f172a',
          padding:  { bottom: 12 },
        },
        annotation: {
          annotations: {
            line40: {
              type: 'line',
              xMin: 40,
              xMax: 40,
              borderColor: '#cbd5e1',
              borderWidth: 1.5,
              borderDash: [4, 4]
            },
            line50: {
              type: 'line',
              xMin: 50,
              xMax: 50,
              borderColor: '#64748b',
              borderWidth: 2,
              borderDash: [6, 4]
            },
            line60: {
              type: 'line',
              xMin: 60,
              xMax: 60,
              borderColor: '#cbd5e1',
              borderWidth: 1.5,
              borderDash: [4, 4]
            },
          },
        },
      },
      scales: {
        x: {
          min: 20, max: 100,
          ticks: {
            stepSize: 10,
            font:     { size: 12, family: 'Arial' },
            color:    '#334155',
          },
          grid:  { color: 'rgba(0,0,0,0.06)' },
          title: {
            display: true,
            text:    'Puntuación T',
            font:    { size: 12, weight: 'bold', family: 'Arial' },
            color:   '#334155',
          },
        },
        y: {
          ticks: {
            font:    { size: 12, family: 'Arial' },
            color:   '#1e293b',
            padding: 8,
          },
          grid: { color: 'rgba(0,0,0,0.06)' },
        },
      },
    },
    plugins: [whiteBackgroundPlugin],
  });

  await new Promise(r => setTimeout(r, 500));
  const img = canvas.toDataURL('image/png');
  chart.destroy();
  document.body.removeChild(canvas);
  return img;
}

/**
 * Renders the IAP Quadrant scatter chart off-screen.
 * X-axis = IPOS T, Y-axis = IPAT T.
 * Returns base64 PNG.
 */
async function renderQuadrantChart(tIPOS, tIPAT) {
  const SZ = 480;   // square canvas (pixels)
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = SZ;
  Object.assign(canvas.style, { position: 'absolute', left: '-99999px', top: '-99999px' });
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, SZ, SZ);

  // Fall-back to midpoint if a score is unavailable
  const px = tIPOS ?? 50;
  const py = tIPAT ?? 50;

  const chart = new ChartJS(ctx, {
    type: 'scatter',
    data: {
      datasets: [{
        data: [{ x: px, y: py }],
        backgroundColor:  'rgba(37, 99, 235, 0.90)',
        borderColor:      '#ffffff',
        borderWidth:      3,
        pointRadius:      16,
        pointHoverRadius: 18,
      }],
    },
    options: {
      responsive: false,
      animation:  false,
      layout: { padding: { top: 36, right: 20, bottom: 10, left: 10 } },
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          text:    'Modelo de Ajuste de la Personalidad (IAP)',
          font:    { size: 15, weight: 'bold', family: 'Arial' },
          color:   '#0f172a',
          padding: { bottom: 10 },
        },
        annotation: {
          annotations: {
            // ── Dividing lines at T=50 ──
            lineV: { type: 'line', xMin: 50, xMax: 50,
                     borderColor: '#64748b', borderWidth: 2 },
            lineH: { type: 'line', yMin: 50, yMax: 50,
                     borderColor: '#64748b', borderWidth: 2 },
            // ── Quadrant labels — positioned at center of each quadrant ──
            lSI: {
              type: 'label', xValue: 35, yValue: 75,
              content: ['Personalidad', 'Patol\u00f3gica'],
              textAlign: 'center',
              font:  { size: 11, weight: 'bold', style: 'italic', family: 'Arial' },
              color: 'rgba(185,28,28,0.72)',
            },
            lSD: {
              type: 'label', xValue: 75, yValue: 75,
              content: ['Patol\u00f3gica', 'Compensada'],
              textAlign: 'center',
              font:  { size: 11, weight: 'bold', style: 'italic', family: 'Arial' },
              color: 'rgba(146,64,14,0.72)',
            },
            lII: {
              type: 'label', xValue: 35, yValue: 25,
              content: ['Personalidad', 'Vulnerable'],
              textAlign: 'center',
              font:  { size: 11, weight: 'bold', style: 'italic', family: 'Arial' },
              color: 'rgba(29,78,216,0.72)',
            },
            lID: {
              type: 'label', xValue: 75, yValue: 25,
              content: ['Personalidad', 'Sana'],
              textAlign: 'center',
              font:  { size: 11, weight: 'bold', style: 'italic', family: 'Arial' },
              color: 'rgba(20,83,45,0.72)',
            },
          },
        },
      },
      scales: {
        x: {
          min: 20, max: 100,
          ticks: { stepSize: 10, font: { size: 12, family: 'Arial' }, color: '#334155' },
          grid:  { color: 'rgba(0,0,0,0.05)' },
          title: { display: true,
                   text:    'IPOS \u2014 \u00cdndice de Rasgos Positivos (T)',
                   font:    { size: 12, weight: 'bold', family: 'Arial' },
                   color:   '#334155' },
        },
        y: {
          min: 20, max: 100,
          ticks: { stepSize: 10, font: { size: 12, family: 'Arial' }, color: '#334155' },
          grid:  { color: 'rgba(0,0,0,0.05)' },
          title: { display: true,
                   text:    'IPAT \u2014 \u00cdndice de Rasgos Patol\u00f3gicos (T)',
                   font:    { size: 12, weight: 'bold', family: 'Arial' },
                   color:   '#334155' },
        },
      },
    },
    plugins: [whiteBackgroundPlugin],
  });

  await new Promise(r => setTimeout(r, 500));
  const img = canvas.toDataURL('image/png');
  chart.destroy();
  document.body.removeChild(canvas);
  return img;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export const generatePDF = async (scores, patientData = {}) => {
  const doc  = new jsPDF({ unit: 'mm', format: 'a4' });
  const pw   = doc.internal.pageSize.width;   // 210 mm
  const ph   = doc.internal.pageSize.height;  // 297 mm
  const mg   = 14;

  // ── Helpers ────────────────────────────────────────────────────────────
  const checkPage = (y, neededH) => {
    if (y + neededH > ph - 16) { doc.addPage(); return 20; }
    return y;
  };

  const addFooter = () => {
    const total = doc.internal.getNumberOfPages();
    for (let p = 1; p <= total; p++) {
      doc.setPage(p);
      doc.setFontSize(7.5);
      doc.setTextColor(...COLORS.muted);
      doc.text(
        `ICCP — Inventario de los Cinco Continuos de la Personalidad  |  Página ${p} de ${total}`,
        pw / 2, ph - 7, { align: 'center' }
      );
      doc.setDrawColor(...COLORS.border);
      doc.line(mg, ph - 10, pw - mg, ph - 10);
    }
  };

  // ── Page 1: Header + Patient data + Validity + Global indices ──────────

  // Top colour bar
  doc.setFillColor(...COLORS.primary);
  doc.rect(0, 0, pw, 24, 'F');
  doc.setFillColor(...COLORS.secondary);
  doc.rect(0, 20, pw, 4, 'F');

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Perfil ICCP — Informe Clínico', pw / 2, 14, { align: 'center' });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(219, 234, 254);
  doc.text('Inventario de los Cinco Continuos de la Personalidad', pw / 2, 20, { align: 'center' });

  // ── Patient data block ─────────────────────────────────────────────────
  const boxY = 28;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(...COLORS.border);
  doc.roundedRect(mg, boxY, pw - mg * 2, 28, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.header);
  doc.text('DATOS DEL EVALUADO', mg + 4, boxY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.text);

  const today = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
  const pd = patientData;

  const col1X = mg + 4;
  const col2X = pw / 2 + 2;
  const lineH  = 5.5;
  let pdy = boxY + 13;

  const field = (label, value, x, y) => {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.muted);
    doc.text(`${label}:`, x, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.text);
    const labelW = doc.getTextWidth(`${label}: `);
    doc.text(value || '—', x + labelW + 1, y);
  };

  field('Nombre',              pd.nombre          || '', col1X, pdy);
  field('Fecha de Evaluación', pd.fechaEvaluacion || today, col2X, pdy);
  pdy += lineH;
  field('Edad',               pd.edad ? `${pd.edad} años` : '', col1X, pdy);
  field('Nivel Educativo',    pd.nivelEducativo   || '', col2X, pdy);
  pdy += lineH;
  field('Sexo',               pd.sexo             || '', col1X, pdy);
  field('Fecha del informe',  today,                 col2X, pdy);

  let y = boxY + 34;

  // ── Escalas de Validez ─────────────────────────────────────────────────
  y = drawSectionHeader(doc, y, 'ESCALAS DE VALIDEZ', COLORS.validez);

  const validezRows = [
    // AR: raw count, no T
    {
      acronym: 'AR',
      name:    LABELS.AR,
      pb:      String(scores.validez.AR),
      t:       '—',
    },
    // INC: raw count (0-10), no T
    {
      acronym: 'INC',
      name:    LABELS.INC,
      pb:      scores.validez.INC !== null ? String(scores.validez.INC) : 'N/C',
      t:       '—',
    },
    {
      acronym: 'MGPAT',
      name:    LABELS.MGPAT,
      pb:      fmtPB(scores.validez.MGPAT),
      t:       fmtT(transformToTScore(scores.validez.MGPAT, 'MGPAT')),
    },
    {
      acronym: 'MNPAT',
      name:    LABELS.MNPAT,
      pb:      fmtPB(scores.validez.MNPAT),
      t:       fmtT(transformToTScore(scores.validez.MNPAT, 'MNPAT')),
    },
    {
      acronym: 'MGPOS',
      name:    LABELS.MGPOS,
      pb:      fmtPB(scores.validez.MGPOS),
      t:       fmtT(transformToTScore(scores.validez.MGPOS, 'MGPOS')),
    },
  ];
  y = drawTable(doc, y, validezRows);

  // ── Clinical Validity Alerts ─────────────────────────────────────────────
  y = checkPage(y, 22);
  y = drawValidityAlerts(doc, y, scores);

  // ── Índices Globales ───────────────────────────────────────────────────────────────
  y = checkPage(y, 70);
  y = drawSectionHeader(doc, y, 'ÍNDICES GLOBALES', COLORS.globales);

  const globalesRows = [
    { acronym: 'IFP',  name: LABELS.IFP,  pb: fmtPB(scores.globales.IFP),  t: fmtT(transformToTScore(scores.globales.IFP,  'IFP'))  },
    { acronym: 'IPAT', name: LABELS.IPAT, pb: fmtPB(scores.globales.IPAT), t: fmtT(transformToTScore(scores.globales.IPAT, 'IPAT')) },
    { acronym: 'IPOS', name: LABELS.IPOS, pb: fmtPB(scores.globales.IPOS), t: fmtT(transformToTScore(scores.globales.IPOS, 'IPOS')) },
    // IAP has no normative data yet — show PB only
    { acronym: 'IAP',  name: LABELS.IAP,  pb: fmtPB(scores.globales.IAP),  t: '—'  },
    { acronym: 'IEXT', name: LABELS.IEXT, pb: fmtPB(scores.globales.IEXT), t: fmtT(transformToTScore(scores.globales.IEXT, 'IEXT')) },
    { acronym: 'IINT', name: LABELS.IINT, pb: fmtPB(scores.globales.IINT), t: fmtT(transformToTScore(scores.globales.IINT, 'IINT')) },
  ];
  y = drawTable(doc, y, globalesRows);

  // ── Escalas Específicas ────────────────────────────────────────────────
  y = checkPage(y, 115);
  y = drawSectionHeader(doc, y, 'ESCALAS CRITERIO A — FUNCIONAMIENTO', COLORS.criterioA);

  const criterioARows = [
    { acronym: 'FS', name: LABELS.FS, pb: fmtPB(scores.criterioA.FS), t: fmtT(transformToTScore(scores.criterioA.FS, 'FS')) },
    { acronym: 'FI', name: LABELS.FI, pb: fmtPB(scores.criterioA.FI), t: fmtT(transformToTScore(scores.criterioA.FI, 'FI')) },
  ];
  y = drawTable(doc, y, criterioARows);

  y = checkPage(y, 100);
  y = drawSectionHeader(doc, y, 'CONTINUOS DE RASGOS — CRITERIO B', COLORS.criterioB);

  const criterioBRows = [
    { acronym: 'AF', name: LABELS.AF, pb: fmtPB(scores.criterioB.AF), t: fmtT(transformToTScore(scores.criterioB.AF, 'AF')) },
    { acronym: 'SE', name: LABELS.SE, pb: fmtPB(scores.criterioB.SE), t: fmtT(transformToTScore(scores.criterioB.SE, 'SE')) },
    { acronym: 'DA', name: LABELS.DA, pb: fmtPB(scores.criterioB.DA), t: fmtT(transformToTScore(scores.criterioB.DA, 'DA')) },
    { acronym: 'HU', name: LABELS.HU, pb: fmtPB(scores.criterioB.HU), t: fmtT(transformToTScore(scores.criterioB.HU, 'HU')) },
    { acronym: 'AN', name: LABELS.AN, pb: fmtPB(scores.criterioB.AN), t: fmtT(transformToTScore(scores.criterioB.AN, 'AN')) },
    { acronym: 'IN', name: LABELS.IN, pb: fmtPB(scores.criterioB.IN), t: fmtT(transformToTScore(scores.criterioB.IN, 'IN')) },
    { acronym: 'DI', name: LABELS.DI, pb: fmtPB(scores.criterioB.DI), t: fmtT(transformToTScore(scores.criterioB.DI, 'DI')) },
    { acronym: 'MO', name: LABELS.MO, pb: fmtPB(scores.criterioB.MO), t: fmtT(transformToTScore(scores.criterioB.MO, 'MO')) },
    { acronym: 'PS', name: LABELS.PS, pb: fmtPB(scores.criterioB.PS), t: fmtT(transformToTScore(scores.criterioB.PS, 'PS')) },
    { acronym: 'VF', name: LABELS.VF, pb: fmtPB(scores.criterioB.VF), t: fmtT(transformToTScore(scores.criterioB.VF, 'VF')) },
  ];
  y = drawTable(doc, y, criterioBRows);

  // ── Chart 1: Perfil de Índices Globales ───────────────────────────────
  doc.addPage();
  let cy = 20;

  // IAP is excluded from the chart: no normative data → T score would be null.
  // The 5 indices with validated baremos are graphed.
  const globalLabels = ['IFP', 'IPAT', 'IPOS', 'IEXT', 'IINT'];
  const globalTScores = globalLabels.map(k => transformToTScore(scores.globales[k], k));

  const chart1 = await renderProfileChart({
    labels:   globalLabels,
    tScores:  globalTScores,
    title:    'Perfil de Índices Globales',
    canvasW:  820,
    canvasH:  360,
  });

  const imgW = pw - mg * 2;
  const img1H = imgW * (360 / 820);
  doc.addImage(chart1, 'PNG', mg, cy, imgW, img1H);
  cy += img1H + 6;

  // Profile note: replaces the generic legend with clinically accurate guidance
  cy = drawProfileNote(doc, cy, mg, pw);

  // ── Chart 3: Gráfico de Cuadrantes (IAP / Modelo Dual) ───────────────
  const tIPOS = transformToTScore(scores.globales.IPOS, 'IPOS');
  const tIPAT = transformToTScore(scores.globales.IPAT, 'IPAT');
  const chart3 = await renderQuadrantChart(tIPOS, tIPAT);

  // Place quadrant chart centred on the page (square ~90 mm)
  const qSize = (pw - mg * 2) * 0.60;  // 60% of text width = ~109 mm
  const qX    = mg + ((pw - mg * 2) - qSize) / 2;
  cy = checkPage(cy, qSize + 20);
  cy += 4;
  doc.addImage(chart3, 'PNG', qX, cy, qSize, qSize);
  cy += qSize + 8;

  // ── Chart 2: Perfil de Continuos de Rasgos ────────────────────────────────
  cy = checkPage(cy, 120);
  cy += 8;

  const rasgosLabels  = ['FS', 'FI', 'AF', 'SE', 'DA', 'HU', 'AN', 'IN', 'DI', 'MO', 'PS', 'VF'];
  const rasgosAllScores = { ...scores.criterioA, ...scores.criterioB };
  const rasgosTScores = rasgosLabels.map(k => transformToTScore(rasgosAllScores[k], k));

  const chart2 = await renderProfileChart({
    labels:   rasgosLabels,
    tScores:  rasgosTScores,
    title:    'Perfil de Continuos de Rasgos de la Personalidad',
    canvasW:  820,
    canvasH:  560,
  });

  const img2H = imgW * (560 / 820);
  cy = checkPage(cy, img2H + 20);
  doc.addImage(chart2, 'PNG', mg, cy, imgW, img2H);
  cy += img2H + 6;
  drawProfileNote(doc, cy, mg, pw);

  // ── Footers ────────────────────────────────────────────────────────────
  addFooter();

  doc.save('Informe_ICCP.pdf');
};

// ─── Profile interpretation note ─────────────────────────────────────────────

/**
 * Prints the dual-model interpretation guide below each profile chart.
 * Clinically correct: does NOT assume T≥60 = adaptive for all scales.
 */
function drawProfileNote(doc, y, margin, pw) {
  const tableW = pw - margin * 2;
  const lh = 5.4;
  const textW = tableW - 8;

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');

  // Prepare strings (no special chars like ge, le, bullet)
  const text1 = 'Escalas Patol\u00f3gicas (AF, DA, AN, DI, PS, IEXT, IINT, IFP, IPAT): ' +
                'Puntuaciones T >= 60 indican presencia de patolog\u00eda cl\u00ednica.';
  const split1 = doc.splitTextToSize(text1, textW);

  const text2 = 'Escalas Positivas/Adaptativas (SE, HU, IN, MO, VF, IPOS): ' +
                'T <= 40 indican escasez de recursos y vulnerabilidad; T >= 60 indican salud y adaptaci\u00f3n.';
  const split2 = doc.splitTextToSize(text2, textW);

  const text3 = '- La l\u00ednea punteada vertical marca T = 50 (media normativa de la muestra de tipificaci\u00f3n).';
  const split3 = doc.splitTextToSize(text3, tableW - 6);

  const lines1 = split1.length;
  const lines2 = split2.length;
  const lines3 = split3.length;

  const totalLines = 1 + lines1 + lines2 + lines3; // 1 for title
  const boxH = (totalLines * lh) + 7;

  // Box
  doc.setFillColor(248, 250, 252);   // slate-50
  doc.setDrawColor(...COLORS.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(margin, y, tableW, boxH, 2, 2, 'FD');

  let ty = y + 5.5;

  // Title
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(51, 65, 85);
  doc.text('Gu\u00eda de Interpretaci\u00f3n del Perfil \u2014 Modelo Dual ICCP:', margin + 3, ty);
  ty += lh;

  // Line 1 — Pathological scales
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(185, 28, 28);
  doc.text('-', margin + 3, ty);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(split1, margin + 7, ty);
  ty += lh * lines1;

  // Line 2 — Adaptive scales
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 83, 45);
  doc.text('-', margin + 3, ty);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(split2, margin + 7, ty);
  ty += lh * lines2;

  // Line 3 — Median reference
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.muted);
  doc.text(split3, margin + 3, ty);

  doc.setTextColor(...COLORS.text);
  return y + boxH + 5;
}
