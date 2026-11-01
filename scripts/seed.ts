// DEMODATA — verzonnen wedstrijden en uitkomsten, alleen om de pagina's te kunnen bekijken.
import { createDb } from "../src/lib/db";
import { appendPrediction, recordResult, recordClosingOdds } from "../src/lib/predictions";

let s = 42;
const rnd = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
const teams = ["Ajax", "PSV", "Feyenoord", "AZ", "Twente", "Utrecht", "Vitesse", "Heerenveen", "Sparta", "NEC"];

async function main() {
  const db = await createDb(process.env.DATA_DIR ?? ".data/pg");
  const n = await db.query<{ c: number }>("SELECT count(*)::int c FROM predictions");
  if (n.rows[0].c > 0) { console.log("Al data aanwezig, niets gedaan."); return; }
  const start = Date.now() - 200 * 3.6e6 * 24 / 3;
  for (let i = 0; i < 200; i++) {
    const kickoff = new Date(start + i * 3.6e6 * 8);
    const h = teams[i % 10], a = teams[(i * 3 + 1) % 10] === h ? teams[(i + 5) % 10] : teams[(i * 3 + 1) % 10];
    const ph = 0.2 + rnd() * 0.5, pd = 0.15 + rnd() * 0.15, pa = Math.max(0.05, 1 - ph - pd);
    const t = ph + pd + pa;
    const H = Math.round((ph / t) * 1e4), D = Math.round((pd / t) * 1e4), A = 1e4 - H - D;
    const id = `demo-${i}`;
    await appendPrediction(db, { matchId: id, competition: "Demo Eredivisie", home: h, away: a, kickoff,
      pHomeBp: H, pDrawBp: D, pAwayBp: A, modelVersion: "demo-1" }, new Date(kickoff.getTime() - 36e5 * 24));
    if (kickoff.getTime() < Date.now()) {
      const r = rnd(); const hp = H / 1e4, dp = D / 1e4;
      const out = r < hp ? "H" : r < hp + dp ? "D" : "A";
      await recordResult(db, id, out === "H" ? 2 : out === "D" ? 1 : 0, out === "A" ? 2 : out === "D" ? 1 : 0);
      const odd = (p: number) => 1 / (p * 1.06); // ~6% marge
      await recordClosingOdds(db, id, { H: odd(hp), D: odd(dp), A: odd(A / 1e4) }, "demo");
    }
  }
  console.log("Demodata aangemaakt.");
}
main();
