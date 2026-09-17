import { describe, expect, it } from "vitest";
import { centsToInputValue, formatEuro, parseEuro } from "../money";

describe("parseEuro", () => {
  it("leest komma- en puntnotatie", () => {
    expect(parseEuro("12,50")).toBe(1250);
    expect(parseEuro("12.50")).toBe(1250);
    expect(parseEuro("€ 12")).toBe(1200);
  });

  it("geeft null bij lege invoer", () => {
    expect(parseEuro("")).toBeNull();
    expect(parseEuro(null)).toBeNull();
  });

  it("gooit bij onleesbare invoer in plaats van stil 0 op te slaan", () => {
    expect(() => parseEuro("twaalf")).toThrow();
    expect(() => parseEuro("12,505")).toThrow();
  });
});

describe("formatEuro", () => {
  it("formatteert centen als euro", () => {
    expect(formatEuro(1250).replace(/ /g, " ")).toBe("€ 12,50");
    expect(formatEuro(null)).toBe("");
  });
});

describe("centsToInputValue", () => {
  it("geeft twee decimalen", () => {
    expect(centsToInputValue(1200)).toBe("12.00");
    expect(centsToInputValue(null)).toBe("");
  });
});
