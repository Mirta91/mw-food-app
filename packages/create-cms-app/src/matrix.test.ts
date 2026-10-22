import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { checkDocs } from "../templates/common/scripts/check-docs.ts";
import { allCombos, type Cms, comboId, type Framework } from "./choices.ts";
import { type FileEntry, planProject } from "./plan.ts";
import { sourceTemplatesDir } from "./paths.ts";
import { makeTempDir } from "./test-helpers.ts";
import { writeProject } from "./write.ts";

const REQUIRED = [
  ".env.example",
  ".githooks/pre-commit",
  ".gitignore",
  ".oxfmtrc.json",
  ".oxlintrc.json",
  "AGENTS.md",
  "README.md",
  "docs/instructions/cms.md",
  "docs/instructions/framework.md",
  "docs/instructions/code-style.md",
  "docs/instructions/linting-and-formatting.md",
  "docs/instructions/testing.md",
  "package.json",
  "playwright.config.ts",
  "pnpm-workspace.yaml",
  "scripts/check-docs.ts",
  "scripts/smoke.ts",
  "src/lib/cms/client.ts",
  "src/lib/cms/example.ts",
  "src/lib/utils/env.ts",
  "src/lib/utils/once.ts",
  "tests/e2e/smoke.spec.ts",
  "tests/unit/cms-client.test.ts",
  "tests/unit/cms-example.test.ts",
  "tests/unit/env.test.ts",
  "tests/unit/once.test.ts",
  "tsconfig.json",
  "vitest.config.ts",
];

const CMS_FILES: Record<Cms, string[]> = {
  sanity: [
    "cms/package.json",
    "cms/sanity.cli.ts",
    "cms/sanity.config.ts",
    "cms/schema-types/example.ts",
    "cms/migrations/001-create-example/index.ts",
  ],
  contentful: [
    "cms/content-types/example.ts",
    "cms/migrations/001-create-example.ts",
    "cms/migrate.ts",
  ],
  storyblok: [
    "cms/components/example.ts",
    "cms/migrations/001-create-example.ts",
    "cms/migrate.ts",
  ],
};

const ROUTE: Record<Framework, string> = {
  next: "src/app/page.tsx",
  nuxt: "src/pages/index.vue",
  astro: "src/pages/index.astro",
  sveltekit: "src/routes/+page.server.ts",
};

const SCRIPTS = [
  "dev",
  "build",
  "start",
  "lint",
  "lint:fix",
  "format",
  "format:fix",
  "check-types",
  "test",
  "test:watch",
  "test:smoke",
  "test:e2e",
  "check:docs",
  "check",
  "prepare",
  "cms:migrate",
];

function text(entries: FileEntry[], path: string): string {
  const entry = entries.find((item) => item.path === path);
  if (entry?.kind !== "file") {
    throw new Error(`missing ${path}`);
  }
  return entry.contents.toString("utf8");
}

describe.each(allCombos().map((combo) => ({ ...combo, id: comboId(combo) })))(
  "$id",
  ({ id, cms, framework }) => {
    const entries = () => planProject(sourceTemplatesDir, { name: id, cms, framework });

    it("contains the required files", async () => {
      const paths = (await entries()).map((entry) => entry.path);
      expect(paths).toEqual(
        expect.arrayContaining([...REQUIRED, ...CMS_FILES[cms], ROUTE[framework]]),
      );
      expect((await entries()).find((entry) => entry.path === "CLAUDE.md")).toEqual({
        kind: "symlink",
        path: "CLAUDE.md",
        target: "AGENTS.md",
      });
    });

    it("contains no skills, mise, lychee, .env or leftover tokens", async () => {
      for (const entry of await entries()) {
        expect(entry.path).not.toMatch(
          /^(\.env|mise\.toml|skills-lock\.json)$|^\.agents\/|^\.claude\//,
        );
        if (entry.kind === "file") {
          expect(entry.contents.toString("utf8"), entry.path).not.toMatch(
            /lychee|__PROJECT_NAME__|__CMS__|__FRAMEWORK__/i,
          );
        }
      }
    });

    it("contains no CMS state machine", async () => {
      for (const entry of await entries()) {
        if (entry.kind === "file") {
          expect(entry.contents.toString("utf8"), entry.path).not.toMatch(
            /describeCmsState|loadCmsState|CmsState|CmsStatus|data-cms-state|content states/,
          );
        }
      }
    });

    it("has a complete package.json with exact versions", async () => {
      const pkg = JSON.parse(text(await entries(), "package.json"));
      expect(pkg.name).toBe(id);
      expect(Object.keys(pkg.scripts)).toEqual(
        expect.arrayContaining(cms === "sanity" ? [...SCRIPTS, "cms:dev"] : SCRIPTS),
      );
      for (const version of Object.values<string>({
        ...pkg.dependencies,
        ...pkg.devDependencies,
      })) {
        expect(version).toMatch(/^\d+\.\d+\.\d+$/);
      }
      expect(pkg).toMatchSnapshot();
    });

    it("lists every required variable in .env.example", async () => {
      const all = await entries();
      const required =
        /requiredEnv = \[([^\]]*)\]/.exec(text(all, "src/lib/cms/client.ts"))?.[1] ?? "";
      const names = required.match(/[A-Z_]+/g) ?? [];
      expect(names).not.toHaveLength(0);
      for (const name of names) {
        expect(text(all, ".env.example")).toContain(`${name}=`);
      }
    });

    it("documents every .env.example variable and every cms script in the README", async () => {
      const all = await entries();
      const readme = text(all, "README.md");
      for (const name of text(all, ".env.example").match(/^[A-Z_]+(?==)/gm) ?? []) {
        expect(readme, name).toContain(`\`${name}\``);
      }
      const scripts = Object.keys(JSON.parse(text(all, "package.json")).scripts);
      for (const script of scripts.filter((name) => name.startsWith("cms:"))) {
        expect(readme, script).toContain(`pnpm ${script}`);
      }
    });

    it.runIf(cms === "sanity")(
      "declares the root styled-components version for the Studio",
      async () => {
        const all = await entries();
        const root = JSON.parse(text(all, "package.json"));
        const studio = JSON.parse(text(all, "cms/package.json"));
        expect(studio.name).toBe(`${id}-cms`);
        expect(studio.dependencies["styled-components"]).toBe(
          root.dependencies["styled-components"],
        );
      },
    );

    it("passes check-docs when written", async () => {
      const target = join(await makeTempDir(), id);
      await writeProject(target, await entries());
      expect(checkDocs(target).errors).toEqual([]);
      const readme = await readFile(join(target, "README.md"), "utf8");
      for (const [, link] of readme.matchAll(/\]\(([^)#:]+)\)/g)) {
        await expect(access(join(target, link ?? "")), link).resolves.toBeUndefined();
      }
      expect(await readFile(join(target, "CLAUDE.md"), "utf8")).toBe(
        await readFile(join(target, "AGENTS.md"), "utf8"),
      );
    });
  },
);
