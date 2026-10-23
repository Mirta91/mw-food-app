# Fail Fast on CMS Errors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generated projects check required CMS variables at server startup and leave a missing
example and CMS errors to the framework's 404 and error handling, instead of rendering a
`CmsState` on the page.

**Architecture:** A common `src/lib/cms/env.ts` provides `missingEnv`/`assertEnv`; each framework
layer calls `assertEnv` from its startup hook. Home routes in the 12 combos load the example
directly and use the framework's 404 call; errors propagate. `pnpm test:smoke` goes through a
wrapper that skips Playwright when variables are missing. The matrix script gains steps that prove
`build` passes and `dev`/`start` refuse to run without `.env`.

**Tech Stack:** TypeScript templates for Next.js 16, Nuxt 4, SvelteKit 3, Astro 7; Vitest;
Playwright; Node 24 (runs `.ts` scripts natively).

**Spec:** `docs/specs/2-fail-fast-on-cms-errors/task.md`

## Global Constraints

- Templates live in `packages/create-cms-app/templates/`; fix templates, never a generated copy.
  Layer rules and tokens: `docs/instructions/generator.md`.
- Code style for templates and repository: `docs/instructions/code-style.md` (types with `type`,
  braces always, exports before internals).
- CMS clients stay created per request from runtime env; nothing reads CMS variables in
  `next.config.ts`, `nuxt.config.ts`, `vite.config.ts` or Astro integration options.
- `pnpm build`, `pnpm check-types` and `pnpm lint` in a generated project pass without `.env`.
- `requiredEnv` in each CMS layer's `src/lib/cms/client.ts` stays the only list of required
  variables.
- Startup error message, exactly:
  `Missing environment variables: <A>, <B>. Copy .env.example to .env and fill them in.`
- Smoke skip message, exactly:
  `Smoke test skipped: missing <A>, <B>. Copy .env.example to .env to run it.`
- No custom 404 or error pages, no slug routing, no change to `fetchExample()` or `cms/`.
- Every commit: `pnpm build` (from the repository root, refreshes `dist/`), stage `dist/`, and
  `pnpm check` passes (it is the pre-commit hook).

## Review Focus

- A variable set to an empty or whitespace-only value in `.env` counts as missing, at startup and
  in the smoke wrapper. Pinned in Task 1 (`assertEnv` test with `" "`).
- A partially filled `.env` names only the variables still missing. Pinned in Task 1.
- Optional variables (`STORYBLOK_REGION`, `CONTENTFUL_ENVIRONMENT`) left unset do not stop the
  server. Holds because only `requiredEnv` is checked; Task 1's test passes an env without them.
- Variables provided by the shell instead of `.env` (CI, deployment) satisfy both the startup
  check and the smoke wrapper. Pinned in Task 3 (wrapper reads `process.env` after
  `loadEnvFile`, which does not override existing values).
- A Storyblok SDK rejection with a plain object (not an `Error`) still yields a 500 page, not a
  crashed server. Pinned in Task 8's manual check, step 5, with the Storyblok layer.

---

### Task 1: Shared env check

**Files:**

- Create: `packages/create-cms-app/templates/common/src/lib/cms/env.ts`
- Create: `packages/create-cms-app/templates/common/src/lib/cms/example.ts`
- Create: `packages/create-cms-app/templates/common/tests/unit/cms-env.test.ts`
- Modify: `packages/create-cms-app/templates/common/src/lib/cms/state.ts` (re-export `Example`
  from `./example` and `missingEnv` from `./env`; removed in Task 8)
- Modify: `packages/create-cms-app/templates/cms/{contentful,sanity,storyblok}/src/lib/cms/client.ts`
  (`import type { Example } from "./example";`)
- Modify: `packages/create-cms-app/src/common-layer.test.ts` (file list)

**Interfaces:**

