import { describe, expect, it } from "vitest";
import { allCombos, comboId, cmsLabel, frameworkLabel, validateProjectName } from "./choices.ts";

describe("validateProjectName", () => {
  it.each(["my-app", "app2", "a"])("accepts %s", (name) => {
    expect(validateProjectName(name)).toBeUndefined();
  });

  it.each([
    "",
    undefined,
    "My App",
    "MyApp",
    "../x",
    "a/b",
    "-x",
    ".hidden",
    "a_b",
    "a.b",
    "a".repeat(215),
  ])("rejects %s", (name) => {
    expect(validateProjectName(name)).toEqual(expect.any(String));
  });
});

describe("combos", () => {
  it("lists all 12 combinations once", () => {
    const ids = allCombos().map(comboId);
    expect(ids).toHaveLength(12);
    expect(new Set(ids).size).toBe(12);
    expect(ids[0]).toBe("sanity-next");
  });

  it("has display labels", () => {
    expect(cmsLabel("storyblok")).toBe("Storyblok");
    expect(frameworkLabel("next")).toBe("Next.js");
    expect(frameworkLabel("sveltekit")).toBe("SvelteKit");
  });
});
