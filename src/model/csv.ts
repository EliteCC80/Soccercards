import type { Match } from "./dixonColes";

export interface CsvMatch extends Match { closing?: { H: number; D: number; A: number } }

function parseDate(s: string): number {
  const [d, m, y] = s.split("/").map(Number);
  return Date.UTC(y < 100 ? 2000 + y : y, m - 1, d, 12);
}

/** Leest football-data.co.uk-CSV (Date, HomeTeam, AwayTeam, FTHG, FTAG, slotkoersen). Voorkeur: Pinnacle (PSC*), dan gemiddelde (AvgC*), dan Bet365 (B365C*). */
export function parseFootballDataCsv(text: string): CsvMatch[] {
  const lines = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  const head = lines[0].split(",");
  const col = (n: string) => head.indexOf(n);
  const cDate = col("Date"), cH = col("HomeTeam"), cA = col("AwayTeam"), cHG = col("FTHG"), cAG = col("FTAG");
  if ([cDate, cH, cA, cHG, cAG].some((c) => c < 0)) throw new Error("CSV mist verplichte kolommen (Date, HomeTeam, AwayTeam, FTHG, FTAG)");
  const sets = [["PSCH", "PSCD", "PSCA"], ["AvgCH", "AvgCD", "AvgCA"], ["B365CH", "B365CD", "B365CA"]].map((s) => s.map(col));
  const out: CsvMatch[] = [];
  for (const line of lines.slice(1)) {
    const c = line.split(",");
    const hg = parseInt(c[cHG]), ag = parseInt(c[cAG]);
    if (!c[cDate] || Number.isNaN(hg) || Number.isNaN(ag)) continue;
    let closing: CsvMatch["closing"];
    for (const s of sets) {
      if (s.some((i) => i < 0)) continue;
      const [h, d, a] = s.map((i) => parseFloat(c[i]));
      if ([h, d, a].every((v) => v > 1)) { closing = { H: h, D: d, A: a }; break; }
    }
    out.push({ home: c[cH], away: c[cA], hg, ag, date: parseDate(c[cDate]), closing });
  }
  return out.sort((x, y) => x.date - y.date);
}
