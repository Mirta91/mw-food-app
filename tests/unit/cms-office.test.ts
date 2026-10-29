import type { ContentfulClientApi } from "contentful";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getEntries = vi.fn();
vi.mock("contentful", () => ({ createClient: vi.fn(() => ({ getEntries })) }));

const { fetchOffices } = await import("../../src/lib/cms/office");
const client = { getEntries } as unknown as ContentfulClientApi<undefined>;

beforeEach(() => {
  getEntries.mockReset();
});

describe("fetchOffices", () => {
  it("maps office entries in creation order", async () => {
    getEntries.mockResolvedValue({
      items: [
        {
          sys: { id: "VALE" },
          fields: {
            name: "VALE",
            city: "Valencia",
            address: "Plaça 1",
            coordinates: { lat: 39.47, lon: -0.37 },
          },
        },
      ],
    });
    expect(await fetchOffices(client)).toEqual([
      {
        id: "VALE",
        name: "VALE",
        city: "Valencia",
        address: "Plaça 1",
        coordinates: { lat: 39.47, lon: -0.37 },
      },
    ]);
    expect(getEntries).toHaveBeenCalledWith({
      content_type: "office",
      order: ["sys.createdAt"],
      limit: 1000,
    });
  });

  it("maps missing coordinates to null", async () => {
    getEntries.mockResolvedValue({ items: [{ sys: { id: "o1" }, fields: { name: "Bare" } }] });
    expect(await fetchOffices(client)).toEqual([
      { id: "o1", name: "Bare", city: "", address: "", coordinates: null },
    ]);
  });

  it("uses the shared client by default", async () => {
    getEntries.mockResolvedValue({ items: [] });
    await fetchOffices();
    expect(getEntries).toHaveBeenCalledTimes(1);
  });
});
