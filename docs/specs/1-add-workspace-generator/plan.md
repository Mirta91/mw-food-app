# Workspace generator implementation plan

> This plan is the original execution record. The "Deviations after implementation" section of
> design.md lists what changed.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development
> (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use
> checkbox (`- [ ]`) syntax for tracking.

**Goal:** A generator, run with `npx` or `pnpm dlx` from this repository's git URL, that scaffolds
a single-package TypeScript project for one of 3 CMSs × 4 web frameworks, with lint, format,
types, Vitest, Playwright, an agent-ready `AGENTS.md` and a pre-commit hook.

**Architecture:** A TypeScript package `packages/create-cms-app` is bundled with esbuild into a
committed `dist/cli.mjs` plus a copy of its templates; the root `package.json` exposes it as `bin`.
Templates are four ordered layers (`common`, `frameworks/<fw>`, `cms/<cms>`,
`combos/<cms>-<fw>`): later layers replace whole files, `pkg.json` and `pnpm-workspace.json`
fragments are deep-merged. A pure `planProject()` turns choices into file entries; `writeProject()`
writes them atomically; `initRepository()` makes the initial commit.

**Tech Stack:** Node 24, TypeScript 6, esbuild, @clack/prompts, Vitest 5, oxlint, oxfmt, turbo;
templates: Next.js 16, Nuxt 4, Astro 7, SvelteKit 3, Sanity, Contentful, Storyblok, Playwright.

**Spec:** [task.md](task.md) (what) and [design.md](design.md) (how). Read both before starting.

## Global Constraints

- Everything is TypeScript: generator, templates, generated code. Config files only fall back to
  `.js` where the tool does not support `.ts`; say so in a comment in that file.
- Node: generator source runs with native type stripping (Node ≥ 24); relative imports in code
  that Node runs directly (generator `src/`, `scripts/`, `build.ts`, generated `scripts/` and
  `cms/` runners) use explicit `.ts` extensions. Framework app code uses extensionless imports.
- `erasableSyntaxOnly`: no enums, no namespaces, no constructor parameter properties.
- The generator bundle has no runtime dependencies; every import is a devDependency and bundled.
- Generated projects: `engines.node` is `">=24"`; `devEngines.packageManager` is
  `{ "name": "pnpm", "version": "^11.28.0", "onFail": "download" }`.
- Template dependency versions are exact (`"16.4.0"`, never `^`). Versions to use:
  next 16.4.0, react 19.3.0, react-dom 19.3.0, @types/react 19.3.0, @types/react-dom 19.3.0,
  nuxt 4.6.0, vue 3.5.43, vue-tsc 3.3.12, astro 7.3.7, @astrojs/node 11.1.7,
  @astrojs/check 0.9.10, @sveltejs/kit 3.0.1, @sveltejs/adapter-node 6.0.0,
  @sveltejs/vite-plugin-svelte 7.3.1, svelte 5.57.2, svelte-check 4.7.6, vite 8.3.3,
  typescript 6.0.3 (not 7: svelte-check and @astrojs/check support ≤ 6), vitest 5.0.3,
  @playwright/test 1.64.0, oxlint 1.87.0, oxfmt 0.72.0, @types/node 24.19.1, sanity 6.18.0,
  @sanity/client 8.9.0, next-sanity 13.3.4, @nuxtjs/sanity 2.5.0, @sanity/astro 3.5.1,
  styled-components 6.5.3, contentful 11.12.10, contentful-migration 5.1.1,
  contentful-management 12.19.0, @storyblok/react 7.3.1, @storyblok/nuxt 11.2.1,
  @storyblok/astro 10.3.2, @storyblok/svelte 7.3.2.
- `@sanity/sveltekit` only supports SvelteKit 2, so `sanity-sveltekit` uses `@sanity/client`.
- pnpm 11 fails `pnpm install` on unapproved dependency build scripts. Approvals go into
  `allowBuilds` (this repository: `pnpm-workspace.yaml`; templates: `pnpm-workspace.json`
  fragments). When pnpm prints `ERR_PNPM_IGNORED_BUILDS`, add each named package with `true`
  (needed at runtime or build time) or `false` (not needed) and re-run.
- No CMS credentials anywhere; generator writes `.env.example`, never `.env`.
- Generated projects contain no agent skills, no `mise.toml`, no lychee.
- Every generated route renders a root element with `data-cms-state` set to `example`, `empty`,
  `missing-env` or `error`, using `describeCmsState()` text. It never throws.
- Env variable names (exact): Sanity `SANITY_PROJECT_ID`, `SANITY_DATASET`; Contentful
  `CONTENTFUL_SPACE_ID`, `CONTENTFUL_ACCESS_TOKEN`, optional `CONTENTFUL_ENVIRONMENT`,
  migration-only `CONTENTFUL_MANAGEMENT_TOKEN`; Storyblok `STORYBLOK_ACCESS_TOKEN`, optional
  `STORYBLOK_REGION`, migration-only `STORYBLOK_SPACE_ID`, `STORYBLOK_PERSONAL_ACCESS_TOKEN`.
- This repository's rules apply to every task: [AGENTS.md](../../../AGENTS.md) definition of
  done (`pnpm check` passes, docs updated in the same step), tests next to code as
  `<name>.test.ts`, `vitest: "catalog:"`, read the bundled turbo docs before changing turbo config.

## Review Focus

1. **Project name that is not a safe directory name** (`My App`, `../x`, `a/b`, `.hidden`, empty):
   the prompt rejects it inline and nothing is written. Test: Task 2.
2. **Target path exists as a regular file**, not a directory: treated like a non-empty target,
   exit 1, the file is unchanged. Test: Task 4.
3. **Credentials present but wrong, or CMS unreachable**: the demo route renders the `error` state
   with the SDK's message instead of crashing or returning 500. Test: Task 8 (`cms-state.test.ts`).
4. **git installed but no `user.name`/`user.email`**: commit fails, generator warns with a hint,
   exits 0, files are written and staged. Test: Task 5 and Task 6.
5. **Generator started without a TTY** (piped stdin, CI): prints that it needs an interactive
   terminal and exits 1 instead of hanging. Test: Task 6; Task 1 verifies it through the git URL.

---

### Task 1: Generator package skeleton and git-URL distribution

Proves the riskiest assumption first: a committed bundle runs through `npx` and `pnpm dlx` from a
git URL, and installing it neither installs dev dependencies nor touches git config.

**Files:**

- Create: `packages/create-cms-app/package.json`
- Create: `packages/create-cms-app/tsconfig.json`
- Create: `packages/create-cms-app/turbo.json`
- Create: `packages/create-cms-app/build.ts`
- Create: `packages/create-cms-app/src/main.ts`
- Create: `packages/create-cms-app/scripts/verify-git-install.sh`
- Create: `scripts/check-bundle.mjs`
- Create: `docs/instructions/generator.md`
- Create (built): `packages/create-cms-app/dist/cli.mjs`
- Modify: `package.json`, `pnpm-workspace.yaml`, `.gitignore`, `.oxlintrc.json`, `.oxfmtrc.json`,
  `AGENTS.md`

**Interfaces:**

- Produces: `pnpm build` writes `packages/create-cms-app/dist/cli.mjs` (executable, shebang) and
  `packages/create-cms-app/dist/templates/**` (copy of `templates/`). `pnpm check:bundle` fails
  when `dist/` differs from the git index. Later tasks replace `src/main.ts`.

- [ ] **Step 1: Read the turbo docs**

Run: `node -p "require('path').dirname(require.resolve('turbo/package.json'))"` and read
`docs/README.md` plus the pages on package configurations (`extends`) and task `inputs` in that
directory. Confirm that a package `turbo.json` with `"extends": ["//"]` can override
`build.inputs`.

- [ ] **Step 2: Create the package**

`packages/create-cms-app/package.json`:

```json
{
  "name": "@cms-hackathon-setup/create-cms-app",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "node build.ts",
    "check-types": "tsc --noEmit",
    "test": "vitest run --passWithNoTests",
    "test:watch": "vitest --watch"
  },
  "devDependencies": {
    "@clack/prompts": "1.8.1",
    "@types/node": "24.19.1",
    "esbuild": "0.28.2",
    "typescript": "6.0.3",
    "vitest": "catalog:"
  }
}
```

`packages/create-cms-app/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "es2024",
    "lib": ["es2024"],
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "strict": true,
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "erasableSyntaxOnly": true,
    "verbatimModuleSyntax": true,
    "skipLibCheck": true,
    "types": ["node"]
  },
  "include": ["src", "scripts", "build.ts"]
}
```

`packages/create-cms-app/turbo.json` (the bundle is committed, so tracked `dist/` files must not
count as build inputs):

```json
{
  "$schema": "https://turborepo.com/schema.json",
  "extends": ["//"],
  "tasks": {
    "build": {
      "inputs": ["build.ts", "package.json", "src/**", "!src/**/*.test.ts", "templates/**"],
      "outputs": ["dist/**"]
    }
  }
}
```

`packages/create-cms-app/build.ts`:

```ts
// Bundles the CLI with all dependencies into dist/cli.mjs and copies the templates next to it.
// dist/ is committed: npx and pnpm dlx run it straight from the git URL without a build step.
import { build } from "esbuild";
import { chmod, cp, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

const root = import.meta.dirname;
const dist = join(root, "dist");

await rm(dist, { recursive: true, force: true });
await build({
  entryPoints: [join(root, "src/main.ts")],
  outfile: join(dist, "cli.mjs"),
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node24",
  legalComments: "none",
  // Bundled CommonJS dependencies call require() for Node built-ins.
  banner: {
    js: "#!/usr/bin/env node\nimport { createRequire } from 'node:module';\nconst require = createRequire(import.meta.url);",
  },
});
await chmod(join(dist, "cli.mjs"), 0o755);
await mkdir(join(root, "templates"), { recursive: true });
await cp(join(root, "templates"), join(dist, "templates"), { recursive: true });
```

`packages/create-cms-app/src/main.ts` (temporary; Task 6 replaces it):

```ts
if (!process.stdin.isTTY || !process.stdout.isTTY) {
  console.error("create-cms-app needs an interactive terminal.");
  process.exitCode = 1;
} else {
  console.log("create-cms-app");
}
```

Create `packages/create-cms-app/templates/.gitkeep` (empty) so `templates/` exists in git.

- [ ] **Step 3: Wire the root**

In `package.json`: remove `"prepare"`, then add/replace:

```json
{
  "bin": { "create-cms-app": "packages/create-cms-app/dist/cli.mjs" },
  "files": ["packages/create-cms-app/dist"],
  "engines": { "node": ">=24" },
  "scripts": {
    "postinstall": "test -d .githooks && git config core.hooksPath .githooks || true",
    "check": "turbo run lint format check-types test build && pnpm check:bundle && pnpm check:docs",
    "check:bundle": "node scripts/check-bundle.mjs",
    "verify:git-install": "sh packages/create-cms-app/scripts/verify-git-install.sh"
  }
}
```

Keep every other existing script. `postinstall` replaces `prepare` because npm installs all
devDependencies of a git dependency and runs its `prepare`; in a git install `.githooks/` is not
packed, so `postinstall` does nothing there.

`pnpm-workspace.yaml`, append:

```yaml
allowBuilds:
  esbuild: true
```

`.gitignore`, append after `dist/`:

```
!packages/create-cms-app/dist/
```

`.oxlintrc.json`, add `"ignorePatterns": ["packages/create-cms-app/templates/**", "packages/create-cms-app/dist/**"]`.
`.oxfmtrc.json`, extend `ignorePatterns` with the same two globs.

`scripts/check-bundle.mjs`:

```js
// Fails when the committed generator bundle differs from the fresh build in the working tree.
// Runs after `turbo run build` in `pnpm check`, so the pre-commit hook rejects a stale bundle.
import { execFileSync } from "node:child_process";

const dist = "packages/create-cms-app/dist";
const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
const changed = [
  git("diff", "--name-only", "--", dist),
  git("ls-files", "--others", "--exclude-standard", "--", dist),
].filter(Boolean);

if (changed.length > 0) {
  console.error(`error: ${dist} is out of date or not staged:\n${changed.join("\n")}`);
  console.error(`Run \`pnpm build\` and \`git add ${dist}\`.`);
  process.exit(1);
}
console.log("Generator bundle OK");
```

- [ ] **Step 4: Write the git-install verification**

`packages/create-cms-app/scripts/verify-git-install.sh`:

```sh
#!/bin/sh
# Verifies that the committed bundle runs through npx and pnpm dlx from a git URL, and that a git
# install packs only the bundle. Uses a bare clone of HEAD, so commit before running.
set -eu
repo_root=$(git rev-parse --show-toplevel)
work=$(mktemp -d)
trap 'rm -rf "$work"' EXIT
git clone --quiet --bare "$repo_root" "$work/repo.git"
url="git+file://$work/repo.git"
hooks_before=$(git -C "$repo_root" config --get core.hooksPath || true)

expect_tty_error() {
  label=$1
  shift
  if out=$("$@" </dev/null 2>&1); then
    echo "FAIL $label: exited 0"
    exit 1
  fi
  case $out in
    *"needs an interactive terminal"*) echo "ok   $label" ;;
    *) echo "FAIL $label:" && echo "$out" && exit 1 ;;
  esac
}

cd "$work"
expect_tty_error "npx" npx --yes "$url"
expect_tty_error "pnpm dlx" pnpm dlx "$url"

mkdir install && cd install
npm init -y >/dev/null
npm install --no-audit --no-fund "$url" >/dev/null
pkg=node_modules/cms-hackathon-setup
test -x "$pkg/packages/create-cms-app/dist/cli.mjs" || { echo "FAIL bundle missing or not executable"; exit 1; }
extra=$(ls node_modules | grep -v -e '^cms-hackathon-setup$' -e '^\.' || true)
test -z "$extra" || { echo "FAIL npm installed other packages: $extra"; exit 1; }
for file in ${VERIFY_TEMPLATE_FILES:-}; do
  test -e "$pkg/packages/create-cms-app/dist/templates/$file" || { echo "FAIL template file not packed: $file"; exit 1; }
done
echo "ok   npm install packs only the bundle"

hooks_after=$(git -C "$repo_root" config --get core.hooksPath || true)
test "$hooks_before" = "$hooks_after" || { echo "FAIL core.hooksPath changed"; exit 1; }
echo "ok   git config untouched"
```

- [ ] **Step 5: Install, build, check**

Run: `pnpm install && pnpm build && pnpm build`
Expected: install succeeds without `ERR_PNPM_IGNORED_BUILDS`; second build reports
`FULL TURBO` for `@cms-hackathon-setup/create-cms-app#build`; `git config core.hooksPath` prints
`.githooks`.

Run: `pnpm check:bundle`
Expected: FAIL listing `packages/create-cms-app/dist/cli.mjs` (not staged yet).

Run: `git add packages/create-cms-app package.json pnpm-workspace.yaml pnpm-lock.yaml .gitignore .oxlintrc.json .oxfmtrc.json scripts/check-bundle.mjs && pnpm check:bundle`
Expected: `Generator bundle OK`.

- [ ] **Step 6: Document**

Create `docs/instructions/generator.md`:

```md
# Generator

The generator lives in `packages/create-cms-app`. Users run it from the git URL of this
repository; there is no publish step.

## Distribution

- npx and pnpm dlx install the repository root as a package. The root `package.json` therefore
  carries the generator's `bin` and `files`. Keep both pointing at `packages/create-cms-app/dist`.
- `packages/create-cms-app/dist/` is committed. After changing `src/` or `templates/`, run
  `pnpm build` and stage `dist/`; `pnpm check` fails while the bundle is stale or unstaged.
- The bundle has no runtime dependencies. Add libraries the CLI imports as devDependencies; esbuild
  inlines them.
- Do not add a `prepare` script to the root `package.json`. npm would install all dev
  dependencies and run it on every `npx` call. Git hooks are activated in `postinstall`.
- After changing anything above, commit and run `pnpm verify:git-install`.
```

In `AGENTS.md`:

- Layout: add `- \`packages/create-cms-app/\` — the generator; its \`dist/\` is committed.`
- Tools and commands table: change the `pnpm check` row purpose to
  `Run lint, format, check-types, test, build, check:bundle and check:docs; runs as pre-commit hook`,
  and add a row `| \`pnpm verify:git-install\` | Check that the committed bundle runs from a git URL |`.
- Instruction files: add
  `- [Generator](docs/instructions/generator.md) — before changing the generator, its templates or how it is distributed`.

Run: `pnpm format:fix && pnpm check`
Expected: PASS.

- [ ] **Step 7: Commit and verify the distribution**

```bash
git add -A packages/create-cms-app docs/instructions/generator.md AGENTS.md package.json pnpm-lock.yaml pnpm-workspace.yaml .gitignore .oxlintrc.json .oxfmtrc.json scripts/check-bundle.mjs
git commit -m "feat(create-cms-app): add committed bundle runnable from git URL"
pnpm verify:git-install
```

Expected: `ok   npx`, `ok   pnpm dlx`, `ok   npm install packs only the bundle`,
`ok   git config untouched`.

If `pnpm dlx` fails on `git+file://`, retry with `pnpm dlx "file://$work/repo.git"` style URLs and
record the working form in `generator.md`. If npm installs other packages, check that no root
lifecycle script except `postinstall` exists. Do not continue to Task 2 until all four lines pass;
if one cannot pass, stop and report which and why.

---

### Task 2: Choices and project name validation

**Files:**

- Create: `packages/create-cms-app/src/choices.ts`
- Test: `packages/create-cms-app/src/choices.test.ts`

**Interfaces:**

- Produces:
  - `CMS_OPTIONS`, `FRAMEWORK_OPTIONS`: readonly `{ value, label }[]`
  - `type Cms = "sanity" | "contentful" | "storyblok"`,
    `type Framework = "next" | "nuxt" | "astro" | "sveltekit"`
  - `interface Combo { cms: Cms; framework: Framework }`,
    `interface Choices extends Combo { name: string }`
  - `comboId(combo: Combo): string` → `"sanity-next"`
  - `allCombos(): Combo[]` (12, CMS-major order)
  - `cmsLabel(cms: Cms): string`, `frameworkLabel(framework: Framework): string`
  - `validateProjectName(name: string | undefined): string | undefined` (error text or undefined)

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @cms-hackathon-setup/create-cms-app test`
Expected: FAIL, cannot resolve `./choices.ts`.

- [ ] **Step 3: Implement**

```ts
export const CMS_OPTIONS = [
  { value: "sanity", label: "Sanity" },
  { value: "contentful", label: "Contentful" },
  { value: "storyblok", label: "Storyblok" },
] as const;

