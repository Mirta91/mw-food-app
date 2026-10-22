import { describe, expect, it, vi } from "vitest";

vi.mock("@sanity/client", () => ({ createClient: vi.fn(() => ({})) }));

const { createClient } = await import("@sanity/client");
const { apiVersion, getClient, requiredEnv } = await import("../../src/lib/cms/client");

describe("Sanity client", () => {
  it("requires the project and dataset", () => {
    expect(requiredEnv).toEqual(["SANITY_PROJECT_ID", "SANITY_DATASET"]);
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
