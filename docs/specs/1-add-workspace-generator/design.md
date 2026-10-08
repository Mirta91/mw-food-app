# 1-add-workspace-generator — design

Design for [task.md](task.md). The task defines what is built; this file defines how.

## Decisions

| Topic               | Decision                                                                                                   |
| ------------------- | ---------------------------------------------------------------------------------------------------------- |
| Distribution        | Committed, self-contained bundle in root `dist/`, exposed through `bin` in the root `package.json`.        |
| Demo route          | One idiomatic route file per CMS × framework combination (12 files).                                       |
| CMS integration     | Official framework bindings wherever they exist; plain SDK where none exist (Contentful).                  |
| Layer composition   | Ordered layers, later layer replaces whole files, `package.json` fragments are deep-merged.                |
| Matrix test         | Offline snapshot matrix inside `pnpm check`; full install-and-check matrix as separate `pnpm test:matrix`. |
| CI                  | Not part of this spec. `pnpm test:matrix` runs locally.                                                    |
| Design doc location | Next to the task, following this repository's spec layout.                                                 |

### Why a committed bundle

`npx <git-url>` and `pnpm dlx <git-url>` install the repository root as a package, so the `bin`
must live in the root `package.json`; npm has no syntax to select a subdirectory. Node does not
strip TypeScript types inside `node_modules`, so a `.ts` entry cannot run directly. Building in a
`prepare` script at install time is fragile: pnpm blocks dependency lifecycle scripts by default,
every run would install dev dependencies, and the root `prepare` already configures git hooks.
A committed bundle with all dependencies inlined has no install-time build and installs fast.

## Package layout

```
packages/create-cms-app/            # final name is an open question in task.md
  src/
    cli.ts                          # entry: prompts → plan → write → git → next steps
    prompts.ts                      # @clack/prompts: name, CMS, framework, confirm
    plan.ts                         # pure: choices → list of {path, contents | symlink}
    layers.ts                       # layer resolution, file override, package.json merge
    write.ts                        # empty-directory check, atomic write, CLAUDE.md symlink
    git.ts                          # git detection, init, initial commit
  templates/
    common/                         # AGENTS.md, docs/instructions/*, scripts/check-docs.ts,
                                    # .githooks/pre-commit, oxlint/oxfmt config,
                                    # Vitest/Playwright base config, _gitignore
    frameworks/{next,nuxt,astro,sveltekit}/
    cms/{sanity,contentful,storyblok}/
                                    # cms/ folder (schema, example type, migration),
                                    # .env.example, Example type
    combos/{sanity,contentful,storyblok}-{next,nuxt,astro,sveltekit}/
                                    # route, client wiring, framework config overrides,
                                    # client unit test where the binding differs
  test/                             # unit tests and snapshot matrix
  scripts/test-matrix.ts            # full matrix, filterable by combination
dist/create-cms-app.mjs             # committed bundle
dist/templates/**                   # copied templates
```

- The root `package.json` gains `"bin": { "<name>": "dist/create-cms-app.mjs" }`.
- The bundle is built with tsdown or esbuild and inlines every dependency, so it has no runtime
  dependencies.
- **Freshness guard:** `pnpm check` rebuilds the bundle and fails if `git diff --exit-code dist/`
  reports changes. The pre-commit hook therefore keeps the committed bundle in sync with the
  source.
- **Root `prepare` guard:** npm runs `prepare` when it installs a git dependency. The root
  `prepare` must do nothing outside this repository's working tree (for example, only run
  `git config core.hooksPath .githooks` when `.githooks/` exists and the directory is the
  repository top level).
- **Template file names:** `package.json` fragments are stored as `pkg.json` so that the pnpm
  workspace and other tooling do not treat template folders as packages. `.gitignore` is stored
  as `_gitignore` and renamed on write.
- Templates are excluded from root lint, format and type checks. They are validated through the
  matrix test.

## Generator flow