- Produces:
  - `export type Example = { title: string; body: string };` in `example.ts`
  - `export function missingEnv(required: readonly string[], env: Record<string, string | undefined>): string[]`
  - `export function assertEnv(required: readonly string[], env: Record<string, string | undefined>): void`
    — throws `Error` with the startup message from Global Constraints, listing missing names in
    `required` order; returns when none is missing.

- [ ] **Step 1: Write `tests/unit/cms-env.test.ts`**

```ts
describe("missingEnv", () => {
  it("lists unset and blank variables in order", () => {
    expect(missingEnv(["A", "B", "C"], { A: "x", B: " ", C: undefined })).toEqual(["B", "C"]);
  });
});

describe("assertEnv", () => {
  it("names every missing variable", () => {
    expect(() => assertEnv(["A", "B", "C"], { B: "x", C: " " })).toThrow(
      "Missing environment variables: A, C. Copy .env.example to .env and fill them in.",
    );
  });

  it("passes when every required variable is set, ignoring others", () => {
    expect(() => assertEnv(["A"], { A: "x" })).not.toThrow();
  });
});
```

- [ ] **Step 2: Implement `env.ts` and `example.ts`; move `missingEnv` out of `state.ts`**

`state.ts` keeps working for the routes until Task 8 through
`export type { Example } from "./example";` and `export { missingEnv } from "./env";`.
`tests/unit/cms-state.test.ts` keeps passing unchanged.

- [ ] **Step 3: Update the common-layer file list**

Add `src/lib/cms/env.ts`, `src/lib/cms/example.ts`, `tests/unit/cms-env.test.ts` to the expected
list in `src/common-layer.test.ts`.

- [ ] **Step 4: Verify**

Run: `pnpm build && pnpm check` (repository root). Expected: passes.
Run: `pnpm test:matrix contentful-next`. Expected: `ok contentful-next` (the generated unit tests,
including `cms-env.test.ts`, pass).

- [ ] **Step 5: Commit**

```bash
git add packages/create-cms-app
git commit -m "feat(create-cms-app): add a shared check for required CMS variables"
```

### Task 2: Matrix proves the startup check

**Files:**

- Modify: `packages/create-cms-app/scripts/test-matrix.ts`
- Modify: `docs/instructions/generator.md` (Matrix test section)

**Interfaces:**

- Consumes: the startup message from Global Constraints.
- Produces: matrix steps `pnpm build`, `pnpm start refuses without env`,
  `pnpm dev refuses without env`, run after `pnpm check` and before the pre-commit hook step.

- [ ] **Step 1: Give `exec` a timeout**

`exec(command, args, cwd, env, timeoutMs?)`: spawn with `detached: true`; on timeout kill the
process group (`process.kill(-child.pid, "SIGKILL")`) and resolve with
`{ code: 1, output: output + "timed out after <n> ms\n" }`. Without `timeoutMs`, behaviour is
unchanged.

- [ ] **Step 2: Add the three steps**

- `pnpm build`: must exit 0.
- `pnpm start` and `pnpm dev`, each with a 120 s timeout: the step passes only when the exit code
  is non-zero, the output contains `Missing environment variables:`, and it contains every name
  from the generated project's `requiredEnv`. Read the names with the same regex
  `src/matrix.test.ts` uses (`/requiredEnv = \[([^\]]*)\]/` on `src/lib/cms/client.ts`, then
  `/[A-Z_]+/g`). A refusal step inverts the exit-code check of `step`; add an `expectFailure`
  option rather than a second helper.

- [ ] **Step 3: Document**

In `docs/instructions/generator.md` → Matrix test, add: the matrix runs without CMS variables and
checks that `pnpm build` passes and `pnpm dev`/`pnpm start` exit with the missing-variables
message.

- [ ] **Step 4: Verify the steps fail today**

Run: `pnpm test:matrix contentful-next`. Expected: `FAIL contentful-next (pnpm start refuses
without env)` — the server currently starts. Log shows the timeout.

- [ ] **Step 5: Commit**

