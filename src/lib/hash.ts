import { createHash } from "node:crypto";

export const GENESIS_HASH = "0".repeat(64);

/** Wat er in de hash gaat. Kansen in basispunten (som = 10000) zodat er geen float-ruis in zit. */
export interface PredictionPayload {
  matchId: string;
  competition: string;
  home: string;
  away: string;
  kickoff: string; // ISO UTC
  pHomeBp: number;
  pDrawBp: number;
  pAwayBp: number;
  modelVersion: string;
  createdAt: string; // ISO UTC
}

/** Vaste volgorde van sleutels, zodat iedereen dezelfde string kan reproduceren. */
export function canonical(p: PredictionPayload): string {
  return JSON.stringify([
    p.matchId, p.competition, p.home, p.away, p.kickoff,
    p.pHomeBp, p.pDrawBp, p.pAwayBp, p.modelVersion, p.createdAt,
  ]);
}

export function computeHash(prevHash: string, p: PredictionPayload): string {
  return createHash("sha256").update(prevHash + "|" + canonical(p)).digest("hex");
}

export interface ChainLink { hash: string; prevHash: string; payload: PredictionPayload }

export type ChainCheck = { ok: true } | { ok: false; index: number; reason: string };

/** Controleert een keten op volgorde (oud → nieuw). */
export function verifyChain(links: ChainLink[]): ChainCheck {
  let prev = GENESIS_HASH;
  for (let i = 0; i < links.length; i++) {
    const l = links[i];
    if (l.prevHash !== prev) return { ok: false, index: i, reason: "prev_hash sluit niet aan" };
    if (computeHash(l.prevHash, l.payload) !== l.hash) return { ok: false, index: i, reason: "hash komt niet overeen met inhoud" };
    prev = l.hash;
  }
  return { ok: true };
}
