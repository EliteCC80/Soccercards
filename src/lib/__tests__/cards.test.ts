import { describe, expect, it } from "vitest";
import { CardError, cardDataFromForm, listCards } from "../cards";

function form(fields: Record<string, string>): FormData {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.append(key, value);
  return data;
}

const base = {
  player: "Lamine Yamal",
  year: "2023-24",
  set: "Topps Chrome",
  condition: "MINT",
  status: "LISTED",
};

describe("cardDataFromForm", () => {
  it("zet bedragen om naar centen en lege velden naar null", () => {
    const data = cardDataFromForm(form({ ...base, askingPrice: "125,00", variant: "" }));
    expect(data.askingPrice).toBe(12500);
    expect(data.variant).toBeNull();
    expect(data.priceLow).toBeNull();
    expect(data.isRookie).toBe(false);
  });

  it("leest de RC-checkbox", () => {
    expect(cardDataFromForm(form({ ...base, isRookie: "on" })).isRookie).toBe(true);
  });

  it("weigert ontbrekende verplichte velden", () => {
    expect(() => cardDataFromForm(form({ ...base, player: "  " }))).toThrow(/verplicht/);
  });

  it("weigert een onbekende status of conditie", () => {
    expect(() => cardDataFromForm(form({ ...base, status: "VERKOCHT" }))).toThrow(/status/);
    expect(() => cardDataFromForm(form({ ...base, condition: "PERFECT" }))).toThrow(/conditie/);
  });
});

describe("cardDataFromForm foutsoorten", () => {
  it("geeft een CardError zodat de melding aan de gebruiker getoond mag worden", () => {
    expect(() => cardDataFromForm(form({ ...base, askingPrice: "12,505" }))).toThrow(CardError);
  });
});

describe("listCards", () => {
  it("wijst een onbekende status af in plaats van alles te tonen", async () => {
    await expect(listCards({ status: "Verkocht" })).rejects.toBeInstanceOf(CardError);
  });
});
