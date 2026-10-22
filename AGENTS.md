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

This repository builds create-cms-app, a generator for agent-ready CMS projects used at
hackathons. See packages/create-cms-app/README.md.

## Tools and commands

Tools are declared in `mise.toml`; pnpm is enforced through `devEngines` in `package.json`.
This is a pnpm workspace orchestrated by Turborepo.

| Command                                       | Purpose                                                                                          |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `mise install`                                | Install pnpm and lychee                                                                          |
| `pnpm install`                                | Install dependencies and activate the git hooks in `.githooks/`                                  |
| `pnpm build` / `dev` / `check-types` / `test` | Run the task in all packages through turbo                                                       |
| `pnpm test:watch`                             | Run tests in watch mode                                                                          |
| `pnpm lint` / `pnpm lint:fix`                 | Lint the whole repository with oxlint                                                            |
| `pnpm format` / `pnpm format:fix`             | Check or apply formatting with oxfmt                                                             |
| `pnpm check:docs`                             | Check dead links, anchors and the instruction link rules                                         |
| `pnpm check`                                  | Run lint, format, check-types, test, build, check:bundle and check:docs; runs as pre-commit hook |
| `pnpm verify:git-install`                     | Check that the committed bundle runs from a git URL                                              |
| `pnpm test:matrix [<cms>-<framework>...]`     | Generate, install and check combinations (slow, needs network)                                   |

## Layout

- `apps/` — deployable applications.
- `packages/` — shared libraries and configs.
- `packages/create-cms-app/` — the generator; its `dist/` is committed.
- `.agents/skills/` — agent skills, installed and locked through `skills-lock.json`.
  `.claude/skills/` symlinks into it. Do not edit installed skills here; change them at their
  source.
- `docs/instructions/` — instruction files (see rules above).
- `docs/specs/<n>-<kebab-name>/task.md` — specs written by the `define-spec` skill.
- `scripts/` — repository tooling.
- `.githooks/` — versioned git hooks, activated through the `postinstall` script.

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

- [Turborepo](docs/instructions/turborepo.md) — before changing `turbo.json`, task scripts or
  adding a package under `apps/` or `packages/`
- [Code style](docs/instructions/code-style.md) — before writing or changing TypeScript or
  JavaScript code
- [Testing](docs/instructions/testing.md) — before writing, running or configuring tests
- [Linting and formatting](docs/instructions/linting-and-formatting.md) — before changing lint or
  format rules, or when a lint or format check fails
- [Generator](docs/instructions/generator.md) — before changing the generator, its templates or how it is distributed
