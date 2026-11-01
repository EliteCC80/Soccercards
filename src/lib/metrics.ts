export type Outcome = "H" | "D" | "A";
export type Probs = { H: number; D: number; A: number };

export const OUTCOMES: Outcome[] = ["H", "D", "A"];

/** Brier-score (meerklasse, som over drie uitkomsten). Lager is beter; 0 = perfect, 2 = maximaal fout. */
export function brier(p: Probs, actual: Outcome): number {
  return OUTCOMES.reduce((s, o) => s + (p[o] - (o === actual ? 1 : 0)) ** 2, 0);
}

/** Log loss (natuurlijke log). Lager is beter. Kansen worden afgekapt om -ln(0) te voorkomen. */
export function logLoss(p: Probs, actual: Outcome): number {
  return -Math.log(Math.max(p[actual], 1e-15));
}

/** Zet decimale koersen om naar kansen zonder bookmakermarge (proportionele normalisatie). */
export function removeMargin(odds: { H: number; D: number; A: number }): Probs {
  const inv = { H: 1 / odds.H, D: 1 / odds.D, A: 1 / odds.A };
  const sum = inv.H + inv.D + inv.A;
  return { H: inv.H / sum, D: inv.D / sum, A: inv.A / sum };
}

export function outcomeFromScore(home: number, away: number): Outcome {
  return home > away ? "H" : home < away ? "A" : "D";
}

export interface CalibrationBucket {
  lo: number; hi: number;
  n: number;
  meanPredicted: number;
  observed: number;
  ciLow: number; ciHigh: number; // Wilson 95%
}

export function wilson(successes: number, n: number, z = 1.96): [number, number] {
  if (n === 0) return [0, 0];
  const p = successes / n;
  const d = 1 + (z * z) / n;
  const c = p + (z * z) / (2 * n);
  const m = z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n));
  return [Math.max(0, (c - m) / d), Math.min(1, (c + m) / d)];
}

/**
 * Betrouwbaarheidsgrafiek: alle (voorspelling, uitkomst)-paren — drie per wedstrijd —
 * in gelijke kansbakken. Observed = hoe vaak het gebeurde.
 */
export function calibration(rows: { p: Probs; actual: Outcome }[], buckets = 10): CalibrationBucket[] {
  const acc = Array.from({ length: buckets }, () => ({ n: 0, sumP: 0, hits: 0 }));
  for (const r of rows) {
    for (const o of OUTCOMES) {
      const p = r.p[o];
      const i = Math.min(buckets - 1, Math.floor(p * buckets));
      acc[i].n++; acc[i].sumP += p; acc[i].hits += o === r.actual ? 1 : 0;
    }
  }
  return acc.map((a, i) => {
    const [ciLow, ciHigh] = wilson(a.hits, a.n);
    return {
      lo: i / buckets, hi: (i + 1) / buckets, n: a.n,
      meanPredicted: a.n ? a.sumP / a.n : 0,
      observed: a.n ? a.hits / a.n : 0, ciLow, ciHigh,
    };
  });
}

export const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : NaN);
