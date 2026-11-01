// Gebruik: npm run backtest -- E0_2122.csv E0_2223.csv E0_2324.csv   (football-data.co.uk, Premier League = E0)
import { readFileSync } from "node:fs";
import { parseFootballDataCsv } from "../src/model/csv";
import { backtest } from "../src/model/backtest";

const files = process.argv.slice(2);
if (!files.length) { console.error("Geef een of meer CSV-bestanden op."); process.exit(1); }
const matches = files.flatMap((f) => parseFootballDataCsv(readFileSync(f, "utf8")));
const r = backtest(matches);
const f = (x: number) => x.toFixed(4);
console.log(`Voorspeld: ${r.n} wedstrijden (met slotkoers: ${r.nWithMarket})`);
console.log(`Model        Brier ${f(r.model.brier)}  LogLoss ${f(r.model.logLoss)}`);
console.log(`Basislijn    Brier ${f(r.baseline.brier)}  LogLoss ${f(r.baseline.logLoss)}  (frequenties H/D/A)`);
if (r.market && r.modelOnMarketSet) {
  console.log(`Model (zelfde set) Brier ${f(r.modelOnMarketSet.brier)}  LogLoss ${f(r.modelOnMarketSet.logLoss)}`);
  console.log(`Markt (slotkoers)  Brier ${f(r.market.brier)}  LogLoss ${f(r.market.logLoss)}`);
}
console.log("Kalibratie (bak: voorspeld → werkelijk, n):");
for (const b of r.calibration.filter((b) => b.n)) console.log(`  ${(b.lo * 100).toFixed(0)}-${(b.hi * 100).toFixed(0)}%: ${(b.meanPredicted * 100).toFixed(1)}% → ${(b.observed * 100).toFixed(1)}%  (n=${b.n})`);