1. **Prompts** with `@clack/prompts`, in order: project name, CMS, framework, then a summary with
   confirmation. A cancelled prompt or a declined confirmation prints "Cancelled", exits 0 and
   writes nothing.
   - The project name must be a valid npm package name (lowercase, `-`, no spaces), because it is
     both the directory and the `package.json` name. An invalid name is re-prompted inline.
2. **Target check**, after confirmation and before any write: resolve the name against the current
   directory. If the directory exists and is not empty, print an error and exit 1. An existing
   empty directory is accepted.
3. **Plan** (`plan.ts`, pure): walk the layers `common → frameworks/<fw> → cms/<cms> →
   combos/<cms>-<fw>` and build a map from relative path to entry; a later layer replaces an
   earlier one. `pkg.json` fragments are deep-merged: objects merge, scalars take the later value,
   arrays are replaced. The token `__PROJECT_NAME__` is replaced in text files. `CLAUDE.md` is a
   symlink entry pointing to `AGENTS.md`.
4. **Write** (`write.ts`): write into a sibling temporary directory (`.<name>.tmp-<random>`), then
   rename it to the target. On failure the temporary directory is removed and the target is left
   untouched.
5. **Git** (`git.ts`): probe with `git --version`.
   - Missing: print a warning and continue.
   - Present: `git init -b main`, `git add -A`, `git commit -m "chore: initial project"`.
   - If the commit fails (for example, no `user.email`), print a warning with a hint and still
     exit 0. The repository stays initialized with the files staged.
   - Hooks are not active yet because `pnpm install` has not run `prepare`, so the initial commit
     does not run `pnpm check`. This is intended.
6. **Next steps:** `cd <name>`, `pnpm install`, `pnpm exec playwright install`,
   `cp .env.example .env` and fill it in, `pnpm dev`.

**Exit codes:** 0 on success, on cancel and on git warnings. 1 on a non-empty target, a write
failure or an unexpected error. Errors print a message; the stack trace only with `DEBUG` set.

**Symlink fallback:** if creating the `CLAUDE.md` symlink fails (for example, on Windows without
developer mode), copy `AGENTS.md` instead and print a warning.

## Generated project

```
<name>/
  AGENTS.md
  CLAUDE.md -> AGENTS.md
  docs/instructions/{testing,linting-and-formatting,cms}.md
  scripts/check-docs.ts             # run with node, using native type stripping
  .githooks/pre-commit              # runs pnpm check
  cms/                              # schema as code, example type, migration
  src/ …                            # framework-native layout
  tests/unit/cms-client.test.ts
  tests/e2e/smoke.spec.ts
  .env.example  .gitignore  .oxlintrc.json  .oxfmtrc.json
  tsconfig.json  vitest.config.ts  playwright.config.ts  package.json
```

### Scripts

Every combination uses the same script names:

| Script                    | Purpose                                                                   |
| ------------------------- | ------------------------------------------------------------------------- |
| `dev` / `build` / `start` | Framework commands                                                        |
| `lint`                    | oxlint                                                                    |
| `format` / `format:fix`   | oxfmt check / apply                                                       |
| `check-types`             | `tsc --noEmit` (Next.js), `nuxi typecheck`, `astro check`, `svelte-check` |
| `test`                    | `vitest run`                                                              |
| `test:smoke`              | `playwright test --grep @smoke`                                           |
| `test:e2e`                | all Playwright tests                                                      |
| `check:docs`              | `node scripts/check-docs.ts`                                              |
| `check`                   | lint, format, check-types, test, test:smoke, check:docs                   |
| `prepare`                 | `git config core.hooksPath .githooks`                                     |
| `cms:dev`                 | Sanity only: `sanity dev` in `cms/`                                       |
| `cms:migrate`             | Run the example migration                                                 |

### Engines

`engines.node` is set to the active Node LTS at implementation time (Node 24 today; Node 26
enters LTS in late October 2026), verified when the templates are written. `devEngines` enforces
pnpm the same way this repository does.

### `cms/` per CMS

- **Sanity:** `sanity.config.ts`, `sanity.cli.ts`, `schemaTypes/example.ts`,
  `migrations/001-create-example/index.ts` run through `sanity migration run`. The Studio runs
  through `sanity dev` from `cms/`.
