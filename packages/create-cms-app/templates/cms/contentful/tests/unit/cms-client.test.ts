import { beforeEach, describe, expect, it, vi } from "vitest";

const getEntries = vi.fn();
vi.mock("contentful", () => ({ createClient: vi.fn(() => ({ getEntries })) }));

const { createClient } = await import("contentful");
const { createExampleLoader, fetchExample, requiredEnv } = await import("../../src/lib/cms/client");

beforeEach(() => {
  getEntries.mockReset();
});

describe("Contentful client", () => {
  it("requires the space and delivery token", () => {
    expect(requiredEnv).toEqual(["CONTENTFUL_SPACE_ID", "CONTENTFUL_ACCESS_TOKEN"]);
  });

  it("maps the first example entry", async () => {
    getEntries.mockResolvedValue({ items: [{ fields: { title: "Hello", body: "World" } }] });
    expect(await fetchExample({ getEntries })).toEqual({ title: "Hello", body: "World" });
    expect(getEntries).toHaveBeenCalledWith({
      content_type: "example",
      limit: 1,
      order: ["sys.createdAt"],
    });
  });

  it("returns null without entries", async () => {
    getEntries.mockResolvedValue({ items: [] });
    expect(await fetchExample({ getEntries })).toBeNull();
  });

  it("creates the SDK client from the environment, defaulting to master", async () => {
    getEntries.mockResolvedValue({ items: [] });
    await createExampleLoader({
      CONTENTFUL_SPACE_ID: "space",
      CONTENTFUL_ACCESS_TOKEN: "token",
      CONTENTFUL_ENVIRONMENT: "",
    })();
    expect(createClient).toHaveBeenCalledWith({
      space: "space",
      accessToken: "token",
      environment: "master",
    });
  });
});
