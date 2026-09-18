"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  CardError,
  cardDataFromForm,
  createCard,
  deleteCard,
  updateCard,
} from "@/lib/cards";

/**
 * Bij een fout gaan de ingevulde waarden mee terug, zodat het formulier
 * opnieuw gevuld rendert in plaats van leeg.
 */
export type FormState = {
  error?: string;
  values?: Record<string, string>;
};

function failure(error: unknown, formData: FormData): FormState {
  const values: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value === "string") values[key] = value;
  }
  return {
    error: error instanceof CardError ? error.message : "Opslaan mislukt.",
    values,
  };
}

export async function createCardAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await createCard(cardDataFromForm(formData));
  } catch (error) {
    return failure(error, formData);
  }
  revalidatePath("/");
  redirect("/");
}

export async function updateCardAction(
  id: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  try {
    await updateCard(id, cardDataFromForm(formData));
  } catch (error) {
    return failure(error, formData);
  }
  revalidatePath("/");
  redirect("/");
}

export async function deleteCardAction(
  id: string,
  _prevState: FormState,
): Promise<FormState> {
  try {
    await deleteCard(id);
  } catch (error) {
    return {
      error: error instanceof CardError ? error.message : "Verwijderen mislukt.",
    };
  }
  revalidatePath("/");
  redirect("/");
}
