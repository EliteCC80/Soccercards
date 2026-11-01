import Link from "next/link";
import { getDb } from "@/lib/db";
import { listPredictions, checkChain, probsOf } from "@/lib/predictions";
import { summarize } from "@/lib/summary";
import { calibration } from "@/lib/metrics";
import { CalibrationChart } from "./Calibration";

export const dynamic = "force-dynamic";

const f = (n: number, d = 3) => (Number.isFinite(n) ? n.toFixed(d) : "—");
const pct = (bp: number) => `${(bp / 100).toFixed(0)}%`;
const LABEL = { H: "Thuis", D: "Gelijk", A: "Uit" } as const;

export default async function Trackrecord({ searchParams }: { searchParams: Promise<{ competitie?: string }> }) {
  const { competitie } = await searchParams;
  const db = await getDb();
  const all = await listPredictions(db);
  const chain = checkChain(all);
  const comps = [...new Set(all.map((p) => p.competition))];
  const shown = competitie ? all.filter((p) => p.competition === competitie) : all;
  const s = summarize(shown);
  const cal = calibration(shown.filter((p) => p.result).map((p) => ({ p: probsOf(p), actual: p.result!.outcome })));
  const better = s.compared > 0 && s.cmpModelLogLoss < s.bookLogLoss;

  return (
    <div className="space-y-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold">Trackrecord</h1>
        <p className="text-stone-700">Alle voorspellingen, ook de foute. Elke regel is vóór de aftrap vastgelegd en aan de vorige geketend.</p>
        <p className={`text-sm ${chain.ok ? "text-teal-700" : "text-red-700"}`}>
          {chain.ok ? `✔ Keten gecontroleerd: ${all.length} voorspellingen, geen afwijkingen.` : `✘ Keten verbroken bij #${chain.index + 1}: ${chain.reason}`}
        </p>
        <p className="text-sm"><a className="underline" href="/api/export?format=csv">CSV</a> · <a className="underline" href="/api/export?format=json">JSON</a> — reken het zelf na.</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-4">
        {[["Voorspellingen", String(s.total)], ["Afgerond", String(s.settled)], ["Raak (hoogste kans)", s.settled ? `${((s.hits / s.settled) * 100).toFixed(1)}%` : "—"], ["Brier-score (model)", f(s.modelBrier)]].map(([k, v]) => (
          <div key={k} className="rounded border border-stone-200 bg-white p-4"><div className="text-xs text-stone-500">{k}</div><div className="text-2xl font-semibold">{v}</div></div>
        ))}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Model tegenover de bookmaker</h2>
        {s.compared === 0 ? <p className="text-stone-600">Nog geen wedstrijden met slotkoersen.</p> : (
          <>
            <table className="w-full max-w-xl text-sm">
              <thead><tr className="text-left text-stone-500"><th></th><th>Brier</th><th>Log loss</th></tr></thead>
              <tbody>
                <tr><td>Wij</td><td>{f(s.cmpModelBrier)}</td><td>{f(s.cmpModelLogLoss)}</td></tr>
                <tr><td>Slotkoersen (zonder marge)</td><td>{f(s.bookBrier)}</td><td>{f(s.bookLogLoss)}</td></tr>
              </tbody>
            </table>
            <p className="text-sm text-stone-600">
              Over {s.compared} wedstrijden met slotkoers. Lager is beter. Op log loss scoren we {better ? "beter" : "slechter"} dan de markt{better ? "" : " — de markt blijft een lastige maatstaf"}.
              Brier-score: gemiddelde kwadratische afwijking tussen kans en uitkomst. Log loss straft stellige missers extra hard.
            </p>
          </>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Kalibratie</h2>
        <p className="text-stone-700">Als we 70% zeggen, gebeurt het dan ook ongeveer 70% van de keren?</p>
        <CalibrationChart buckets={cal} />
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-semibold">Alle voorspellingen</h2>
          <nav className="flex gap-2 text-sm">
            <Link href="/trackrecord" className={!competitie ? "font-semibold" : "underline"}>Alle</Link>
            {comps.map((c) => <Link key={c} href={`/trackrecord?competitie=${encodeURIComponent(c)}`} className={competitie === c ? "font-semibold" : "underline"}>{c}</Link>)}
          </nav>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead><tr className="text-left text-stone-500"><th>Aftrap</th><th>Wedstrijd</th><th>Thuis / Gelijk / Uit</th><th>Uitslag</th><th>Hash</th></tr></thead>
            <tbody>
              {[...shown].reverse().map((p) => (
                <tr key={p.hash} className="border-t border-stone-200">
                  <td className="py-1 pr-2">{p.kickoff.slice(0, 10)}</td>
                  <td className="pr-2">{p.home} – {p.away}</td>
                  <td className="pr-2">{pct(p.pHomeBp)} / {pct(p.pDrawBp)} / {pct(p.pAwayBp)}</td>
                  <td className="pr-2">{p.result ? `${p.result.homeGoals}–${p.result.awayGoals} (${LABEL[p.result.outcome]})` : "nog niet gespeeld"}</td>
                  <td><Link className="font-mono underline" href={`/verify/${p.hash}`}>{p.hash.slice(0, 8)}…</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
