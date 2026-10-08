import { describe, expect, it } from "vitest";
import { askChoices } from "./prompts.ts";
import { CANCEL, scriptedPrompter } from "./test-helpers.ts";

describe("askChoices", () => {
  it("asks name, CMS, framework, shows a summary, then confirms", async () => {
    const { prompter, asked } = scriptedPrompter(["my-app", "storyblok", "astro", true]);
    expect(await askChoices(prompter)).toEqual({
      name: "my-app",
      cms: "storyblok",
      framework: "astro",
    });
    expect(asked).toEqual([
      "Project name",
      "CMS",
      "Web framework",
      "note:Summary",
      "Create the project?",
    ]);
  });

  it.each([
    ["name", [CANCEL]],
    ["CMS", ["my-app", CANCEL]],
    ["framework", ["my-app", "sanity", CANCEL]],
    ["confirmation", ["my-app", "sanity", "next", CANCEL]],
    ["declined confirmation", ["my-app", "sanity", "next", false]],
  ])("returns undefined when %s is cancelled", async (_step, answers) => {
    const { prompter } = scriptedPrompter(answers);
    expect(await askChoices(prompter)).toBeUndefined();
  });

  it("validates the project name", async () => {
    const { prompter } = scriptedPrompter(["My App"]);
    await expect(askChoices(prompter)).rejects.toThrow("invalid answer My App");
  });
});
