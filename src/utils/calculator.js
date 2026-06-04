import { ICCP_NORMS } from './scoringConfig';

/**
 * calculateINC
 * Computes the Inconsistency (INC) raw score.
 *
 * Positive pairs  → inconsistent if |a - b| >= 3  (items expected to agree)
 * Negative pairs  → inconsistent if |a - b| === 0  (items expected to disagree)
 *
 * Item numbers are 1-based in the manual; subtract 1 for 0-indexed array.
 * If either item in a pair was left blank the pair is skipped (not penalised).
 */
export const calculateINC = (answers) => {
  // [item1, item2] — 1-based numbers converted to 0-based inside the function
  const POSITIVE_PAIRS = [
    [41, 87], [59, 71], [63, 66], [39, 80], [21, 56],
  ];
  const NEGATIVE_PAIRS = [
    [106, 118], [92, 102], [82, 103], [6, 26], [9, 97],
  ];

  let inc = 0;

  POSITIVE_PAIRS.forEach(([a, b]) => {
    const va = answers[a - 1];
    const vb = answers[b - 1];
    if (va === undefined || va === null || vb === undefined || vb === null) return;
    if (Math.abs(va - vb) >= 3) inc += 1;
  });

  NEGATIVE_PAIRS.forEach(([a, b]) => {
    const va = answers[a - 1];
    const vb = answers[b - 1];
    if (va === undefined || va === null || vb === undefined || vb === null) return;
    if (Math.abs(va - vb) === 0) inc += 1;
  });

  return inc;
};

/**
 * calculateScores
 * Computes all ICCP scale scores from the answers object.
 * - answers: { [0-based-index]: value (0-5) }
 * - Blank items are excluded from scale averages (not treated as 0).
 * - AR counts how many of the 120 items were left unanswered.
 */
export const calculateScores = (answers, totalItems = 120) => {

  /**
   * Returns the mean of the given 1-based item indices,
   * excluding any items that were not answered.
   * Returns null if NO items in the set were answered.
   */
  const getAvg = (indices) => {
    const values = indices
      .map(i => answers[i - 1])                        // convert to 0-based
      .filter(v => v !== undefined && v !== null);     // exclude blanks
    if (values.length === 0) return null;
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  };

  // ── Escalas de Validez ──────────────────────────────────────────────────
  // AR: items not answered at all
  const answered = Object.keys(answers).filter(
    k => answers[k] !== undefined && answers[k] !== null
  ).length;
  const AR = totalItems - answered;

  // INC (Inconsistencia): sum of flagged inconsistent pairs (0–10).
  // No T-score is computed for INC — interpreted directly from the raw count.
  const INC = calculateINC(answers);

  const MGPAT = getAvg([2, 22, 28, 74, 78, 98, 100, 111, 118]);
  const MNPAT = getAvg([6, 9, 33, 36, 62, 92, 113]);
  const MGPOS = getAvg([4, 49, 82, 86, 97, 101, 114, 120]);

  // ── Escalas Criterio A ──────────────────────────────────────────────────
  const FS = getAvg([11, 43, 50, 88, 96, 112]);
  const FI = getAvg([5, 19, 25, 32, 38, 117]);

  // ── Continuos de Rasgos Criterio B ─────────────────────────────────────
  const AF = getAvg([9, 17, 20, 30, 62, 74, 89, 92, 93, 95, 98, 105, 111]);
  const SE = getAvg([1, 3, 8, 12, 44, 53, 59, 64, 71, 72, 79, 84, 102]);
  const DA = getAvg([2, 14, 18, 21, 29, 56, 58, 78, 100, 118]);
  const HU = getAvg([13, 40, 48, 52, 77, 91, 94, 116]);
  const AN = getAvg([16, 24, 33, 54, 55, 76, 85, 110, 113]);
  const IN = getAvg([37, 42, 45, 47, 60, 61, 65, 73, 75, 81, 83, 99, 115]);
  const DI = getAvg([6, 15, 27, 28, 31, 36, 103, 107]);
  const MO = getAvg([7, 23, 35, 39, 63, 66, 68, 80, 119]);
  const PS = getAvg([22, 34, 46, 51, 57, 67, 104, 108]);
  const VF = getAvg([4, 10, 26, 41, 49, 69, 70, 82, 86, 87, 90, 97, 101, 106, 109, 114, 120]);

  // ── Índices Globales ────────────────────────────────────────────────────
  // Helpers to safely average values that may be null
  const safeAvg = (...vals) => {
    const valid = vals.filter(v => v !== null && v !== undefined);
    if (valid.length === 0) return null;
    return valid.reduce((s, v) => s + v, 0) / valid.length;
  };

  const IFP  = safeAvg(FS, FI);
  const IPAT = safeAvg(AF, DA, AN, DI, PS);
  const IPOS = safeAvg(SE, HU, IN, MO, VF);
  const IEXT = safeAvg(AN, DI);
  const IINT = safeAvg(AF, DA);

  const getZ = (raw, scale) => {
    if (raw === null || raw === undefined) return null;
    const n = ICCP_NORMS[scale];
    if (!n) return null;
    return (raw - n.mean) / n.sd;
  };

  const posZ = safeAvg(getZ(SE, 'SE'), getZ(HU, 'HU'), getZ(IN, 'IN'), getZ(MO, 'MO'), getZ(VF, 'VF'));
  const patZ = safeAvg(getZ(AF, 'AF'), getZ(DA, 'DA'), getZ(AN, 'AN'), getZ(DI, 'DI'), getZ(PS, 'PS'));
  
  const IAP = (posZ !== null && patZ !== null) ? (posZ - patZ) : null;

  return {
    validez:    { AR, INC, MGPAT, MNPAT, MGPOS },
    criterioA:  { FS, FI },
    criterioB:  { AF, SE, DA, HU, AN, IN, DI, MO, PS, VF },
    globales:   { IFP, IPAT, IPOS, IAP, IEXT, IINT },
    // keep legacy key so nothing else breaks
    especificas: { FS, FI, AF, SE, DA, HU, AN, IN, DI, MO, PS, VF },
  };
};
