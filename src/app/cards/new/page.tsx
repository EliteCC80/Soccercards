import { CardForm } from "@/components/CardForm";
import { createCardAction } from "../actions";

export default async function NewCardPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Kaart toevoegen</h1>
      <CardForm action={createCardAction} submitLabel="Opslaan" error={error} />
    </div>
  );
}
