# 1-add-workspace-generator

Add a generator, run with `npx` or `pnpm dlx` from a git URL, that scaffolds an opinionated,
agent-ready TypeScript project for a chosen CMS and web framework.

## Problem

Hackathon teams start every project by hand-wiring a web framework to a CMS and then adding
linting, formatting, tests and agent instructions. This costs hours of the hackathon, and every
team ends up with a different setup, so agents and people cannot rely on a shared structure,
shared commands or a shared definition of done.

## Goal

A team runs one command against the private GitLab repository, answers three prompts, and gets a
single-app TypeScript project for one of Sanity, Contentful or Storyblok combined with one of
Next.js, Nuxt, Astro or SvelteKit. After `pnpm install` the project passes its own `pnpm check`
without any CMS credentials, shows a page rendered from the CMS once credentials are filled in,
and contains an `AGENTS.md` with a definition of done that any coding agent runs before finishing
a task.

## Scope

### In scope

- A generator package in this repository, runnable via `npx` and `pnpm dlx` from the private
  GitLab git URL.
- Interactive prompts for project name, CMS and web framework.
- Bundled templates owned by this repository: one base per framework (Next.js, Nuxt, Astro,
  SvelteKit) and one overlay per CMS (Sanity, Contentful, Storyblok), covering all 12
  combinations.
- In every generated project:
  - The app itself, as a single package (no workspace, no Turborepo).
  - An api client for the chosen CMS.
  - A top-level `cms/` folder in the same package with schema-as-code, one example content type
    and one example migration. For Sanity this includes the Studio configuration, run via
    `sanity dev` from `cms/`. Scripts to run them live in the root `package.json`. The folder is
    always generated.
  - One route that loads the example content type through the api client and renders it, and
    shows a clear message when the CMS environment variables are missing.
  - `.env.example` listing the keys the chosen CMS needs.
  - TypeScript, oxlint, oxfmt, Vitest and Playwright configured.
  - A Vitest unit test for the api client with a mocked fetch or SDK, runnable without
    credentials.
  - A Playwright smoke test that starts the app and checks the home page renders.
  - `AGENTS.md` plus a `CLAUDE.md` symlink to it, modelled on this repository's: rules for editing
    the file, project overview, layout, commands, conventions, a definition of done, and links to
    `docs/instructions/` files.
  - A bundled Node script behind `pnpm check:docs` that checks dead relative links and anchors in
    `AGENTS.md` and `docs/**/*.md`, and the instruction link rules 3, 4 and 7.
  - A versioned pre-commit hook in `.githooks/` that runs `pnpm check`, activated through the
    `prepare` script.
  - A fresh git repository with an initial commit.
- A matrix test in this repository that generates all 12 combinations and runs their checks, plus
  unit tests for the generator logic.

### Out of scope (non-goals)

- The generator does not use or call AI agents. It only writes the agent instruction file.
- No agent skills are shipped. Skills define the team's workflow and are chosen by the team.
- No mise and no lychee in generated projects.
- No publishing to npm or to the GitLab package registry.
- No monorepo or Turborepo in generated projects.
- No prompts for secrets, IDs or tokens; the generator writes `.env.example` only, never `.env`.
- No dependency installation and no `playwright install`; the generator only prints these as next
  steps.
- No command-line flags or non-interactive mode.
- No overwriting of, or merging into, an existing non-empty directory.
- No use of official `create-*` CLIs (create-next-app, nuxi, create-astro, sv).
- No resolving of latest dependency versions at generation time.
- No CMS options beyond Sanity, Contentful, Storyblok, and no framework options beyond Next.js,
  Nuxt, Astro, SvelteKit.

## Behavior

1. The user runs the generator with `npx` or `pnpm dlx` and the GitLab git URL.
2. The generator prompts, in this order:
   1. Project name. It is also the target directory, relative to the current directory.
   2. CMS: Sanity, Contentful or Storyblok.
   3. Web framework: Next.js, Nuxt, Astro or SvelteKit.
3. The generator shows a summary of the choices and asks for confirmation. If the user declines
   or cancels any prompt (for example with Ctrl+C), it exits and writes nothing.
4. If the target directory exists and is not empty, the generator prints an error, writes nothing
   and exits with a non-zero code.
5. The generator writes the framework base template and the CMS overlay into the target
   directory, with the project name filled in.
6. If `git` is available, the generator runs `git init` and creates an initial commit containing
   all generated files. If `git` is not available, it prints a warning, skips this step and still
   finishes successfully.
7. The generator prints next steps: change into the directory, `pnpm install`,
   `pnpm exec playwright install`, copy `.env.example` to `.env` and fill it in, `pnpm dev`.

In the generated project:

- `pnpm check` runs lint, format check, type check, Vitest, the Playwright smoke tests only, and
  `check:docs`. Further e2e tests, if the team adds them, run through a separate script.
- The definition of done in `AGENTS.md` requires the agent to run `pnpm check` and have it pass
  before reporting a task as done.
- The demo route renders the example content when the environment is filled in, and a message
  naming the missing variables when it is not. It does not crash.

## Constraints & assumptions

- Everything is TypeScript: the generator, the templates and the generated code.
- The generator must run directly from the git URL without a publish step.
- Users have access to the private GitLab instance.
- Generated projects enforce pnpm through `devEngines` in `package.json` and set `engines.node` to
  the current Node LTS.
- Template dependency versions are pinned and bumped manually; the matrix test guards upgrades.
- Running the example migration and seeing real content requires an existing CMS space or project
  and credentials provided by the team.

## Acceptance criteria

- [ ] Running the generator via `npx` and via `pnpm dlx` from the GitLab git URL starts the
      prompts in the order project name, CMS, framework, then shows a summary and asks to confirm.
- [ ] For each of the 12 CMS × framework combinations, the generated project passes
      `pnpm install` followed by `pnpm check` without any CMS credentials.
- [ ] In each generated project the demo route shows a message naming the missing variables when
      `.env` is absent, and the Playwright smoke test passes in that state.
- [ ] With valid credentials and the example content type created via the `cms/` migration, the
      demo route renders the example content, for each CMS.
- [ ] Each generated project contains the app, the api client, the `cms/` folder with schema, one
      example content type and one migration, `.env.example`, a Vitest client test and a
      Playwright smoke test.
- [ ] Each generated project contains `AGENTS.md` with editing rules and a definition of done,
      `CLAUDE.md` as a symlink to it, and `docs/instructions/` files reachable from it.
- [ ] `pnpm check:docs` in a generated project fails on a dead relative link, a dead anchor, and an
      unlinked or twice-linked instruction file.
- [ ] Committing in a generated project (after `pnpm install`) runs `pnpm check` through the
      pre-commit hook.
- [ ] A generated project contains no agent skills, no `mise.toml`, no lychee usage and no `.env`.
- [ ] The generated project is a git repository with one initial commit; with `git` unavailable,
      the generator prints a warning and still exits successfully.
- [ ] Pointing the generator at an existing non-empty directory exits non-zero and leaves the
      directory unchanged; cancelling or declining the confirmation writes nothing.
- [ ] The generator does not call any AI agent or model.
- [ ] The matrix test in this repository generates all 12 combinations, installs them and runs
      their `pnpm check`, and passes.

## Open questions

- The generator package name and the GitLab repository URL used in the run command.