`pnpm check` passes (the script is not part of it). Commit with
`test(create-cms-app): check startup refusal without CMS variables in the matrix`.

### Task 3: Smoke wrapper

**Files:**

- Create: `packages/create-cms-app/templates/common/scripts/smoke.ts`
- Modify: `packages/create-cms-app/templates/common/pkg.json` (`"test:smoke": "node scripts/smoke.ts"`)
- Modify: `packages/create-cms-app/templates/common/tests/e2e/smoke.spec.ts`
- Modify: `packages/create-cms-app/templates/common/playwright.config.ts` (comment only)
- Modify: `packages/create-cms-app/templates/common/docs/instructions/testing.md`
- Modify: `packages/create-cms-app/src/common-layer.test.ts` (file list),
  `packages/create-cms-app/src/__snapshots__/matrix.test.ts.snap`
- Possibly modify: `packages/create-cms-app/templates/frameworks/sveltekit/tsconfig.json`

**Interfaces:**

- Consumes: `missingEnv` from `src/lib/cms/env.ts`, `requiredEnv` from `src/lib/cms/client.ts`.
- Produces: `pnpm test:smoke` exits 0 with the skip message when variables are missing, otherwise
  runs `playwright test --grep @smoke` with inherited stdio and its exit code.

- [ ] **Step 1: Write `scripts/smoke.ts`**

Order: `try { process.loadEnvFile(".env") } catch {}`, compute `missingEnv(requiredEnv,
process.env)`, print the skip message and exit 0 if non-empty, else `spawnSync("pnpm", ["exec",
"playwright", "test", "--grep", "@smoke"], { stdio: "inherit" })` and exit with its status.
Import with `.ts` extensions (Node runs it directly). If `pnpm check-types` in a SvelteKit project
rejects the `.ts` import, add `"allowImportingTsExtensions": true` to the SvelteKit `tsconfig.json`.

- [ ] **Step 2: Rewrite the smoke test**

```ts
test("home page renders the example @smoke", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page.locator("main h1")).toBeVisible();
});
```

- [ ] **Step 3: Docs and comments**

- `playwright.config.ts`: the `.env` comment no longer mentions a "CMS not configured" state; the
  smoke wrapper only starts Playwright when the variables are set.
- `testing.md`: replace the last bullet with: smoke tests run only when the required variables
  are set; `pnpm test:smoke` skips them with a message otherwise, so `pnpm check` passes without
  credentials. Assert on status and page structure, not on CMS content.

- [ ] **Step 4: Update repository tests**

Add `scripts/smoke.ts` to `src/common-layer.test.ts`. Run
`pnpm --filter @cms-fe-scaffolding/create-cms-app test -u`, review that the snapshot diff only
changes `test:smoke`.

- [ ] **Step 5: Verify**

Run: `pnpm build && pnpm check`. Expected: passes.
Run: `pnpm test:matrix sanity-sveltekit`. Expected: `pnpm check` step passes and its log shows
`Smoke test skipped: missing SANITY_PROJECT_ID, SANITY_DATASET.`; the run then fails at
`pnpm start refuses without env` (Task 2, still expected).

- [ ] **Step 6: Commit** `feat(create-cms-app): skip the smoke test without CMS variables`.

### Task 4: Next.js

**Files:**

- Create: `packages/create-cms-app/templates/frameworks/next/src/instrumentation.ts`
- Modify: `packages/create-cms-app/templates/combos/{contentful,sanity,storyblok}-next/src/app/page.tsx`
- Delete: `packages/create-cms-app/templates/frameworks/next/src/components/cms-status.tsx`
- Modify: `packages/create-cms-app/templates/frameworks/next/docs/instructions/framework.md`

**Interfaces:**

- Consumes: `assertEnv`, `requiredEnv`, `Example`, each combo's existing loader
  (`createExampleLoader(process.env)()`, `fetchExample(...)`).
- Produces: `export function register(): void`.

- [ ] **Step 1: `instrumentation.ts`**