export const FRAMEWORK_OPTIONS = [
  { value: "next", label: "Next.js" },
  { value: "nuxt", label: "Nuxt" },
  { value: "astro", label: "Astro" },
  { value: "sveltekit", label: "SvelteKit" },
] as const;

export type Cms = (typeof CMS_OPTIONS)[number]["value"];
export type Framework = (typeof FRAMEWORK_OPTIONS)[number]["value"];

export interface Combo {
  cms: Cms;
  framework: Framework;
}

export interface Choices extends Combo {
  name: string;
}

export function comboId(combo: Combo): string {
  return `${combo.cms}-${combo.framework}`;
}

export function allCombos(): Combo[] {
  return CMS_OPTIONS.flatMap((cms) =>
    FRAMEWORK_OPTIONS.map((framework) => ({ cms: cms.value, framework: framework.value })),
  );
}

export function cmsLabel(cms: Cms): string {
  return CMS_OPTIONS.find((option) => option.value === cms)?.label ?? cms;
}

export function frameworkLabel(framework: Framework): string {
  return FRAMEWORK_OPTIONS.find((option) => option.value === framework)?.label ?? framework;
}

// The name is both the target directory and the package.json name, so it must be a valid npm
// package name that cannot escape the current directory.
const PROJECT_NAME = /^[a-z0-9][a-z0-9-]*$/;

export function validateProjectName(name: string | undefined): string | undefined {
  if (!name) return "Enter a project name.";
  if (name.length > 214) return "Use at most 214 characters.";
  if (!PROJECT_NAME.test(name)) {
    return "Use lowercase letters, digits and '-', starting with a letter or digit.";
  }
  return undefined;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @cms-hackathon-setup/create-cms-app test`
Expected: PASS.

- [ ] **Step 5: Commit**

Run: `pnpm format:fix && pnpm check` (expected PASS; bundle unchanged because `main.ts` does not
import `choices.ts` yet).

```bash
git add packages/create-cms-app/src
git commit -m "feat(create-cms-app): add choices and project name validation"
```

---

### Task 3: Template layers and project plan

**Files:**

- Create: `packages/create-cms-app/src/layers.ts`
- Create: `packages/create-cms-app/src/plan.ts`
- Create: `packages/create-cms-app/src/test-helpers.ts`
- Test: `packages/create-cms-app/src/layers.test.ts`, `packages/create-cms-app/src/plan.test.ts`
- Modify: `docs/instructions/generator.md`

**Interfaces:**

- Consumes: `Choices`, `Combo`, `cmsLabel`, `frameworkLabel` from Task 2.
- Produces:
  - `layers.ts`: `type JsonValue`, `type JsonObject`, `interface TemplateFile { contents: Buffer; mode: number }`,
    `layerDirs(templatesDir: string, combo: Combo): string[]` (throws `Template layer missing: <rel>`),
    `readLayer(dir: string): Promise<Map<string, TemplateFile>>` (posix relative paths),
    `deepMerge(base: JsonObject, overlay: JsonObject): JsonObject`,
    `outputPath(templatePath: string): string`, `renderYaml(value: JsonObject): string`,
    `PKG_FRAGMENT = "pkg.json"`, `WORKSPACE_FRAGMENT = "pnpm-workspace.json"`
  - `plan.ts`: `type FileEntry = { kind: "file"; path: string; contents: Buffer; mode: number } | { kind: "symlink"; path: string; target: string }`,
    `planProject(templatesDir: string, choices: Choices): Promise<FileEntry[]>` (sorted by path)
  - `test-helpers.ts`: `makeTempDir(): Promise<string>`,
    `writeTree(root: string, files: Record<string, string | { contents: string; mode: number }>): Promise<void>`

- [ ] **Step 1: Write the test helpers**

```ts
import { chmod, mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

export async function makeTempDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), "create-cms-app-"));
}

export async function writeTree(
  root: string,
  files: Record<string, string | { contents: string; mode: number }>,
): Promise<void> {
  for (const [path, value] of Object.entries(files)) {
    const file = join(root, path);
    await mkdir(dirname(file), { recursive: true });
    const { contents, mode } = typeof value === "string" ? { contents: value, mode: 0o644 } : value;
    await writeFile(file, contents);
    await chmod(file, mode);
  }
}
```

- [ ] **Step 2: Write the failing tests**

`layers.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { deepMerge, outputPath, renderYaml } from "./layers.ts";

describe("deepMerge", () => {
  it("merges objects, later scalars win, arrays are replaced", () => {
    const merged = deepMerge(
      { name: "a", scripts: { lint: "oxlint", test: "vitest" }, files: ["a"] },
      { scripts: { test: "vitest run", dev: "next dev" }, files: ["b"] },
    );
    expect(merged).toEqual({
      name: "a",
      scripts: { lint: "oxlint", test: "vitest run", dev: "next dev" },
      files: ["b"],
    });
  });
});

describe("outputPath", () => {
  it("renames _gitignore at any depth and keeps other names", () => {
    expect(outputPath("_gitignore")).toBe(".gitignore");
    expect(outputPath("cms/_gitignore")).toBe("cms/.gitignore");
    expect(outputPath("src/app/page.tsx")).toBe("src/app/page.tsx");
  });
});

describe("renderYaml", () => {
  it("renders nested maps and quotes keys that need it", () => {
    expect(renderYaml({ allowBuilds: { esbuild: true, "@parcel/watcher": false } })).toBe(
      'allowBuilds:\n  esbuild: true\n  "@parcel/watcher": false\n',
    );
  });

  it("renders an empty map inline", () => {
    expect(renderYaml({ allowBuilds: {} })).toBe("allowBuilds: {}\n");
  });

  it("rejects arrays", () => {
    expect(() => renderYaml({ list: ["a"] })).toThrow(/arrays/);
  });
});
```

`plan.test.ts`:

```ts
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
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm --filter @cms-hackathon-setup/create-cms-app test`
Expected: FAIL, cannot resolve `./layers.ts` / `./plan.ts`.

- [ ] **Step 4: Implement `layers.ts`**

```ts
import { existsSync } from "node:fs";
import { readFile, readdir, stat } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import type { Combo } from "./choices.ts";

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export interface TemplateFile {
  contents: Buffer;
  mode: number;
}

export const PKG_FRAGMENT = "pkg.json";
export const WORKSPACE_FRAGMENT = "pnpm-workspace.json";

// Layers in application order; a later layer replaces files of an earlier one.
export function layerDirs(templatesDir: string, combo: Combo): string[] {
  const dirs = [
    join(templatesDir, "common"),
    join(templatesDir, "frameworks", combo.framework),
    join(templatesDir, "cms", combo.cms),
    join(templatesDir, "combos", `${combo.cms}-${combo.framework}`),
  ];
  for (const dir of dirs) {
    if (!existsSync(dir)) throw new Error(`Template layer missing: ${relative(templatesDir, dir)}`);
  }
  return dirs;
}

export async function readLayer(dir: string): Promise<Map<string, TemplateFile>> {
  const files = new Map<string, TemplateFile>();
  for (const entry of await readdir(dir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) continue;
    const absolute = join(entry.parentPath, entry.name);
    const [contents, info] = await Promise.all([readFile(absolute), stat(absolute)]);
    files.set(relative(dir, absolute).split(sep).join("/"), { contents, mode: info.mode & 0o777 });
  }
  return files;
}

function isObject(value: JsonValue | undefined): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function deepMerge(base: JsonObject, overlay: JsonObject): JsonObject {
  const merged: JsonObject = { ...base };
  for (const [key, value] of Object.entries(overlay)) {
    const previous = merged[key];
    merged[key] = isObject(previous) && isObject(value) ? deepMerge(previous, value) : value;
  }
  return merged;
}

// Template files that npm or git would treat specially are stored under another name.
export function outputPath(templatePath: string): string {
  const parts = templatePath.split("/");
  const name = parts.pop();
  return [...parts, name === "_gitignore" ? ".gitignore" : name].join("/");
}

// Minimal YAML for pnpm settings: nested maps of scalars.
export function renderYaml(value: JsonObject, indent = ""): string {
  let out = "";
  for (const [rawKey, item] of Object.entries(value)) {
    const key = /^[A-Za-z0-9_-]+$/.test(rawKey) ? rawKey : JSON.stringify(rawKey);
    if (Array.isArray(item)) throw new Error(`renderYaml does not support arrays (key ${rawKey})`);
    if (isObject(item)) {
      out +=
        Object.keys(item).length === 0
          ? `${indent}${key}: {}\n`
          : `${indent}${key}:\n${renderYaml(item, `${indent}  `)}`;
    } else {
      out += `${indent}${key}: ${typeof item === "string" ? JSON.stringify(item) : String(item)}\n`;
    }
  }
  return out;
}
```

- [ ] **Step 5: Implement `plan.ts`**

```ts
import { join, relative } from "node:path";
import { type Choices, cmsLabel, frameworkLabel } from "./choices.ts";
import {
  deepMerge,
  type JsonObject,
  layerDirs,
  outputPath,
  PKG_FRAGMENT,
  readLayer,
  renderYaml,
  type TemplateFile,
  WORKSPACE_FRAGMENT,
} from "./layers.ts";

export type FileEntry =
  | { kind: "file"; path: string; contents: Buffer; mode: number }
  | { kind: "symlink"; path: string; target: string };

function replaceTokens(contents: Buffer, tokens: Record<string, string>): Buffer {
  if (contents.includes(0)) return contents; // binary file
  let text = contents.toString("utf8");
  for (const [token, value] of Object.entries(tokens)) text = text.replaceAll(token, value);
  return Buffer.from(text, "utf8");
}

function parseFragment(file: TemplateFile, path: string): JsonObject {
  try {
    return JSON.parse(file.contents.toString("utf8")) as JsonObject;
  } catch (error) {
    throw new Error(`Invalid JSON in template ${path}: ${(error as Error).message}`);
  }
}

