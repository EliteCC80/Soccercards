import type { Card } from "@prisma/client";
import Link from "next/link";
import {
  CONDITIONS,
  CONDITION_LABELS,
  STATUSES,
  STATUS_LABELS,
} from "@/lib/constants";
import { centsToInputValue } from "@/lib/money";

const field =
  "w-full rounded-md border border-black/15 bg-white px-3 py-2 text-sm text-slate-900 dark:border-white/20 dark:bg-slate-900 dark:text-slate-100";
const label = "block text-sm font-medium mb-1";

export function CardForm({
  card,
  action,
  submitLabel,
  error,
}: {
  card?: Card;
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  error?: string;
}) {
  return (
    <form action={action} className="space-y-6">
      {error ? (
        <p className="rounded-md bg-rose-100 px-3 py-2 text-sm text-rose-900">{error}</p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={label} htmlFor="player">Speler *</label>
          <input id="player" name="player" required defaultValue={card?.player} className={field} />
        </div>
        <div>
          <label className={label} htmlFor="year">Jaar *</label>
          <input id="year" name="year" required placeholder="2023-24" defaultValue={card?.year} className={field} />
        </div>
        <div>
          <label className={label} htmlFor="set">Set *</label>
          <input id="set" name="set" required placeholder="Panini Prizm" defaultValue={card?.set} className={field} />
        </div>
        <div>
          <label className={label} htmlFor="variant">Variant</label>
          <input id="variant" name="variant" placeholder="Silver" defaultValue={card?.variant ?? ""} className={field} />
        </div>
        <div>
          <label className={label} htmlFor="serialNumber">Printnummer</label>
          <input id="serialNumber" name="serialNumber" placeholder="38/50" defaultValue={card?.serialNumber ?? ""} className={field} />
        </div>
        <div className="flex items-end gap-2 pb-2">
          <input id="isRookie" name="isRookie" type="checkbox" defaultChecked={card?.isRookie} className="size-4" />
          <label htmlFor="isRookie" className="text-sm font-medium">Rookie card (RC)</label>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={label} htmlFor="condition">Conditie</label>
          <select id="condition" name="condition" defaultValue={card?.condition ?? "NM"} className={field}>
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>{CONDITION_LABELS[c]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="status">Status</label>
          <select id="status" name="status" defaultValue={card?.status ?? "DRAFT"} className={field}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={label} htmlFor="listingUrl">Listing URL</label>
          <input id="listingUrl" name="listingUrl" type="url" defaultValue={card?.listingUrl ?? ""} className={field} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className={label} htmlFor="priceLow">Prijs laag (€)</label>
          <input id="priceLow" name="priceLow" inputMode="decimal" defaultValue={centsToInputValue(card?.priceLow)} className={field} />
        </div>
        <div>
          <label className={label} htmlFor="priceHigh">Prijs hoog (€)</label>
          <input id="priceHigh" name="priceHigh" inputMode="decimal" defaultValue={centsToInputValue(card?.priceHigh)} className={field} />
        </div>
        <div>
          <label className={label} htmlFor="askingPrice">Vraagprijs (€)</label>
          <input id="askingPrice" name="askingPrice" inputMode="decimal" defaultValue={centsToInputValue(card?.askingPrice)} className={field} />
        </div>
      </div>

      <div>
        <label className={label} htmlFor="notes">Notities</label>
        <textarea id="notes" name="notes" rows={3} defaultValue={card?.notes ?? ""} className={field} />
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700">
          {submitLabel}
        </button>
        <Link href="/" className="text-sm underline underline-offset-4">Annuleren</Link>
      </div>
    </form>
  );
}
