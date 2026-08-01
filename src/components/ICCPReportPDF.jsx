import React from 'react';
import { Page, Text, View, Document, StyleSheet, Svg, Line, Circle, Rect } from '@react-pdf/renderer';
import { LABELS, transformToTScore, formatPB, formatT } from '../utils/scoringConfig';

// A4: 595.28 x 841.89
const PAGE_WIDTH = 595.28;
const PADDING = 30;
const INNER_WIDTH = PAGE_WIDTH - (PADDING * 2);
const LEFT_PANEL_W = INNER_WIDTH * 0.45;
const RIGHT_PANEL_W = INNER_WIDTH * 0.55;
const SVG_PADDING = 8;
const SVG_WIDTH = RIGHT_PANEL_W - (SVG_PADDING * 2);
const ROW_HEIGHT = 22;

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: PADDING,
    fontFamily: 'Helvetica',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    textTransform: 'uppercase',
    borderBottomWidth: 1.5,
    borderBottomColor: '#0f172a',
    paddingBottom: 4,
    color: '#0f172a',
  },
  patientData: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 2,
    padding: 8,
    marginBottom: 15,
  },
  warningBanner: {
    backgroundColor: '#fee2e2',
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
    padding: 8,
    marginBottom: 15,
  },
  warningText: {
    color: '#b91c1c',
    fontSize: 10,
    fontWeight: 'bold',
  },
  pdField: {
    width: '50%',
    flexDirection: 'row',
    marginBottom: 4,
  },
  pdLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    width: 75,
    color: '#1e293b',
  },
  pdValue: {
    fontSize: 9,
    color: '#334155',
  },
  block: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#9ca3af',
  },
  blockHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#9ca3af',
  },
  blockHeaderLeft: {
    width: '45%',
    backgroundColor: '#d1d5db',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  blockHeaderRight: {
    width: '55%',
    backgroundColor: '#ffffff',
    borderLeftWidth: 1,
    borderLeftColor: '#9ca3af',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  blockTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#1e293b',
  },
  colHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#9ca3af',
    backgroundColor: '#f3f4f6',
  },
  colHeaderLeft: {
    width: '45%',
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  colHeaderRight: {
    width: '55%',
    borderLeftWidth: 1,
    borderLeftColor: '#9ca3af',
    backgroundColor: '#ffffff',
  },
  colHeaderText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#4b5563',
  },
  colEscala: { flex: 1 },
  colAcron: { width: 35, textAlign: 'center' },
  colPB: { width: 30, textAlign: 'center' },
  colT: { width: 30, textAlign: 'center' },
  contentRow: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
  },
  leftPanel: {
    width: '45%',
    flexDirection: 'column',
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: ROW_HEIGHT,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    paddingHorizontal: 8,
  },
  dataRowLast: {
    borderBottomWidth: 0,
  },
  cellEscala: { flex: 1, fontSize: 9, color: '#1f2937' },
  cellAcron: { width: 35, textAlign: 'center', fontSize: 8, color: '#1e3a8a', fontWeight: 'bold' },
  cellPB: { width: 30, textAlign: 'center', fontSize: 9, color: '#4b5563' },
  cellT: { width: 30, textAlign: 'center', fontSize: 9, fontWeight: 'bold', color: '#111827' },
  rightPanel: {
    width: '55%',
    borderLeftWidth: 1,
    borderLeftColor: '#9ca3af',
    position: 'relative',
    flexDirection: 'column',
  },
  xAxis: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#9ca3af',
    backgroundColor: '#f9fafb',
  },
  xAxisLeft: {
    width: '45%',
    backgroundColor: '#ffffff',
  },
  xAxisRight: {
    width: '55%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderLeftWidth: 1,
    borderLeftColor: '#9ca3af',
    paddingHorizontal: SVG_PADDING,
    paddingVertical: 3,
  },
  xLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  footer: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 9,
    color: '#475569',
    marginBottom: 6,
  },
  legendBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  circleDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 4,
  }
});