`register()` calls `assertEnv(requiredEnv, process.env)` unless
`process.env.NEXT_PHASE === "phase-production-build"`.

- [ ] **Step 2: Home pages**

Each `page.tsx` keeps `dynamic = "force-dynamic"` and its client creation, awaits the example,
calls `notFound()` (from `next/navigation`) when it is `null`, and renders
`<main><h1>{example.title}</h1><p>{example.body}</p></main>`. No try/catch.

- [ ] **Step 3: Docs**

`framework.md`: replace the `CmsStatus` bullet with: required variables are checked in
`src/instrumentation.ts` when the server starts; pages call `notFound()` for missing content and
let CMS errors reach Next's error page.

- [ ] **Step 4: Verify**

Run: `pnpm build && pnpm check`, then
`pnpm test:matrix contentful-next sanity-next storyblok-next`. Expected: all `ok`.
If `pnpm dev` or `pnpm start` keeps running after `register()` throws, catch in `register()`,
`console.error(error.message)` and `process.exit(1)`; rerun.

- [ ] **Step 5: Commit** `feat(create-cms-app): fail fast on CMS errors in Next.js projects`.

### Task 5: Nuxt

**Files:**

- Create: `packages/create-cms-app/templates/frameworks/nuxt/server/plugins/check-env.ts`
- Create: `packages/create-cms-app/templates/combos/{contentful,sanity,storyblok}-nuxt/server/api/example.get.ts`
- Delete: `packages/create-cms-app/templates/combos/{contentful,sanity,storyblok}-nuxt/server/api/cms-state.get.ts`
- Modify: `packages/create-cms-app/templates/frameworks/nuxt/src/pages/index.vue`
- Delete: `packages/create-cms-app/templates/frameworks/nuxt/src/components/CmsStatus.vue`
- Modify: `packages/create-cms-app/templates/combos/{sanity,storyblok}-nuxt/nuxt.config.ts` (comment
  names `server/api/example.get.ts`)
- Modify: `packages/create-cms-app/templates/frameworks/nuxt/docs/instructions/framework.md`

**Interfaces:**

- Consumes: `assertEnv`, `requiredEnv`, `Example`, each combo's existing client creation.
- Produces: `GET /api/example` → `Example`, or `createError({ statusCode: 404, statusMessage: "No example content" })`.

- [ ] **Step 1: Nitro plugin** — `defineNitroPlugin(() => assertEnv(requiredEnv, process.env))`.

- [ ] **Step 2: `example.get.ts` per combo** — same client creation as the deleted
      `cms-state.get.ts`; throws the 404 above when `fetchExample` returns `null`; other errors
      propagate (Nitro answers 500).

- [ ] **Step 3: `index.vue`** — `useFetch<Example>("/api/example")`; when `error.value` is set,
      `throw createError({ ...error.value, fatal: true })` so Nuxt renders its error page with the
      original status; otherwise render `<main><h1>{{ data.title }}</h1><p>{{ data.body }}</p></main>`.

- [ ] **Step 4: Docs** — `framework.md`: the home page fetches `server/api/example.get.ts`;
      required variables are checked in `server/plugins/check-env.ts` when the server starts; missing
      content and CMS errors go to Nuxt's error page.

- [ ] **Step 5: Verify** — `pnpm build && pnpm check`, then
      `pnpm test:matrix contentful-nuxt sanity-nuxt storyblok-nuxt`. Expected: all `ok`. Same
      `console.error` + `process.exit(1)` fallback as Task 4 if the dev or production server keeps
      running.

- [ ] **Step 6: Commit** `feat(create-cms-app): fail fast on CMS errors in Nuxt projects`.

### Task 6: SvelteKit

**Files:**

- Create: `packages/create-cms-app/templates/frameworks/sveltekit/src/hooks.server.ts`
- Modify: `packages/create-cms-app/templates/combos/{contentful,sanity,storyblok}-sveltekit/src/routes/+page.server.ts`
- Modify: `packages/create-cms-app/templates/combos/{contentful,sanity,storyblok}-sveltekit/src/env.ts`
  (comment only; variables stay optional so `build` and `check-types` pass without `.env`)
