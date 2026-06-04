// Clinical scale labels
export const LABELS = {
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

export const ICCP_NORMS = {
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
  IFP:   { mean: 1.1100, sd:  0.89000 },
  IPAT:  { mean: 1.2650, sd:  0.58500 },
  IPOS:  { mean: 3.3200, sd:  0.68000 },
  IEXT:  { mean: 1.3900, sd:  0.71000 },
  IINT:  { mean: 1.5200, sd:  0.74000 },
  IAP:   { mean: 0.0000, sd:  1.25000 },
  // Escalas de Validez
  MGPAT: { mean: 1.0850, sd:  0.80000 },
  MNPAT: { mean: 1.7950, sd: -0.84000 },
  MGPOS: { mean: 3.2900, sd:  0.90000 },
};

export const transformToTScore = (rawScore, scaleKey) => {
  if (rawScore === null || rawScore === undefined || isNaN(rawScore)) return null;
  const norms = ICCP_NORMS[scaleKey];
  if (!norms) return null;
  const t = 50 + ((rawScore - norms.mean) / norms.sd) * 10;
  return Math.round(Math.min(100, Math.max(20, t)));
};

export const formatPB = (val) => {
  return val === null || val === undefined || isNaN(val) ? 'N/C' : Number(val).toFixed(2);
};

export const formatT = (val) => {
  return val === null || val === undefined ? '—' : String(val);
};
