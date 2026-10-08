import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import type { Choices } from "./choices.ts";
import { type FileEntry, planProject } from "./plan.ts";
import { makeTempDir, writeTree } from "./test-helpers.ts";

const choices: Choices = { name: "my-app", cms: "sanity", framework: "next" };
let templates: string;

beforeEach(async () => {
  templates = await makeTempDir();
  await writeTree(templates, {
    "common/AGENTS.md": "# __PROJECT_NAME__ with __CMS__ and __FRAMEWORK__\n",
    "common/_gitignore": "node_modules/\n",
    "common/shared.txt": "from common\n",
    "common/pkg.json": JSON.stringify({ name: "__PROJECT_NAME__", scripts: { lint: "oxlint" } }),
    "common/pnpm-workspace.json": JSON.stringify({ allowBuilds: {} }),
    "common/.githooks/pre-commit": { contents: "#!/bin/sh\n", mode: 0o755 },
    "frameworks/next/shared.txt": "from next\n",
    "frameworks/next/pkg.json": JSON.stringify({
      scripts: { dev: "next dev" },
      dependencies: { next: "16.4.0" },
    }),
    "frameworks/next/pnpm-workspace.json": JSON.stringify({ allowBuilds: { sharp: true } }),
    "cms/sanity/pkg.json": JSON.stringify({ dependencies: { sanity: "6.18.0" } }),
    "combos/sanity-next/shared.txt": "from combo\n",
    "combos/sanity-next/src/app/page.tsx": "export default function Page() {}\n",
  });
});

function byPath(entries: FileEntry[], path: string): FileEntry | undefined {
  return entries.find((entry) => entry.path === path);
}

function text(entries: FileEntry[], path: string): string {
  const entry = byPath(entries, path);
  if (entry?.kind !== "file") throw new Error(`no file ${path}`);
  return entry.contents.toString("utf8");
}

describe("planProject", () => {
  it("lets later layers replace whole files", async () => {
    const entries = await planProject(templates, choices);
    expect(text(entries, "shared.txt")).toBe("from combo\n");
    expect(text(entries, "src/app/page.tsx")).toContain("Page");
  });

  it("deep-merges pkg.json into package.json and replaces tokens", async () => {
    const entries = await planProject(templates, choices);
    expect(byPath(entries, "pkg.json")).toBeUndefined();
    expect(JSON.parse(text(entries, "package.json"))).toEqual({
      name: "my-app",
      scripts: { lint: "oxlint", dev: "next dev" },
      dependencies: { next: "16.4.0", sanity: "6.18.0" },
    });
    expect(text(entries, "package.json").endsWith("}\n")).toBe(true);
  });

  it("renders pnpm-workspace.yaml from merged fragments", async () => {
    const entries = await planProject(templates, choices);
    expect(text(entries, "pnpm-workspace.yaml")).toBe("allowBuilds:\n  sharp: true\n");
  });

  it("replaces display-label tokens in text files", async () => {
    const entries = await planProject(templates, choices);
    expect(text(entries, "AGENTS.md")).toBe("# my-app with Sanity and Next.js\n");
  });

  it("renames _gitignore and keeps file modes", async () => {
    const entries = await planProject(templates, choices);
    expect(text(entries, ".gitignore")).toBe("node_modules/\n");
    const hook = byPath(entries, ".githooks/pre-commit");
    expect(hook?.kind === "file" && hook.mode & 0o111).toBeTruthy();
  });

  it("adds CLAUDE.md as a symlink to AGENTS.md", async () => {
    const entries = await planProject(templates, choices);
    expect(byPath(entries, "CLAUDE.md")).toEqual({
      kind: "symlink",
      path: "CLAUDE.md",
      target: "AGENTS.md",
    });
  });

  it("returns entries sorted by path", async () => {
    const paths = (await planProject(templates, choices)).map((entry) => entry.path);
    expect(paths).toEqual([...paths].sort());
  });

  it("fails when a layer is missing", async () => {
    await expect(planProject(templates, { ...choices, framework: "nuxt" })).rejects.toThrow(
      `Template layer missing: ${join("frameworks", "nuxt")}`,
    );
  });

  it("names the file when a fragment is invalid JSON", async () => {
    await writeTree(templates, { "cms/sanity/pkg.json": "{" });
    await expect(planProject(templates, choices)).rejects.toThrow(/cms[/\\]sanity[/\\]pkg\.json/);
  });
});
