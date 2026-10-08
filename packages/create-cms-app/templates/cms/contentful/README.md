# __PROJECT_NAME__

A __FRAMEWORK__ app that loads its content from __CMS__. The home page renders an example
entry from the CMS, or a message that says what is missing.

## Requirements

- Node.js 24 or later.
- pnpm 11. `package.json` declares it in `devEngines`, so any recent pnpm downloads the right
  version on first use.
- A Contentful account and space. Create one at <https://app.contentful.com> if you have none.

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

Open the URL that `pnpm dev` prints. The page shows "Hello from Contentful". Without `.env` it
shows which variables are missing; with wrong values it shows the error from Contentful.

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