export async function planProject(templatesDir: string, choices: Choices): Promise<FileEntry[]> {
  const tokens = {
    __PROJECT_NAME__: choices.name,
    __CMS__: cmsLabel(choices.cms),
    __FRAMEWORK__: frameworkLabel(choices.framework),
  };
  const files = new Map<string, TemplateFile>();
  let pkg: JsonObject = {};
  let workspace: JsonObject = {};

  for (const dir of layerDirs(templatesDir, choices)) {
    for (const [path, file] of await readLayer(dir)) {
      const source = relative(templatesDir, join(dir, path));
      if (path === PKG_FRAGMENT) pkg = deepMerge(pkg, parseFragment(file, source));
      else if (path === WORKSPACE_FRAGMENT)
        workspace = deepMerge(workspace, parseFragment(file, source));
      else files.set(outputPath(path), file);
    }
  }

  const entries: FileEntry[] = [...files].map(([path, file]) => ({
    kind: "file",
    path,
    contents: replaceTokens(file.contents, tokens),
    mode: file.mode,
  }));
  if (Object.keys(pkg).length > 0) {
    const json = Buffer.from(`${JSON.stringify(pkg, null, 2)}\n`);
    entries.push({
      kind: "file",
      path: "package.json",
      contents: replaceTokens(json, tokens),
      mode: 0o644,
    });
  }
  if (Object.keys(workspace).length > 0) {
    entries.push({
      kind: "file",
      path: "pnpm-workspace.yaml",
      contents: Buffer.from(renderYaml(workspace)),
      mode: 0o644,
    });
  }
  if (files.has("AGENTS.md"))
    entries.push({ kind: "symlink", path: "CLAUDE.md", target: "AGENTS.md" });

  return entries.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm --filter @cms-hackathon-setup/create-cms-app test`
Expected: PASS. Then `pnpm --filter @cms-hackathon-setup/create-cms-app check-types`: PASS.

- [ ] **Step 7: Document the layer rules**

Append to `docs/instructions/generator.md`:

```md
## Templates

- Layers apply in the order `templates/common`, `frameworks/<framework>`, `cms/<cms>`,
  `combos/<cms>-<framework>`. A later layer replaces a whole file of an earlier one; there is no
  partial patching. Put a file in the lowest layer it is the same for.
- `pkg.json` and `pnpm-workspace.json` at a layer root are fragments: objects are deep-merged,
  scalars and arrays of later layers replace earlier ones. They become `package.json` and
  `pnpm-workspace.yaml`.
- Store `.gitignore` as `_gitignore`.
- Text files may use the tokens `__PROJECT_NAME__`, `__CMS__` and `__FRAMEWORK__` (display
  labels). No other templating.
- Pin template dependencies to exact versions. Bump them by hand and run `pnpm test:matrix`.
- Templates are excluded from this repository's lint, format and type checks; `pnpm test:matrix`
  validates them inside generated projects.
```

- [ ] **Step 8: Commit**

Run: `pnpm format:fix && pnpm check` → PASS.

```bash
git add packages/create-cms-app/src docs/instructions/generator.md
git commit -m "feat(create-cms-app): plan project files from template layers"
```

---

### Task 4: Atomic write

**Files:**

- Create: `packages/create-cms-app/src/write.ts`
- Test: `packages/create-cms-app/src/write.test.ts`

**Interfaces:**

- Consumes: `FileEntry` (Task 3), `makeTempDir`, `writeTree` (Task 3).
- Produces:
  - `class TargetNotEmptyError extends Error { readonly target: string }`
  - `assertTargetUsable(target: string): Promise<void>` — resolves when `target` is missing or an
    empty directory; throws `TargetNotEmptyError` otherwise.
  - `writeProject(target: string, entries: FileEntry[], options?: { symlink?: (target: string, path: string) => Promise<void> }): Promise<{ symlinkFallback: boolean }>`

- [ ] **Step 1: Write the failing test**

```ts
import { lstat, mkdir, readFile, readdir, readlink, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import type { FileEntry } from "./plan.ts";
import { makeTempDir } from "./test-helpers.ts";
import { assertTargetUsable, TargetNotEmptyError, writeProject } from "./write.ts";

const entries: FileEntry[] = [
  { kind: "file", path: "AGENTS.md", contents: Buffer.from("# agents\n"), mode: 0o644 },
  { kind: "symlink", path: "CLAUDE.md", target: "AGENTS.md" },
  { kind: "file", path: ".githooks/pre-commit", contents: Buffer.from("#!/bin/sh\n"), mode: 0o755 },
];

let parent: string;
let target: string;

beforeEach(async () => {
  parent = await makeTempDir();
  target = join(parent, "my-app");
});

async function leftovers(): Promise<string[]> {
  return (await readdir(parent)).filter((name) => name.includes(".tmp-"));
}

describe("writeProject", () => {
  it("writes files, modes and the symlink", async () => {
    const result = await writeProject(target, entries);
    expect(result.symlinkFallback).toBe(false);
    expect(await readFile(join(target, "AGENTS.md"), "utf8")).toBe("# agents\n");
    expect(await readlink(join(target, "CLAUDE.md"))).toBe("AGENTS.md");
    expect((await stat(join(target, ".githooks/pre-commit"))).mode & 0o111).toBeTruthy();
    expect(await leftovers()).toEqual([]);
  });

  it("accepts an existing empty directory", async () => {
    await mkdir(target);
    await writeProject(target, entries);
    expect(await readFile(join(target, "AGENTS.md"), "utf8")).toBe("# agents\n");
  });

  it("refuses a non-empty directory and leaves it unchanged", async () => {
    await mkdir(target);
    await writeFile(join(target, "keep.txt"), "mine");
    await expect(writeProject(target, entries)).rejects.toBeInstanceOf(TargetNotEmptyError);
    expect(await readdir(target)).toEqual(["keep.txt"]);
    expect(await leftovers()).toEqual([]);
  });

  it("refuses a target that is a file and leaves it unchanged", async () => {
    await writeFile(target, "a file");
    await expect(assertTargetUsable(target)).rejects.toBeInstanceOf(TargetNotEmptyError);
    await expect(writeProject(target, entries)).rejects.toBeInstanceOf(TargetNotEmptyError);
    expect(await readFile(target, "utf8")).toBe("a file");
  });

  it("removes partial output when a write fails", async () => {
    const broken: FileEntry[] = [
      { kind: "file", path: "a", contents: Buffer.from("file"), mode: 0o644 },
      { kind: "file", path: "a/b", contents: Buffer.from("needs a to be a dir"), mode: 0o644 },
    ];
    await expect(writeProject(target, broken)).rejects.toThrow();
    await expect(lstat(target)).rejects.toThrow();
    expect(await leftovers()).toEqual([]);
  });

  it("copies the link target when symlinks are not permitted", async () => {
    const result = await writeProject(target, entries, {
      symlink: async () => {
        throw Object.assign(new Error("not permitted"), { code: "EPERM" });
      },
    });
    expect(result.symlinkFallback).toBe(true);
    expect(await readFile(join(target, "CLAUDE.md"), "utf8")).toBe("# agents\n");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @cms-hackathon-setup/create-cms-app test`
Expected: FAIL, cannot resolve `./write.ts`.

- [ ] **Step 3: Implement**

```ts
import {
  chmod,
  copyFile,
  lstat,
  mkdir,
  mkdtemp,
  readdir,
  rename,
  rm,
  rmdir,
  symlink,
  writeFile,
} from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import type { FileEntry } from "./plan.ts";

export class TargetNotEmptyError extends Error {
  readonly target: string;

  constructor(target: string) {
    super(`${target} already exists and is not empty`);
    this.name = "TargetNotEmptyError";
    this.target = target;
  }
}

function isMissing(error: unknown): boolean {
  return (error as NodeJS.ErrnoException).code === "ENOENT";
}

export async function assertTargetUsable(target: string): Promise<void> {
  let info;
  try {
    info = await lstat(target);
  } catch (error) {
    if (isMissing(error)) return;
    throw error;
  }
  if (!info.isDirectory() || (await readdir(target)).length > 0)
    throw new TargetNotEmptyError(target);
}

// Writes into a sibling temporary directory and renames it into place, so a failure never leaves
// a partial project behind.
export async function writeProject(
  target: string,
  entries: FileEntry[],
  options: { symlink?: (target: string, path: string) => Promise<void> } = {},
): Promise<{ symlinkFallback: boolean }> {
  const link = options.symlink ?? symlink;
  await assertTargetUsable(target);
  const temp = await mkdtemp(join(dirname(target), `.${basename(target)}.tmp-`));
  let symlinkFallback = false;
  try {
    for (const entry of entries) {
      if (entry.kind !== "file") continue;
      const file = join(temp, ...entry.path.split("/"));
      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, entry.contents);
      await chmod(file, entry.mode);
    }
    for (const entry of entries) {
      if (entry.kind !== "symlink") continue;
      const file = join(temp, ...entry.path.split("/"));
      await mkdir(dirname(file), { recursive: true });
      try {
        await link(entry.target, file);
      } catch {
        symlinkFallback = true;
        await copyFile(join(dirname(file), entry.target), file);
      }
    }
    await rmdir(target).catch((error: unknown) => {
      if (!isMissing(error)) throw error;
    });
    await rename(temp, target);
  } catch (error) {
    await rm(temp, { recursive: true, force: true });
    throw error;
  }
  return { symlinkFallback };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @cms-hackathon-setup/create-cms-app test && pnpm --filter @cms-hackathon-setup/create-cms-app check-types`
Expected: PASS.

- [ ] **Step 5: Commit**

Run: `pnpm format:fix && pnpm check` → PASS.

```bash
git add packages/create-cms-app/src
git commit -m "feat(create-cms-app): write projects atomically"
```

---

### Task 5: Git repository and initial commit

**Files:**

- Create: `packages/create-cms-app/src/git.ts`
- Test: `packages/create-cms-app/src/git.test.ts`

**Interfaces:**

- Produces:
  - `type Exec = (command: string, args: string[], options: { cwd: string }) => Promise<void>`
    (rejects on non-zero exit; rejection may carry `stderr: string`)
  - `execFileExec: Exec`
  - `type GitResult = { status: "committed" } | { status: "git-missing" } | { status: "commit-failed"; message: string }`
  - `initRepository(dir: string, exec?: Exec): Promise<GitResult>`

- [ ] **Step 1: Write the failing test**

```ts
import { execFileSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it, vi } from "vitest";
import { type Exec, initRepository } from "./git.ts";
import { makeTempDir } from "./test-helpers.ts";

function recordingExec(fail?: (args: string[]) => Error | undefined): {
  exec: Exec;
  calls: string[];
} {
  const calls: string[] = [];
  const exec: Exec = async (command, args) => {
    calls.push([command, ...args].join(" "));
    const error = fail?.(args);
    if (error) throw error;
  };
  return { exec, calls };
}

describe("initRepository", () => {
  it("initializes, stages everything and commits", async () => {
    const { exec, calls } = recordingExec();
    expect(await initRepository("/project", exec)).toEqual({ status: "committed" });
    expect(calls).toEqual([
      "git --version",
      "git init -b main",
      "git add -A",
      "git commit --no-verify -m chore: initial project",
    ]);
  });

  it("reports git as missing without running anything else", async () => {
    const { exec, calls } = recordingExec(() =>
      Object.assign(new Error("spawn git ENOENT"), { code: "ENOENT" }),
    );
    expect(await initRepository("/project", exec)).toEqual({ status: "git-missing" });
    expect(calls).toEqual(["git --version"]);
  });

  it("reports a failed commit with git's message", async () => {
    const { exec } = recordingExec((args) =>
      args[0] === "commit"
        ? Object.assign(new Error("Command failed"), { stderr: "Author identity unknown\n" })
        : undefined,
    );
    expect(await initRepository("/project", exec)).toEqual({
      status: "commit-failed",
      message: "Author identity unknown",
    });
  });

  it("creates exactly one commit with real git", async () => {
    vi.stubEnv("GIT_AUTHOR_NAME", "Test");
    vi.stubEnv("GIT_AUTHOR_EMAIL", "test@example.invalid");
    vi.stubEnv("GIT_COMMITTER_NAME", "Test");
    vi.stubEnv("GIT_COMMITTER_EMAIL", "test@example.invalid");
    const dir = await makeTempDir();
    await writeFile(join(dir, "README.md"), "hi\n");
    expect(await initRepository(dir)).toEqual({ status: "committed" });
    expect(
      execFileSync("git", ["rev-list", "--count", "HEAD"], { cwd: dir, encoding: "utf8" }).trim(),
    ).toBe("1");
    vi.unstubAllEnvs();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @cms-hackathon-setup/create-cms-app test`
Expected: FAIL, cannot resolve `./git.ts`.

- [ ] **Step 3: Implement**

```ts
import { execFile } from "node:child_process";
import { promisify } from "node:util";

export type Exec = (command: string, args: string[], options: { cwd: string }) => Promise<void>;

export type GitResult =
  | { status: "committed" }
  | { status: "git-missing" }
  | { status: "commit-failed"; message: string };

const execFileAsync = promisify(execFile);

export const execFileExec: Exec = async (command, args, { cwd }) => {
  await execFileAsync(command, args, { cwd });
};

function messageOf(error: unknown): string {
  const stderr = (error as { stderr?: unknown }).stderr;
  if (typeof stderr === "string" && stderr.trim()) return stderr.trim();
  return error instanceof Error ? error.message : String(error);
}

export async function initRepository(dir: string, exec: Exec = execFileExec): Promise<GitResult> {
  try {
    await exec("git", ["--version"], { cwd: dir });
  } catch {
    return { status: "git-missing" };
  }
  try {
    await exec("git", ["init", "-b", "main"], { cwd: dir });
    await exec("git", ["add", "-A"], { cwd: dir });
    // Hooks are not active before `pnpm install`; --no-verify also skips global hooks.
    await exec("git", ["commit", "--no-verify", "-m", "chore: initial project"], { cwd: dir });
    return { status: "committed" };
  } catch (error) {
    return { status: "commit-failed", message: messageOf(error) };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm --filter @cms-hackathon-setup/create-cms-app test && pnpm --filter @cms-hackathon-setup/create-cms-app check-types`
Expected: PASS.

- [ ] **Step 5: Commit**

Run: `pnpm format:fix && pnpm check` → PASS.

```bash
git add packages/create-cms-app/src
git commit -m "feat(create-cms-app): initialize git repository with initial commit"
```

---

### Task 6: Prompts, CLI flow and bundle entry

**Files:**

- Create: `packages/create-cms-app/src/prompts.ts`, `src/generate.ts`, `src/cli.ts`, `src/paths.ts`
- Modify: `packages/create-cms-app/src/main.ts` (replace)
- Modify: `packages/create-cms-app/src/test-helpers.ts` (add `scriptedPrompter`)
- Test: `packages/create-cms-app/src/prompts.test.ts`, `packages/create-cms-app/src/cli.test.ts`
- Rebuild: `packages/create-cms-app/dist/`

**Interfaces:**

- Consumes: Tasks 2–5.
- Produces:
  - `prompts.ts`: `interface Prompter { text; select; confirm; note }` (below), `clackPrompter: Prompter`,
    `askChoices(prompter: Prompter): Promise<Choices | undefined>`
  - `generate.ts`: `interface GenerateResult { git: GitResult; symlinkFallback: boolean }`,
    `generate(choices: Choices, targetDir: string, templatesDir: string, exec?: Exec): Promise<GenerateResult>`
  - `cli.ts`: `interface Logger { info; warn; error; success }` (each `(message: string) => void`),
    `interface CliContext { prompter: Prompter; log: Logger; cwd: string; templatesDir: string; interactive: boolean; exec?: Exec }`,
    `run(context: CliContext): Promise<number>` (exit code), `nextSteps(name: string): string`
  - `paths.ts`: `sourceTemplatesDir: string` (absolute path of `packages/create-cms-app/templates`)
  - `test-helpers.ts`: `scriptedPrompter(answers: unknown[]): { prompter: Prompter; asked: string[] }`

- [ ] **Step 1: Write `prompts.ts` interface and the scripted prompter**

`prompts.ts`:

```ts
import * as clack from "@clack/prompts";
import {
  type Choices,
  CMS_OPTIONS,
  cmsLabel,
  FRAMEWORK_OPTIONS,
  frameworkLabel,
  validateProjectName,
} from "./choices.ts";

export interface Prompter {
  text(options: {
    message: string;
    placeholder?: string;
    validate: (value: string | undefined) => string | undefined;
  }): Promise<string | symbol>;
  select<T extends string>(options: {
    message: string;
    options: ReadonlyArray<{ value: T; label: string }>;
  }): Promise<T | symbol>;
  confirm(options: { message: string }): Promise<boolean | symbol>;
  note(message: string, title: string): void;
}

export const clackPrompter: Prompter = {
  text: (options) => clack.text(options),
  select: (options) => clack.select({ message: options.message, options: [...options.options] }),
  confirm: (options) => clack.confirm(options),
  note: (message, title) => clack.note(message, title),
};

// Returns undefined when the user cancels a prompt or declines the summary.
export async function askChoices(prompter: Prompter): Promise<Choices | undefined> {
  const name = await prompter.text({
    message: "Project name",
    placeholder: "my-cms-app",
    validate: validateProjectName,
  });
  if (typeof name === "symbol") return undefined;
  const cms = await prompter.select({ message: "CMS", options: CMS_OPTIONS });
  if (typeof cms === "symbol") return undefined;
  const framework = await prompter.select({ message: "Web framework", options: FRAMEWORK_OPTIONS });
  if (typeof framework === "symbol") return undefined;
  prompter.note(
    [
      `Project:   ${name}`,
      `CMS:       ${cmsLabel(cms)}`,
      `Framework: ${frameworkLabel(framework)}`,
      `Directory: ./${name}`,
    ].join("\n"),
    "Summary",
  );
  const confirmed = await prompter.confirm({ message: "Create the project?" });
  if (confirmed !== true) return undefined;
  return { name, cms, framework };
}
```

If `clack.text`/`clack.select` signatures differ in @clack/prompts 1.8.1, adapt only the
`clackPrompter` wrappers (check `node_modules/@clack/prompts/dist/index.d.mts`); the `Prompter`
interface stays as written.

Append to `test-helpers.ts`:

```ts
import type { Prompter } from "./prompts.ts";

export const CANCEL = Symbol("cancel");

// Answers prompts in order; records each prompt's message (notes as "note:<title>").
export function scriptedPrompter(answers: unknown[]): { prompter: Prompter; asked: string[] } {
  const queue = [...answers];
  const asked: string[] = [];
  const next = async (
    message: string,
    validate?: (value: string | undefined) => string | undefined,
  ) => {
    asked.push(message);
    const answer = queue.shift();
    if (validate && typeof answer === "string" && validate(answer))
      throw new Error(`invalid answer ${answer}`);
    return answer as never;
  };
  return {
    asked,
    prompter: {
      text: (options) => next(options.message, options.validate),
      select: (options) => next(options.message),
      confirm: (options) => next(options.message),
      note: (_message, title) => {
        asked.push(`note:${title}`);
      },
    },
  };
}
```

- [ ] **Step 2: Write the failing tests**

`prompts.test.ts`:

```ts
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
```

`cli.test.ts` (uses a fixture template set with every layer for `sanity-next`):

```ts
import { execFileSync } from "node:child_process";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type CliContext, nextSteps, run } from "./cli.ts";
import type { Exec } from "./git.ts";
import { makeTempDir, scriptedPrompter, writeTree } from "./test-helpers.ts";

const answers = ["my-app", "sanity", "next", true];
let cwd: string;
let templatesDir: string;
let logs: string[];

function context(overrides: Partial<CliContext> = {}): CliContext {
  const record = (level: string) => (message: string) => logs.push(`${level}: ${message}`);
  return {
    prompter: scriptedPrompter(answers).prompter,
    log: {
      info: record("info"),
      warn: record("warn"),
      error: record("error"),
      success: record("success"),
    },
    cwd,
    templatesDir,
    interactive: true,
    ...overrides,
  };
}

beforeEach(async () => {
  cwd = await makeTempDir();
  templatesDir = await makeTempDir();
  logs = [];
  await writeTree(templatesDir, {
    "common/AGENTS.md": "# __PROJECT_NAME__\n",
    "common/pkg.json": JSON.stringify({ name: "__PROJECT_NAME__" }),
    "frameworks/next/next.config.ts": "export default {};\n",
    "cms/sanity/.env.example": "SANITY_PROJECT_ID=\n",
    "combos/sanity-next/src/app/page.tsx": "export default function Page() {}\n",
  });
  vi.stubEnv("GIT_AUTHOR_NAME", "Test");
  vi.stubEnv("GIT_AUTHOR_EMAIL", "test@example.invalid");
  vi.stubEnv("GIT_COMMITTER_NAME", "Test");
  vi.stubEnv("GIT_COMMITTER_EMAIL", "test@example.invalid");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("run", () => {
  it("generates the project with one commit and prints next steps", async () => {
    expect(await run(context())).toBe(0);
    const target = join(cwd, "my-app");
    expect(JSON.parse(await readFile(join(target, "package.json"), "utf8")).name).toBe("my-app");
    expect(
      execFileSync("git", ["rev-list", "--count", "HEAD"], {
        cwd: target,
        encoding: "utf8",
      }).trim(),
    ).toBe("1");
    expect(logs).toContain(`info: ${nextSteps("my-app")}`);
    expect(nextSteps("my-app")).toMatch(
      /cd my-app[\s\S]*pnpm install[\s\S]*pnpm exec playwright install[\s\S]*\.env\.example[\s\S]*pnpm dev/,
    );
  });

  it("writes nothing when cancelled", async () => {
    const { prompter } = scriptedPrompter(["my-app", "sanity", "next", false]);
    expect(await run(context({ prompter }))).toBe(0);
    expect(await readdir(cwd)).toEqual([]);
    expect(logs.join("\n")).toMatch(/Cancelled/);
  });

  it("exits 1 for a non-empty target and leaves it unchanged", async () => {
    await mkdir(join(cwd, "my-app"));
    await writeFile(join(cwd, "my-app", "keep.txt"), "mine");
    expect(await run(context())).toBe(1);
    expect(await readdir(join(cwd, "my-app"))).toEqual(["keep.txt"]);
    expect(logs.join("\n")).toMatch(/error: my-app already exists and is not empty/);
  });

  it("warns and succeeds when git is missing", async () => {
    const exec: Exec = async () => {
      throw Object.assign(new Error("spawn git ENOENT"), { code: "ENOENT" });
    };
    expect(await run(context({ exec }))).toBe(0);
    expect(logs.join("\n")).toMatch(/warn: git not found/);
    expect(await readFile(join(cwd, "my-app", "AGENTS.md"), "utf8")).toBe("# my-app\n");
  });

  it("warns and succeeds when the commit fails", async () => {
    const exec: Exec = async (_command, args) => {
      if (args[0] === "commit")
        throw Object.assign(new Error("failed"), { stderr: "Author identity unknown" });
    };
    expect(await run(context({ exec }))).toBe(0);
    expect(logs.join("\n")).toMatch(
      /warn: Could not create the initial commit: Author identity unknown/,
    );
  });

  it("refuses to run without an interactive terminal", async () => {
    expect(await run(context({ interactive: false }))).toBe(1);
    expect(logs.join("\n")).toMatch(/needs an interactive terminal/);
    expect(await readdir(cwd)).toEqual([]);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm --filter @cms-hackathon-setup/create-cms-app test`
Expected: FAIL, cannot resolve `./cli.ts` (prompts tests pass already).

- [ ] **Step 4: Implement `generate.ts`, `cli.ts`, `paths.ts`, `main.ts`**

`generate.ts`:

```ts
import type { Choices } from "./choices.ts";
import { type Exec, type GitResult, initRepository } from "./git.ts";
import { planProject } from "./plan.ts";
import { writeProject } from "./write.ts";

export interface GenerateResult {
  git: GitResult;
  symlinkFallback: boolean;
}

export async function generate(
  choices: Choices,
  targetDir: string,
  templatesDir: string,
  exec?: Exec,
): Promise<GenerateResult> {
  const entries = await planProject(templatesDir, choices);
  const { symlinkFallback } = await writeProject(targetDir, entries);
  const git = await initRepository(targetDir, exec);
  return { git, symlinkFallback };
}
```

`cli.ts`:

```ts
import { resolve } from "node:path";
import { generate } from "./generate.ts";
import type { Exec } from "./git.ts";
import { askChoices, type Prompter } from "./prompts.ts";
import { assertTargetUsable, TargetNotEmptyError } from "./write.ts";

export interface Logger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  success(message: string): void;
}

export interface CliContext {
  prompter: Prompter;
  log: Logger;
  cwd: string;
  templatesDir: string;
  interactive: boolean;
  exec?: Exec;
}

export function nextSteps(name: string): string {
  return [
    "Next steps:",
    `  cd ${name}`,
    "  pnpm install",
    "  pnpm exec playwright install",
    "  cp .env.example .env   # then fill in the values",
    "  pnpm dev",
  ].join("\n");
}

export async function run(context: CliContext): Promise<number> {
  const { log } = context;
  if (!context.interactive) {
    log.error("create-cms-app needs an interactive terminal. Run it directly in a terminal.");
    return 1;
  }
  const choices = await askChoices(context.prompter);
  if (!choices) {
    log.info("Cancelled. Nothing was written.");
    return 0;
  }
  const target = resolve(context.cwd, choices.name);
  try {
    await assertTargetUsable(target);
  } catch (error) {
    if (!(error instanceof TargetNotEmptyError)) throw error;
    log.error(`${choices.name} already exists and is not empty. Choose another name or remove it.`);
    return 1;
  }

  const result = await generate(choices, target, context.templatesDir, context.exec);
  if (result.symlinkFallback) {
    log.warn(
      "Could not create CLAUDE.md as a symlink, so it is a copy of AGENTS.md. Replace it with a symlink when you can.",
    );
  }
  if (result.git.status === "git-missing") {
    log.warn("git not found: skipped git init and the initial commit.");
  } else if (result.git.status === "commit-failed") {
    log.warn(
      `Could not create the initial commit: ${result.git.message}\nThe repository is initialized and all files are staged; commit them yourself.`,
    );
  }
  log.success(`Created ${choices.name}`);
  log.info(nextSteps(choices.name));
  return 0;
}
```

`paths.ts`:

```ts
import { fileURLToPath } from "node:url";

// Templates in the source tree. The bundle uses dist/templates next to cli.mjs instead.
export const sourceTemplatesDir = fileURLToPath(new URL("../templates/", import.meta.url));
```

`main.ts` (replace):

```ts
import * as clack from "@clack/prompts";
import { fileURLToPath } from "node:url";
import { run } from "./cli.ts";
import { clackPrompter } from "./prompts.ts";

const templatesDir = fileURLToPath(new URL("./templates/", import.meta.url));

clack.intro("create-cms-app");
try {
  process.exitCode = await run({
    prompter: clackPrompter,
    log: clack.log,
    cwd: process.cwd(),
    templatesDir,
    interactive: Boolean(process.stdin.isTTY && process.stdout.isTTY),
  });
} catch (error) {
  clack.log.error(error instanceof Error ? error.message : String(error));
  if (process.env.DEBUG && error instanceof Error) console.error(error.stack);
  process.exitCode = 1;
}
```

- [ ] **Step 5: Run tests and type check**

Run: `pnpm --filter @cms-hackathon-setup/create-cms-app test && pnpm --filter @cms-hackathon-setup/create-cms-app check-types`
Expected: PASS.

- [ ] **Step 6: Rebuild and try the bundle by hand**

Run: `pnpm build && node packages/create-cms-app/dist/cli.mjs </dev/null; echo "exit $?"`
Expected: `needs an interactive terminal`, `exit 1`.

Run in a scratch directory, interactively: `node <repo>/packages/create-cms-app/dist/cli.mjs`,
answer the prompts, press Ctrl+C at the CMS prompt. Expected: "Cancelled. Nothing was written.",
directory empty. (Generating fails with `Template layer missing: common` until Task 8; that is
expected here.)

- [ ] **Step 7: Commit**

Run: `pnpm format:fix && git add packages/create-cms-app && pnpm check` → PASS.

```bash
git add packages/create-cms-app
git commit -m "feat(create-cms-app): add interactive prompts and CLI flow"
```

---

### Task 7: Documentation checker for generated projects

**Files:**

- Create: `packages/create-cms-app/templates/common/scripts/check-docs.ts`
- Test: `packages/create-cms-app/src/check-docs.test.ts`
- Modify: `packages/create-cms-app/tsconfig.json` (no change needed if the test import pulls the
  file in; verify with `check-types`)

**Interfaces:**

- Produces (in the template file):
  `interface DocsReport { errors: string[]; warnings: string[]; instructionFiles: string[] }`,
  `checkDocs(root: string): DocsReport`, `headingSlugs(markdown: string): Set<string>`.
  Run as `node scripts/check-docs.ts`: prints warnings, errors, exits 1 on errors, else prints
  `Docs OK (<n> instruction files)`.

- [ ] **Step 1: Write the failing test**

````ts
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { checkDocs, headingSlugs } from "../templates/common/scripts/check-docs.ts";
import { makeTempDir, writeTree } from "./test-helpers.ts";

const AGENTS = [
  "# AGENTS.md",
  "",
  "See [the rules](#rules-for-editing-this-file) and [testing rules](docs/instructions/testing.md#rules).",
  "",
  "## Rules for editing this file",
  "",
  "```md",
  "[ignored](docs/instructions/missing.md)",
  "```",
  "",
  "Docs: [site](https://example.com) and `[code](docs/nope.md)`.",
  "",
  "## Instruction files",
  "",
  "- [Testing](docs/instructions/testing.md) — before writing tests",
  "",
].join("\n");

let root: string;

beforeEach(async () => {
  root = await makeTempDir();
  await writeTree(root, {
    "AGENTS.md": AGENTS,
    "docs/instructions/testing.md": "# Testing\n\n## Rules\n\nText.\n",
  });
});

describe("checkDocs", () => {
  it("passes a clean tree", () => {
    expect(checkDocs(root)).toEqual({
      errors: [],
      warnings: [],
      instructionFiles: ["docs/instructions/testing.md"],
    });
  });

  it("fails on a dead relative link", async () => {
    await writeTree(root, {
      "docs/instructions/testing.md": "# Testing\n\n## Rules\n\n[x](../missing.md)\n",
    });
    expect(checkDocs(root).errors).toEqual([
      "docs/instructions/testing.md:5: dead link to docs/missing.md",
    ]);
  });

  it("fails on a dead anchor", async () => {
    await writeTree(root, { "docs/instructions/testing.md": "# Testing\n\n## Other\n" });
    expect(checkDocs(root).errors).toEqual([
      "AGENTS.md:3: dead anchor #rules in docs/instructions/testing.md",
    ]);
  });

  it("fails on an unlinked instruction file", async () => {
    await writeTree(root, { "docs/instructions/orphan.md": "# Orphan\n" });
    expect(checkDocs(root).errors).toEqual([
      "docs/instructions/orphan.md: not reachable from AGENTS.md",
    ]);
  });

  it("fails on a twice-linked instruction file", async () => {
    await writeTree(root, {
      "AGENTS.md": `${AGENTS}- [Testing again](docs/instructions/testing.md) — again\n`,
    });
    expect(checkDocs(root).errors).toEqual([
      "AGENTS.md: docs/instructions/testing.md is linked 2 times, allowed once",
    ]);
  });

  it("requires the trigger form for instruction links", async () => {
    await writeTree(root, { "AGENTS.md": AGENTS.replace(" — before writing tests", "") });
    expect(checkDocs(root).errors).toEqual([
      'AGENTS.md:15: link to docs/instructions/testing.md needs the form "- [Title](docs/instructions/testing.md) — when to read it"',
    ]);
  });

  it("warns on links between instruction files and counts them as reachable", async () => {
    await writeTree(root, {
      "docs/instructions/testing.md": "# Testing\n\n## Rules\n\nSee [style](style.md).\n",
      "docs/instructions/style.md": "# Style\n",
    });
    const report = checkDocs(root);
    expect(report.errors).toEqual([]);
    expect(report.warnings).toEqual([
      "docs/instructions/testing.md:5: links to docs/instructions/style.md; prefer linking instruction files only from AGENTS.md",
    ]);
  });

  it("fails when AGENTS.md is missing", async () => {
    const empty = await makeTempDir();
    expect(checkDocs(join(empty)).errors).toEqual(["AGENTS.md: missing"]);
  });
});

describe("headingSlugs", () => {
  it("builds GitHub-style slugs with duplicate suffixes", () => {
    expect([
      ...headingSlugs("# A `code` Title!\n## Same\n## Same\n```\n# not a heading\n```\n"),
    ]).toEqual(["a-code-title", "same", "same-1"]);
  });
});
````

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @cms-hackathon-setup/create-cms-app test`
Expected: FAIL, cannot resolve `../templates/common/scripts/check-docs.ts`.

- [ ] **Step 3: Implement**

````ts
// Checks the documentation rules from AGENTS.md (run: `pnpm check:docs`):
// - every relative link in AGENTS.md and docs/**/*.md points to an existing file, and every
//   anchor to an existing heading
// - each instruction file is linked at most once from AGENTS.md, as "- [Title](path) — when to read it"
// - every instruction file is reachable from AGENTS.md
// - links between instruction files are allowed but reported as warnings
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, normalize, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

export interface DocsReport {
  errors: string[];
  warnings: string[];
  instructionFiles: string[];
}

interface Link {
  target: string;
  anchor: string | undefined;
  line: string;
  lineNumber: number;
}

const AGENTS = "AGENTS.md";
const INSTRUCTIONS = "docs/instructions";
const LINK = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const TRIGGER = /^\s*[-*]\s+\[[^\]]+\]\([^)]+\)\s+[—–-]\s+\S/;
const FENCE = /^\s*(```|~~~)/;

function toPosix(path: string): string {
  return path.split(sep).join("/");
}

function markdownFiles(root: string): string[] {
  const files = existsSync(join(root, AGENTS)) ? [AGENTS] : [];
  const docs = join(root, "docs");
  if (existsSync(docs)) {
    for (const entry of readdirSync(docs, { recursive: true, withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push(toPosix(relative(root, join(entry.parentPath, entry.name))));
      }
    }
  }
  return files.sort();
}

function linksIn(root: string, file: string): Link[] {
  const links: Link[] = [];
  let inFence = false;
  readFileSync(join(root, file), "utf8")
    .split("\n")
    .forEach((raw, index) => {
      if (FENCE.test(raw)) {
        inFence = !inFence;
        return;
      }
      if (inFence) return;
      const line = raw.replace(/`[^`]*`/g, "");
      for (const match of line.matchAll(LINK)) {
        const href = match[1] ?? "";
        if (/^[a-z][a-z0-9+.-]*:/i.test(href)) continue; // https:, mailto:, ...
        const [path = "", anchor] = href.split("#", 2);
        const target =
          path === "" ? file : toPosix(normalize(join(dirname(file), decodeURI(path))));
        links.push({ target, anchor, line, lineNumber: index + 1 });
      }
    });
  return links;
}

export function headingSlugs(markdown: string): Set<string> {
  const slugs = new Set<string>();
  const seen = new Map<string, number>();
  let inFence = false;
  for (const line of markdown.split("\n")) {
    if (FENCE.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const heading = /^#{1,6}\s+(.*?)\s*#*\s*$/.exec(line)?.[1];
    if (heading === undefined) continue;
    const base = heading
      .toLowerCase()
      .replace(/<[^>]*>/g, "")
      .replace(/[^\p{L}\p{N}\s_-]/gu, "")
      .replace(/\s/g, "-");
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    slugs.add(count === 0 ? base : `${base}-${count}`);
  }
  return slugs;
}

function isInstruction(path: string): boolean {
  return dirname(path) === INSTRUCTIONS && path.endsWith(".md");
}

export function checkDocs(root: string): DocsReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const files = markdownFiles(root);
  const slugCache = new Map<string, Set<string>>();
  const slugsOf = (file: string): Set<string> => {
    let slugs = slugCache.get(file);
    if (!slugs) {
      slugs = headingSlugs(readFileSync(join(root, file), "utf8"));
      slugCache.set(file, slugs);
    }
    return slugs;
  };

  for (const file of files) {
    for (const link of linksIn(root, file)) {
      const absolute = join(root, link.target);
      if (!existsSync(absolute)) {
        errors.push(`${file}:${link.lineNumber}: dead link to ${link.target}`);
      } else if (
        link.anchor !== undefined &&
        link.target.endsWith(".md") &&
        statSync(absolute).isFile() &&
        !slugsOf(link.target).has(link.anchor.toLowerCase())
      ) {
        errors.push(`${file}:${link.lineNumber}: dead anchor #${link.anchor} in ${link.target}`);
      }
    }
  }

  const instructionFiles = files.filter(isInstruction);
  if (!files.includes(AGENTS)) {
    errors.push(`${AGENTS}: missing`);
    return { errors, warnings, instructionFiles };
  }

  const counts = new Map<string, number>();
  for (const link of linksIn(root, AGENTS)) {
    if (!isInstruction(link.target)) continue;
    counts.set(link.target, (counts.get(link.target) ?? 0) + 1);
    if (!TRIGGER.test(link.line)) {
      errors.push(
        `${AGENTS}:${link.lineNumber}: link to ${link.target} needs the form "- [Title](${link.target}) — when to read it"`,
      );
    }
  }
  for (const [target, count] of counts) {
    if (count > 1) errors.push(`${AGENTS}: ${target} is linked ${count} times, allowed once`);
  }

  const reachable = new Set(counts.keys());
  const queue = [...reachable];
  for (let file = queue.shift(); file !== undefined; file = queue.shift()) {
    if (!existsSync(join(root, file))) continue;
    for (const link of linksIn(root, file)) {
      if (!isInstruction(link.target) || link.target === file) continue;
      warnings.push(
        `${file}:${link.lineNumber}: links to ${link.target}; prefer linking instruction files only from ${AGENTS}`,
      );
      if (!reachable.has(link.target)) {
        reachable.add(link.target);
        queue.push(link.target);
      }
    }
  }
  for (const file of instructionFiles) {
    if (!reachable.has(file)) errors.push(`${file}: not reachable from ${AGENTS}`);
  }
  return { errors, warnings, instructionFiles };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const report = checkDocs(join(dirname(fileURLToPath(import.meta.url)), ".."));
  for (const warning of report.warnings) console.warn(`warning: ${warning}`);
  for (const error of report.errors) console.error(`error: ${error}`);
  if (report.errors.length > 0) process.exit(1);
  console.log(`Docs OK (${report.instructionFiles.length} instruction files)`);
}
````

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm --filter @cms-hackathon-setup/create-cms-app test && pnpm --filter @cms-hackathon-setup/create-cms-app check-types`
Expected: PASS. Fix expected line numbers in the test only if the fixture text changed.

- [ ] **Step 5: Commit**

Run: `pnpm build && pnpm format:fix && git add packages/create-cms-app && pnpm check` → PASS.

```bash
git add packages/create-cms-app
git commit -m "feat(create-cms-app): add documentation checker for generated projects"
```

---

### Task 8: Common template layer

**Files (all under `packages/create-cms-app/templates/common/`):**

- Create: `AGENTS.md`, `docs/instructions/testing.md`, `docs/instructions/linting-and-formatting.md`
- Create: `.githooks/pre-commit` (mode 755), `_gitignore`, `.oxlintrc.json`, `.oxfmtrc.json`
- Create: `pkg.json`, `pnpm-workspace.json`, `vitest.config.ts`, `playwright.config.ts`
- Create: `src/lib/cms/state.ts`, `tests/unit/cms-state.test.ts`, `tests/e2e/smoke.spec.ts`
- Delete: `packages/create-cms-app/templates/.gitkeep`
- Test: `packages/create-cms-app/src/common-layer.test.ts`

**Interfaces:**

- Produces for every generated project:
  - `src/lib/cms/state.ts`: `interface Example { title: string; body: string }`,
    `type CmsState = { kind: "example"; example: Example } | { kind: "empty" } | { kind: "missing-env"; missing: string[] } | { kind: "error"; message: string }`,
    `missingEnv(required: readonly string[], env: Record<string, string | undefined>): string[]`,
    `loadCmsState(missing: string[], load: () => Promise<Example | null>): Promise<CmsState>`,
    `describeCmsState(state: CmsState): { title: string; detail: string }`
  - Contract for later layers: each framework layer provides `docs/instructions/framework.md`,
    `tsconfig.json` (covering `src`, `cms`, `scripts`, `tests`, config files) and the scripts
    `dev`, `build`, `start` (honours `PORT`), `check-types`. Each CMS layer provides
    `docs/instructions/cms.md`, `.env.example`, `src/lib/cms/client.ts` exporting
    `requiredEnv: readonly string[]`, `tests/unit/cms-client.test.ts`, and the script
    `cms:migrate`.

- [ ] **Step 1: Write the failing test**

`src/common-layer.test.ts`:

```ts
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
    for (const version of Object.values<string>(pkg.devDependencies))
      expect(version).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm --filter @cms-hackathon-setup/create-cms-app test`
Expected: FAIL, `common` directory missing.

- [ ] **Step 3: Create the layer files**

`AGENTS.md`:

```md
# AGENTS.md

`CLAUDE.md` is a symlink to this file. Edit `AGENTS.md` only.

## Rules for editing this file

These rules stay in this file. Do not move them into an instruction file.

1. **Keep it current on every step.** In the same step as the change:
   - When the user states a rule, convention or preference about the project (for example "a
     function should be at most 40 lines long"), record it in the fitting instruction file. If no
     file fits, create one and link it here.
   - When an implementation changes anything described here or in an instruction file (commands,
     layout, tools, conventions), update the affected text.
2. **Progressive disclosure.** This file holds only what every step needs: project overview,
   layout, tools and commands, general conventions and the definition of done. Everything else
   lives in an instruction file at `./docs/instructions/<instruction-file>.md`.
3. **Link each instruction file at most once in this file**, as a list item that says when to read
   it: `- [Testing](docs/instructions/testing.md) — before writing or running tests`.
4. **Link instruction files only from this file.** Links between instruction files are allowed but
   discouraged. Every instruction file must be reachable from this file.
5. **Each fact lives in one place.** Do not repeat content between this file and instruction files,
   or between instruction files. Link instead.
6. **One topic per instruction file**, named in kebab-case (`code-style.md`, `testing.md`).
7. **No dead links, no orphans.** When an instruction file is deleted, delete its link. When a
   topic grows past one file's scope, split it.
8. **Keep this file under about 100 lines.** If it grows past that, move a section into an
   instruction file.
9. **Do not record what the code already says.** Write down rules and decisions, not what
   configuration, scripts or git history already show.

`pnpm check:docs` checks rules 3, 4 and 7.

## Project

**PROJECT_NAME** is a **FRAMEWORK** app that loads its content from **CMS**.

## Tools and commands

pnpm is enforced through `devEngines` and Node through `engines` in `package.json`.

| Command                           | Purpose                                                                    |
| --------------------------------- | -------------------------------------------------------------------------- |
| `pnpm install`                    | Install dependencies and activate the git hooks in `.githooks/`            |
| `pnpm exec playwright install`    | Install the Playwright browsers (once per machine)                         |
| `pnpm dev`                        | Start the development server                                               |
| `pnpm build` / `pnpm start`       | Build for production and serve the build                                   |
| `pnpm lint` / `pnpm lint:fix`     | Lint with oxlint                                                           |
| `pnpm format` / `pnpm format:fix` | Check or apply formatting with oxfmt                                       |
| `pnpm check-types`                | Type-check the project                                                     |
| `pnpm test` / `pnpm test:watch`   | Run the Vitest unit tests                                                  |
| `pnpm test:smoke`                 | Run the Playwright tests tagged `@smoke`                                   |
| `pnpm test:e2e`                   | Run all Playwright tests                                                   |
| `pnpm check:docs`                 | Check dead links, anchors and the instruction link rules                   |
| `pnpm check`                      | Run lint, format, check-types, test, test:smoke and check:docs; pre-commit |

## Layout

- `src/` — the app.
- `src/lib/cms/` — the CMS client and the content states every route renders.
- `cms/` — schema as code, the example content type and migrations for the CMS.
- `tests/unit/` — Vitest unit tests. `tests/e2e/` — Playwright tests.
- `docs/instructions/` — instruction files (see rules above).
- `scripts/` — project tooling.
- `.githooks/` — versioned git hooks, activated through the `prepare` script.

## Conventions

None yet.

## Definition of done

Before reporting a step as done, go through every item below yourself and run every command it
names. If an item fails, fix it and go through the list again. Do not hand unchecked items to the
user. If an item cannot be met, say which one and why instead of reporting the step as done.

- The requested change is implemented.
- `AGENTS.md` and the affected instruction files reflect it (rule 1).
- `pnpm check` passes.

## Instruction files

- [Framework](docs/instructions/framework.md) — before changing routes, pages, components or
  framework configuration
- [CMS](docs/instructions/cms.md) — before changing content types, migrations, the CMS client or
  environment variables
- [Testing](docs/instructions/testing.md) — before writing, running or configuring tests
- [Linting and formatting](docs/instructions/linting-and-formatting.md) — before changing lint or
  format rules, or when a lint or format check fails
```

`docs/instructions/testing.md`:

```md
# Testing

## Unit tests

- Vitest runs `tests/unit/**/*.test.ts` (`vitest.config.ts`).
- Unit tests run without CMS credentials or network. Mock the CMS SDK or client object.

## End-to-end tests

- Playwright runs `tests/e2e/`. It builds and starts the app itself (`playwright.config.ts`).
- Tag a test with `@smoke` in its title to run it in `pnpm check`. Keep smoke tests few and fast.
  Untagged tests run only through `pnpm test:e2e`.
- Smoke tests must pass without CMS credentials. Assert on what the page renders in every state
  (`data-cms-state`), not on CMS content.
```

`docs/instructions/linting-and-formatting.md`:

```md
# Linting and formatting

oxlint lints and oxfmt formats the whole project. Configuration lives in `.oxlintrc.json` and
`.oxfmtrc.json`.

- When a format check fails, run `pnpm format:fix`. Do not format by hand.
- When a lint check fails, try `pnpm lint:fix` first, then fix the rest by hand. Do not disable a
  rule inline without a comment saying why.
- Keep generated and build output in `ignorePatterns` of both config files.
```

`.githooks/pre-commit` (then `chmod 755`):

```sh
#!/bin/sh
# Runs all checks before every commit. Activated by `pnpm install` through the prepare script.
echo "pre-commit: running pnpm check"
exec pnpm check
```

`_gitignore`:

```
node_modules/
.env
.env.*
!.env.example
.DS_Store

# Build output
dist/
build/
.next/
next-env.d.ts
.nuxt/
.output/
.astro/
.svelte-kit/

# Test output
test-results/
playwright-report/

# Sanity Studio
cms/.sanity/
cms/dist/
```

`.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["typescript", "unicorn", "oxc"],
  "categories": {
    "correctness": "error"
  },
  "env": {
    "builtin": true
  },
  "ignorePatterns": [
    ".next/**",
    ".nuxt/**",
    ".output/**",
    ".astro/**",
    ".svelte-kit/**",
    "dist/**",
    "build/**",
    "cms/.sanity/**",
    "cms/dist/**",
    "playwright-report/**",
    "test-results/**"
  ]
}
```

`.oxfmtrc.json`:

```json
{
  "$schema": "./node_modules/oxfmt/configuration_schema.json",
  "ignorePatterns": [
    "pnpm-lock.yaml",
    ".next/**",
    ".nuxt/**",
    ".output/**",
    ".astro/**",
    ".svelte-kit/**",
    "dist/**",
    "build/**",
    "cms/.sanity/**",
    "cms/dist/**",
    "playwright-report/**",
    "test-results/**"
  ]
}
```

`pkg.json`:

```json
{
  "name": "__PROJECT_NAME__",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "lint": "oxlint",
    "lint:fix": "oxlint --fix",
    "format": "oxfmt --check",
    "format:fix": "oxfmt",
    "test": "vitest run",
    "test:watch": "vitest --watch",
    "test:smoke": "playwright test --grep @smoke",
    "test:e2e": "playwright test",
    "check:docs": "node scripts/check-docs.ts",
    "check": "pnpm lint && pnpm format && pnpm check-types && pnpm test && pnpm test:smoke && pnpm check:docs",
    "prepare": "git config core.hooksPath .githooks || true"
  },
  "devDependencies": {
    "@playwright/test": "1.64.0",
    "@types/node": "24.19.1",
    "oxfmt": "0.72.0",
    "oxlint": "1.87.0",
    "typescript": "6.0.3",
    "vitest": "5.0.3"
  },
  "engines": {
    "node": ">=24"
  },
  "devEngines": {
    "packageManager": {
      "name": "pnpm",
      "version": "^11.28.0",
      "onFail": "download"
    }
  }
}
```

`pnpm-workspace.json` (layers add approvals; the file also makes the project its own pnpm root):

```json
{
  "allowBuilds": {}
}
```

`vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/unit/**/*.test.ts"],
  },
});
```

`playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

// Tests and the web server see the same variables as `pnpm dev`.
try {
  process.loadEnvFile(".env");
} catch {
  // No .env: the app renders its "CMS not configured" state.
}

const port = Number(process.env.E2E_PORT ?? 4173);
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "tests/e2e",
  forbidOnly: Boolean(process.env.CI),
  reporter: "list",
  use: { baseURL },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm build && pnpm start",
    url: baseURL,
    env: { PORT: String(port) },
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
```

`src/lib/cms/state.ts`:

```ts
export interface Example {
  title: string;
  body: string;
}

export type CmsState =
  | { kind: "example"; example: Example }
  | { kind: "empty" }
  | { kind: "missing-env"; missing: string[] }
  | { kind: "error"; message: string };

export function missingEnv(
  required: readonly string[],
  env: Record<string, string | undefined>,
): string[] {
  return required.filter((name) => !env[name]?.trim());
}

// Never throws: routes render every outcome, including a misconfigured or unreachable CMS.
export async function loadCmsState(
  missing: string[],
  load: () => Promise<Example | null>,
): Promise<CmsState> {
  if (missing.length > 0) return { kind: "missing-env", missing };
  try {
    const example = await load();
    return example ? { kind: "example", example } : { kind: "empty" };
  } catch (error) {
    return { kind: "error", message: error instanceof Error ? error.message : String(error) };
  }
}

export function describeCmsState(state: CmsState): { title: string; detail: string } {
  switch (state.kind) {
    case "example":
      return { title: state.example.title, detail: state.example.body };
    case "empty":
      return {
        title: "No example content yet",
        detail: "Run pnpm cms:migrate to create the example content.",
      };
    case "missing-env":
      return {
        title: "CMS not configured",
        detail: `Missing: ${state.missing.join(", ")}. Copy .env.example to .env and fill it in.`,
      };
    case "error":
      return { title: "Could not load content from the CMS", detail: state.message };
  }
}
```

`tests/unit/cms-state.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { describeCmsState, loadCmsState, missingEnv } from "../../src/lib/cms/state";

describe("missingEnv", () => {
  it("lists unset and blank variables in order", () => {
    expect(missingEnv(["A", "B", "C"], { A: "x", B: " ", C: undefined })).toEqual(["B", "C"]);
  });
});

describe("loadCmsState", () => {
  it("does not call the CMS when variables are missing", async () => {
    const load = vi.fn();
    expect(await loadCmsState(["A"], load)).toEqual({ kind: "missing-env", missing: ["A"] });
    expect(load).not.toHaveBeenCalled();
  });

  it("returns the example", async () => {
    const example = { title: "Hello", body: "World" };
    expect(await loadCmsState([], async () => example)).toEqual({ kind: "example", example });
  });

  it("returns empty when there is no entry", async () => {
    expect(await loadCmsState([], async () => null)).toEqual({ kind: "empty" });
  });

  it("returns the error instead of throwing", async () => {
    const state = await loadCmsState([], async () => {
      throw new Error("Unauthorized");
    });
    expect(state).toEqual({ kind: "error", message: "Unauthorized" });
  });
});

describe("describeCmsState", () => {
  it("names the missing variables", () => {
    expect(describeCmsState({ kind: "missing-env", missing: ["A", "B"] })).toEqual({
      title: "CMS not configured",
      detail: "Missing: A, B. Copy .env.example to .env and fill it in.",
    });
  });
});
```

`tests/e2e/smoke.spec.ts`:

```ts
import { expect, test } from "@playwright/test";
import { requiredEnv } from "../../src/lib/cms/client";

test("home page renders a CMS state @smoke", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  const status = page.locator("[data-cms-state]");
  await expect(status).toBeVisible();
  if ((await status.getAttribute("data-cms-state")) === "missing-env") {
    for (const name of requiredEnv.filter((name) => !process.env[name]?.trim())) {
      await expect(status).toContainText(name);
    }
  }
});
```

Delete `packages/create-cms-app/templates/.gitkeep`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `chmod 755 packages/create-cms-app/templates/common/.githooks/pre-commit && pnpm --filter @cms-hackathon-setup/create-cms-app test`
Expected: PASS.

- [ ] **Step 5: Commit**

Run: `pnpm build && pnpm format:fix && git add packages/create-cms-app && pnpm check` → PASS.

```bash
git add packages/create-cms-app
git commit -m "feat(create-cms-app): add common template layer"
```

---

### Task 9: Next.js base, Sanity layer, `sanity-next`, and the full matrix runner

First vertical slice: one generated project goes through install, `pnpm check` and the hook.

**Files:**

- Create: `packages/create-cms-app/scripts/test-matrix.ts`
- Create under `templates/frameworks/next/`: `pkg.json`, `pnpm-workspace.json`, `next.config.ts`,
  `tsconfig.json`, `src/app/layout.tsx`, `src/components/cms-status.tsx`,
  `docs/instructions/framework.md`
- Create under `templates/cms/sanity/`: `pkg.json`, `pnpm-workspace.json`, `.env.example`,
  `src/lib/cms/client.ts`, `tests/unit/cms-client.test.ts`, `docs/instructions/cms.md`,
  `cms/sanity.config.ts`, `cms/sanity.cli.ts`, `cms/schema-types/example.ts`,
  `cms/schema-types/index.ts`, `cms/migrations/001-create-example/index.ts`
- Create under `templates/combos/sanity-next/`: `pkg.json`, `src/app/page.tsx`
- Modify: `packages/create-cms-app/package.json`, root `package.json`, `AGENTS.md`,
  `docs/instructions/generator.md`

**Interfaces:**

- Consumes: `generate()`, `sourceTemplatesDir`, `allCombos()`, `comboId()`, `Combo`; common layer
  contract (Task 8).
- Produces:
  - `pnpm test:matrix [--concurrency <n>] [--keep] [<cms>-<framework>...]` — exits 0 only when
    every selected combination generates with one commit, installs, passes `pnpm check`, and a
    commit runs the pre-commit hook.
  - Sanity `src/lib/cms/client.ts`: `requiredEnv`, `apiVersion: string`, `exampleQuery: string`,
    `interface SanityFetcher { fetch<T>(query: string): Promise<T> }`,
    `fetchExample(client: SanityFetcher): Promise<Example | null>`.
  - Next `src/components/cms-status.tsx`: `CmsStatus({ state }: { state: CmsState })`.

- [ ] **Step 1: Write the matrix runner**

`packages/create-cms-app/scripts/test-matrix.ts`:

```ts
// Generates CMS × framework combinations into a temporary directory, installs each, and runs its
// `pnpm check` and pre-commit hook. Slow and needs network; not part of `pnpm check`.
// Usage: pnpm test:matrix [--concurrency <n>] [--keep] [<cms>-<framework> ...]
import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { allCombos, type Combo, comboId } from "../src/choices.ts";
import { generate } from "../src/generate.ts";
import type { Exec } from "../src/git.ts";
import { sourceTemplatesDir } from "../src/paths.ts";

interface Outcome {
  id: string;
  failedStep?: string;
  log: string;
}

function parseArgs(argv: string[]): { combos: Combo[]; concurrency: number; keep: boolean } {
  let concurrency = 1;
  let keep = false;
  const ids: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i] ?? "";
    if (arg === "--concurrency") concurrency = Number(argv[++i]);
    else if (arg === "--keep") keep = true;
    else ids.push(arg);
  }
  const known = allCombos();
  const unknown = ids.filter((id) => !known.some((combo) => comboId(combo) === id));
  if (unknown.length > 0 || !(concurrency >= 1)) {
    console.error(`Unknown combination or bad --concurrency: ${unknown.join(", ")}`);
    console.error(`Known: ${known.map(comboId).join(", ")}`);
    process.exit(2);
  }
  const combos = ids.length === 0 ? known : known.filter((combo) => ids.includes(comboId(combo)));
  return { combos, concurrency, keep };
}

// Strip CMS credentials from the developer's shell so every project runs in the "missing" state.
const baseEnv: NodeJS.ProcessEnv = Object.fromEntries(
  Object.entries(process.env).filter(([name]) => !/^(SANITY|CONTENTFUL|STORYBLOK)_/.test(name)),
);
Object.assign(baseEnv, {
  GIT_AUTHOR_NAME: "test-matrix",
  GIT_AUTHOR_EMAIL: "test-matrix@example.invalid",
  GIT_COMMITTER_NAME: "test-matrix",
  GIT_COMMITTER_EMAIL: "test-matrix@example.invalid",
});

function exec(
  command: string,
  args: string[],
  cwd: string,
  env: NodeJS.ProcessEnv,
): Promise<{ code: number; output: string }> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, env, stdio: ["ignore", "pipe", "pipe"] });
    let output = `$ ${command} ${args.join(" ")}\n`;
    child.stdout.on("data", (chunk: Buffer) => (output += chunk.toString()));
    child.stderr.on("data", (chunk: Buffer) => (output += chunk.toString()));
    child.on("error", (error) => resolve({ code: 1, output: `${output}${String(error)}\n` }));
    child.on("close", (code) => resolve({ code: code ?? 1, output }));
  });
}

async function runCombo(combo: Combo, index: number, work: string): Promise<Outcome> {
  const id = comboId(combo);
  const dir = join(work, id);
  const env = { ...baseEnv, E2E_PORT: String(4173 + index) };
  let log = "";
  const step = async (
    name: string,
    command: string,
    args: string[],
    expect?: (output: string) => boolean,
  ) => {
    const result = await exec(command, args, dir, env);
    log += result.output;
    if (result.code !== 0 || (expect && !expect(result.output))) throw new Error(name);
    return result.output;
  };
  try {
    const gitExec: Exec = async (command, args, { cwd }) => {
      const result = await exec(command, args, cwd, env);
      log += result.output;
      if (result.code !== 0)
        throw Object.assign(new Error(result.output), { stderr: result.output });
    };
    const result = await generate({ name: id, ...combo }, dir, sourceTemplatesDir, gitExec);
    if (result.git.status !== "committed") throw new Error(`generate (git: ${result.git.status})`);
    await step("one initial commit", "git", ["rev-list", "--count", "HEAD"], (out) =>
      out.trim().endsWith("1"),
    );
    await step("pnpm install", "pnpm", ["install"]);
    await step("playwright install", "pnpm", ["exec", "playwright", "install", "chromium"]);
    await step("pnpm check", "pnpm", ["check"]);
    await step(
      "pre-commit hook",
      "git",
      ["commit", "--allow-empty", "-m", "test: pre-commit hook"],
      (out) => out.includes("pre-commit: running pnpm check"),
    );
    return { id, log };
  } catch (error) {
    return { id, failedStep: (error as Error).message, log };
  }
}

async function pool<T, R>(
  items: T[],
  size: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  let next = 0;
  const lanes = Array.from({ length: Math.min(size, items.length) }, async () => {
    for (let index = next++; index < items.length; index = next++) {
      results[index] = await worker(items[index] as T, index);
    }
  });
  await Promise.all(lanes);
  return results;
}

const { combos, concurrency, keep } = parseArgs(process.argv.slice(2));
const work = await mkdtemp(join(tmpdir(), "create-cms-app-matrix-"));
console.log(`Matrix: ${combos.length} combination(s) in ${work}`);

const outcomes = await pool(combos, concurrency, async (combo, index) => {
  const outcome = await runCombo(combo, index, work);
  await writeFile(join(work, `${outcome.id}.log`), outcome.log);
  console.log(
    outcome.failedStep ? `FAIL ${outcome.id} (${outcome.failedStep})` : `ok   ${outcome.id}`,
  );
  return outcome;
});

const failed = outcomes.filter((outcome) => outcome.failedStep);
if (failed.length > 0) {
  console.error(
    `\n${failed.length} failed. Logs: ${failed.map((o) => join(work, `${o.id}.log`)).join(" ")}`,
  );
  process.exit(1);
}
if (!keep) await rm(work, { recursive: true, force: true });
console.log(`\nAll ${outcomes.length} passed.`);
```

Add to `packages/create-cms-app/package.json` scripts: `"test:matrix": "node scripts/test-matrix.ts"`.
Add to root `package.json` scripts: `"test:matrix": "node packages/create-cms-app/scripts/test-matrix.ts"`
(direct, so flags like `--keep` reach the script without a second pnpm layer).

Run: `pnpm --filter @cms-hackathon-setup/create-cms-app check-types`
Expected: PASS.

Run: `pnpm test:matrix sanity-next`
Expected: `FAIL sanity-next (generate (...))` with `Template layer missing: frameworks/next` in
the output — the runner works, templates are missing.

- [ ] **Step 2: Create the Next.js layer**

`frameworks/next/pkg.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "check-types": "next typegen && tsc --noEmit"
  },
  "dependencies": {
    "next": "16.4.0",
    "react": "19.3.0",
    "react-dom": "19.3.0"
  },
  "devDependencies": {
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0"
  }
}
```

`frameworks/next/pnpm-workspace.json`: start with `{ "allowBuilds": {} }`; fill in from
`ERR_PNPM_IGNORED_BUILDS` (likely `sharp`) in Step 6.

`frameworks/next/next.config.ts`:

```ts
import type { NextConfig } from "next";

