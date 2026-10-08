import { describe, expect, it, vi } from "vitest";
import { fetchExample, requiredEnv, storyblokRegion } from "../../src/lib/cms/client";

describe("Storyblok client", () => {
  it("requires the access token", () => {
    expect(requiredEnv).toEqual(["STORYBLOK_ACCESS_TOKEN"]);
  });

  it("maps the first published example story", async () => {
    const get = vi
      .fn()
      .mockResolvedValue({ data: { stories: [{ content: { title: "Hello", body: "World" } }] } });
    expect(await fetchExample({ get })).toEqual({ title: "Hello", body: "World" });
    expect(get).toHaveBeenCalledWith("cdn/stories", {
      content_type: "example",
      per_page: 1,
      sort_by: "created_at:asc",
      version: "published",
    });
  });

  it("returns null without stories", async () => {
    expect(
      await fetchExample({ get: vi.fn().mockResolvedValue({ data: { stories: [] } }) }),
    ).toBeNull();
  });

  it("defaults the region to eu and accepts known regions only", () => {
    expect(storyblokRegion({})).toBe("eu");
    expect(storyblokRegion({ STORYBLOK_REGION: "us" })).toBe("us");
    expect(storyblokRegion({ STORYBLOK_REGION: "mars" })).toBe("eu");
  });
});
