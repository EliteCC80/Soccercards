import { describe, it, expect } from "vitest";
import { createDb } from "@/lib/db";
import { appendPrediction, listPredictions, checkChain, recordResult } from "@/lib/predictions";
import { brier, logLoss, removeMargin, calibration, wilson } from "@/lib/metrics";
import { verifyChain, computeHash, GENESIS_HASH } from "@/lib/hash";

const base = (id: string, kickoff: Date) => ({ matchId: id, competition: "T", home: "A", away: "B", kickoff, pHomeBp: 5000, pDrawBp: 2500, pAwayBp: 2500, modelVersion: "t" });
const future = (h: number) => new Date(Date.now() + h * 36e5);

describe("metrics", () => {
  it("brier en log loss", () => {
    expect(brier({ H: 1, D: 0, A: 0 }, "H")).toBe(0);
    expect(brier({ H: 0, D: 1, A: 0 }, "H")).toBe(2);
    expect(brier({ H: 0.5, D: 0.25, A: 0.25 }, "H")).toBeCloseTo(0.375);
    expect(logLoss({ H: 0.5, D: 0.25, A: 0.25 }, "H")).toBeCloseTo(Math.LN2);
    expect(Number.isFinite(logLoss({ H: 0, D: 0.5, A: 0.5 }, "H"))).toBe(true);
  });
  it("margeverwijdering geeft som 1", () => {
    const p = removeMargin({ H: 2, D: 3.5, A: 4 });
    expect(p.H + p.D + p.A).toBeCloseTo(1);
    expect(p.H).toBeGreaterThan(p.D);
  });
  it("kalibratie telt alle drie uitkomsten", () => {
    const b = calibration([{ p: { H: 0.55, D: 0.25, A: 0.2 }, actual: "H" }]);
    expect(b.reduce((s, x) => s + x.n, 0)).toBe(3);
    expect(b[5].observed).toBe(1);
    const [lo, hi] = wilson(7, 10);
    expect(lo).toBeLessThan(0.7); expect(hi).toBeGreaterThan(0.7);
  });
});

describe("hashketen", () => {
  it("bouwt een geldige keten en detecteert manipulatie", async () => {
    const db = await createDb();
    await appendPrediction(db, base("1", future(5)));
    await appendPrediction(db, base("2", future(6)));
    const all = await listPredictions(db);
    expect(all[0].prevHash).toBe(GENESIS_HASH);
    expect(all[1].prevHash).toBe(all[0].hash);
    expect(checkChain(all)).toEqual({ ok: true });
    const tampered = structuredClone(all); tampered[0].pHomeBp = 9000; tampered[0].pDrawBp = 500; tampered[0].pAwayBp = 500;
    expect(checkChain(tampered).ok).toBe(false);
    expect(verifyChain([{ hash: computeHash(GENESIS_HASH, all[0]), prevHash: GENESIS_HASH, payload: all[0] }]).ok).toBe(true);
  });
  it("weigert voorspelling na aftrap of met foute som", async () => {
    const db = await createDb();
    await expect(appendPrediction(db, base("x", new Date(Date.now() - 1000)))).rejects.toThrow();
    await expect(appendPrediction(db, { ...base("y", future(1)), pAwayBp: 100 })).rejects.toThrow();
  });
  it("database staat geen UPDATE/DELETE op voorspellingen toe", async () => {
    const db = await createDb();
    await appendPrediction(db, base("1", future(5)));
    await expect(db.query("UPDATE predictions SET p_home_bp = 9000")).rejects.toThrow(/append-only/);
    await expect(db.query("DELETE FROM predictions")).rejects.toThrow(/append-only/);
  });
  it("resultaten worden gekoppeld", async () => {
    const db = await createDb();
    await appendPrediction(db, base("1", future(5)));
    await recordResult(db, "1", 2, 1);
    expect((await listPredictions(db))[0].result?.outcome).toBe("H");
  });
});