const config: NextConfig = {};

export default config;
```

`frameworks/next/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "es2024"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "incremental": true,
    "types": ["node"],
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", ".next/types/**/*.ts", "**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules", ".next"]
}
```

`frameworks/next/src/app/layout.tsx`:

```tsx
import type { ReactNode } from "react";

export const metadata = { title: "__PROJECT_NAME__" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

`frameworks/next/src/components/cms-status.tsx`:

```tsx
import { type CmsState, describeCmsState } from "@/lib/cms/state";

export function CmsStatus({ state }: { state: CmsState }) {
  const { title, detail } = describeCmsState(state);
  return (
    <main data-cms-state={state.kind}>
      <h1>{title}</h1>
      <p>{detail}</p>
    </main>
  );
}
```

`frameworks/next/docs/instructions/framework.md`:

```md
# Next.js

- App Router under `src/app/`. Shared components in `src/components/`. Import from `src/` with `@/`.
- Read CMS data in server components only; environment variables without `NEXT_PUBLIC_` never
  reach the browser.
- The home page is dynamic (`export const dynamic = "force-dynamic"`) so it reads the environment
  at request time.
- Every page that loads CMS content renders `CmsStatus` with the result of `loadCmsState()`, so a
  missing or broken CMS configuration shows a message instead of an error page.
- `pnpm start` listens on `PORT` (default 3000); Playwright sets it.
```

- [ ] **Step 3: Create the Sanity layer**

`cms/sanity/pkg.json`:

```json
{
  "scripts": {
    "cms:dev": "cd cms && sanity dev",
    "cms:migrate": "cd cms && sanity migration run 001-create-example --no-dry-run"
  },
  "dependencies": {
    "react": "19.3.0",
    "react-dom": "19.3.0",
    "sanity": "6.18.0",
    "styled-components": "6.5.3"
  }
}
```

`cms/sanity/pnpm-workspace.json`: `{ "allowBuilds": {} }`, filled in Step 6.

`cms/sanity/.env.example`:

```
# Read by the app (src/lib/cms/client.ts) and by the Studio in cms/.
SANITY_PROJECT_ID=
SANITY_DATASET=production
# pnpm cms:dev and pnpm cms:migrate authenticate through `pnpm exec sanity login`.
```

`cms/sanity/src/lib/cms/client.ts`:

```ts
import type { Example } from "./state";

export const requiredEnv = ["SANITY_PROJECT_ID", "SANITY_DATASET"] as const;

export const apiVersion = "2026-10-01";

export const exampleQuery = `*[_type == "example"] | order(_createdAt asc)[0]{title, body}`;

// The subset of @sanity/client that the app uses; bindings (next-sanity, @nuxtjs/sanity,
// @sanity/astro) return compatible clients.
export interface SanityFetcher {
  fetch<T>(query: string): Promise<T>;
}

export async function fetchExample(client: SanityFetcher): Promise<Example | null> {
  const document = await client.fetch<{ title?: string; body?: string } | null>(exampleQuery);
  return document ? { title: document.title ?? "", body: document.body ?? "" } : null;
}
```

`cms/sanity/tests/unit/cms-client.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { exampleQuery, fetchExample, requiredEnv } from "../../src/lib/cms/client";

describe("Sanity client", () => {
  it("requires the project and dataset", () => {
    expect(requiredEnv).toEqual(["SANITY_PROJECT_ID", "SANITY_DATASET"]);
  });

  it("queries the first example document", async () => {
    const fetch = vi.fn().mockResolvedValue({ title: "Hello", body: "World" });
    expect(await fetchExample({ fetch })).toEqual({ title: "Hello", body: "World" });
    expect(fetch).toHaveBeenCalledWith(exampleQuery);
  });

  it("returns null when no example exists", async () => {
    expect(await fetchExample({ fetch: vi.fn().mockResolvedValue(null) })).toBeNull();
  });

  it("propagates SDK errors", async () => {
    const fetch = vi.fn().mockRejectedValue(new Error("Unauthorized"));
    await expect(fetchExample({ fetch })).rejects.toThrow("Unauthorized");
  });
});
```

`cms/sanity/cms/schema-types/example.ts`:

```ts
import { defineField, defineType } from "sanity";

export const example = defineType({
  name: "example",
  title: "Example",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "body", title: "Body", type: "text" }),
  ],
});
```

`cms/sanity/cms/schema-types/index.ts`:

```ts
import { example } from "./example";

export const schemaTypes = [example];
```

`cms/sanity/cms/sanity.config.ts`:

```ts
import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./schema-types";

export default defineConfig({
  name: "default",
  title: "__PROJECT_NAME__",
  projectId: process.env.SANITY_STUDIO_PROJECT_ID ?? "",
  dataset: process.env.SANITY_STUDIO_DATASET ?? "production",
  plugins: [structureTool()],
  schema: { types: schemaTypes },
});
```

`cms/sanity/cms/sanity.cli.ts`:

```ts
import { defineCliConfig } from "sanity/cli";

// The Sanity CLI runs from cms/ and reads only SANITY_STUDIO_* variables into the Studio, so
// load the project's .env and map the app's variable names.
try {
  process.loadEnvFile("../.env");
} catch {
  // No .env yet.
}
process.env.SANITY_STUDIO_PROJECT_ID ??= process.env.SANITY_PROJECT_ID;
process.env.SANITY_STUDIO_DATASET ??= process.env.SANITY_DATASET;

export default defineCliConfig({
  api: { projectId: process.env.SANITY_PROJECT_ID, dataset: process.env.SANITY_DATASET },
});
```

`cms/sanity/cms/migrations/001-create-example/index.ts`:

```ts
import { createIfNotExists, defineMigration } from "sanity/migrate";

// Creates the example document that the home page renders. Run: pnpm cms:migrate
export default defineMigration({
  title: "Create the example document",
  async *migrate() {
    yield createIfNotExists({
      _id: "example",
      _type: "example",
      title: "Hello from Sanity",
      body: "This document was created by cms/migrations/001-create-example.",
    });
  },
});
```

`cms/sanity/docs/instructions/cms.md`:

```md
# Sanity

- Content types are schema as code in `cms/schema-types/`. Register each type in
  `cms/schema-types/index.ts`.
- The Studio runs from `cms/` with `pnpm cms:dev`. It reads `SANITY_PROJECT_ID` and
  `SANITY_DATASET` from `.env` (`cms/sanity.cli.ts`).
- Migrations live in `cms/migrations/<nnn>-<name>/index.ts`. `pnpm cms:migrate` runs the example
  migration; run others with `cd cms && pnpm exec sanity migration run <name> --no-dry-run`.
  Authenticate once with `pnpm exec sanity login`.
- The app reads content through `src/lib/cms/client.ts`. Keep queries there and test them in
  `tests/unit/cms-client.test.ts` with a mocked client.
- Every variable the app needs is listed in `requiredEnv` and in `.env.example`.
```

- [ ] **Step 4: Create the `sanity-next` combo**

`combos/sanity-next/pkg.json`:

```json
{
  "dependencies": {
    "next-sanity": "13.3.4"
  }
}
```

`combos/sanity-next/src/app/page.tsx`:

```tsx
import { createClient } from "next-sanity";
import { CmsStatus } from "@/components/cms-status";
import { apiVersion, fetchExample, requiredEnv } from "@/lib/cms/client";
import { loadCmsState, missingEnv } from "@/lib/cms/state";

export const dynamic = "force-dynamic";

export default async function Home() {
  const state = await loadCmsState(missingEnv(requiredEnv, process.env), () =>
    fetchExample(
      createClient({
        projectId: process.env.SANITY_PROJECT_ID,
        dataset: process.env.SANITY_DATASET,
        apiVersion,
        useCdn: true,
      }),
    ),
  );
  return <CmsStatus state={state} />;
}
```

- [ ] **Step 5: Generate and inspect**

Run: `pnpm test:matrix --keep sanity-next`
Expected on the first run: a failure at some step. Open the log path printed.

- [ ] **Step 6: Iterate until `sanity-next` passes**

Fix templates (never the generated copy) until `pnpm test:matrix sanity-next` prints
`ok   sanity-next`. Known adjustments:

- `ERR_PNPM_IGNORED_BUILDS`: add the named packages to the `allowBuilds` of the layer whose
  dependency pulls them in (`frameworks/next` for Next's, `cms/sanity` for Sanity's).
- Format failures: in the kept project run `pnpm format:fix`, then copy the reformatted files back
  into their template layer.
- Type errors in `cms/` from Sanity types: fix in the Sanity layer; keep `cms/` inside
  `tsconfig.json`.
- If `next typegen` does not exist in Next 16.4, use `tsc --noEmit` alone.

Check the result by hand once in the kept project: `cat package.json` (exact versions, scripts),
`ls -la` (`CLAUDE.md -> AGENTS.md`, no `.env`), `pnpm check:docs` (passes).

- [ ] **Step 7: Document and commit**

`AGENTS.md`, Tools and commands: add
`| \`pnpm test:matrix [<cms>-<framework>...]\` | Generate, install and check combinations (slow, needs network) |`.

Append to `docs/instructions/generator.md`:

```md
## Matrix test

- `pnpm test:matrix` is not part of `pnpm check`: it installs every combination from the network
  and takes minutes. Run it for the affected combinations after changing templates, and for all
  combinations before bumping template dependencies.
- Fix templates, never a generated copy. `--keep` leaves the generated projects for inspection.
- Every route renders `data-cms-state` through `loadCmsState()` and `describeCmsState()` from
  `src/lib/cms/state.ts`; the smoke test depends on it.
```

Run: `pnpm build && pnpm format:fix && git add -A packages/create-cms-app AGENTS.md docs package.json && pnpm check` → PASS.

```bash
git commit -m "feat(create-cms-app): add Next.js and Sanity templates and matrix runner"
```

---

### Task 10: Contentful layer and `contentful-next`

**Files:**

- Create under `templates/cms/contentful/`: `pkg.json`, `pnpm-workspace.json`, `.env.example`,
  `src/lib/cms/client.ts`, `tests/unit/cms-client.test.ts`, `docs/instructions/cms.md`,
  `cms/content-types/example.ts`, `cms/migrations/001-create-example.ts`, `cms/migrate.ts`
- Create under `templates/combos/contentful-next/`: `src/app/page.tsx`

**Interfaces:**

- Produces (Contentful `src/lib/cms/client.ts`): `requiredEnv`,
  `interface ContentfulEntries { getEntries(query: { content_type: string; limit: number; order: string[] }): Promise<{ items: Array<{ fields: Record<string, unknown> }> }> }`,
  `fetchExample(client: ContentfulEntries): Promise<Example | null>`,
  `createExampleLoader(env: Record<string, string | undefined>): () => Promise<Example | null>`.
  Contentful has no framework bindings, so every Contentful combo calls `createExampleLoader`.

- [ ] **Step 1: Write the client test**

`cms/contentful/tests/unit/cms-client.test.ts`:

```ts
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
```

- [ ] **Step 2: Create the layer files**

`cms/contentful/pkg.json`:

```json
{
  "scripts": {
    "cms:migrate": "node --env-file-if-exists=.env cms/migrate.ts"
  },
  "dependencies": {
    "contentful": "11.12.10"
  },
  "devDependencies": {
    "contentful-management": "12.19.0",
    "contentful-migration": "5.1.1"
  }
}
```

`cms/contentful/pnpm-workspace.json`: `{ "allowBuilds": {} }`, filled while iterating.

`cms/contentful/.env.example`:

```
# Read by the app (src/lib/cms/client.ts).
CONTENTFUL_SPACE_ID=
CONTENTFUL_ACCESS_TOKEN=
# Optional, defaults to master.
CONTENTFUL_ENVIRONMENT=
# Only for pnpm cms:migrate (a personal access token with write access).
CONTENTFUL_MANAGEMENT_TOKEN=
```

`cms/contentful/src/lib/cms/client.ts`:

```ts
import { createClient } from "contentful";
import type { Example } from "./state";

export const requiredEnv = ["CONTENTFUL_SPACE_ID", "CONTENTFUL_ACCESS_TOKEN"] as const;

// The subset of the Contentful delivery client that the app uses.
export interface ContentfulEntries {
  getEntries(query: {
    content_type: string;
    limit: number;
    order: string[];
  }): Promise<{ items: Array<{ fields: Record<string, unknown> }> }>;
}

export async function fetchExample(client: ContentfulEntries): Promise<Example | null> {
  const { items } = await client.getEntries({
    content_type: "example",
    limit: 1,
    order: ["sys.createdAt"],
  });
  const fields = items[0]?.fields;
  return fields ? { title: String(fields.title ?? ""), body: String(fields.body ?? "") } : null;
}

export function createExampleLoader(
  env: Record<string, string | undefined>,
): () => Promise<Example | null> {
  return () => {
    const client = createClient({
      space: env.CONTENTFUL_SPACE_ID ?? "",
      accessToken: env.CONTENTFUL_ACCESS_TOKEN ?? "",
      environment: env.CONTENTFUL_ENVIRONMENT || "master",
    });
    return fetchExample({ getEntries: (query) => client.getEntries(query as never) as never });
  };
}
```

(Replace the two `as never` casts with exact types if `contentful` 11's `getEntries` overloads
allow it; keep the `ContentfulEntries` interface.)

`cms/contentful/cms/content-types/example.ts`:

```ts
// Schema as code for the example content type; applied by cms/migrations/001-create-example.ts.
export const exampleContentType = {
  id: "example",
  name: "Example",
  displayField: "title",
  fields: [
    { id: "title", name: "Title", type: "Symbol", required: true },
    { id: "body", name: "Body", type: "Text", required: false },
  ],
} as const;
```

`cms/contentful/cms/migrations/001-create-example.ts`:

```ts
import type { MigrationFunction } from "contentful-migration";
import { exampleContentType } from "../content-types/example.ts";

const migration: MigrationFunction = (migration) => {
  const type = migration.createContentType(exampleContentType.id, {
    name: exampleContentType.name,
    displayField: exampleContentType.displayField,
  });
  for (const field of exampleContentType.fields) {
    type.createField(field.id, { name: field.name, type: field.type, required: field.required });
  }
};

export default migration;
```

`cms/contentful/cms/migrate.ts`:

```ts
// Creates the example content type and one published example entry. Safe to re-run.
// Run: pnpm cms:migrate
import { createClient } from "contentful-management";
import { runMigration } from "contentful-migration";
import { exampleContentType } from "./content-types/example.ts";
import migration from "./migrations/001-create-example.ts";

const required = ["CONTENTFUL_SPACE_ID", "CONTENTFUL_MANAGEMENT_TOKEN"];
const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length > 0) {
  console.error(`Missing in .env: ${missing.join(", ")}`);
  process.exit(1);
}
const spaceId = process.env.CONTENTFUL_SPACE_ID ?? "";
const environmentId = process.env.CONTENTFUL_ENVIRONMENT || "master";
const accessToken = process.env.CONTENTFUL_MANAGEMENT_TOKEN ?? "";

const client = createClient(
  { accessToken },
  { type: "plain", defaults: { spaceId, environmentId } },
);

const exists = await client.contentType
  .get({ contentTypeId: exampleContentType.id })
  .then(() => true)
  .catch(() => false);
if (exists) console.log(`Content type ${exampleContentType.id} exists, skipping migration.`);
else
  await runMigration({
    migrationFunction: migration,
    spaceId,
    environmentId,
    accessToken,
    yes: true,
  });

const entries = await client.entry.getMany({
  query: { content_type: exampleContentType.id, limit: 1 },
});
if (entries.items.length === 0) {
  const locales = await client.locale.getMany({});
  const locale = locales.items.find((item) => item.default)?.code ?? "en-US";
  const entry = await client.entry.create(
    { contentTypeId: exampleContentType.id },
    {
      fields: {
        title: { [locale]: "Hello from Contentful" },
        body: { [locale]: "This entry was created by cms/migrate.ts." },
      },
    },
  );
  await client.entry.publish({ entryId: entry.sys.id }, entry);
  console.log("Created and published the example entry.");
}
```

(Check the `contentful-management` 12 plain API and the `contentful-migration` `runMigration`
options in their `node_modules` type definitions; adjust calls, not behaviour.)

`cms/contentful/docs/instructions/cms.md`:

```md
# Contentful

- Content types are schema as code in `cms/content-types/`. Change them only through a new
  migration in `cms/migrations/<nnn>-<name>.ts`, applied in order by `cms/migrate.ts`.
- `pnpm cms:migrate` needs `CONTENTFUL_SPACE_ID` and `CONTENTFUL_MANAGEMENT_TOKEN` in `.env`.
  It is safe to re-run.
- The app reads content through `src/lib/cms/client.ts` with the delivery token. Keep queries
  there and test them in `tests/unit/cms-client.test.ts` with a mocked SDK.
- Every variable the app needs is listed in `requiredEnv` and in `.env.example`.
```

`combos/contentful-next/src/app/page.tsx`:

```tsx
import { CmsStatus } from "@/components/cms-status";
import { createExampleLoader, requiredEnv } from "@/lib/cms/client";
import { loadCmsState, missingEnv } from "@/lib/cms/state";

export const dynamic = "force-dynamic";

export default async function Home() {
  const state = await loadCmsState(
    missingEnv(requiredEnv, process.env),
    createExampleLoader(process.env),
  );
  return <CmsStatus state={state} />;
}
```

`combos/contentful-next/` has no `pkg.json`.

- [ ] **Step 3: Iterate with the matrix**

Run: `pnpm test:matrix --keep contentful-next` until it prints `ok   contentful-next`, applying
the adjustments listed in Task 9 Step 6.

- [ ] **Step 4: Commit**

Run: `pnpm build && pnpm format:fix && git add -A packages/create-cms-app && pnpm check` → PASS.

```bash
git commit -m "feat(create-cms-app): add Contentful templates"
```

---

### Task 11: Storyblok layer and `storyblok-next`

**Files:**

- Create under `templates/cms/storyblok/`: `pkg.json`, `pnpm-workspace.json`, `.env.example`,
  `src/lib/cms/client.ts`, `tests/unit/cms-client.test.ts`, `docs/instructions/cms.md`,
  `cms/components/example.ts`, `cms/migrations/001-create-example.ts`, `cms/migrate.ts`
- Create under `templates/combos/storyblok-next/`: `pkg.json`, `src/app/page.tsx`,
  `src/lib/cms/storyblok.ts`

**Interfaces:**

- Produces (Storyblok `src/lib/cms/client.ts`): `requiredEnv`,
  `type StoryblokRegion = "eu" | "us" | "ap" | "ca" | "cn"`,
  `storyblokRegion(env: Record<string, string | undefined>): StoryblokRegion`,
  `interface StoryblokApi { get(path: string, params: Record<string, unknown>): Promise<{ data: { stories?: Array<{ content?: Record<string, unknown> }> } }> }`,
  `fetchExample(api: StoryblokApi): Promise<Example | null>`.
  Migration: `up(mapi: (path: string, init?: RequestInit) => Promise<unknown>): Promise<void>`.

- [ ] **Step 1: Write the client test**

`cms/storyblok/tests/unit/cms-client.test.ts`:

```ts
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
```

- [ ] **Step 2: Create the layer files**

`cms/storyblok/pkg.json`:

```json
{
  "scripts": {
    "cms:migrate": "node --env-file-if-exists=.env cms/migrate.ts"
  }
}
```

(Bindings, and with them the delivery client, come from each combo's `pkg.json`.)

`cms/storyblok/pnpm-workspace.json`: `{ "allowBuilds": {} }`.

`cms/storyblok/.env.example`:

```
# Read by the app (src/lib/cms/client.ts): a public or preview access token of the space.
STORYBLOK_ACCESS_TOKEN=
# Optional: eu (default), us, ap, ca, cn.
STORYBLOK_REGION=
# Only for pnpm cms:migrate.
STORYBLOK_SPACE_ID=
STORYBLOK_PERSONAL_ACCESS_TOKEN=
```

`cms/storyblok/src/lib/cms/client.ts`:

```ts
import type { Example } from "./state";

export const requiredEnv = ["STORYBLOK_ACCESS_TOKEN"] as const;

export type StoryblokRegion = "eu" | "us" | "ap" | "ca" | "cn";
const regions: readonly StoryblokRegion[] = ["eu", "us", "ap", "ca", "cn"];

export function storyblokRegion(env: Record<string, string | undefined>): StoryblokRegion {
  const region = env.STORYBLOK_REGION?.trim() as StoryblokRegion | undefined;
  return region && regions.includes(region) ? region : "eu";
}

// The subset of the Storyblok delivery client that the app uses; every binding's
// useStoryblokApi()/getStoryblokApi() returns a compatible client.
export interface StoryblokApi {
  get(
    path: string,
    params: Record<string, unknown>,
  ): Promise<{ data: { stories?: Array<{ content?: Record<string, unknown> }> } }>;
}

export async function fetchExample(api: StoryblokApi): Promise<Example | null> {
  const { data } = await api.get("cdn/stories", {
    content_type: "example",
    per_page: 1,
    sort_by: "created_at:asc",
    version: "published",
  });
  const content = data.stories?.[0]?.content;
  return content ? { title: String(content.title ?? ""), body: String(content.body ?? "") } : null;
}
```

`cms/storyblok/cms/components/example.ts`:

```ts
// Schema as code for the example component; applied by cms/migrations/001-create-example.ts.
export const exampleComponent = {
  name: "example",
  display_name: "Example",
  is_root: true,
  is_nestable: false,
  schema: {
    title: { type: "text", pos: 0, required: true },
    body: { type: "textarea", pos: 1 },
  },
} as const;
```

`cms/storyblok/cms/migrations/001-create-example.ts`:

```ts
import { exampleComponent } from "../components/example.ts";

type Mapi = (path: string, init?: RequestInit) => Promise<unknown>;

// Creates the example component and one published example story, unless they exist.
export async function up(mapi: Mapi): Promise<void> {
  const { components } = (await mapi("/components")) as { components: Array<{ name: string }> };
  if (!components.some((component) => component.name === exampleComponent.name)) {
    await mapi("/components", {
      method: "POST",
      body: JSON.stringify({ component: exampleComponent }),
    });
  }
  const { stories } = (await mapi("/stories?content_type=example&per_page=1")) as {
    stories: unknown[];
  };
  if (stories.length === 0) {
    await mapi("/stories", {
      method: "POST",
      body: JSON.stringify({
        story: {
          name: "Example",
          slug: "example",
          content: {
            component: "example",
            title: "Hello from Storyblok",
            body: "This story was created by cms/migrations/001-create-example.ts.",
          },
        },
        publish: 1,
      }),
    });
  }
}
```

`cms/storyblok/cms/migrate.ts`:

```ts
// Runs the migrations in cms/migrations against the Storyblok Management API. Safe to re-run.
// Run: pnpm cms:migrate
import { up as createExample } from "./migrations/001-create-example.ts";

const hosts = {
  eu: "https://mapi.storyblok.com",
  us: "https://api-us.storyblok.com",
  ap: "https://api-ap.storyblok.com",
  ca: "https://api-ca.storyblok.com",
  cn: "https://app.storyblokchina.cn",
} as const;

const required = ["STORYBLOK_SPACE_ID", "STORYBLOK_PERSONAL_ACCESS_TOKEN"];
const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length > 0) {
  console.error(`Missing in .env: ${missing.join(", ")}`);
  process.exit(1);
}
const region = (process.env.STORYBLOK_REGION?.trim() || "eu") as keyof typeof hosts;
const base = `${hosts[region] ?? hosts.eu}/v1/spaces/${process.env.STORYBLOK_SPACE_ID}`;

async function mapi(path: string, init: RequestInit = {}): Promise<unknown> {
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      Authorization: process.env.STORYBLOK_PERSONAL_ACCESS_TOKEN ?? "",
      "Content-Type": "application/json",
    },
  });
  if (!response.ok)
    throw new Error(`${init.method ?? "GET"} ${path}: ${response.status} ${await response.text()}`);
  return response.json();
}

await createExample(mapi);
console.log("Storyblok migrations applied.");
```

`cms/storyblok/docs/instructions/cms.md`:

```md
# Storyblok

- Components are schema as code in `cms/components/`. Change them through a new migration in
  `cms/migrations/<nnn>-<name>.ts` that exports `up(mapi)`, and call it from `cms/migrate.ts`.
- `pnpm cms:migrate` needs `STORYBLOK_SPACE_ID` and `STORYBLOK_PERSONAL_ACCESS_TOKEN` in `.env`.
  It is safe to re-run.
- The app reads published stories through `src/lib/cms/client.ts`. Keep queries there and test
  them in `tests/unit/cms-client.test.ts` with a mocked client.
- Every variable the app needs is listed in `requiredEnv` and in `.env.example`.
```

- [ ] **Step 3: Create the `storyblok-next` combo**

`combos/storyblok-next/pkg.json`:

```json
{
  "dependencies": {
    "@storyblok/react": "7.3.1"
  }
}
```

`combos/storyblok-next/src/lib/cms/storyblok.ts`:

```ts
import { apiPlugin, storyblokInit } from "@storyblok/react/rsc";
import { type StoryblokApi, storyblokRegion } from "./client";

// Server-side Storyblok client for React Server Components.
export function getStoryblokApi(env: Record<string, string | undefined>): StoryblokApi {
  const getApi = storyblokInit({
    accessToken: env.STORYBLOK_ACCESS_TOKEN,
    use: [apiPlugin],
    apiOptions: { region: storyblokRegion(env) },
  });
  return getApi() as StoryblokApi;
}
```

`combos/storyblok-next/src/app/page.tsx`:

```tsx
import { CmsStatus } from "@/components/cms-status";
import { fetchExample, requiredEnv } from "@/lib/cms/client";
import { loadCmsState, missingEnv } from "@/lib/cms/state";
import { getStoryblokApi } from "@/lib/cms/storyblok";

export const dynamic = "force-dynamic";

export default async function Home() {
  const state = await loadCmsState(missingEnv(requiredEnv, process.env), () =>
    fetchExample(getStoryblokApi(process.env)),
  );
  return <CmsStatus state={state} />;
}
```

(Check `@storyblok/react` 7's README in `node_modules` for the RSC entry point and init API.)

- [ ] **Step 4: Iterate with the matrix**

Run: `pnpm test:matrix --keep storyblok-next` until `ok   storyblok-next` (Task 9 Step 6 list).
Then run `pnpm test:matrix --concurrency 3 sanity-next contentful-next storyblok-next` → all ok.

- [ ] **Step 5: Commit**

Run: `pnpm build && pnpm format:fix && git add -A packages/create-cms-app && pnpm check` → PASS.

```bash
git commit -m "feat(create-cms-app): add Storyblok templates"
```

---

### Task 12: Nuxt base and its three combos

**Files:**

- Create under `templates/frameworks/nuxt/`: `pkg.json`, `pnpm-workspace.json`, `nuxt.config.ts`,
  `tsconfig.json`, `tsconfig.tools.json`, `src/app.vue`, `src/components/CmsStatus.vue`,
  `docs/instructions/framework.md`
- Create `templates/combos/contentful-nuxt/`: `server/api/cms-state.get.ts`, `src/pages/index.vue`
- Create `templates/combos/sanity-nuxt/`: `pkg.json`, `nuxt.config.ts`, `src/pages/index.vue`
- Create `templates/combos/storyblok-nuxt/`: `pkg.json`, `nuxt.config.ts`, `src/pages/index.vue`

**Interfaces:**

- Consumes: CMS client modules (Tasks 9–11), `CmsState` helpers (Task 8).
- Produces: `src/components/CmsStatus.vue` with prop `state: CmsState`, auto-imported by Nuxt.

- [ ] **Step 1: Create the Nuxt layer**

`frameworks/nuxt/pkg.json`:

```json
{
  "scripts": {
    "dev": "nuxt dev",
    "build": "nuxt build",
    "start": "node --env-file-if-exists=.env .output/server/index.mjs",
    "check-types": "nuxt typecheck",
    "postinstall": "nuxt prepare"
  },
  "dependencies": {
    "nuxt": "4.6.0",
    "vue": "3.5.43"
  },
  "devDependencies": {
    "vue-tsc": "3.3.12"
  }
}
```

`frameworks/nuxt/pnpm-workspace.json`: `{ "allowBuilds": {} }`.

`frameworks/nuxt/nuxt.config.ts`:

```ts
export default defineNuxtConfig({
  srcDir: "src/",
  compatibilityDate: "2026-10-01",
  devtools: { enabled: false },
});
```

`frameworks/nuxt/tsconfig.json`:

```json
{
  "files": [],
  "references": [
    { "path": "./.nuxt/tsconfig.app.json" },
    { "path": "./.nuxt/tsconfig.server.json" },
    { "path": "./.nuxt/tsconfig.shared.json" },
    { "path": "./.nuxt/tsconfig.node.json" },
    { "path": "./tsconfig.tools.json" }
  ]
}
```

`frameworks/nuxt/tsconfig.tools.json` (type-checks code outside Nuxt's own projects):

```json
{
  "compilerOptions": {
    "composite": true,
    "target": "es2024",
    "lib": ["es2024", "dom"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "skipLibCheck": true,
    "types": ["node"]
  },
  "include": [
    "cms/**/*.ts",
    "scripts/**/*.ts",
    "tests/**/*.ts",
    "playwright.config.ts",
    "vitest.config.ts",
    "src/lib/**/*.ts"
  ]
}
```

Check against `nuxt typecheck` output in Nuxt 4.6: if Nuxt's generated tsconfig layout differs,
mirror what `nuxi init` generates for 4.6 and keep `tsconfig.tools.json` as the extra reference.

`frameworks/nuxt/src/app.vue`:

```vue
<template>
  <NuxtPage />
</template>
```

`frameworks/nuxt/src/components/CmsStatus.vue`:

```vue
<script setup lang="ts">
import { computed } from "vue";
import { type CmsState, describeCmsState } from "~/lib/cms/state";

const props = defineProps<{ state: CmsState }>();
const text = computed(() => describeCmsState(props.state));
</script>

<template>
  <main :data-cms-state="props.state.kind">
    <h1>{{ text.title }}</h1>
    <p>{{ text.detail }}</p>
  </main>
</template>
```

`frameworks/nuxt/docs/instructions/framework.md`:

```md
# Nuxt

- `srcDir` is `src/`: pages in `src/pages/`, components in `src/components/` (auto-imported).
  Server routes live in `server/` at the project root.
- Load CMS data on the server (server routes or SSR `useAsyncData`), never with secrets in the
  browser. The home page renders `CmsStatus` with the result of `loadCmsState()`.
- `pnpm start` serves `.output/` with `.env` loaded and listens on `PORT`.
- Code outside Nuxt's directories (`cms/`, `scripts/`, `tests/`) is type-checked through
  `tsconfig.tools.json`.
```

- [ ] **Step 2: Create `contentful-nuxt`**

`combos/contentful-nuxt/server/api/cms-state.get.ts`:

```ts
import { createExampleLoader, requiredEnv } from "~/lib/cms/client";
import { loadCmsState, missingEnv } from "~/lib/cms/state";

export default defineEventHandler(() =>
  loadCmsState(missingEnv(requiredEnv, process.env), createExampleLoader(process.env)),
);
```

`combos/contentful-nuxt/src/pages/index.vue`:

```vue
<script setup lang="ts">
import type { CmsState } from "~/lib/cms/state";

const { data: state } = await useFetch<CmsState>("/api/cms-state");
</script>

<template>
  <CmsStatus v-if="state" :state="state" />
</template>
```

- [ ] **Step 3: Create `sanity-nuxt`** (binding `@nuxtjs/sanity`, SSR via `useSanity()`)

`combos/sanity-nuxt/pkg.json`: `{ "dependencies": { "@nuxtjs/sanity": "2.5.0" } }`.

`combos/sanity-nuxt/nuxt.config.ts`:

```ts
import { apiVersion } from "./src/lib/cms/client";

export default defineNuxtConfig({
  srcDir: "src/",
  compatibilityDate: "2026-10-01",
  devtools: { enabled: false },
  modules: ["@nuxtjs/sanity"],
  // A placeholder project ID keeps the module working without credentials; the page checks the
  // real variables before it queries.
  sanity: {
    projectId: process.env.SANITY_PROJECT_ID || "not-configured",
    dataset: process.env.SANITY_DATASET || "production",
    apiVersion,
    useCdn: true,
  },
  runtimeConfig: {
    sanityProjectId: process.env.SANITY_PROJECT_ID ?? "",
    sanityDataset: process.env.SANITY_DATASET ?? "",
  },
});
```

`combos/sanity-nuxt/src/pages/index.vue`:

```vue
<script setup lang="ts">
import { fetchExample, requiredEnv } from "~/lib/cms/client";
import { loadCmsState, missingEnv } from "~/lib/cms/state";

const config = useRuntimeConfig();
const sanity = useSanity();
const { data: state } = await useAsyncData("cms-state", () =>
  loadCmsState(
    missingEnv(requiredEnv, {
      SANITY_PROJECT_ID: config.sanityProjectId,
      SANITY_DATASET: config.sanityDataset,
    }),
    () => fetchExample(sanity.client),
  ),
);
</script>

<template>
  <CmsStatus v-if="state" :state="state" />
</template>
```

`runtimeConfig` keys are server-only, and `useAsyncData` runs during SSR and hydrates from the
payload, so the variables never reach the browser. Use the `@nuxtjs/sanity` 2.5 README for the
exact client accessor (`useSanity().client` or `useSanity().fetch`); keep `fetchExample`.

- [ ] **Step 4: Create `storyblok-nuxt`** (binding `@storyblok/nuxt`)

`combos/storyblok-nuxt/pkg.json`: `{ "dependencies": { "@storyblok/nuxt": "11.2.1" } }`.

`combos/storyblok-nuxt/nuxt.config.ts`:

```ts
import { storyblokRegion } from "./src/lib/cms/client";

export default defineNuxtConfig({
  srcDir: "src/",
  compatibilityDate: "2026-10-01",
  devtools: { enabled: false },
  modules: ["@storyblok/nuxt"],
  storyblok: {
    accessToken: process.env.STORYBLOK_ACCESS_TOKEN ?? "",
    apiOptions: { region: storyblokRegion(process.env) },
  },
  runtimeConfig: {
    storyblokAccessToken: process.env.STORYBLOK_ACCESS_TOKEN ?? "",
  },
});
```

`combos/storyblok-nuxt/src/pages/index.vue`:

```vue
<script setup lang="ts">
import { fetchExample, requiredEnv, type StoryblokApi } from "~/lib/cms/client";
import { loadCmsState, missingEnv } from "~/lib/cms/state";

const config = useRuntimeConfig();
const api = useStoryblokApi() as StoryblokApi;
const { data: state } = await useAsyncData("cms-state", () =>
  loadCmsState(
    missingEnv(requiredEnv, { STORYBLOK_ACCESS_TOKEN: config.storyblokAccessToken }),
    () => fetchExample(api),
  ),
);
</script>

<template>
  <CmsStatus v-if="state" :state="state" />
</template>
```

Storyblok access tokens for published content are public by design, so `@storyblok/nuxt`
exposing it to the browser is acceptable; record this in the combo's `nuxt.config.ts` comment.

- [ ] **Step 5: Iterate with the matrix**

Run: `pnpm test:matrix --keep --concurrency 3 contentful-nuxt sanity-nuxt storyblok-nuxt` until all
three print `ok` (Task 9 Step 6 list). If a binding cannot build without credentials even with a
placeholder, fall back to its plain SDK in that combo and record why in the combo's
`nuxt.config.ts` comment.

- [ ] **Step 6: Commit**

Run: `pnpm build && pnpm format:fix && git add -A packages/create-cms-app && pnpm check` → PASS.

```bash
git commit -m "feat(create-cms-app): add Nuxt templates"
```

---

### Task 13: Astro base and its three combos

**Files:**

- Create under `templates/frameworks/astro/`: `pkg.json`, `pnpm-workspace.json`, `astro.config.ts`,
  `tsconfig.json`, `src/layouts/Layout.astro`, `src/components/CmsStatus.astro`,
  `docs/instructions/framework.md`
- Create `templates/combos/contentful-astro/src/pages/index.astro`
- Create `templates/combos/sanity-astro/`: `pkg.json`, `astro.config.ts`, `src/env.d.ts`,
  `src/pages/index.astro`
- Create `templates/combos/storyblok-astro/`: `pkg.json`, `astro.config.ts`, `src/pages/index.astro`

- [ ] **Step 1: Create the Astro layer**

`frameworks/astro/pkg.json`:

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "start": "node --env-file-if-exists=.env dist/server/entry.mjs",
    "check-types": "astro check"
  },
  "dependencies": {
    "@astrojs/node": "11.1.7",
    "astro": "7.3.7"
  },
  "devDependencies": {
    "@astrojs/check": "0.9.10"
  }
}
```

`frameworks/astro/pnpm-workspace.json`: `{ "allowBuilds": {} }`.

`frameworks/astro/astro.config.ts`:

```ts
import node from "@astrojs/node";
import { defineConfig } from "astro/config";

// Server code reads process.env; load .env for `astro dev` and `astro build` as well.
try {
  process.loadEnvFile(".env");
} catch {
  // No .env: pages render the "CMS not configured" state.
}

export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
});
```

`frameworks/astro/tsconfig.json`:

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "allowImportingTsExtensions": true,
    "types": ["node"]
  },
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

`frameworks/astro/src/layouts/Layout.astro`:

```astro
---
---

