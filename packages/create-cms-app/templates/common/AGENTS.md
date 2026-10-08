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

__PROJECT_NAME__ is a __FRAMEWORK__ app that loads its content from __CMS__.

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
