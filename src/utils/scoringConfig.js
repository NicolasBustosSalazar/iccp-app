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

  // Strict rounding to exactly 2 decimals
  const roundedRaw = Number(Number(rawScore).toFixed(2));

  // INC Custom Mapping
  if (scaleKey === 'INC') {
    if (roundedRaw >= 7) return 100;
    const INC_MAP = { 0: 39, 1: 47, 2: 56, 3: 65, 4: 73, 5: 82, 6: 91 };
    return INC_MAP[Math.floor(roundedRaw)] || 100;
  }

  // IAP Custom Mapping (Z-scores)
  if (scaleKey === 'IAP') {
    const raw = roundedRaw;
    if (raw >= 6.2) return 100;
    if (raw >= 6.1) return 99;
    if (raw >= 6.0) return 98;
    if (raw >= 5.8) return 97;
    if (raw >= 5.7) return 96;
    if (raw >= 5.6) return 95;
    if (raw >= 5.5) return 94;
    if (raw >= 5.3) return 93;
    if (raw >= 5.2) return 92;
    if (raw >= 5.1) return 91;
    if (raw >= 5.0) return 90;
    if (raw >= 4.8) return 89;
    if (raw >= 4.7) return 88;
    if (raw >= 4.6) return 87;
    if (raw >= 4.5) return 86;
    if (raw >= 4.3) return 85;
    if (raw >= 4.2) return 84;
    if (raw >= 4.1) return 83;
    if (raw >= 4.0) return 82;
    if (raw >= 3.8) return 81;
    if (raw >= 3.7) return 80;
    if (raw >= 3.6) return 79;
    if (raw >= 3.5) return 78;
    if (raw >= 3.4) return 77;
    if (raw >= 3.2) return 76;
    if (raw >= 3.1) return 75;
    if (raw >= 3.0) return 74;
    if (raw >= 2.9) return 73;
    if (raw >= 2.7) return 72;
    if (raw >= 2.6) return 71;
    if (raw >= 2.5) return 70;
    if (raw >= 2.4) return 69;
    if (raw >= 2.2) return 68;
    if (raw >= 2.1) return 67;
    if (raw >= 2.0) return 66;
    if (raw >= 1.9) return 65;
    if (raw >= 1.7) return 64;
    if (raw >= 1.6) return 63;
    if (raw >= 1.5) return 62;
    if (raw >= 1.4) return 61;
    if (raw >= 1.2) return 60;
    if (raw >= 1.1) return 59;
    if (raw >= 1.0) return 58;
    if (raw >= 0.9) return 57;
    if (raw >= 0.7) return 56;
    if (raw >= 0.6) return 55;
    if (raw >= 0.5) return 54;
    if (raw >= 0.4) return 53;
    if (raw >= 0.2) return 52;
    if (raw >= 0.1) return 51;
    if (raw >= 0.0) return 50;
    if (raw >= -0.1) return 49;
    if (raw >= -0.3) return 48;
    if (raw >= -0.4) return 47;
    if (raw >= -0.5) return 46;
    if (raw >= -0.6) return 45;
    if (raw >= -0.8) return 44;
    if (raw >= -0.9) return 43;
    if (raw >= -1.0) return 42;
    if (raw >= -1.1) return 41;
    if (raw >= -1.3) return 40;
    if (raw >= -1.4) return 39;
    if (raw >= -1.5) return 38;
    if (raw >= -1.6) return 37;
    if (raw >= -1.8) return 36;
    if (raw >= -1.9) return 35;
    if (raw >= -2.0) return 34;
    if (raw >= -2.1) return 33;
    if (raw >= -2.3) return 32;
    if (raw >= -2.4) return 31;
    if (raw >= -2.5) return 30;
    if (raw >= -2.6) return 29;
    if (raw >= -2.8) return 28;
    if (raw >= -2.9) return 27;
    if (raw >= -3.0) return 26;
    if (raw >= -3.1) return 25;
    if (raw >= -3.3) return 24;
    if (raw >= -3.4) return 23;
    if (raw >= -3.5) return 22;
    if (raw >= -3.6) return 21;
    if (raw >= -3.7) return 20;
    if (raw >= -3.9) return 19;
    if (raw >= -4.0) return 18;
    if (raw >= -4.1) return 17;
    if (raw >= -4.2) return 16;
    if (raw >= -4.4) return 15;
    if (raw >= -4.5) return 14;
    if (raw >= -4.6) return 13;
    if (raw >= -4.7) return 12;
    if (raw >= -4.9) return 11;
    if (raw >= -5.0) return 10;
    if (raw >= -5.1) return 9;
    if (raw >= -5.2) return 8;
    if (raw >= -5.4) return 7;
    if (raw >= -5.5) return 6;
    if (raw >= -5.6) return 5;
    if (raw >= -5.7) return 4;
    if (raw >= -5.9) return 3;
    if (raw >= -6.0) return 2;
    return 1;
  }

  const norms = ICCP_NORMS[scaleKey];
  if (!norms) return null;
  const t = 50 + ((roundedRaw - norms.mean) / norms.sd) * 10;
  return Math.round(Math.min(100, Math.max(20, t)));
};

export const formatPB = (val) => {
  return val === null || val === undefined || isNaN(val) ? 'N/C' : Number(val).toFixed(2);
};

export const formatT = (val) => {
  return val === null || val === undefined ? '—' : String(val);
};
