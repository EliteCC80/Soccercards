import { describe, it, expect } from "vitest";
import { fit, predict, toBasisPoints, type Match } from "@/model/dixonColes";
import { parseFootballDataCsv } from "@/model/csv";
import { backtest } from "@/model/backtest";

// Gesimuleerde competitie met bekende sterktes (seeded RNG).
function simulate(seasons: number, seed = 7) {
  let s = seed; const rnd = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
  const pois = (lam: number) => { const L = Math.exp(-lam); let k = 0, p = 1; do { k++; p *= rnd(); } while (p > L); return k - 1; };
  const teams = Array.from({ length: 20 }, (_, i) => `T${i}`);
  const att = teams.map((_, i) => (i - 9.5) * 0.04), def = teams.map((_, i) => (9.5 - i) * 0.03 * -1 + 0);
  const home = 0.3, out: Match[] = []; let day = Date.UTC(2020, 7, 1);
  for (let k = 0; k < seasons; k++) for (let i = 0; i < 20; i++) for (let j = 0; j < 20; j++) if (i !== j) {
    out.push({ home: teams[i], away: teams[j], hg: pois(Math.exp(0.2 + att[i] - def[j] + home)), ag: pois(Math.exp(0.2 + att[j] - def[i])), date: day });
    day += 86400000 * 0.35;
  }
  return { out, att, def, home };
}

describe("Dixon-Coles", () => {
  const sim = simulate(3);
  const model = fit(sim.out, { xi: 0 });
  it("vindt het thuisvoordeel en de rangorde van sterktes terug", () => {
    expect(model.home).toBeGreaterThan(0.2); expect(model.home).toBeLessThan(0.4);
    const best = model.teams.indexOf("T19"), worst = model.teams.indexOf("T0");
    expect(model.att[best] - model.def[best]).toBeGreaterThan(model.att[worst] - model.def[worst]);
  });
  it("geeft kansen die optellen tot 1; sterk thuisteam is favoriet", () => {
    const p = predict(model, "T19", "T0")!;
    expect(p.H + p.D + p.A).toBeCloseTo(1, 6);
    expect(p.H).toBeGreaterThan(p.A);
    expect(predict(model, "T19", "Onbekend")).toBeNull();
  });
  it("basispunten sommeren altijd tot 10000", () => {
    for (const p of [{ H: 0.5, D: 0.3, A: 0.2 }, { H: 1 / 3, D: 1 / 3, A: 1 / 3 }, { H: 0.9999, D: 0.00005, A: 0.00005 }]) {
      const bp = toBasisPoints(p); expect(bp.reduce((a, b) => a + b, 0)).toBe(10000); expect(Math.min(...bp)).toBeGreaterThan(0);
    }
  });
  it("backtest: model scoort beter dan de basislijn op data met echte sterkteverschillen", { timeout: 120000 }, () => {
    const r = backtest(sim.out, { minTrain: 380, stepDays: 30, xi: 0 });
    expect(r.n).toBeGreaterThan(300);
    expect(r.model.logLoss).toBeLessThan(r.baseline.logLoss);
    expect(r.market).toBeNull();
  });
});

describe("CSV", () => {
  it("leest football-data.co.uk-formaat met voorkeur voor Pinnacle", () => {
    const csv = "Div,Date,HomeTeam,AwayTeam,FTHG,FTAG,B365CH,B365CD,B365CA,PSCH,PSCD,PSCA\nE0,12/08/2023,Burnley,Man City,0,3,9,5.5,1.3,10,6,1.28\nE0,13/08/2023,Arsenal,Forest,2,1,,,,,,\n";
    const m = parseFootballDataCsv(csv);
    expect(m).toHaveLength(2);
    expect(m[0]).toMatchObject({ home: "Burnley", hg: 0, ag: 3, closing: { H: 10, D: 6, A: 1.28 } });
    expect(m[1].closing).toBeUndefined();
    expect(() => parseFootballDataCsv("a,b\n1,2")).toThrow();
  });
});
