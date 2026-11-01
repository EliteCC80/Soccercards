import { fit, predict, Model } from "./dixonColes";
import type { CsvMatch } from "./csv";
import { brier, logLoss, mean, outcomeFromScore, removeMargin, calibration, Probs, Outcome } from "@/lib/metrics";

export interface BacktestOptions { minTrain?: number; stepDays?: number; xi?: number }
export interface BacktestReport {
  n: number; nWithMarket: number;
  model: { brier: number; logLoss: number };
  baseline: { brier: number; logLoss: number };
  /** Zelfde wedstrijden als `market`, zodat de vergelijking eerlijk is. */
  modelOnMarketSet: { brier: number; logLoss: number } | null;
  market: { brier: number; logLoss: number } | null;
  calibration: ReturnType<typeof calibration>;
}

/** Rollend: voor elk venster alleen trainen op wedstrijden vóór het venster. */
export function backtest(all: CsvMatch[], o: BacktestOptions = {}): BacktestReport {
  const minTrain = o.minTrain ?? 190, step = (o.stepDays ?? 7) * 86400000;
  const ms = [...all].sort((a, b) => a.date - b.date);
  const rows: { p: Probs; base: Probs; actual: Outcome; mkt: Probs | null }[] = [];
  let prev: Model | undefined;
  let start = ms[minTrain]?.date;
  while (start !== undefined && start <= ms[ms.length - 1].date) {
    const train = ms.filter((m) => m.date < start!);
    const test = ms.filter((m) => m.date >= start! && m.date < start! + step);
    if (test.length) {
      const model = fit(train, { asOf: start, xi: o.xi, init: prev }); prev = model;
      const f = { H: 0, D: 0, A: 0 };
      for (const m of train) f[outcomeFromScore(m.hg, m.ag)]++;
      const base = { H: f.H / train.length, D: f.D / train.length, A: f.A / train.length };
      for (const m of test) {
        const p = predict(model, m.home, m.away);
        if (!p) continue; // team onbekend: niet voorspelbaar, zelfde regel als in productie
        rows.push({ p, base, actual: outcomeFromScore(m.hg, m.ag), mkt: m.closing ? removeMargin(m.closing) : null });
      }
    }
    start += step;
  }
  const agg = (rs: typeof rows, pick: (r: (typeof rows)[number]) => Probs) => ({
    brier: mean(rs.map((r) => brier(pick(r), r.actual))), logLoss: mean(rs.map((r) => logLoss(pick(r), r.actual))),
  });
  const withM = rows.filter((r) => r.mkt);
  return {
    n: rows.length, nWithMarket: withM.length,
    model: agg(rows, (r) => r.p), baseline: agg(rows, (r) => r.base),
    modelOnMarketSet: withM.length ? agg(withM, (r) => r.p) : null,
    market: withM.length ? agg(withM, (r) => r.mkt!) : null,
    calibration: calibration(rows.map((r) => ({ p: r.p, actual: r.actual }))),
  };
}
