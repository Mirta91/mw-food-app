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
            office: { sys: { id: "VALE" }, fields: { name: "VALE", city: "Valencia" } },
            address: "Passeig de Neptú 6",
            coordinates: { lat: 39.46, lon: -0.32 },
            cuisine: "Spanish",
            foodOptions: [
              { sys: { id: "f1" }, fields: { name: "Vegetarian", slug: "vegetarian" } },
              { sys: { id: "f2", type: "Link" } },
            ],
            averagePrice: 25,
            emoji: "🥘",
            image: { fields: { file: { url: "//images.ctfassets.net/pepica.jpg" } } },
            googleMapsUrl: "https://maps.google.com/?q=la+pepica",
            takeaway: true,
          },
        },
      ],
    });
    expect(await fetchRestaurants("VALE", client)).toEqual([
      {
        id: "r1",
        name: "La Pepica",
        description: "Paella by the beach",
        officeId: "VALE",
        address: "Passeig de Neptú 6",
        coordinates: { lat: 39.46, lon: -0.32 },
        cuisine: "Spanish",
        foodOptions: [{ id: "f1", name: "Vegetarian", slug: "vegetarian" }],
        averagePrice: 25,
        emoji: "🥘",
        imageUrl: "https://images.ctfassets.net/pepica.jpg",
        googleMapsUrl: "https://maps.google.com/?q=la+pepica",
        takeaway: true,
      },
    ]);
    expect(getEntries).toHaveBeenCalledWith({
      content_type: "restaurant",
      "fields.office.sys.id": "VALE",
      include: 1,
      order: ["fields.name"],
      limit: 1000,
    });
  });

  it("fills optional and unresolved fields with defaults", async () => {
    getEntries.mockResolvedValue({
      items: [
        {
          sys: { id: "r2" },
          fields: {
            name: "Bare",
            office: { sys: { id: "VALE", type: "Link" } },
            address: "Somewhere 1",
            coordinates: { lat: 39.5, lon: -0.4 },
            cuisine: "Fusion",
            foodOptions: [],
            averagePrice: 12,
            image: { sys: { id: "a1", type: "Link" } },
          },
        },
      ],
    });
    expect(await fetchRestaurants("VALE", client)).toEqual([
      {
        id: "r2",
        name: "Bare",
        description: "",
        officeId: "VALE",
        address: "Somewhere 1",
        coordinates: { lat: 39.5, lon: -0.4 },
        cuisine: "Fusion",
        foodOptions: [],
        averagePrice: 12,
        emoji: "🍽️",
        imageUrl: null,
        googleMapsUrl: "https://www.google.com/maps/search/?api=1&query=39.5%2C-0.4",
        takeaway: false,
      },
    ]);
  });

  it("falls back to the address for the Maps link without coordinates", async () => {
    getEntries.mockResolvedValue({
      items: [{ sys: { id: "r3" }, fields: { name: "No point", address: "Calle 1" } }],
    });
    const [restaurant] = await fetchRestaurants("VALE", client);
    expect(restaurant?.coordinates).toBeNull();
    expect(restaurant?.googleMapsUrl).toBe(
      "https://www.google.com/maps/search/?api=1&query=Calle%201",
    );
  });

  it("returns an empty list without entries", async () => {
    getEntries.mockResolvedValue({ items: [] });
    expect(await fetchRestaurants("VALE", client)).toEqual([]);
  });

  it("uses the shared client by default", async () => {
    getEntries.mockResolvedValue({ items: [] });
    await fetchRestaurants("VALE");
    expect(getEntries).toHaveBeenCalledTimes(1);
  });
});
