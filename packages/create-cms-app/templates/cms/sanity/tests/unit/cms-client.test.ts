import type { SanityClient } from "@sanity/client";
import { describe, expect, it, vi } from "vitest";

vi.mock("@sanity/client", () => ({ createClient: vi.fn(() => ({})) }));

const { createClient } = await import("@sanity/client");
const { apiVersion, exampleQuery, fetchExample, getClient, requiredEnv } =
  await import("../../src/lib/cms/client");

describe("Sanity client", () => {
  it("requires the project and dataset", () => {
    expect(requiredEnv).toEqual(["SANITY_PROJECT_ID", "SANITY_DATASET"]);
  });

  it("queries the first example document", async () => {
    const fetch = vi.fn().mockResolvedValue({ title: "Hello", body: "World" });
    expect(await fetchExample(client(fetch))).toEqual({ title: "Hello", body: "World" });
    expect(fetch).toHaveBeenCalledWith(exampleQuery);
  });

  it("returns null when no example exists", async () => {
    expect(await fetchExample(client(vi.fn().mockResolvedValue(null)))).toBeNull();
  });

  it("propagates SDK errors", async () => {
    const fetch = vi.fn().mockRejectedValue(new Error("Unauthorized"));
    await expect(fetchExample(client(fetch))).rejects.toThrow("Unauthorized");
  });

  it("creates the SDK client once from the environment", () => {
    vi.stubEnv("SANITY_PROJECT_ID", "project");
    vi.stubEnv("SANITY_DATASET", "production");
    expect(getClient()).toBe(getClient());
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(createClient).toHaveBeenCalledWith({
      projectId: "project",
      dataset: "production",
      apiVersion,
      useCdn: true,
    });
    vi.unstubAllEnvs();
  });
});

function client(fetch: ReturnType<typeof vi.fn>): SanityClient {
  return { fetch } as unknown as SanityClient;
}
