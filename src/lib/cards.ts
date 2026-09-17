import type { Card, Prisma } from "@prisma/client";
import { prisma } from "./db";
import { isCondition, isStatus } from "./constants";
import { parseEuro } from "./money";

export type CardFilter = { status?: string; query?: string };

export function listCards(filter: CardFilter = {}): Promise<Card[]> {
  const where: Prisma.CardWhereInput = {};
  if (filter.status && isStatus(filter.status)) where.status = filter.status;
  if (filter.query) where.player = { contains: filter.query };
  return prisma.card.findMany({ where, orderBy: { updatedAt: "desc" } });
}

export function getCard(id: string): Promise<Card | null> {
  return prisma.card.findUnique({ where: { id } });
}

/**
 * Zet ruwe formuliervelden om naar een geldige Card-payload.
 * Gooit bij ontbrekende verplichte velden of een onleesbaar bedrag, zodat
 * onvolledige invoer niet half wordt opgeslagen.
 */
export function cardDataFromForm(form: FormData): Prisma.CardCreateInput {
  const text = (key: string) => (form.get(key)?.toString() ?? "").trim();
  const optional = (key: string) => text(key) || null;

  const player = text("player");
  const year = text("year");
  const set = text("set");
  if (!player || !year || !set) {
    throw new Error("Speler, jaar en set zijn verplicht.");
  }

  const condition = text("condition");
  const status = text("status");
  if (!isCondition(condition)) throw new Error(`Onbekende conditie: ${condition}`);
  if (!isStatus(status)) throw new Error(`Onbekende status: ${status}`);

  return {
    player,
    year,
    set,
    variant: optional("variant"),
    serialNumber: optional("serialNumber"),
    isRookie: form.get("isRookie") !== null,
    condition,
    status,
    priceLow: parseEuro(text("priceLow")),
    priceHigh: parseEuro(text("priceHigh")),
    askingPrice: parseEuro(text("askingPrice")),
    listingUrl: optional("listingUrl"),
    notes: optional("notes"),
  };
}

export function createCard(data: Prisma.CardCreateInput): Promise<Card> {
  return prisma.card.create({ data });
}

export function updateCard(id: string, data: Prisma.CardUpdateInput): Promise<Card> {
  return prisma.card.update({ where: { id }, data });
}

export function deleteCard(id: string): Promise<Card> {
  return prisma.card.delete({ where: { id } });
}
