import { notFound } from "next/navigation";
import { CardForm } from "@/components/CardForm";
import { DeleteCardButton } from "@/components/DeleteCardButton";
import { getCard } from "@/lib/cards";
import { deleteCardAction, updateCardAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function EditCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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
      />
      <div className="border-t border-black/10 pt-4 dark:border-white/10">
        <DeleteCardButton action={deleteCardAction.bind(null, card.id)} />
      </div>
    </div>
  );
}
