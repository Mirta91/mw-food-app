import type { ContentfulClientApi } from "contentful";
import { beforeEach, describe, expect, it, vi } from "vitest";

const getEntries = vi.fn();
vi.mock("contentful", () => ({ createClient: vi.fn(() => ({ getEntries })) }));

const { fetchExample } = await import("../../src/lib/cms/example");
const client = { getEntries } as unknown as ContentfulClientApi<undefined>;

beforeEach(() => {
  getEntries.mockReset();
});

describe("fetchExample", () => {
  it("maps the first example entry", async () => {
    getEntries.mockResolvedValue({ items: [{ fields: { title: "Hello", body: "World" } }] });
    expect(await fetchExample(client)).toEqual({ title: "Hello", body: "World" });
    expect(getEntries).toHaveBeenCalledWith({
      content_type: "example",
      limit: 1,
      order: ["sys.createdAt"],
    });
  });

  it("returns null without entries", async () => {
    getEntries.mockResolvedValue({ items: [] });
    expect(await fetchExample(client)).toBeNull();
  });

  it("uses the shared client by default", async () => {
    getEntries.mockResolvedValue({ items: [] });
    await fetchExample();
    expect(getEntries).toHaveBeenCalledTimes(1);
  });
});
