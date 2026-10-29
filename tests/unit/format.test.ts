import { describe, expect, it } from "vitest";
import { formatDistance, formatPrice } from "../../src/lib/utils/format";

describe("formatPrice", () => {
  it("shows whole euros without decimals and other prices with two", () => {
    expect(formatPrice(11)).toBe("11 €");
    expect(formatPrice(12.5)).toBe("12.50 €");
  });
});

describe("formatDistance", () => {
  it("shows meters below 1 km and kilometers above", () => {
    expect(formatDistance(350)).toBe("350 m");
    expect(formatDistance(347)).toBe("350 m");
    expect(formatDistance(1240)).toBe("1.2 km");
  });
});
