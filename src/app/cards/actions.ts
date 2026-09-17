"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { cardDataFromForm, createCard, deleteCard, updateCard } from "@/lib/cards";

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : "Opslaan mislukt.";
}

export async function createCardAction(formData: FormData) {
  let data;
  try {
    data = cardDataFromForm(formData);
  } catch (error) {
    redirect(`/cards/new?error=${encodeURIComponent(messageOf(error))}`);
  }
  await createCard(data);
  revalidatePath("/");
  redirect("/");
}

export async function updateCardAction(id: string, formData: FormData) {
  let data;
  try {
    data = cardDataFromForm(formData);
  } catch (error) {
    redirect(`/cards/${id}?error=${encodeURIComponent(messageOf(error))}`);
  }
  await updateCard(id, data);
  revalidatePath("/");
  redirect("/");
}

export async function deleteCardAction(id: string) {
  await deleteCard(id);
  revalidatePath("/");
  redirect("/");
}
