import type { ContentfulClientApi } from "contentful";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getEntries = vi.fn();
vi.mock("contentful", () => ({ createClient: vi.fn(() => ({ getEntries })) }));

const { fetchRestaurants } = await import("../../src/lib/cms/restaurant");
const client = { getEntries } as unknown as ContentfulClientApi<undefined>;

beforeEach(() => {
  getEntries.mockReset();
});

describe("fetchRestaurants", () => {
  it("maps restaurant entries with their linked office, food options and image", async () => {
    getEntries.mockResolvedValue({
      items: [
        {
          sys: { id: "r1" },
          fields: {
            name: "La Pepica",
            description: "Paella by the beach",
            office: { fields: { name: "VALE", city: "Valencia" } },
            address: "Passeig de Neptú 6",
            cuisine: "Spanish",
            foodOptions: [
              { fields: { name: "Vegetarian", slug: "vegetarian" } },
              { sys: { type: "Link" } },
            ],
            averagePrice: 25,
            image: { fields: { file: { url: "//images.ctfassets.net/pepica.jpg" } } },
            googleMapsUrl: "https://maps.google.com/?q=la+pepica",
            takeaway: true,
          },
        },
      ],
    });
    expect(await fetchRestaurants(client)).toEqual([
      {
        id: "r1",
        name: "La Pepica",
        description: "Paella by the beach",
        office: "VALE",
        address: "Passeig de Neptú 6",
        cuisine: "Spanish",
        foodOptions: ["Vegetarian"],
        averagePrice: 25,
        imageUrl: "https://images.ctfassets.net/pepica.jpg",
        googleMapsUrl: "https://maps.google.com/?q=la+pepica",
        takeaway: true,
      },
    ]);
    expect(getEntries).toHaveBeenCalledWith({
      content_type: "restaurant",
      include: 1,
      order: ["fields.name"],
    });
  });

  it("fills optional and unresolved fields with empty values", async () => {
    getEntries.mockResolvedValue({
      items: [
        {
          sys: { id: "r2" },
          fields: {
            name: "Bare",
            office: { sys: { type: "Link" } },
            address: "Somewhere 1",
            cuisine: "Fusion",
            foodOptions: [],
            averagePrice: 12,
          },
        },
      ],
    });
    expect(await fetchRestaurants(client)).toEqual([
      {
        id: "r2",
        name: "Bare",
        description: "",
        office: "",
        address: "Somewhere 1",
        cuisine: "Fusion",
        foodOptions: [],
        averagePrice: 12,
        imageUrl: null,
        googleMapsUrl: null,
        takeaway: false,
      },
    ]);
  });

  it("returns an empty list without entries", async () => {
    getEntries.mockResolvedValue({ items: [] });
    expect(await fetchRestaurants(client)).toEqual([]);
  });

  it("uses the shared client by default", async () => {
    getEntries.mockResolvedValue({ items: [] });
    await fetchRestaurants();
    expect(getEntries).toHaveBeenCalledTimes(1);
  });
});