const ReportBlockPDF = ({ title, items }) => {
  const getT = (val, key) => transformToTScore(val, key);
  const N = items.length;
  const svgHeight = N * ROW_HEIGHT;

  const points = items.map((item, idx) => {
    let tScore = item.skipT ? null : getT(item.val, item.key);
    let x = null;
    if (item.skipGraph) {
      x = null;
    } else if (item.useRaw) {
      const raw = item.val !== null && item.val !== undefined ? item.val : 0;
      x = (Math.min(raw, 15) / 15) * SVG_WIDTH;
    } else if (tScore !== null) {
      x = ((tScore - 20) / 80) * SVG_WIDTH;
    }
    const yStart = idx * ROW_HEIGHT;
    const yCenter = yStart + (ROW_HEIGHT / 2);
    return { ...item, x, yStart, yCenter, tScore };
  });

  const validPoints = points.filter(p => p.x !== null);

  return (
    <View style={styles.block} wrap={false}>
      {/* Block Header */}
      <View style={styles.blockHeader}>
        <View style={styles.blockHeaderLeft}>
          <Text style={styles.blockTitle}>{title}</Text>
        </View>
        <View style={styles.blockHeaderRight}>
          <Text style={styles.blockTitle}>{title}</Text>
        </View>
      </View>

      {/* Columns Header */}
      <View style={styles.colHeader}>
        <View style={styles.colHeaderLeft}>
          <Text style={[styles.colHeaderText, styles.colEscala]}>Escala</Text>
          <Text style={[styles.colHeaderText, styles.colAcron]}>Acrón.</Text>
          <Text style={[styles.colHeaderText, styles.colPB]}>PB</Text>
          <Text style={[styles.colHeaderText, styles.colT]}>T</Text>
        </View>
        <View style={styles.colHeaderRight}></View>
      </View>

      {/* Content */}
      <View style={styles.contentRow}>
        {/* Left Panel - Texts */}
        <View style={styles.leftPanel}>
          {points.map((item, idx) => {
            const pbStr = formatPB(item.val);
            const tStr = item.skipT ? '—' : item.useRaw ? '—' : formatT(item.tScore);
            return (
              <View key={item.key} style={[styles.dataRow, idx === N - 1 ? styles.dataRowLast : {}]}>
                <Text style={styles.cellEscala}>{LABELS[item.key]}</Text>
                <Text style={styles.cellAcron}>{item.key}</Text>
                <Text style={styles.cellPB}>{pbStr}</Text>
                <Text style={styles.cellT}>{tStr}</Text>
              </View>
            );
          })}
        </View>

        {/* Right Panel - SVG Graph */}
        <View style={styles.rightPanel}>
          <View style={{ position: 'absolute', top: 0, left: SVG_PADDING, width: SVG_WIDTH, height: svgHeight }}>
            <Svg width={SVG_WIDTH} height={svgHeight}>
              
              {/* Background Rects per Row */}
              {points.map((p, idx) => {
                if (p.band === 'none') return null;
                let colors = [];
                if (p.band === 'patologica') {
                  colors = ['#dcfce7', '#fef08a', '#fee2e2']; // Verde, Amarillo, Rojo
                } else if (p.band === 'positiva') {
                  colors = ['#fee2e2', '#fef08a', '#dcfce7']; // Rojo, Amarillo, Verde
                }
                return (
                  <React.Fragment key={`bg-${p.key}`}>
                    <Rect x={0} y={p.yStart} width={SVG_WIDTH * 0.25} height={ROW_HEIGHT} fill={colors[0]} opacity={0.4} />
                    <Rect x={SVG_WIDTH * 0.25} y={p.yStart} width={SVG_WIDTH * 0.25} height={ROW_HEIGHT} fill={colors[1]} opacity={0.4} />
                    <Rect x={SVG_WIDTH * 0.5} y={p.yStart} width={SVG_WIDTH * 0.5} height={ROW_HEIGHT} fill={colors[2]} opacity={0.4} />
                  </React.Fragment>
                );
              })}

              {/* Reference Lines */}
              <Line x1={SVG_WIDTH * 0.25} y1={0} x2={SVG_WIDTH * 0.25} y2={svgHeight} stroke="#d1d5db" strokeWidth={1} strokeDasharray="2,2" />
              <Line x1={SVG_WIDTH * 0.375} y1={0} x2={SVG_WIDTH * 0.375} y2={svgHeight} stroke="#9ca3af" strokeWidth={1.5} />
              <Line x1={SVG_WIDTH * 0.50} y1={0} x2={SVG_WIDTH * 0.50} y2={svgHeight} stroke="#d1d5db" strokeWidth={1} strokeDasharray="2,2" />

              {/* Connective Lines */}
              {validPoints.map((p, idx) => {
                if (idx === 0) return null;
                const prev = validPoints[idx - 1];
                return (
                  <Line 
                    key={`link-${p.key}`}
                    x1={prev.x} y1={prev.yCenter}
                    x2={p.x} y2={p.yCenter}
                    stroke="#374151" strokeWidth={2}
                  />
                );
              })}

              {/* Exact Circles */}
              {validPoints.map(p => {
                let fill = '#6b7280';
                if (p.band === 'patologica') {
                  if (p.tScore >= 60) fill = '#ef4444';
                  else if (p.tScore >= 40) fill = '#eab308';
                  else fill = '#22c55e';
                } else if (p.band === 'positiva') {
                  if (p.tScore >= 60) fill = '#22c55e';
                  else if (p.tScore >= 40) fill = '#eab308';
                  else fill = '#ef4444';
                }
                return (
                  <Circle
                    key={`pt-${p.key}`}
                    cx={p.x} cy={p.yCenter}
                    r={4}
                    fill={fill}
                    stroke="#ffffff"
                    strokeWidth={1}
                  />
                );
              })}
            </Svg>
          </View>
        </View>
      </View>

      {/* X Axis */}
      <View style={styles.xAxis}>
        <View style={styles.xAxisLeft}></View>
        <View style={styles.xAxisRight}>
          {[20, 30, 40, 50, 60, 70, 80, 90, 100].map(v => (
            <Text key={v} style={styles.xLabel}>{v}</Text>
          ))}
        </View>
      </View>

    </View>
  );
};

