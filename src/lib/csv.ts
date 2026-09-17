import type { Card } from "@prisma/client";
import { centsToInputValue } from "./money";

/** Kolomvolgorde van de Vinted_Listing_Tracker. */
export const CSV_COLUMNS = [
  "Speler",
  "Jaar",
  "Set",
  "Variant",
  "Printnummer",
  "RC",
  "Conditie",
  "Prijs laag",
  "Prijs hoog",
  "Vraagprijs",
  "Status",
  "Listing URL",
  "Notities",
  "Aangemaakt",
] as const;

function escapeCell(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function toRow(card: Card): string[] {
  return [
    card.player,
    card.year,
    card.set,
    card.variant ?? "",
    card.serialNumber ?? "",
    card.isRookie ? "ja" : "nee",
    card.condition,
    centsToInputValue(card.priceLow),
    centsToInputValue(card.priceHigh),
    centsToInputValue(card.askingPrice),
    card.status,
    card.listingUrl ?? "",
    card.notes ?? "",
    card.createdAt.toISOString().slice(0, 10),
  ];
}

export function cardsToCsv(cards: Card[]): string {
  const lines = [
    CSV_COLUMNS.join(","),
    ...cards.map((card) => toRow(card).map(escapeCell).join(",")),
  ];
  return lines.join("\n") + "\n";
}
