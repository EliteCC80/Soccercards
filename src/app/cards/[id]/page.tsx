import { notFound } from "next/navigation";
import { CardForm } from "@/components/CardForm";
import { getCard } from "@/lib/cards";
import { deleteCardAction, updateCardAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditCardPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const card = await getCard(id);
  if (!card) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">
        {card.player} — {card.year} {card.set}
      </h1>
      <CardForm
        card={card}
        action={updateCardAction.bind(null, card.id)}
        submitLabel="Wijzigingen opslaan"
        error={error}
      />
      <form action={deleteCardAction.bind(null, card.id)} className="border-t border-black/10 pt-4 dark:border-white/10">
        <button type="submit" className="text-sm text-rose-600 underline underline-offset-4">
          Kaart verwijderen
        </button>
      </form>
    </div>
  );
}
