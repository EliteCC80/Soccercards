import { StoredPrediction, probsOf, Summary } from "./predictions";
import { brier, logLoss, mean, OUTCOMES } from "./metrics";

export function summarize(all: StoredPrediction[]): Summary {
  const settled = all.filter((p) => p.result);
  const hits = settled.filter((p) => {
    const pr = probsOf(p);
    const pick = OUTCOMES.reduce((a, b) => (pr[b] > pr[a] ? b : a));
    return pick === p.result!.outcome;
  }).length;
  const cmp = settled.filter((p) => p.closing);
  return {
    total: all.length, settled: settled.length, hits,
    modelBrier: mean(settled.map((p) => brier(probsOf(p), p.result!.outcome))),
    modelLogLoss: mean(settled.map((p) => logLoss(probsOf(p), p.result!.outcome))),
    compared: cmp.length,
    cmpModelBrier: mean(cmp.map((p) => brier(probsOf(p), p.result!.outcome))),
    cmpModelLogLoss: mean(cmp.map((p) => logLoss(probsOf(p), p.result!.outcome))),
    bookBrier: mean(cmp.map((p) => brier(p.closing!, p.result!.outcome))),
    bookLogLoss: mean(cmp.map((p) => logLoss(p.closing!, p.result!.outcome))),
  };
}