<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>__PROJECT_NAME__</title>
  </head>
  <body>
    <slot />
  </body>
</html>
```

`frameworks/astro/src/components/CmsStatus.astro`:

```astro
---
import { type CmsState, describeCmsState } from "../lib/cms/state";

interface Props {
  state: CmsState;
}

const { state } = Astro.props;
const { title, detail } = describeCmsState(state);
---

<main data-cms-state={state.kind}>
  <h1>{title}</h1>
  <p>{detail}</p>
</main>
```

`frameworks/astro/docs/instructions/framework.md`:

```md
# Astro

- Server output with the Node adapter: pages in `src/pages/` render on each request.
- Server code reads `process.env`; `astro.config.ts` loads `.env` for dev and build. Restart
  `pnpm dev` after changing `.env`.
- The home page renders `CmsStatus` with the result of `loadCmsState()`.
- `pnpm start` serves `dist/server/entry.mjs` with `.env` loaded and listens on `PORT`.
```

- [ ] **Step 2: Create `contentful-astro`**

`combos/contentful-astro/src/pages/index.astro`:

```astro
---
import CmsStatus from "../components/CmsStatus.astro";
import Layout from "../layouts/Layout.astro";
import { createExampleLoader, requiredEnv } from "../lib/cms/client";
import { loadCmsState, missingEnv } from "../lib/cms/state";

