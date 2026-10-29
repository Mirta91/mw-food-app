import { describe, expect, it } from "vitest";
import { filterRestaurants, pickRandom, priceRange } from "../../src/lib/utils/restaurants";

const vegan = { slug: "vegan" };
const fish = { slug: "fish" };
const restaurants = [
  { id: "a", averagePrice: 11, foodOptions: [vegan] },
  { id: "b", averagePrice: 20, foodOptions: [fish] },
  { id: "c", averagePrice: 26, foodOptions: [fish, vegan] },
];

describe("filterRestaurants", () => {
  it("keeps every food option for All, up to the price inclusive", () => {
    const ids = filterRestaurants(restaurants, { foodOption: null, maxPrice: 20 }).map((r) => r.id);
    expect(ids).toEqual(["a", "b"]);
  });

  it("keeps only restaurants with the food option", () => {
    const ids = filterRestaurants(restaurants, { foodOption: "vegan", maxPrice: 30 }).map(
      (r) => r.id,
    );
    expect(ids).toEqual(["a", "c"]);
  });
});

describe("pickRandom", () => {
  it("returns null for no items", () => {
    expect(pickRandom([])).toBeNull();
  });

  it("avoids the excluded item while there is another", () => {
    for (const value of [0, 0.5, 0.99]) {
      expect(pickRandom(restaurants, "a", () => value)?.id).not.toBe("a");
    }
  });

  it("returns the only item even when it is excluded", () => {
    expect(pickRandom([{ id: "a" }], "a")?.id).toBe("a");
  });
});

describe("priceRange", () => {
  it("goes from 5 € to 30 €", () => {
    expect(priceRange(restaurants)).toEqual({ min: 5, max: 30 });
    expect(priceRange([])).toEqual({ min: 5, max: 30 });
  });

  it("grows past 30 € for the most expensive restaurant", () => {
    expect(priceRange([{ averagePrice: 34.5 }])).toEqual({ min: 5, max: 35 });
  });
});