- Modify: `packages/create-cms-app/templates/frameworks/sveltekit/src/routes/+page.svelte`
- Delete: `packages/create-cms-app/templates/frameworks/sveltekit/src/lib/components/CmsStatus.svelte`
- Modify: `packages/create-cms-app/templates/frameworks/sveltekit/docs/instructions/framework.md`

**Interfaces:**

- Consumes: `assertEnv`, `requiredEnv`, `Example`, each combo's existing loader.
- Produces: `export const init: ServerInit`; page data `{ example: Example }`.

- [ ] **Step 1: `hooks.server.ts`** — `init` calls `assertEnv(requiredEnv, env)` with
      `import * as env from "$app/env/private"`.

- [ ] **Step 2: Load functions** — return `{ example }`; `error(404, "No example content")` from
      `@sveltejs/kit` when `null`; no try/catch.

- [ ] **Step 3: `+page.svelte`** — renders `<main><h1>{data.example.title}</h1><p>{data.example.body}</p></main>`.

- [ ] **Step 4: Docs and comments** — `env.ts` comment: optional so `build` and `check-types` run
      without `.env`; `hooks.server.ts` checks them at startup. `framework.md`: replace the
      "reports missing ones" and `CmsStatus` text accordingly.

- [ ] **Step 5: Verify** — `pnpm build && pnpm check`, then
      `pnpm test:matrix contentful-sveltekit sanity-sveltekit storyblok-sveltekit`. Expected: all `ok`.
      If `pnpm dev` only runs `init` on the first request, add a Vite plugin with `apply: "serve"` in
      `vite.config.ts` whose `configureServer` hook loads `.env` (`process.loadEnvFile`, ignore a
      missing file) and calls `assertEnv(requiredEnv, process.env)`; it reads the variables only in
      dev, so the build-time rule in Global Constraints still holds. Same `process.exit(1)` fallback
      as Task 4.

- [ ] **Step 6: Commit** `feat(create-cms-app): fail fast on CMS errors in SvelteKit projects`.

### Task 7: Astro

**Files:**

- Modify: `packages/create-cms-app/templates/frameworks/astro/astro.config.ts`
- Create: `packages/create-cms-app/templates/frameworks/astro/scripts/check-env.ts`
- Modify: `packages/create-cms-app/templates/frameworks/astro/pkg.json` (`start`)
- Modify: `packages/create-cms-app/templates/combos/{contentful,sanity,storyblok}-astro/src/pages/index.astro`
- Delete: `packages/create-cms-app/templates/frameworks/astro/src/components/CmsStatus.astro`
- Modify: `packages/create-cms-app/templates/frameworks/astro/docs/instructions/framework.md`
- Modify: `packages/create-cms-app/src/__snapshots__/matrix.test.ts.snap`

**Interfaces:**

- Consumes: `assertEnv`, `requiredEnv`, `Example`.
- Produces: `start` =
  `node --env-file-if-exists=.env scripts/check-env.ts && node --env-file-if-exists=.env dist/server/entry.mjs`.

- [ ] **Step 1: Dev check** — inline integration in `astro.config.ts`:
      `{ name: "check-env", hooks: { "astro:config:setup": ({ command }) => { if (command === "dev") { assertEnv(requiredEnv, process.env); } } } }`.
      Imports use `./src/lib/cms/env.ts` and `./src/lib/cms/client.ts`. Update the `.env` comment
      (no "CMS not configured" state).

- [ ] **Step 2: Start check** — `scripts/check-env.ts` calls `assertEnv(requiredEnv, process.env)`;
      on error prints `error.message` to stderr and exits 1. Set `start` as above.

