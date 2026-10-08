import { describe, expect, it, vi } from "vitest";
import { exampleQuery, fetchExample, requiredEnv } from "../../src/lib/cms/client";

describe("Sanity client", () => {
  it("requires the project and dataset", () => {
    expect(requiredEnv).toEqual(["SANITY_PROJECT_ID", "SANITY_DATASET"]);
  });

  it("queries the first example document", async () => {
    const fetch = vi.fn().mockResolvedValue({ title: "Hello", body: "World" });
    expect(await fetchExample({ fetch })).toEqual({ title: "Hello", body: "World" });
    expect(fetch).toHaveBeenCalledWith(exampleQuery);
  });

  it("returns null when no example exists", async () => {
    expect(await fetchExample({ fetch: vi.fn().mockResolvedValue(null) })).toBeNull();
  });

  it("propagates SDK errors", async () => {
    const fetch = vi.fn().mockRejectedValue(new Error("Unauthorized"));
    await expect(fetchExample({ fetch })).rejects.toThrow("Unauthorized");
  });
});
