import type StoryblokClient from "storyblok-js-client";
import { describe, expect, it, vi } from "vitest";

vi.mock("storyblok-js-client", () => ({ default: vi.fn() }));

const { default: StoryblokClientMock } = await import("storyblok-js-client");
const { fetchExample, getClient, requiredEnv, storyblokRegion } =
  await import("../../src/lib/cms/client");

describe("Storyblok client", () => {
  it("requires the access token", () => {
    expect(requiredEnv).toEqual(["STORYBLOK_ACCESS_TOKEN"]);
  });

  it("maps the first published example story", async () => {
    const get = vi
      .fn()
      .mockResolvedValue({ data: { stories: [{ content: { title: "Hello", body: "World" } }] } });
    expect(await fetchExample(client(get))).toEqual({ title: "Hello", body: "World" });
    expect(get).toHaveBeenCalledWith("cdn/stories", {
      content_type: "example",
      per_page: 1,
      sort_by: "created_at:asc",
      version: "published",
    });
  });

  it("returns null without stories", async () => {
    expect(
      await fetchExample(client(vi.fn().mockResolvedValue({ data: { stories: [] } }))),
    ).toBeNull();
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
    expect(StoryblokClientMock).toHaveBeenCalledTimes(1);
    expect(StoryblokClientMock).toHaveBeenCalledWith({ accessToken: "token", region: "us" });
    vi.unstubAllEnvs();
  });
});

function client(get: ReturnType<typeof vi.fn>): StoryblokClient {
  return { get } as unknown as StoryblokClient;
}
