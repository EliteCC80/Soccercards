import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { CardError, listCards } from "@/lib/cards";
import { STATUSES, STATUS_LABELS, isStatus } from "@/lib/constants";
import { formatEuro } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status = "", q = "" } = await searchParams;

  // Een onbekende status uit de URL mag niet stilzwijgend "alles" tonen.
  let warning: string | null = null;
  let cards;
  try {
    cards = await listCards({ status, query: q });
  } catch (error) {
    if (!(error instanceof CardError)) throw error;
    warning = `${error.message} — alle kaarten worden getoond.`;
    cards = await listCards({ query: q });
  }

  return (
    <div className="space-y-6">
      {warning ? (
        <p className="rounded-md bg-amber-100 px-3 py-2 text-sm text-amber-900" role="alert">
          {warning}
        </p>
      ) : null}
      <form className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="q">Speler</label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Zoek op speler"
            className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/20 dark:bg-slate-900 dark:text-slate-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1" htmlFor="status">Status</label>
          <select
            id="status"
            name="status"
            defaultValue={isStatus(status) ? status : ""}
            className="rounded-md border border-black/15 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/20 dark:bg-slate-900 dark:text-slate-100"
          >
            <option value="">Alle</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="rounded-md border border-black/15 px-4 py-2 text-sm dark:border-white/20">
          Filter
        </button>
      </form>

      {cards.length === 0 ? (
        <p className="text-sm opacity-70">
          Geen kaarten gevonden. <Link href="/cards/new" className="underline underline-offset-4">Voeg er een toe</Link>.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/10">
          <table className="w-full text-sm">
            <thead className="bg-black/5 text-left dark:bg-white/5">
              <tr>
                <th className="px-3 py-2 font-medium">Speler</th>
                <th className="px-3 py-2 font-medium">Kaart</th>
                <th className="px-3 py-2 font-medium">Vraagprijs</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {cards.map((card) => (
                <tr key={card.id} className="border-t border-black/10 dark:border-white/10">
                  <td className="px-3 py-2">
                    {card.player}
                    {card.isRookie ? <span className="ml-2 text-xs font-semibold text-amber-600">RC</span> : null}
                  </td>
                  <td className="px-3 py-2 opacity-80">
                    {card.year} {card.set}
                    {card.variant ? ` · ${card.variant}` : ""}
                    {card.serialNumber ? ` · ${card.serialNumber}` : ""}
                  </td>
                  <td className="px-3 py-2">{formatEuro(card.askingPrice)}</td>
                  <td className="px-3 py-2"><StatusBadge status={card.status} /></td>
                  <td className="px-3 py-2 text-right">
                    <Link href={`/cards/${card.id}`} className="underline underline-offset-4">Bewerken</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-sm opacity-70">{cards.length} kaart(en)</p>
    </div>
  );
}