- **Contentful:** `content-types/example.ts` and `migrations/001-create-example.ts` using
  `contentful-migration` programmatically, run with `node`.
- **Storyblok:** `components/example.ts` with the component schema, and
  `migrations/001-create-example.ts` that pushes the schema through the Management API, run with
  `node`.

### CMS integration per combination

Each combination uses the official binding where one exists: `next-sanity`, `@nuxtjs/sanity`,
`@sanity/astro`, `@storyblok/react`, `@storyblok/nuxt`, `@storyblok/astro`,
`@storyblok/svelte`, and the Sanity SvelteKit integration if it is current when the templates are
written. Contentful, and any combination without a maintained binding, uses the plain SDK. The
combination layer
ships the route, the client wiring, any framework config file that needs the binding (for example
`nuxt.config.ts`, `astro.config.mjs`) and its `pkg.json` fragment with the binding dependencies.

### Missing environment

Each combination reads environment variables in its framework's idiom. When required keys are
missing, the client factory returns the list of missing keys instead of throwing, and the route
renders: "CMS not configured. Missing: X, Y. Copy .env.example to .env." The page responds with
200 in both states.

### Tests

- **Client unit test:** mocks the SDK or `fetch` with `vi.mock`, asserts the request shape and the
  mapping to `Example`. Shared per CMS; overridden per combination where the binding changes the
  client.
- **Smoke test** (tagged `@smoke`): starts the app, opens the home page, asserts status 200 and
  that either the example title or the missing-environment message is visible.

### `check-docs.ts`

A single TypeScript source in `templates/common/scripts/`. It ports the instruction link rules
from this repository's `scripts/check-instruction-links.mjs` and adds its own relative link and
anchor checker, replacing lychee. It is unit-tested inside the generator package.

## Testing this repository

### In `pnpm check` (fast, offline)

- **Unit tests:** layer order and override, `pkg.json` merge, token replacement and the symlink
  entry in `plan.ts`; project name validation; the target directory check; the git step with a
  mocked `execFile` (git present, git missing, commit fails).
- **`check-docs.ts` tests:** a dead link, a dead anchor, an unlinked instruction file, a
  twice-linked instruction file and a link from an instruction file to an unlisted one each fail;
  a clean fixture passes.
- **Snapshot matrix:** for all 12 combinations, run `plan()` and assert
  - the required files: route, client, `cms/` schema, example type and migration, `.env.example`,
    unit test, smoke test, `AGENTS.md`, `CLAUDE.md` symlink, `docs/instructions/`;
  - the forbidden files and content: `.env`, `mise.toml`, `.agents/`, `.claude/skills/`, any
    lychee reference;
  - a snapshot of the merged `package.json`.
- **Bundle freshness:** rebuild and `git diff --exit-code dist/`.
- **CLI integration:** run the built bundle in a temporary directory with scripted prompt answers
  (through an injected prompt adapter): cancelling writes nothing, declining writes nothing, a
  non-empty target exits 1 and stays unchanged, the happy path creates a repository with one
  commit, and a `PATH` without git prints a warning and exits 0.

### `pnpm test:matrix [combo…]` (slow, needs network)

For each selected combination, in a temporary directory: generate, `pnpm install`,
`pnpm exec playwright install chromium`, `pnpm check`, then make a commit in the project and
assert that the pre-commit hook ran `pnpm check`. Combinations run sequentially by default;
`--concurrency <n>` runs several at once. The script prints a pass/fail table and exits non-zero
if any combination fails.

### Manual

- Rendering real content with credentials and the migrated content type, per CMS: a checklist in
  the generator README.
- Running via `npx` and `pnpm dlx` from the GitLab URL: once the URL exists (open question in
  task.md).

## First step: distribution spike

Before the implementation tasks, verify with a local bare repository (`file://` URL) that
`npx git+file://…` and `pnpm dlx git+file://…` run the committed bundle, and that the root
`prepare` guard does not fail or modify anything during the install.