- [ ] **Step 3: Pages** — each `index.astro` keeps its client creation; when the example is
      `null`, `return new Response(null, { status: 404, statusText: "Not Found" })`; otherwise renders
      `<Layout><main><h1>{example.title}</h1><p>{example.body}</p></main></Layout>`.

- [ ] **Step 4: Docs** — `framework.md`: replace the `CmsStatus` text; state that `astro dev`
      checks the variables through the integration in `astro.config.ts` and `pnpm start` through
      `scripts/check-env.ts`, and that a deployment that does not use `pnpm start` skips the check.

- [ ] **Step 5: Snapshot** — `pnpm --filter @cms-fe-scaffolding/create-cms-app test -u`; diff
      changes only the Astro `start` scripts.

- [ ] **Step 6: Verify** — `pnpm build && pnpm check`, then
      `pnpm test:matrix contentful-astro sanity-astro storyblok-astro`. Expected: all `ok`.

- [ ] **Step 7: Commit** `feat(create-cms-app): fail fast on CMS errors in Astro projects`.

### Task 8: Remove the state machine and finish the docs

**Files:**

- Delete: `packages/create-cms-app/templates/common/src/lib/cms/state.ts`,
  `packages/create-cms-app/templates/common/tests/unit/cms-state.test.ts`
- Modify: `packages/create-cms-app/src/common-layer.test.ts`, `packages/create-cms-app/src/matrix.test.ts`
- Modify: `packages/create-cms-app/templates/cms/{contentful,sanity,storyblok}/README.md`
- Modify: `packages/create-cms-app/README.md` (Manual check with real content)
- Modify: `docs/instructions/generator.md` (the `data-cms-state` bullet)

**Interfaces:**

- Consumes: everything above; nothing imports `state.ts` any more.

- [ ] **Step 1: Write the failing test** — in `src/matrix.test.ts` add, per combination:

```ts
it("contains no CMS state machine", async () => {
  for (const entry of await entries()) {
    if (entry.kind === "file") {
      expect(entry.contents.toString("utf8"), entry.path).not.toMatch(
        /describeCmsState|loadCmsState|CmsState|CmsStatus|data-cms-state/,
      );
    }
  }
});
```

Run: `pnpm --filter @cms-fe-scaffolding/create-cms-app test`. Expected: FAIL on `state.ts`.

- [ ] **Step 2: Delete** `state.ts` and `cms-state.test.ts`; in `REQUIRED` replace
      `src/lib/cms/state.ts` and `tests/unit/cms-state.test.ts` with `src/lib/cms/env.ts`,
      `src/lib/cms/example.ts`, `tests/unit/cms-env.test.ts`, `scripts/smoke.ts`; update the
      common-layer list. Run the test again. Expected: PASS.

- [ ] **Step 3: Docs**
  - CMS READMEs: without `.env`, `pnpm dev` stops and names the missing variables; with wrong
    values the page shows the framework's error page and the CMS error is in the server log.
  - Generator README manual check: step 4 expects "Hello from <CMS>" (no `data-cms-state`);
    step 5 expects the framework's error page (status 500) and the error in the server log; add
    a step: unpublish or delete the example, reload, expect status 404.
  - `generator.md`: replace the `data-cms-state` bullet with: home routes render the example,
    call the framework's 404 for missing content and let CMS errors reach the framework's error
    page; the required variables are checked at server startup (see each `framework.md`).
  - Check nothing else mentions the old behaviour:
    `grep -rn "CmsStatus\|cms-state\|data-cms-state\|not configured" packages/create-cms-app/templates packages/create-cms-app/README.md docs/instructions`
    returns nothing.

- [ ] **Step 4: Verify everything**

Run: `pnpm build && pnpm check`. Expected: passes.
Run: `pnpm test:matrix --concurrency 3`. Expected: `All 12 passed.`
Manual check with real content (generator README) for each CMS the team has credentials for;
report any CMS not checked instead of claiming criteria 3–5 of the spec.

- [ ] **Step 5: Commit** `refactor(create-cms-app): remove the CMS state machine from templates`.
