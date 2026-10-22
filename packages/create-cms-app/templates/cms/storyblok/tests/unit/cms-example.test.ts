import type StoryblokClient from "storyblok-js-client";
import { beforeEach, describe, expect, it, vi } from "vitest";

const get = vi.fn();
vi.mock("storyblok-js-client", () => ({
  default: vi.fn(function () {
    return { get };
  }),
}));

const { fetchExample } = await import("../../src/lib/cms/example");
const client = { get } as unknown as StoryblokClient;

beforeEach(() => {
  get.mockReset();
});

describe("fetchExample", () => {
  it("maps the first published example story", async () => {
    get.mockResolvedValue({ data: { stories: [{ content: { title: "Hello", body: "World" } }] } });
    expect(await fetchExample(client)).toEqual({ title: "Hello", body: "World" });
    expect(get).toHaveBeenCalledWith("cdn/stories", {
      content_type: "example",
      per_page: 1,
      sort_by: "created_at:asc",
      version: "published",
    });
  });

  it("returns null without stories", async () => {
    get.mockResolvedValue({ data: { stories: [] } });
    expect(await fetchExample(client)).toBeNull();
  });

  it("uses the shared client by default", async () => {
    get.mockResolvedValue({ data: { stories: [] } });
    await fetchExample();
    expect(get).toHaveBeenCalledTimes(1);
  });
});
