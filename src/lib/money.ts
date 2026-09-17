/** Bedragen worden overal als hele eurocenten (integer) bewaard. */

export function formatEuro(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "";
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

/**
 * Leest een door de gebruiker getypt bedrag ("12,50", "€ 12.50", "12") en
 * geeft het aantal centen terug. Lege invoer geeft null, onleesbare invoer
 * gooit — zodat een typfout niet stilzwijgend als 0 wordt opgeslagen.
 */
export function parseEuro(input: string | null | undefined): number | null {
  if (input === null || input === undefined) return null;
  const cleaned = input.replace(/[€\s]/g, "").replace(",", ".");
  if (cleaned === "") return null;
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) {
    throw new Error(`Ongeldig bedrag: "${input}"`);
  }
  return Math.round(Number(cleaned) * 100);
}

/** Centen als "12.50" voor een number-input in een formulier. */
export function centsToInputValue(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return "";
  return (cents / 100).toFixed(2);
}
