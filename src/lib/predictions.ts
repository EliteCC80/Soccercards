import type { PGlite } from "@electric-sql/pglite";
import { GENESIS_HASH, PredictionPayload, computeHash, verifyChain, ChainCheck } from "./hash";
import { Outcome, Probs, outcomeFromScore, removeMargin } from "./metrics";

export interface NewPrediction {
  matchId: string; competition: string; home: string; away: string;
  kickoff: Date; pHomeBp: number; pDrawBp: number; pAwayBp: number; modelVersion: string;
}

export interface StoredPrediction extends PredictionPayload {
  seq: number; prevHash: string; hash: string;
  result: { homeGoals: number; awayGoals: number; outcome: Outcome } | null;
  closing: Probs | null;
}

/** Voegt toe aan de keten. Weigert voorspellingen op of na de aftrap. */
export async function appendPrediction(db: PGlite, p: NewPrediction, now = new Date()): Promise<StoredPrediction> {
  if (p.pHomeBp + p.pDrawBp + p.pAwayBp !== 10000) throw new Error("Kansen moeten samen 10000 basispunten zijn");
  if (now >= p.kickoff) throw new Error("Voorspelling moet vóór de aftrap worden vastgelegd");
  return db.transaction(async (tx) => {
    const last = await tx.query<{ hash: string }>("SELECT hash FROM predictions ORDER BY seq DESC LIMIT 1");
    const prevHash = last.rows[0]?.hash ?? GENESIS_HASH;
    const payload: PredictionPayload = {
      matchId: p.matchId, competition: p.competition, home: p.home, away: p.away,
      kickoff: p.kickoff.toISOString(), pHomeBp: p.pHomeBp, pDrawBp: p.pDrawBp, pAwayBp: p.pAwayBp,
      modelVersion: p.modelVersion, createdAt: now.toISOString(),
    };
    const hash = computeHash(prevHash, payload);
    const r = await tx.query<{ seq: number }>(
      `INSERT INTO predictions (match_id,competition,home,away,kickoff,p_home_bp,p_draw_bp,p_away_bp,model_version,created_at,prev_hash,hash)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING seq`,
      [payload.matchId, payload.competition, payload.home, payload.away, payload.kickoff,
       payload.pHomeBp, payload.pDrawBp, payload.pAwayBp, payload.modelVersion, payload.createdAt, prevHash, hash],
    );
    return { ...payload, seq: r.rows[0].seq, prevHash, hash, result: null, closing: null };
  });
}

export async function recordResult(db: PGlite, matchId: string, homeGoals: number, awayGoals: number) {
  await db.query(
    "INSERT INTO results (match_id,home_goals,away_goals) VALUES ($1,$2,$3) ON CONFLICT (match_id) DO UPDATE SET home_goals=$2, away_goals=$3",
    [matchId, homeGoals, awayGoals]);
}

export async function recordClosingOdds(db: PGlite, matchId: string, o: { H: number; D: number; A: number }, source: string) {
  await db.query(
    "INSERT INTO odds_closing (match_id,odds_home,odds_draw,odds_away,source) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (match_id) DO UPDATE SET odds_home=$2, odds_draw=$3, odds_away=$4, source=$5",
    [matchId, o.H, o.D, o.A, source]);
}

type Row = {
  seq: number; match_id: string; competition: string; home: string; away: string;
  kickoff: string | Date; p_home_bp: number; p_draw_bp: number; p_away_bp: number; model_version: string;
  created_at: string | Date; prev_hash: string; hash: string;
  home_goals: number | null; away_goals: number | null;
  odds_home: string | null; odds_draw: string | null; odds_away: string | null;
};

const iso = (d: string | Date) => new Date(d).toISOString();

function toStored(r: Row): StoredPrediction {
  return {
    seq: r.seq, matchId: r.match_id, competition: r.competition, home: r.home, away: r.away,
    kickoff: iso(r.kickoff), pHomeBp: r.p_home_bp, pDrawBp: r.p_draw_bp, pAwayBp: r.p_away_bp,
    modelVersion: r.model_version, createdAt: iso(r.created_at), prevHash: r.prev_hash, hash: r.hash,
    result: r.home_goals === null ? null : {
      homeGoals: r.home_goals, awayGoals: r.away_goals!, outcome: outcomeFromScore(r.home_goals, r.away_goals!),
    },
    closing: r.odds_home === null ? null : removeMargin({ H: +r.odds_home, D: +r.odds_draw!, A: +r.odds_away! }),
  };
}

const SELECT = `SELECT p.*, r.home_goals, r.away_goals, o.odds_home, o.odds_draw, o.odds_away
  FROM predictions p LEFT JOIN results r USING (match_id) LEFT JOIN odds_closing o USING (match_id)`;

/** Alle voorspellingen, oud → nieuw. */
export async function listPredictions(db: PGlite): Promise<StoredPrediction[]> {
  const r = await db.query<Row>(`${SELECT} ORDER BY p.seq ASC`);
  return r.rows.map(toStored);
}

export async function getByHash(db: PGlite, hash: string): Promise<StoredPrediction | null> {
  const r = await db.query<Row>(`${SELECT} WHERE p.hash = $1`, [hash]);
  return r.rows[0] ? toStored(r.rows[0]) : null;
}

export function checkChain(all: StoredPrediction[]): ChainCheck {
  return verifyChain(all.map((p) => ({ hash: p.hash, prevHash: p.prevHash, payload: p })));
}

export const probsOf = (p: StoredPrediction): Probs => ({ H: p.pHomeBp / 1e4, D: p.pDrawBp / 1e4, A: p.pAwayBp / 1e4 });

export interface Summary {
  total: number; settled: number; hits: number;
  modelBrier: number; modelLogLoss: number;
  /** Alleen over wedstrijden met slotkoersen, zodat de vergelijking eerlijk is. */
  compared: number; cmpModelBrier: number; cmpModelLogLoss: number; bookBrier: number; bookLogLoss: number;
}
