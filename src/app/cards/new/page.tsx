import { CardForm } from "@/components/CardForm";
import { createCardAction } from "../actions";

export default function NewCardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Kaart toevoegen</h1>
      <CardForm action={createCardAction} submitLabel="Opslaan" />
    </div>
  );
}
