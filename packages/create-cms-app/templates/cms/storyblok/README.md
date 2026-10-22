# __PROJECT_NAME__

A __FRAMEWORK__ app that loads its content from __CMS__. The home page renders an example
story from the CMS.

## Requirements

- Node.js 24 or later.
- pnpm 11. `package.json` declares it in `devEngines`, so any recent pnpm downloads the right
  version on first use.
- A Storyblok account and space. Create one at <https://app.storyblok.com> if you have none.

## Getting started

```sh
pnpm install                    # also activates the pre-commit hook
pnpm exec playwright install    # browsers for the smoke test, once per machine
cp .env.example .env
```

Fill in `.env`:

| Variable                          | Where to find it                                                                                    |
| --------------------------------- | --------------------------------------------------------------------------------------------------- |
| `STORYBLOK_ACCESS_TOKEN`          | Storyblok → your space → Settings → Access Tokens. A `public` token is enough for published content |
| `STORYBLOK_REGION`                | Optional. The server location of the space: `eu` (default), `us`, `ap`, `ca` or `cn`                |
| `STORYBLOK_SPACE_ID`              | Only for `pnpm cms:migrate`. Settings → Space, or the number in the space's URL                     |
| `STORYBLOK_PERSONAL_ACCESS_TOKEN` | Only for `pnpm cms:migrate`. My Account → Personal access tokens. Keep it out of the app            |

Create the example content and start the app:

```sh
pnpm cms:migrate    # creates the example component and a published story
pnpm dev
```

Open the URL that `pnpm dev` prints. The page shows "Hello from Storyblok". Without `.env`,
`pnpm dev` and `pnpm start` stop and name the missing variables. With wrong values the page
shows the framework's error page, and the error from Storyblok is in the server output.

`pnpm cms:migrate` is safe to re-run. Components are schema as code in `cms/components/`,
migrations in `cms/migrations/`.

## Commands

| Command            | Purpose                                                      |
| ------------------ | ------------------------------------------------------------ |
| `pnpm dev`         | Start the development server                                 |
| `pnpm build`       | Build for production; `pnpm start` serves the build          |
| `pnpm cms:migrate` | Create the example component and story                       |
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