const state = await loadCmsState(missingEnv(requiredEnv, process.env), createExampleLoader(process.env));
---

<Layout><CmsStatus state={state} /></Layout>
```

- [ ] **Step 3: Create `sanity-astro`** (binding `@sanity/astro`, `sanity:client`)

`combos/sanity-astro/pkg.json`:

```json
{
  "dependencies": {
    "@sanity/astro": "3.5.1",
    "@sanity/client": "8.9.0",
    "react-is": "19.3.0"
  }
}
```

`combos/sanity-astro/astro.config.ts`:

```ts
import node from "@astrojs/node";
import sanity from "@sanity/astro";
import { defineConfig } from "astro/config";
import { apiVersion } from "./src/lib/cms/client";

try {
  process.loadEnvFile(".env");
} catch {
  // No .env: pages render the "CMS not configured" state.
}

export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
  // A placeholder project ID keeps the integration working without credentials; the page checks
  // the real variables before it queries.
  integrations: [
    sanity({
      projectId: process.env.SANITY_PROJECT_ID || "not-configured",
      dataset: process.env.SANITY_DATASET || "production",
      apiVersion,
      useCdn: true,
    }),
  ],
});
```

`combos/sanity-astro/src/env.d.ts`:

```ts
/// <reference types="@sanity/astro/module" />
```

`combos/sanity-astro/src/pages/index.astro`:

```astro
---
import { sanityClient } from "sanity:client";
import CmsStatus from "../components/CmsStatus.astro";
import Layout from "../layouts/Layout.astro";
import { fetchExample, requiredEnv } from "../lib/cms/client";
import { loadCmsState, missingEnv } from "../lib/cms/state";

