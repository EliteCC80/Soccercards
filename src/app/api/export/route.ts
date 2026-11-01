import { getDb } from "@/lib/db";
import { listPredictions } from "@/lib/predictions";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const all = await listPredictions(await getDb());
  if (new URL(req.url).searchParams.get("format") === "json") return Response.json(all);
  const head = ["seq","match_id","competition","home","away","kickoff","p_home_bp","p_draw_bp","p_away_bp","model_version","created_at","prev_hash","hash","home_goals","away_goals"];
  const q = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const rows = all.map((p) => [p.seq,p.matchId,p.competition,p.home,p.away,p.kickoff,p.pHomeBp,p.pDrawBp,p.pAwayBp,p.modelVersion,p.createdAt,p.prevHash,p.hash,p.result?.homeGoals,p.result?.awayGoals].map(q).join(","));
  return new Response([head.join(","), ...rows].join("\n"), { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": 'attachment; filename="trackrecord.csv"' } });
}
