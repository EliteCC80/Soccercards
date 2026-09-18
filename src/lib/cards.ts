import { Prisma, type Card } from "@prisma/client";
import { prisma } from "./db";
import { isCondition, isStatus } from "./constants";
import { parseEuro } from "./money";

export type CardFilter = { status?: string; query?: string };

/** Fout die als nette melding aan de gebruiker getoond mag worden. */
export class CardError extends Error {}

/**
 * Een onbekende status wordt afgewezen in plaats van genegeerd: stil alles
 * teruggeven ziet eruit als een filter dat niet werkt.
 */
export async function listCards(filter: CardFilter = {}): Promise<Card[]> {
  const where: Prisma.CardWhereInput = {};
  const status = filter.status?.trim();
  if (status) {
    if (!isStatus(status)) throw new CardError(`Onbekende status: ${status}`);
    where.status = status;
  }
  const query = filter.query?.trim();
  if (query) where.player = { contains: query };
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
    throw new CardError("Speler, jaar en set zijn verplicht.");
  }

  const condition = text("condition");
  const status = text("status");
  if (!isCondition(condition)) throw new CardError(`Onbekende conditie: ${condition}`);
  if (!isStatus(status)) throw new CardError(`Onbekende status: ${status}`);

  const money = (key: string) => {
    try {
      return parseEuro(text(key));
    } catch (error) {
      throw new CardError(error instanceof Error ? error.message : `Ongeldig bedrag bij ${key}`);
    }
  };

  return {
    player,
    year,
    set,
    variant: optional("variant"),
    serialNumber: optional("serialNumber"),
    isRookie: form.get("isRookie") !== null,
    condition,
    status,
    priceLow: money("priceLow"),
    priceHigh: money("priceHigh"),
    askingPrice: money("askingPrice"),
    listingUrl: optional("listingUrl"),
    notes: optional("notes"),
  };
}

export function createCard(data: Prisma.CardCreateInput): Promise<Card> {
  return prisma.card.create({ data });
}

/**
 * Prisma gooit P2025 als het record ondertussen weg is (bijv. in een tweede
 * tab verwijderd); dat wordt hier een nette melding in plaats van een 500.
 */
async function requireExisting<T>(action: () => Promise<T>): Promise<T> {
  try {
    return await action();
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      throw new CardError("Deze kaart bestaat niet meer.");
    }
    throw error;
  }
}

export function updateCard(id: string, data: Prisma.CardUpdateInput): Promise<Card> {
  return requireExisting(() => prisma.card.update({ where: { id }, data }));
}

export function deleteCard(id: string): Promise<Card> {
  return requireExisting(() => prisma.card.delete({ where: { id } }));
}
