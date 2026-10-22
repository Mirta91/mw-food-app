import type { SanityClient } from "@sanity/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const fetch = vi.fn();
vi.mock("@sanity/client", () => ({ createClient: vi.fn(() => ({ fetch })) }));

const { exampleQuery, fetchExample } = await import("../../src/lib/cms/example");
const client = { fetch } as unknown as SanityClient;

beforeEach(() => {
  fetch.mockReset();
});

describe("fetchExample", () => {
  it("queries the first example document", async () => {
    fetch.mockResolvedValue({ title: "Hello", body: "World" });
    expect(await fetchExample(client)).toEqual({ title: "Hello", body: "World" });
    expect(fetch).toHaveBeenCalledWith(exampleQuery);
  });

  it("returns null when no example exists", async () => {
    fetch.mockResolvedValue(null);
    expect(await fetchExample(client)).toBeNull();
  });

  it("propagates SDK errors", async () => {
    fetch.mockRejectedValue(new Error("Unauthorized"));
    await expect(fetchExample(client)).rejects.toThrow("Unauthorized");
  });

  it("uses the shared client by default", async () => {
    fetch.mockResolvedValue(null);
    await fetchExample();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
