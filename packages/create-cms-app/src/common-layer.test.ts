import { cp, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { checkDocs } from "../templates/common/scripts/check-docs.ts";
import { readLayer } from "./layers.ts";
import { sourceTemplatesDir } from "./paths.ts";
import { makeTempDir } from "./test-helpers.ts";

const common = join(sourceTemplatesDir, "common");

describe("common layer", () => {
  it("contains the shared project files", async () => {
    const files = await readLayer(common);
    expect([...files.keys()].sort()).toEqual([
      ".githooks/pre-commit",
      ".oxfmtrc.json",
      ".oxlintrc.json",
      "AGENTS.md",
      "_gitignore",
      "docs/instructions/code-style.md",
      "docs/instructions/linting-and-formatting.md",
      "docs/instructions/testing.md",
      "pkg.json",
      "playwright.config.ts",
      "pnpm-workspace.json",
      "scripts/check-docs.ts",
      "src/lib/cms/state.ts",
      "tests/e2e/smoke.spec.ts",
      "tests/unit/cms-state.test.ts",
      "vitest.config.ts",
    ]);
    expect((files.get(".githooks/pre-commit")?.mode ?? 0) & 0o111).toBeTruthy();
    // Verify AGENTS.md contains bare template tokens (not formatted to bold markdown)
    const agentsContent = files.get("AGENTS.md")!.contents.toString("utf8");
    expect(agentsContent).toContain(
      "__PROJECT_NAME__ is a __FRAMEWORK__ app that loads its content from __CMS__.",
    );
  });

  it("has docs that pass check-docs once framework and cms docs exist", async () => {
    const root = await makeTempDir();
    await cp(common, root, { recursive: true });
    await writeFile(join(root, "docs/instructions/framework.md"), "# Framework\n");
    await writeFile(join(root, "docs/instructions/cms.md"), "# CMS\n");
    expect(checkDocs(root).errors).toEqual([]);
  });

  it("defines the shared scripts and engines", async () => {
    const pkg = JSON.parse((await readLayer(common)).get("pkg.json")!.contents.toString("utf8"));
    expect(pkg.scripts.check).toBe(
      "pnpm lint && pnpm format && pnpm check-types && pnpm test && pnpm test:smoke && pnpm check:docs",
    );
    expect(pkg.engines).toEqual({ node: ">=24" });
    expect(pkg.devEngines.packageManager).toEqual({
      name: "pnpm",
      version: "^11.28.0",
      onFail: "download",
    });
    for (const version of Object.values<string>(pkg.devDependencies)) {
      expect(version).toMatch(/^\d+\.\d+\.\d+$/);
    }
  });
});