const state = await loadCmsState(missingEnv(requiredEnv, process.env), () => fetchExample(sanityClient));
---

<Layout><CmsStatus state={state} /></Layout>
```

- [ ] **Step 4: Create `storyblok-astro`** (binding `@storyblok/astro`)

`combos/storyblok-astro/pkg.json`: `{ "dependencies": { "@storyblok/astro": "10.3.2" } }`.

`combos/storyblok-astro/astro.config.ts`:

```ts
import node from "@astrojs/node";
import { storyblok } from "@storyblok/astro";
import { defineConfig } from "astro/config";
import { storyblokRegion } from "./src/lib/cms/client";

try {
  process.loadEnvFile(".env");
} catch {
  // No .env: pages render the "CMS not configured" state.
}

export default defineConfig({
  output: "server",
  adapter: node({ mode: "standalone" }),
  integrations: [
    storyblok({
      accessToken: process.env.STORYBLOK_ACCESS_TOKEN ?? "",
      apiOptions: { region: storyblokRegion(process.env) },
    }),
  ],
});
```

`combos/storyblok-astro/src/pages/index.astro`:

```astro
---
import { useStoryblokApi } from "@storyblok/astro";
import CmsStatus from "../components/CmsStatus.astro";
import Layout from "../layouts/Layout.astro";
import { fetchExample, requiredEnv, type StoryblokApi } from "../lib/cms/client";
import { loadCmsState, missingEnv } from "../lib/cms/state";

