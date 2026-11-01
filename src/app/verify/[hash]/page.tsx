import { notFound } from "next/navigation";
import { getDb } from "@/lib/db";
import { getByHash } from "@/lib/predictions";
import { computeHash, canonical } from "@/lib/hash";

export const dynamic = "force-dynamic";

export default async function Verify({ params }: { params: Promise<{ hash: string }> }) {
  const { hash } = await params;
  const p = await getByHash(await getDb(), hash);
  if (!p) notFound();
  const recomputed = computeHash(p.prevHash, p);
  const ok = recomputed === p.hash;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Verificatie</h1>
      <p className={ok ? "text-teal-700" : "text-red-700"}>{ok ? "✔ De hash klopt met de opgeslagen inhoud." : "✘ De hash klopt NIET met de inhoud."}</p>
      <dl className="space-y-1 text-sm">
        <div><dt className="inline text-stone-500">Wedstrijd: </dt><dd className="inline">{p.home} – {p.away} ({p.competition})</dd></div>
        <div><dt className="inline text-stone-500">Aftrap: </dt><dd className="inline">{p.kickoff}</dd></div>
        <div><dt className="inline text-stone-500">Vastgelegd: </dt><dd className="inline">{p.createdAt}</dd></div>
        <div><dt className="inline text-stone-500">Vorige hash: </dt><dd className="inline break-all font-mono">{p.prevHash}</dd></div>
        <div><dt className="inline text-stone-500">Hash: </dt><dd className="inline break-all font-mono">{p.hash}</dd></div>
      </dl>
      <h2 className="font-semibold">Zelf narekenen</h2>
      <p className="text-sm text-stone-700">SHA-256 van <code>vorige_hash + "|" + inhoud</code>, waarbij inhoud deze JSON-lijst is:</p>
      <pre className="overflow-x-auto rounded bg-stone-100 p-3 text-xs">{canonical(p)}</pre>
    </div>
  );
}
