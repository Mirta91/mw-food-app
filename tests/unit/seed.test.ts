import type { PlainClientAPI } from "contentful-management";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { demoFoodOptions, demoOffices, demoRestaurants } from "../../cms/demo-data";
import { seedDemoContent } from "../../cms/seed";

type Existing = { id: string; fields: Record<string, Record<string, unknown>> };

const existing: Record<string, Existing[]> = {};
const getMany = vi.fn(async ({ query }: { query: { content_type: string } }) => ({
  items: (existing[query.content_type] ?? []).map(({ id, fields }) => ({ sys: { id }, fields })),
}));
const createWithId = vi.fn(async ({ entryId }: { entryId: string }) => ({ sys: { id: entryId } }));
const publish = vi.fn(async () => ({}));
const client = { entry: { getMany, createWithId, publish } } as unknown as PlainClientAPI;

beforeEach(() => {
  for (const key of Object.keys(existing)) {
    delete existing[key];
  }
  getMany.mockClear();
  createWithId.mockClear();
  publish.mockClear();
});

describe("seedDemoContent", () => {
  it("creates and publishes every entry in an empty space", async () => {
    const created = await seedDemoContent(client, "en-US");
    const total = demoFoodOptions.length + demoOffices.length + demoRestaurants.length;
    expect(created).toBe(total);
    expect(publish).toHaveBeenCalledTimes(total);
    expect(createWithId).toHaveBeenCalledWith(
      { entryId: "food-vegan", contentTypeId: "foodOption" },
      { fields: { name: { "en-US": "Vegan" }, slug: { "en-US": "vegan" } } },
    );
  });

  it("reuses food options by slug and offices by city", async () => {
    existing.foodOption = [{ id: "hand-made-veg", fields: { slug: { "en-US": "vegetarian" } } }];
    existing.office = [{ id: "VALE", fields: { city: { "en-US": "Valencia" } } }];

    await seedDemoContent(client, "en-US");

    const createdIds = createWithId.mock.calls.map(([params]) => params.entryId);
    expect(createdIds).not.toContain("food-vegetarian");
    expect(createdIds).not.toContain("office-valencia");
    const greenBowl = createWithId.mock.calls.find(
      ([params]) => params.entryId === "restaurant-green-bowl",
    ) as unknown as [unknown, { fields: Record<string, Record<string, unknown>> }];
    expect(greenBowl[1].fields.office).toEqual({
      "en-US": { sys: { type: "Link", linkType: "Entry", id: "VALE" } },
    });
    expect(greenBowl[1].fields.foodOptions).toEqual({
      "en-US": [
        { sys: { type: "Link", linkType: "Entry", id: "hand-made-veg" } },
        { sys: { type: "Link", linkType: "Entry", id: "food-vegan" } },
      ],
    });
    expect(greenBowl[1].fields.coordinates).toEqual({ "en-US": { lat: 39.4717, lon: -0.3768 } });
  });

  it("skips restaurants that exist", async () => {
    existing.restaurant = demoRestaurants.map(({ id }) => ({ id, fields: {} }));
    const created = await seedDemoContent(client, "en-US");
    expect(created).toBe(demoFoodOptions.length + demoOffices.length);
  });
});
