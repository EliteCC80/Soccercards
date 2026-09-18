"use client";

import { useActionState, useState } from "react";
import type { FormState } from "@/app/cards/actions";

/**
 * Twee stappen: de eerste klik vraagt om bevestiging, pas de tweede stuurt de
 * server action af. Verwijderen kan niet ongedaan gemaakt worden.
 */
export function DeleteCardButton({
  action,
}: {
  action: (state: FormState) => Promise<FormState>;
}) {
  const [confirming, setConfirming] = useState(false);
  const [state, formAction, pending] = useActionState<FormState>(action, {});

  const error = state.error ? (
    <p className="text-sm text-rose-700" role="alert">{state.error}</p>
  ) : null;

  if (!confirming) {
    return (
      <div className="space-y-2">
        {error}
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="text-sm text-rose-600 underline underline-offset-4"
        >
          Kaart verwijderen
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error}
      <form action={formAction} className="flex items-center gap-3">
        <span className="text-sm">Zeker weten? Dit kan niet ongedaan gemaakt worden.</span>
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700 disabled:opacity-60"
        >
          {pending ? "Bezig…" : "Ja, verwijderen"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-sm underline underline-offset-4"
        >
          Annuleren
        </button>
      </form>
    </div>
  );
}
