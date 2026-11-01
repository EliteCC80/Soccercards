// Client voor football-data.org v4. Gratis tier: 10 aanvragen/minuut, Premier League inbegrepen.
export const COMPETITION = "PL";
export const COMPETITION_NAME = "Premier League";

export interface ApiMatch {
  id: number;
  utcDate: string;
  status: string;
  matchday: number | null;
  season?: { startDate?: string };
  homeTeam: { name: string | null };
  awayTeam: { name: string | null };
  score?: { fullTime?: { home: number | null; away: number | null } };
}

export interface MatchRow {
  matchId: string; competition: string; season: string; matchday: number | null;
  home: string; away: string; kickoff: string; status: string;
  score: { home: number; away: number } | null;
}

/** Zet een API-wedstrijd om; null als teams nog niet bekend zijn. */
export function mapMatch(m: ApiMatch): MatchRow | null {
  if (!m.homeTeam?.name || !m.awayTeam?.name) return null;
  const ft = m.score?.fullTime;
  const finished = m.status === "FINISHED" && ft && ft.home != null && ft.away != null;
  const year = m.season?.startDate?.slice(0, 4) ?? m.utcDate.slice(0, 4);
  return {
    matchId: `fd-${m.id}`, competition: COMPETITION_NAME, season: year,
    matchday: m.matchday ?? null, home: m.homeTeam.name, away: m.awayTeam.name,
    kickoff: new Date(m.utcDate).toISOString(), status: m.status,
    score: finished ? { home: ft!.home!, away: ft!.away! } : null,
  };
}

export async function fetchMatches(token: string, season?: string, fetchImpl: typeof fetch = fetch): Promise<MatchRow[]> {
  const url = `https://api.football-data.org/v4/competitions/${COMPETITION}/matches${season ? `?season=${season}` : ""}`;
  for (let attempt = 0; ; attempt++) {
    const res = await fetchImpl(url, { headers: { "X-Auth-Token": token } });
    if (res.status === 429 && attempt < 3) { await new Promise((r) => setTimeout(r, 7000 * (attempt + 1))); continue; }
    if (!res.ok) throw new Error(`football-data.org ${res.status}`);
    const body = (await res.json()) as { matches: ApiMatch[] };
    return body.matches.map(mapMatch).filter((m): m is MatchRow => m !== null);
  }
}
