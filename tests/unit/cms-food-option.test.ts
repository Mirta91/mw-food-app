import type { ContentfulClientApi } from "contentful";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getEntries = vi.fn();
vi.mock("contentful", () => ({ createClient: vi.fn(() => ({ getEntries })) }));

const { fetchFoodOptions } = await import("../../src/lib/cms/food-option");
const client = { getEntries } as unknown as ContentfulClientApi<undefined>;

beforeEach(() => {
  getEntries.mockReset();
});

describe("fetchFoodOptions", () => {
  it("maps food option entries in creation order", async () => {
    getEntries.mockResolvedValue({
      items: [{ sys: { id: "f1" }, fields: { name: "Vegan", slug: "vegan" } }],
    });
    expect(await fetchFoodOptions(client)).toEqual([{ id: "f1", name: "Vegan", slug: "vegan" }]);
    expect(getEntries).toHaveBeenCalledWith({
      content_type: "foodOption",
      order: ["sys.createdAt"],
      limit: 1000,
    });
  });

  it("uses the shared client by default", async () => {
    getEntries.mockResolvedValue({ items: [] });
    await fetchFoodOptions();
    expect(getEntries).toHaveBeenCalledTimes(1);
  });
});