export const ICCPReportPDF = ({ scores, patientData }) => {
  const pd = {
    nombre: patientData?.nombre || '',
    edad: patientData?.edad || '',
    sexo: patientData?.sexo || '',
    nacionalidad: patientData?.nacionalidad || '',
    estadoCivil: patientData?.estadoCivil || '',
    nivelEducativo: patientData?.nivelEducativo || '',
    fechaEvaluacion: patientData?.fechaEvaluacion || '',
    fechaInforme: new Date().toISOString().split('T')[0],
  };

  const validezItems = [
    { key: 'AR', band: 'none', skipGraph: true, useRaw: true, val: scores.validez?.AR },
    { key: 'INC', band: 'none', val: scores.validez?.INC },
    { key: 'MGPAT', band: 'patologica', val: scores.validez?.MGPAT },
    { key: 'MNPAT', band: 'patologica', val: scores.validez?.MNPAT },
    { key: 'MGPOS', band: 'patologica', val: scores.validez?.MGPOS },
  ];

  const globalesItems = [
    { key: 'IFP', band: 'patologica', val: scores.globales?.IFP },
    { key: 'IPAT', band: 'patologica', val: scores.globales?.IPAT },
    { key: 'IPOS', band: 'positiva', val: scores.globales?.IPOS },
    { key: 'IAP', band: 'none', val: scores.globales?.IAP },
    { key: 'IEXT', band: 'patologica', val: scores.globales?.IEXT },
    { key: 'IINT', band: 'patologica', val: scores.globales?.IINT },
  ];

  const criterioAItems = [
    { key: 'FS', band: 'patologica', val: scores.criterioA?.FS },
    { key: 'FI', band: 'patologica', val: scores.criterioA?.FI },
  ];

  const rasgosItems = [
    { key: 'AF', band: 'patologica', val: scores.criterioB?.AF },
    { key: 'SE', band: 'positiva', val: scores.criterioB?.SE },
    { key: 'DA', band: 'patologica', val: scores.criterioB?.DA },
    { key: 'HU', band: 'positiva', val: scores.criterioB?.HU },
    { key: 'AN', band: 'patologica', val: scores.criterioB?.AN },
    { key: 'IN', band: 'positiva', val: scores.criterioB?.IN },
    { key: 'DI', band: 'patologica', val: scores.criterioB?.DI },
    { key: 'MO', band: 'positiva', val: scores.criterioB?.MO },
    { key: 'PS', band: 'patologica', val: scores.criterioB?.PS },
    { key: 'VF', band: 'positiva', val: scores.criterioB?.VF },
  ];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Header */}
        <Text style={styles.title}>Perfil Clínico ICCP</Text>

        <View style={styles.patientData}>
          <View style={styles.pdField}><Text style={styles.pdLabel}>Nombre:</Text><Text style={styles.pdValue}>{pd.nombre}</Text></View>
          <View style={styles.pdField}><Text style={styles.pdLabel}>Edad:</Text><Text style={styles.pdValue}>{pd.edad} {pd.edad ? 'años' : ''}</Text></View>
          <View style={styles.pdField}><Text style={styles.pdLabel}>Sexo:</Text><Text style={styles.pdValue}>{pd.sexo}</Text></View>
          <View style={styles.pdField}><Text style={styles.pdLabel}>Nacionalidad:</Text><Text style={styles.pdValue}>{pd.nacionalidad}</Text></View>
          <View style={styles.pdField}><Text style={styles.pdLabel}>Estado Civil:</Text><Text style={styles.pdValue}>{pd.estadoCivil}</Text></View>
          <View style={styles.pdField}><Text style={styles.pdLabel}>Nivel Educativo:</Text><Text style={styles.pdValue}>{pd.nivelEducativo}</Text></View>
          <View style={styles.pdField}><Text style={styles.pdLabel}>Fecha Eval.:</Text><Text style={styles.pdValue}>{pd.fechaEvaluacion}</Text></View>
          <View style={styles.pdField}><Text style={styles.pdLabel}>Fecha Informe:</Text><Text style={styles.pdValue}>{pd.fechaInforme}</Text></View>
        </View>

        {scores.validez?.AR >= 12 && (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>
              ⚠️ PROTOCOLO INVÁLIDO: El evaluado ha dejado 12 o más respuestas en blanco (AR = {scores.validez.AR}). Según el manual técnico del ICCP, el perfil clínico no es admisible ni interpretable.
            </Text>
          </View>
        )}

        {/* Blocks */}
        <ReportBlockPDF title="Escalas de Validez" items={validezItems} />
        <ReportBlockPDF title="Índices Globales" items={globalesItems} />
        <ReportBlockPDF title="Escalas Criterio A" items={criterioAItems} />
        <ReportBlockPDF title="Continuos de Rasgos" items={rasgosItems} />

        {/* Footer Legend */}
        <View style={styles.footer} wrap={false}>
          <Text style={styles.footerText}>
            Nota: AR se evalúa por su puntuación bruta (0-15) y no dispone de puntuación T. INC e IAP sí se convierten a puntuación T según sus tablas específicas.
          </Text>
          <View style={styles.legendBox}>
            <Text style={[styles.footerText, { fontWeight: 'bold', marginRight: 10, marginBottom: 0 }]}>Riesgo Clínico:</Text>
            <View style={styles.legendItem}>
              <View style={[styles.circleDot, { backgroundColor: '#ef4444' }]} />
              <Text style={{ fontSize: 9, color: '#475569' }}>T &gt;= 60 (Pat.) / T &lt;= 39 (Pos.)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.circleDot, { backgroundColor: '#eab308' }]} />
              <Text style={{ fontSize: 9, color: '#475569' }}>T 40-59 (Intermedio)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.circleDot, { backgroundColor: '#22c55e' }]} />
              <Text style={{ fontSize: 9, color: '#475569' }}>T &lt;= 39 (Pat.) / T &gt;= 60 (Pos.)</Text>
            </View>
          </View>
        </View>

      </Page>
    </Document>
  );
};
