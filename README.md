# mw-food-app

A SvelteKit app that loads its content from Contentful. The home page renders an example
entry from the CMS.

## Requirements

- Node.js 24 or later.
- pnpm 11. `package.json` declares it in `devEngines`, so any recent pnpm downloads the right
  version on first use.
- A Contentful account and space. Create one at <https://app.contentful.com> if you have none.

## Quick start

The short version. Each step is explained in [Getting started](#getting-started) below.

1. Use Node 24. With nvm: `nvm use 24` (or `nvm alias default 24` once). If `pnpm` is not
   found afterwards, run `corepack enable` for that Node version.
2. `pnpm install`
3. `pnpm exec playwright install` (once per machine)
4. `cp .env.example .env` and fill in the Contentful values
5. `pnpm cms:migrate` to create the example content in your space
6. `pnpm dev` and open the URL it prints

## Getting started

```sh
pnpm install                    # also activates the pre-commit hook
pnpm exec playwright install    # browsers for the smoke test, once per machine
cp .env.example .env
```

Fill in `.env`:

| Variable                      | Where to find it                                                                                            |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `CONTENTFUL_SPACE_ID`         | Contentful → Settings → API keys → an API key → Space ID                                                    |
| `CONTENTFUL_ACCESS_TOKEN`     | The same API key → Content Delivery API access token                                                        |
| `CONTENTFUL_ENVIRONMENT`      | Optional. The environment to read from; empty means `master`                                                |
| `CONTENTFUL_MANAGEMENT_TOKEN` | Only for `pnpm cms:migrate`. Settings → CMA tokens → create a personal access token. Keep it out of the app |

Create the example content and start the app:

```sh
pnpm cms:migrate    # creates the example content type and a published entry
pnpm dev
```

Open the URL that `pnpm dev` prints. The page shows "Hello from Contentful". Without `.env`,
`pnpm dev` and `pnpm start` stop and name the missing variables. With wrong values the page
shows the framework's error page, and the error from Contentful is in the server output.

`pnpm cms:migrate` is safe to re-run. Content types are schema as code in `cms/content-types/`,
migrations in `cms/migrations/`.

## Commands

| Command            | Purpose                                                      |
| ------------------ | ------------------------------------------------------------ |
| `pnpm dev`         | Start the development server                                 |
| `pnpm build`       | Build for production; `pnpm start` serves the build          |
| `pnpm cms:migrate` | Create the example content type and entry                    |
| `pnpm check`       | Run all checks: lint, format, types, tests, smoke test, docs |

[AGENTS.md](AGENTS.md) lists every command.

## Working with coding agents

[AGENTS.md](AGENTS.md) (also available as `CLAUDE.md`) is the entry point for coding agents. It
describes the layout, the conventions and the definition of done: `pnpm check` must pass before a
task counts as done. The pre-commit hook runs the same check on every commit.

Details for people and agents live in `docs/instructions/`:

- [CMS](docs/instructions/cms.md) — content types, migrations and the CMS client
- [Framework](docs/instructions/framework.md) — routes, pages and configuration
- [Testing](docs/instructions/testing.md) — unit and end-to-end tests

## Troubleshooting

| Symptom                                                             | Fix                                                                                                                           |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `Unsupported engine: wanted: {"node":">=24"}`                       | The terminal is on an older Node. Run `nvm use 24`.                                                                           |
| `Command 'pnpm' not found` after switching Node                     | Each Node version has its own corepack shims. Run `corepack enable`.                                                          |
| `ERR_PNPM_BAD_PM_VERSION` (corepack picked pnpm 12)                 | `package.json` pins `packageManager` to pnpm 11. Make sure that field is present and run `pnpm install` again.                |
| `ERR_PNPM_AUTH_INVALID_BASE64`                                      | A `_password=` entry in `~/.npmrc` is not valid base64 (often a leftover `[...]` placeholder). Fix or remove that entry.      |
| Playwright warns "Host system is missing dependencies" on WSL/Linux | Safe to ignore: the listed libraries are for WebKit and Firefox, and the smoke test only uses Chromium.                       |
| Pre-commit hook fails with "Format issues found"                    | Run `pnpm exec oxfmt` to format, then `git add` the changed files and commit again.                                           |
| `pnpm dev` shows the error page                                     | The Contentful values in `.env` are wrong or the content is missing. Check the terminal output and re-run `pnpm cms:migrate`. |
