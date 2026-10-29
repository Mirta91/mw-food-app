import { describe, expect, it } from "vitest";
import { distanceInMeters, mapsSearchUrl, toCoordinates } from "../../src/lib/utils/geo";

const valencia = { lat: 39.474, lon: -0.3721 };
const munich = { lat: 48.1374, lon: 11.5755 };

describe("distanceInMeters", () => {
  it("measures Valencia to Munich as about 1,350 km", () => {
    expect(distanceInMeters(valencia, munich) / 1000).toBeCloseTo(1350, -1.5);
  });

  it("is zero for the same point", () => {
    expect(distanceInMeters(valencia, valencia)).toBe(0);
  });
});

describe("mapsSearchUrl", () => {
  it("searches for coordinates", () => {
    expect(mapsSearchUrl(valencia)).toBe(
      "https://www.google.com/maps/search/?api=1&query=39.474%2C-0.3721",
    );
  });

  it("searches for an address", () => {
    expect(mapsSearchUrl("Tal 12, München")).toBe(
      "https://www.google.com/maps/search/?api=1&query=Tal%2012%2C%20M%C3%BCnchen",
    );
  });
});

describe("toCoordinates", () => {
  it("reads a location and rejects anything else", () => {
    expect(toCoordinates({ lat: 1, lon: 2 })).toEqual({ lat: 1, lon: 2 });
    expect(toCoordinates(undefined)).toBeNull();
    expect(toCoordinates({ lat: "1", lon: 2 })).toBeNull();
  });
});
