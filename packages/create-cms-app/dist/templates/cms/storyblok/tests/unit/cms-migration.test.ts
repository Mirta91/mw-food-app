import { describe, expect, it, vi } from "vitest";
import { up } from "../../cms/migrations/001-create-example.ts";

type Call = [string, RequestInit | undefined];

function fakeMapi(responses: Record<string, unknown>) {
  return vi.fn(async (path: string, _init?: RequestInit) => responses[path]);
}

const postsTo = (mapi: ReturnType<typeof fakeMapi>, path: string) =>
  (mapi.mock.calls as Call[]).filter(([p, init]) => p === path && init?.method === "POST");

const STORY_LOOKUP = "/stories?contain_component=example&per_page=1";

describe("Storyblok migration 001", () => {
  it("creates the component and story in a space with only a Home story", async () => {
    const mapi = fakeMapi({ "/components": { components: [] }, [STORY_LOOKUP]: { stories: [] } });
    await up(mapi);
    expect(mapi).toHaveBeenCalledWith(STORY_LOOKUP);
    expect(postsTo(mapi, "/components")).toHaveLength(1);
    expect(postsTo(mapi, "/stories")).toHaveLength(1);
  });

  it("does nothing when the component and an example story exist", async () => {
    const mapi = fakeMapi({
      "/components": { components: [{ name: "example" }] },
      [STORY_LOOKUP]: { stories: [{ content: { component: "example" } }] },
    });
    await up(mapi);
    expect(mapi).toHaveBeenCalledWith(STORY_LOOKUP);
    expect(postsTo(mapi, "/components")).toHaveLength(0);
    expect(postsTo(mapi, "/stories")).toHaveLength(0);
  });
});
