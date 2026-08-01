import React from 'react';
import { LABELS, transformToTScore, formatPB, formatT } from '../utils/scoringConfig';

export const Report = ({ scores, patientData }) => {
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

  const getT = (val, key) => transformToTScore(val, key);

  const ReportBlock = ({ title, items }) => {
    const ROW_HEIGHT = 22; // Altura fija muy compacta
    const N = items.length;
    
    // Calculate points
    const points = items.map((item, idx) => {
      let tScore = item.skipT ? null : getT(item.val, item.key);
      let x = null;
      if (item.skipGraph) {
        x = null;
      } else if (item.useRaw) {
        const raw = item.val !== null && item.val !== undefined ? item.val : 0;
        x = (Math.min(raw, 15) / 15) * 100;
      } else if (tScore !== null) {
        x = ((tScore - 20) / 80) * 100;
      }
      const yStartPct = idx * (100 / N);
      const yCenterPct = (idx + 0.5) * (100 / N);
      return { ...item, x, yStartPct, yCenterPct, tScore };
    });
  
    const validPoints = points.filter(p => p.x !== null);
  
    return (
      <div className="mb-3 border border-gray-400 bg-white">
        
        {/* Cabecera General */}
        <div className="flex border-b border-gray-400">
          <div className="w-[45%] bg-gray-300 font-bold px-2 py-0.5 text-[10px] text-slate-800 uppercase tracking-wide">
            {title}
          </div>
          <div className="w-[55%] bg-white font-bold px-2 py-0.5 text-[10px] text-slate-800 uppercase tracking-wide border-l border-gray-400">
            {title}
          </div>
        </div>

        {/* Cabecera de Columnas */}
        <div className="flex border-b border-gray-400 bg-gray-100">
          <div className="w-[45%] grid grid-cols-[1fr_35px_30px_30px] px-2 py-0.5 text-[9px] font-bold text-gray-600">
            <div>Escala</div>
            <div className="text-center">Acrón.</div>
            <div className="text-center">PB</div>
            <div className="text-center">T</div>
          </div>
          <div className="w-[55%] bg-white border-l border-gray-400"></div>
        </div>

        {/* Contenedor que empareja Datos y Gráfico */}
        <div className="flex w-full bg-white relative">
          
          {/* PANEL IZQUIERDO: 45% */}
          <div className="w-[45%] flex flex-col">
            {points.map((item) => {
              const pbStr = formatPB(item.val);
              const tStr = item.skipT ? '—' : item.useRaw ? '—' : formatT(item.tScore);
              
              return (
                <div key={item.key} className="grid grid-cols-[1fr_35px_30px_30px] items-center border-b border-gray-200 px-2 last:border-b-0" style={{ height: `${ROW_HEIGHT}px` }}>
                  <div className="truncate pr-1 text-[10px] text-gray-800 font-medium" title={LABELS[item.key]}>
                    {LABELS[item.key]}
                  </div>
                  <div className="text-center text-[9px] text-blue-900 font-bold truncate">
                    {item.key}
                  </div>
                  <div className="text-center text-[10px] text-gray-600 truncate">
                    {pbStr}
                  </div>
                  <div className="text-center font-bold text-[10px] text-gray-900 truncate">
                    {tStr}
                  </div>
                </div>
              );
            })}
          </div>
  
          {/* PANEL DERECHO: 55% */}
          <div className="w-[55%] border-l border-gray-400 relative">
            <div className="absolute top-0 bottom-0 left-[8px] right-[8px]">
              
              {/* SVG NATIVO CON PORCENTAJES (Sin deformación) */}
              <svg className="absolute top-0 left-0 w-full h-full overflow-visible">
                
                {/* 1. Fondos de color clínico por fila */}
                {points.map((p, idx) => {
                  if (p.band === 'none') return null;
                  let colors = [];
                  if (p.band === 'patologica') {
                    colors = ['#dcfce7', '#fef08a', '#fee2e2']; 
                  } else if (p.band === 'positiva') {
                    colors = ['#fee2e2', '#fef08a', '#dcfce7']; 
                  }
                  return (
                    <g key={`bg-${p.key}`}>
                      <rect x="0%" y={`${p.yStartPct}%`} width="25%" height={`${100/N}%`} fill={colors[0]} opacity="0.4" />
                      <rect x="25%" y={`${p.yStartPct}%`} width="25%" height={`${100/N}%`} fill={colors[1]} opacity="0.4" />
                      <rect x="50%" y={`${p.yStartPct}%`} width="50%" height={`${100/N}%`} fill={colors[2]} opacity="0.4" />
                    </g>
                  );
                })}

                {/* 2. Líneas Verticales Referenciales */}
                <line x1="25%" y1="0%" x2="25%" y2="100%" stroke="#d1d5db" strokeWidth="1" strokeDasharray="2,2" />
                <line x1="37.5%" y1="0%" x2="37.5%" y2="100%" stroke="#9ca3af" strokeWidth="1.5" />
                <line x1="50%" y1="0%" x2="50%" y2="100%" stroke="#d1d5db" strokeWidth="1" strokeDasharray="2,2" />

                {/* 3. Líneas Conectoras */}
                {validPoints.map((p, idx) => {
                  if (idx === 0) return null;
                  const prev = validPoints[idx - 1];
                  return (
                    <line 
                      key={`link-${p.key}`} 
                      x1={`${prev.x}%`} y1={`${prev.yCenterPct}%`} 
                      x2={`${p.x}%`} y2={`${p.yCenterPct}%`} 
                      stroke="#374151" strokeWidth="2" strokeLinecap="round" 
                    />
                  );
                })}

                {/* 4. Círculos Exactos sin distorsión */}
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
                    <circle 
                      key={`pt-svg-${p.key}`}
                      cx={`${p.x}%`} cy={`${p.yCenterPct}%`} 
                      r="4" fill={fill} stroke="#ffffff" strokeWidth="1.5" 
                    />
                  );
                })}
              </svg>
            </div>
          </div>
        </div>

        {/* EJE X (Abajo) */}
        <div className="flex border-t border-gray-400 bg-gray-50">
          <div className="w-[45%] bg-white"></div>
          <div className="w-[55%] flex justify-between px-2 py-[2px] border-l border-gray-400 text-[9px] text-gray-500 font-medium leading-none">
            {[20, 30, 40, 50, 60, 70, 80, 90, 100].map(v => <span key={v}>{v}</span>)}
          </div>
        </div>

      </div>
    );
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
    <div id="iccp-report-container" className="w-full max-w-[210mm] mx-auto bg-white px-8 py-6 text-[11px] leading-tight" style={{ boxSizing: 'border-box' }}>
      
      {/* Cabecera */}
      <h1 className="text-xl font-black text-slate-900 text-center uppercase tracking-widest border-b-[1.5px] border-slate-900 pb-1 mb-4">
        Perfil Clínico ICCP
      </h1>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mb-5 bg-slate-50 p-3 border border-slate-200 rounded-sm text-[10px] text-slate-800 shadow-sm">
        <div className="flex"><span className="font-bold w-24 shrink-0">Nombre:</span> <span className="truncate">{pd.nombre}</span></div>
        <div className="flex"><span className="font-bold w-24 shrink-0">Edad:</span> <span className="truncate">{pd.edad} {pd.edad ? 'años' : ''}</span></div>
        <div className="flex"><span className="font-bold w-24 shrink-0">Sexo:</span> <span className="truncate">{pd.sexo}</span></div>
        <div className="flex"><span className="font-bold w-24 shrink-0">Nacionalidad:</span> <span className="truncate">{pd.nacionalidad}</span></div>
        <div className="flex"><span className="font-bold w-24 shrink-0">Estado Civil:</span> <span className="truncate">{pd.estadoCivil}</span></div>
        <div className="flex"><span className="font-bold w-24 shrink-0">Nivel Educ.:</span> <span className="truncate">{pd.nivelEducativo}</span></div>
        <div className="flex"><span className="font-bold w-24 shrink-0">Fecha Eval.:</span> <span className="truncate">{pd.fechaEvaluacion}</span></div>
        <div className="flex"><span className="font-bold w-24 shrink-0">Fecha Info.:</span> <span className="truncate">{pd.fechaInforme}</span></div>
      </div>

      {scores.validez?.AR >= 12 && (
        <div className="mb-5 bg-red-100 border-l-4 border-red-500 text-red-700 p-3 text-[11px] font-bold shadow-sm">
          ⚠️ PROTOCOLO INVÁLIDO: El evaluado ha dejado 12 o más respuestas en blanco (AR = {scores.validez.AR}). Según el manual técnico del ICCP, el perfil clínico no es admisible ni interpretable.
        </div>
      )}

      {/* Bloques Modulares Independientes */}
      <ReportBlock title="Escalas de Validez" items={validezItems} />
      <ReportBlock title="Índices Globales" items={globalesItems} />
      <ReportBlock title="Escalas Criterio A" items={criterioAItems} />
      <ReportBlock title="Continuos de Rasgos" items={rasgosItems} />

      {/* Leyenda Inferior */}
      <div className="mt-4 text-[10px] text-slate-600 border-t border-slate-200 pt-2 leading-snug">
        <p className="mb-0.5"><strong>Nota:</strong> AR se evalúa por su puntuación bruta (0-15) y no dispone de puntuación T. INC e IAP sí se convierten a puntuación T según sus tablas específicas.</p>
        <p className="flex items-center gap-4">
          <strong>Riesgo Clínico:</strong>
          <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-red-500 mr-1.5 border border-red-700"></span> T &ge; 60 (Pat.) / T &le; 39 (Pos.)</span>
          <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-yellow-500 mr-1.5 border border-yellow-700"></span> T 40-59 (Intermedio)</span>
          <span className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-green-500 mr-1.5 border border-green-700"></span> T &le; 39 (Pat.) / T &ge; 60 (Pos.)</span>
        </p>
      </div>

    </div>
  );
};
