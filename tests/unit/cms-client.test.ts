import { describe, expect, it, vi } from "vitest";

vi.mock("contentful", () => ({ createClient: vi.fn(() => ({})) }));

const { createClient } = await import("contentful");
const { getClient, requiredEnv } = await import("../../src/lib/cms/client");

describe("Contentful client", () => {
  it("requires the space and delivery token", () => {
    expect(requiredEnv).toEqual(["CONTENTFUL_SPACE_ID", "CONTENTFUL_ACCESS_TOKEN"]);
  });

  it("creates the SDK client once from the environment, defaulting to master", () => {
    vi.stubEnv("CONTENTFUL_SPACE_ID", "space");
    vi.stubEnv("CONTENTFUL_ACCESS_TOKEN", "token");
    vi.stubEnv("CONTENTFUL_ENVIRONMENT", "");
    expect(getClient()).toBe(getClient());
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(createClient).toHaveBeenCalledWith({
      space: "space",
      accessToken: "token",
      environment: "master",
    });
    vi.unstubAllEnvs();
  });
});
