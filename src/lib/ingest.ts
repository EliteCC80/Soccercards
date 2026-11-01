import type { PGlite } from "@electric-sql/pglite";
import type { MatchRow } from "./footballData";

export interface IngestReport { matches: number; resultsNew: number; corrections: number }

/** Idempotent: meerdere keren draaien geeft hetzelfde resultaat. Uitslagen worden nooit stil overschreven. */
export async function ingestMatches(db: PGlite, rows: MatchRow[]): Promise<IngestReport> {
  const rep: IngestReport = { matches: 0, resultsNew: 0, corrections: 0 };
  await db.transaction(async (tx) => {
    for (const m of rows) {
      await tx.query(
        `INSERT INTO matches (match_id,competition,season,matchday,home,away,kickoff,status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT (match_id) DO UPDATE SET matchday=$4, home=$5, away=$6, kickoff=$7, status=$8, updated_at=now()`,
        [m.matchId, m.competition, m.season, m.matchday, m.home, m.away, m.kickoff, m.status]);
      rep.matches++;
      if (!m.score) continue;
      const old = await tx.query<{ home_goals: number; away_goals: number }>("SELECT home_goals, away_goals FROM results WHERE match_id=$1", [m.matchId]);
      if (!old.rows[0]) {
        await tx.query("INSERT INTO results (match_id,home_goals,away_goals) VALUES ($1,$2,$3)", [m.matchId, m.score.home, m.score.away]);
        rep.resultsNew++;
      } else if (old.rows[0].home_goals !== m.score.home || old.rows[0].away_goals !== m.score.away) {
        await tx.query("INSERT INTO result_corrections (match_id,old_home,old_away,new_home,new_away) VALUES ($1,$2,$3,$4,$5)",
          [m.matchId, old.rows[0].home_goals, old.rows[0].away_goals, m.score.home, m.score.away]);
        await tx.query("UPDATE results SET home_goals=$2, away_goals=$3 WHERE match_id=$1", [m.matchId, m.score.home, m.score.away]);
        rep.corrections++;
      }
    }
  });
  return rep;
}
