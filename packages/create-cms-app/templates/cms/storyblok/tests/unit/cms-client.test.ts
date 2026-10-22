import { describe, expect, it, vi } from "vitest";

vi.mock("storyblok-js-client", () => ({ default: vi.fn() }));

const { default: StoryblokClient } = await import("storyblok-js-client");
const { getClient, requiredEnv, storyblokRegion } = await import("../../src/lib/cms/client");

describe("Storyblok client", () => {
  it("requires the access token", () => {
    expect(requiredEnv).toEqual(["STORYBLOK_ACCESS_TOKEN"]);
  });

  it("defaults the region to eu and accepts known regions only", () => {
    expect(storyblokRegion({})).toBe("eu");
    expect(storyblokRegion({ STORYBLOK_REGION: "us" })).toBe("us");
    expect(storyblokRegion({ STORYBLOK_REGION: "mars" })).toBe("eu");
  });

  it("creates the SDK client once from the environment", () => {
    vi.stubEnv("STORYBLOK_ACCESS_TOKEN", "token");
    vi.stubEnv("STORYBLOK_REGION", "us");
    expect(getClient()).toBe(getClient());
    expect(StoryblokClient).toHaveBeenCalledTimes(1);
    expect(StoryblokClient).toHaveBeenCalledWith({ accessToken: "token", region: "us" });
    vi.unstubAllEnvs();
  });
});
