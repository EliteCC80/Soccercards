import type { Card } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { CSV_COLUMNS, cardsToCsv } from "../csv";

function card(overrides: Partial<Card> = {}): Card {
  return {
    id: "c1",
    player: "Lamine Yamal",
    year: "2023-24",
    set: "Topps Chrome",
    variant: "Refractor",
    serialNumber: "38/50",
    isRookie: true,
    condition: "MINT",
    priceLow: 9000,
    priceHigh: 14000,
    askingPrice: 12500,
    status: "LISTED",
    listingUrl: null,
    notes: null,
    imageUrl: null,
    createdAt: new Date("2026-09-01T10:00:00Z"),
    updatedAt: new Date("2026-09-02T10:00:00Z"),
    ...overrides,
  };
}

describe("cardsToCsv", () => {
  it("schrijft de trackerkolommen in volgorde", () => {
    const [header] = cardsToCsv([]).split("\n");
    expect(header).toBe(CSV_COLUMNS.join(","));
  });

  it("zet een kaart om naar één regel", () => {
    const [, row] = cardsToCsv([card()]).split("\n");
    expect(row).toBe(
      "Lamine Yamal,2023-24,Topps Chrome,Refractor,38/50,ja,MINT,90.00,140.00,125.00,LISTED,,,2026-09-01",
    );
  });

  it("escapet komma's en aanhalingstekens in notities", () => {
    const [, row] = cardsToCsv([card({ notes: 'hoek, licht "wit"' })]).split("\n");
    expect(row).toContain('"hoek, licht ""wit"""');
  });

  it("laat lege bedragen leeg in plaats van 0", () => {
    const [, row] = cardsToCsv([card({ askingPrice: null })]).split("\n");
    expect(row.split(",")[9]).toBe("");
  });
});
