# __PROJECT_NAME__

A __FRAMEWORK__ app that loads its content from __CMS__. The home page renders an example
document from the CMS.

## Requirements

- Node.js 24 or later.
- pnpm 11. `package.json` declares it in `devEngines`, so any recent pnpm downloads the right
  version on first use.
- A Sanity account and project. Create one at <https://www.sanity.io/manage> if you have none.

## Getting started

```sh
pnpm install                    # also activates the pre-commit hook
pnpm exec playwright install    # browsers for the smoke test, once per machine
cp .env.example .env
```

Fill in `.env`:

| Variable            | Where to find it                                                           |
| ------------------- | -------------------------------------------------------------------------- |
| `SANITY_PROJECT_ID` | sanity.io/manage → your project. The ID is shown under the project name.   |
| `SANITY_DATASET`    | sanity.io/manage → your project → Datasets. New projects use `production`. |

The app reads without an API token, so the dataset must be public. New projects create
`production` as a public dataset.

Create the example content and start the app:

```sh
pnpm exec sanity login    # once per machine
pnpm cms:migrate          # creates the example document
pnpm dev
```

Open the URL that `pnpm dev` prints. The page shows "Hello from Sanity". Without `.env`,
`pnpm dev` and `pnpm start` stop and name the missing variables. With wrong values the page
shows the framework's error page, and the error from Sanity is in the server output.

## Sanity Studio

The Studio configuration lives in `cms/` and reads the same `.env`. Start it with:

```sh
pnpm cms:dev
```

If the Studio reports a CORS error, add its URL (by default `http://localhost:3333`) under
sanity.io/manage → your project → API → CORS origins, with credentials allowed.

Content types are schema as code in `cms/schema-types/`, migrations in `cms/migrations/`.

## Commands

| Command            | Purpose                                                      |
| ------------------ | ------------------------------------------------------------ |
| `pnpm dev`         | Start the development server                                 |
| `pnpm build`       | Build for production; `pnpm start` serves the build          |
| `pnpm cms:dev`     | Start Sanity Studio                                          |
| `pnpm cms:migrate` | Create the example content                                   |
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