const state = await loadCmsState(missingEnv(requiredEnv, process.env), () =>
  fetchExample(useStoryblokApi() as StoryblokApi),
);
---

<Layout><CmsStatus state={state} /></Layout>
```

(Check the default vs named export of `@storyblok/astro` 10 and `@sanity/astro` 3 in their
READMEs in `node_modules`.)

- [ ] **Step 5: Iterate with the matrix**

Run: `pnpm test:matrix --keep --concurrency 3 contentful-astro sanity-astro storyblok-astro` until
all three print `ok`. Same fallback rule as Task 12 Step 5.

- [ ] **Step 6: Commit**

Run: `pnpm build && pnpm format:fix && git add -A packages/create-cms-app && pnpm check` → PASS.

```bash
git commit -m "feat(create-cms-app): add Astro templates"
```

---

### Task 14: SvelteKit base and its three combos

**Files:**

- Create under `templates/frameworks/sveltekit/`: `pkg.json`, `pnpm-workspace.json`,
  `svelte.config.ts` (or `.js`, see below), `vite.config.ts`, `tsconfig.json`, `src/app.html`,
  `src/app.d.ts`, `src/lib/components/CmsStatus.svelte`, `src/routes/+page.svelte`,
  `docs/instructions/framework.md`
- Create `templates/combos/contentful-sveltekit/src/routes/+page.server.ts`
- Create `templates/combos/sanity-sveltekit/`: `pkg.json`, `src/routes/+page.server.ts`
- Create `templates/combos/storyblok-sveltekit/`: `pkg.json`, `src/routes/+page.server.ts`

The page component is identical for every CMS, so it lives in the framework layer; each combo
provides only the `+page.server.ts` load function.

- [ ] **Step 1: Create the SvelteKit layer**

`frameworks/sveltekit/pkg.json`:

```json
{
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "start": "node --env-file-if-exists=.env build",
    "check-types": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json"
  },
  "devDependencies": {
    "@sveltejs/adapter-node": "6.0.0",
    "@sveltejs/kit": "3.0.1",
    "@sveltejs/vite-plugin-svelte": "7.3.1",
    "svelte": "5.57.2",
    "svelte-check": "4.7.6",
    "vite": "8.3.3"
  }
}
```

`frameworks/sveltekit/pnpm-workspace.json`: `{ "allowBuilds": {} }`.

`frameworks/sveltekit/svelte.config.ts` — use `.ts` if SvelteKit 3 loads it; otherwise
`svelte.config.js` with the comment `// SvelteKit 3 does not load svelte.config.ts.`:

```ts
import adapter from "@sveltejs/adapter-node";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter(),
    typescript: {
      // Type-check code outside src/ as well.
      config: (config: { include: string[] }) => {
        config.include.push(
          "../cms/**/*.ts",
          "../scripts/**/*.ts",
          "../tests/**/*.ts",
          "../playwright.config.ts",
          "../vitest.config.ts",
        );
        return config;
      },
    },
  },
};
```

`frameworks/sveltekit/vite.config.ts`:

```ts
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({ plugins: [sveltekit()] });
```

`frameworks/sveltekit/tsconfig.json`:

```json
{
  "extends": "./.svelte-kit/tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "allowImportingTsExtensions": true,
    "skipLibCheck": true,
    "types": ["node"]
  }
}
```

`frameworks/sveltekit/src/app.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>__PROJECT_NAME__</title>
    %sveltekit.head%
  </head>
  <body>
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
```

`frameworks/sveltekit/src/app.d.ts`:

```ts
declare global {
  namespace App {}
}

export {};
```

(If `namespace` conflicts with `erasableSyntaxOnly`, it does not: a `declare global` ambient
namespace erases. Keep it as SvelteKit generates it.)

`frameworks/sveltekit/src/lib/components/CmsStatus.svelte`:

```svelte
<script lang="ts">
  import { type CmsState, describeCmsState } from "$lib/cms/state";

  let { state }: { state: CmsState } = $props();
  const text = $derived(describeCmsState(state));
</script>

<main data-cms-state={state.kind}>
  <h1>{text.title}</h1>
  <p>{text.detail}</p>
</main>
```

`frameworks/sveltekit/src/routes/+page.svelte`:

```svelte
<script lang="ts">
  import CmsStatus from "$lib/components/CmsStatus.svelte";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
</script>

<CmsStatus state={data.state} />
```

`frameworks/sveltekit/docs/instructions/framework.md`:

```md
# SvelteKit

- Routes in `src/routes/`; load CMS data in `+page.server.ts` so secrets stay on the server.
  Shared code in `src/lib/` (import with `$lib`).
- Read variables through `$env/dynamic/private`; it reads `.env` in dev and the process
  environment in production.
- The home page renders `CmsStatus` with the `state` returned by its load function.
- `pnpm start` serves `build/` with the Node adapter, `.env` loaded, listening on `PORT`.
```

- [ ] **Step 2: Create the three load functions**

`combos/contentful-sveltekit/src/routes/+page.server.ts`:

```ts
import { env } from "$env/dynamic/private";
import { createExampleLoader, requiredEnv } from "$lib/cms/client";
import { loadCmsState, missingEnv } from "$lib/cms/state";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => ({
  state: await loadCmsState(missingEnv(requiredEnv, env), createExampleLoader(env)),
});
```

`combos/sanity-sveltekit/pkg.json`: `{ "dependencies": { "@sanity/client": "8.9.0" } }`.

`combos/sanity-sveltekit/src/routes/+page.server.ts`:

```ts
// @sanity/sveltekit supports SvelteKit 2 only, so this combo uses @sanity/client directly.
import { env } from "$env/dynamic/private";
import { createClient } from "@sanity/client";
import { apiVersion, fetchExample, requiredEnv } from "$lib/cms/client";
import { loadCmsState, missingEnv } from "$lib/cms/state";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => ({
  state: await loadCmsState(missingEnv(requiredEnv, env), () =>
    fetchExample(
      createClient({
        projectId: env.SANITY_PROJECT_ID,
        dataset: env.SANITY_DATASET,
        apiVersion,
        useCdn: true,
      }),
    ),
  ),
});
```

`combos/storyblok-sveltekit/pkg.json`: `{ "dependencies": { "@storyblok/svelte": "7.3.2" } }`.

`combos/storyblok-sveltekit/src/routes/+page.server.ts`:

```ts
import { env } from "$env/dynamic/private";
import { apiPlugin, storyblokInit, useStoryblokApi } from "@storyblok/svelte";
import { fetchExample, requiredEnv, type StoryblokApi, storyblokRegion } from "$lib/cms/client";
import { loadCmsState, missingEnv } from "$lib/cms/state";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => ({
  state: await loadCmsState(missingEnv(requiredEnv, env), () => {
    storyblokInit({
      accessToken: env.STORYBLOK_ACCESS_TOKEN,
      use: [apiPlugin],
      apiOptions: { region: storyblokRegion(env) },
    });
    return fetchExample(useStoryblokApi() as StoryblokApi);
  }),
});
```

- [ ] **Step 3: Iterate with the matrix**

Run: `pnpm test:matrix --keep --concurrency 3 contentful-sveltekit sanity-sveltekit storyblok-sveltekit`
until all three print `ok`. Same fallback rule as Task 12 Step 5.

- [ ] **Step 4: Commit**

Run: `pnpm build && pnpm format:fix && git add -A packages/create-cms-app && pnpm check` → PASS.

```bash
git commit -m "feat(create-cms-app): add SvelteKit templates"
```

---

### Task 15: Snapshot matrix in `pnpm check`, README and full verification

**Files:**

- Create: `packages/create-cms-app/src/matrix.test.ts`
- Create: `packages/create-cms-app/README.md`
- Modify: root `package.json` (`verify:git-install` template files), `AGENTS.md`,
  `docs/instructions/generator.md`
- Create (generated): `packages/create-cms-app/src/__snapshots__/matrix.test.ts.snap`

**Interfaces:**

- Consumes: everything above.

- [ ] **Step 1: Write the snapshot matrix test**

```ts
import { readFile } from "node:fs/promises";
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
  "docs/instructions/cms.md",
  "docs/instructions/framework.md",
  "docs/instructions/linting-and-formatting.md",
  "docs/instructions/testing.md",
  "package.json",
  "playwright.config.ts",
  "pnpm-workspace.yaml",
  "scripts/check-docs.ts",
  "src/lib/cms/client.ts",
  "src/lib/cms/state.ts",
  "tests/e2e/smoke.spec.ts",
  "tests/unit/cms-client.test.ts",
  "tests/unit/cms-state.test.ts",
  "tsconfig.json",
  "vitest.config.ts",
];

const CMS_FILES: Record<Cms, string[]> = {
  sanity: [
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
  if (entry?.kind !== "file") throw new Error(`missing ${path}`);
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
      for (const name of required.match(/[A-Z_]+/g) ?? [])
        expect(text(all, ".env.example")).toContain(`${name}=`);
    });

    it("passes check-docs when written", async () => {
      const target = join(await makeTempDir(), id);
      await writeProject(target, await entries());
      expect(checkDocs(target).errors).toEqual([]);
      expect(await readFile(join(target, "CLAUDE.md"), "utf8")).toBe(
        await readFile(join(target, "AGENTS.md"), "utf8"),
      );
    });
  },
);
```

- [ ] **Step 2: Run it**

Run: `pnpm --filter @cms-hackathon-setup/create-cms-app test`
Expected: PASS and 12 snapshots written. If a combo fails, fix its templates and re-run
`pnpm test:matrix <combo>` for it.

- [ ] **Step 3: Verify packed template files through the git URL**

Change the root script to:

```json
"verify:git-install": "VERIFY_TEMPLATE_FILES='common/.githooks/pre-commit common/_gitignore common/.oxlintrc.json cms/sanity/.env.example' sh packages/create-cms-app/scripts/verify-git-install.sh"
```

- [ ] **Step 4: Write the README**

`packages/create-cms-app/README.md`:

````md
# create-cms-app

Scaffolds a single-package TypeScript project for Sanity, Contentful or Storyblok with Next.js,
Nuxt, Astro or SvelteKit.

```sh
npx --yes git+<repository-url>
# or
pnpm dlx git+<repository-url>
```

Answer the prompts (project name, CMS, framework), confirm the summary, then follow the printed
next steps.

## Manual check with real content

Run once per CMS after changing a CMS layer, with a scratch space or project:

1. Generate a project for the CMS with any framework, `pnpm install`, `cp .env.example .env`.
2. Fill in every variable in `.env`, including the migration-only ones.
3. Sanity: `pnpm exec sanity login`, then `pnpm cms:migrate`. Contentful and Storyblok:
   `pnpm cms:migrate`.
4. `pnpm dev`, open the home page: it shows "Hello from <CMS>" (`data-cms-state="example"`).
5. Break a token in `.env`, restart: the page shows "Could not load content from the CMS".
6. Sanity only: `pnpm cms:dev` opens the Studio with the example document.
````

Leave `<repository-url>` as is: the URL is an open question in task.md. Record that in the
report to the user.

- [ ] **Step 5: Final docs**

`AGENTS.md` Project section: replace the TODO comment with
`This repository builds create-cms-app, a generator for agent-ready CMS projects used at hackathons. See packages/create-cms-app/README.md.`
Check the Layout and commands sections match what exists (`test:matrix`, `verify:git-install`,
`check:bundle`).

Append to `docs/instructions/generator.md` under "Matrix test":

```md
- `src/matrix.test.ts` runs in `pnpm check` without network: it plans all combinations and checks
  required and forbidden files, `package.json` and docs. Update its snapshots with
  `pnpm --filter @cms-hackathon-setup/create-cms-app test -u` only after reviewing the diff.
- After changing a CMS layer, run the manual check in the generator README for that CMS.
```

- [ ] **Step 6: Full verification**

Run, in order, and confirm each:

1. `pnpm build && pnpm format:fix && git add -A && pnpm check` → PASS.
2. `pnpm test:matrix --concurrency 4` → `All 12 passed.`
3. `git commit -m "test(create-cms-app): add snapshot matrix and README"` → pre-commit runs
   `pnpm check` and passes.
4. `pnpm verify:git-install` → four `ok` lines.
5. Interactive run from a scratch directory:
   `npx --yes git+file://$(git rev-parse --show-toplevel)` → prompts in order name, CMS,
   framework, summary, confirm; the project is created with one commit; next steps printed.
6. Same, answering a name of an existing non-empty directory → error, exit code 1, directory
   unchanged.
7. Same, with git hidden: `PATH=$(dirname $(which node)) npx --yes git+file://…` → warning
   "git not found", exit 0. (`pnpm` and `npx` must still be on that `PATH`; if `npx` is not next to
   `node`, run `node <repo>/packages/create-cms-app/dist/cli.mjs` with that `PATH` instead.)

Report the result of every item. If 2 fails for some combinations, report which and why rather
than declaring done.
