import { describe, expect, it } from "vitest";
import { demoFoodOptions, demoOffices, demoRestaurants } from "../../cms/demo-data";

describe("demo data", () => {
  it("uses unique entry IDs", () => {
    const ids = [...demoFoodOptions, ...demoOffices, ...demoRestaurants].map((entry) => entry.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("uses unique slugs and cities", () => {
    const slugs = demoFoodOptions.map((option) => option.slug);
    const cities = demoOffices.map((office) => office.city);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(cities).size).toBe(cities.length);
  });

  it("refers only to demo offices and food options", () => {
    const cities = new Set(demoOffices.map((office) => office.city));
    const slugs = new Set(demoFoodOptions.map((option) => option.slug));
    for (const restaurant of demoRestaurants) {
      expect(cities).toContain(restaurant.office);
      expect(restaurant.foodOptions.length).toBeGreaterThan(0);
      for (const slug of restaurant.foodOptions) {
        expect(slugs).toContain(slug);
      }
    }
  });

  it("has the four Valencia restaurants of the design at 20 € or less", () => {
    const names = demoRestaurants
      .filter((restaurant) => restaurant.office === "Valencia" && restaurant.averagePrice <= 20)
      .map((restaurant) => restaurant.name);
    expect(names).toEqual(["Green Bowl", "La Tasca", "Sushi Corner", "Noodle Bar"]);
  });
});
