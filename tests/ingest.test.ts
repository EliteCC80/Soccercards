import { describe, it, expect } from "vitest";
import { createDb } from "@/lib/db";
import { mapMatch, fetchMatches, type ApiMatch } from "@/lib/footballData";
import { ingestMatches } from "@/lib/ingest";

const api = (o: Partial<ApiMatch> & { id: number }): ApiMatch => ({
  utcDate: "2026-08-15T14:00:00Z", status: "SCHEDULED", matchday: 1, season: { startDate: "2026-08-01" },
  homeTeam: { name: "Arsenal FC" }, awayTeam: { name: "Chelsea FC" }, score: { fullTime: { home: null, away: null } }, ...o,
});

describe("mapMatch", () => {
  it("zet geplande en afgelopen wedstrijden om", () => {
    expect(mapMatch(api({ id: 1 }))).toMatchObject({ matchId: "fd-1", season: "2026", score: null, competition: "Premier League" });
    expect(mapMatch(api({ id: 2, status: "FINISHED", score: { fullTime: { home: 2, away: 1 } } }))!.score).toEqual({ home: 2, away: 1 });
  });
  it("slaat wedstrijden zonder bekende teams over en negeert uitslag bij niet-FINISHED", () => {
    expect(mapMatch(api({ id: 3, homeTeam: { name: null } }))).toBeNull();
    expect(mapMatch(api({ id: 4, status: "IN_PLAY", score: { fullTime: { home: 1, away: 0 } } }))!.score).toBeNull();
  });
});

describe("fetchMatches", () => {
  it("stuurt sleutel mee en filtert", async () => {
    let hdr = "";
    const f = (async (_u: string, init: RequestInit) => { hdr = (init.headers as Record<string, string>)["X-Auth-Token"]; return new Response(JSON.stringify({ matches: [api({ id: 1 }), api({ id: 2, awayTeam: { name: null } })] })); }) as unknown as typeof fetch;
    expect(await fetchMatches("abc", "2026", f)).toHaveLength(1);
    expect(hdr).toBe("abc");
  });
  it("gooit bij foutstatus", async () => {
    const f = (async () => new Response("", { status: 403 })) as unknown as typeof fetch;
    await expect(fetchMatches("x", undefined, f)).rejects.toThrow("403");
  });
});

describe("ingestMatches", () => {
  it("is idempotent, legt uitslagen vast en logt correcties", async () => {
    const db = await createDb();
    const sched = mapMatch(api({ id: 1 }))!;
    const done = mapMatch(api({ id: 1, status: "FINISHED", score: { fullTime: { home: 2, away: 1 } } }))!;
    expect(await ingestMatches(db, [sched])).toEqual({ matches: 1, resultsNew: 0, corrections: 0 });
    expect(await ingestMatches(db, [done])).toEqual({ matches: 1, resultsNew: 1, corrections: 0 });
    expect(await ingestMatches(db, [done])).toEqual({ matches: 1, resultsNew: 0, corrections: 0 });
    const fixed = mapMatch(api({ id: 1, status: "FINISHED", score: { fullTime: { home: 2, away: 2 } } }))!;
    expect((await ingestMatches(db, [fixed])).corrections).toBe(1);
    expect((await db.query("SELECT * FROM result_corrections")).rows).toHaveLength(1);
    expect((await db.query("SELECT count(*)::int c FROM matches")).rows[0]).toEqual({ c: 1 });
  });
});
