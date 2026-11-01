import { PGlite } from "@electric-sql/pglite";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

// PGlite = echte Postgres (WASM). Voor productie: zelfde SQL tegen een Postgres-server via `pg`.
const SCHEMA = `
CREATE TABLE IF NOT EXISTS predictions (
  seq           SERIAL PRIMARY KEY,
  match_id      TEXT NOT NULL UNIQUE,
  competition   TEXT NOT NULL,
  home          TEXT NOT NULL,
  away          TEXT NOT NULL,
  kickoff       TIMESTAMPTZ NOT NULL,
  p_home_bp     INT NOT NULL,
  p_draw_bp     INT NOT NULL,
  p_away_bp     INT NOT NULL,
  model_version TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL,
  prev_hash     TEXT NOT NULL,
  hash          TEXT NOT NULL UNIQUE,
  CHECK (p_home_bp + p_draw_bp + p_away_bp = 10000),
  CHECK (created_at < kickoff)
);
CREATE TABLE IF NOT EXISTS results (
  match_id   TEXT PRIMARY KEY,
  home_goals INT NOT NULL,
  away_goals INT NOT NULL
);
CREATE TABLE IF NOT EXISTS odds_closing (
  match_id  TEXT PRIMARY KEY,
  odds_home NUMERIC NOT NULL, odds_draw NUMERIC NOT NULL, odds_away NUMERIC NOT NULL,
  source    TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS matches (
  match_id    TEXT PRIMARY KEY,
  competition TEXT NOT NULL,
  season      TEXT NOT NULL,
  matchday    INT,
  home        TEXT NOT NULL,
  away        TEXT NOT NULL,
  kickoff     TIMESTAMPTZ NOT NULL,
  status      TEXT NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS result_corrections (
  id SERIAL PRIMARY KEY, match_id TEXT NOT NULL,
  old_home INT NOT NULL, old_away INT NOT NULL, new_home INT NOT NULL, new_away INT NOT NULL,
  noted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, price_cents INT NOT NULL, credits INT NOT NULL
);
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY, email TEXT NOT NULL UNIQUE, plan_id TEXT REFERENCES plans(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS credit_ledger (
  id SERIAL PRIMARY KEY, user_id INT NOT NULL REFERENCES users(id),
  delta INT NOT NULL, reason TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Trackrecord is append-only: geen UPDATE/DELETE op predictions.
CREATE OR REPLACE FUNCTION predictions_immutable() RETURNS trigger AS $$
BEGIN RAISE EXCEPTION 'predictions is append-only'; END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS predictions_no_change ON predictions;
CREATE TRIGGER predictions_no_change BEFORE UPDATE OR DELETE ON predictions
  FOR EACH ROW EXECUTE FUNCTION predictions_immutable();
`;

export async function createDb(dataDir?: string): Promise<PGlite> {
  if (dataDir) mkdirSync(dirname(dataDir), { recursive: true });
  const db = new PGlite(dataDir);
  await db.waitReady;
  await db.exec(SCHEMA);
  return db;
}

const g = globalThis as unknown as { __db?: Promise<PGlite> };
export function getDb(): Promise<PGlite> {
  return (g.__db ??= createDb(process.env.DATA_DIR ?? ".data/pg"));
}
