# Turborepo

## Read the installed docs first

Turborepo configuration, task behavior and CLI commands change between versions and may differ
from what you remember. Before changing `turbo.json`, task definitions or `turbo` commands, read
the docs bundled with the installed package. They match the installed version and work offline.

```sh
node -p "require('path').dirname(require.resolve('turbo/package.json'))"
```

Start with `docs/README.md` in that directory, then the relevant pages under `docs/`. Heed
deprecation notices.

## Repository decisions

- `agentGuidance` is `false` in `turbo.json`. Turbo would otherwise write its own block into
  `AGENTS.md` on every run, which breaks the progressive disclosure rule. This file replaces that
  block. Do not re-enable it.
- The package manager is declared through `devEngines.packageManager` in the root `package.json`,
  not the legacy `packageManager` field. Turbo supports both.
- Package tasks: `build`, `dev`, `check-types`, `test`, `test:watch`. A package only needs the
  scripts it uses; turbo skips missing ones.
- Root tasks (`//#lint`, `//#format` and their `:fix` variants) run once over the whole repository.
  Packages do not get their own `lint` or `format` scripts.
- `check-types` and `test` depend on the `transit` task instead of `^check-types` / `^test`. No
  package defines a `transit` script; it only links each task to its dependencies' changes, so
  dependent packages re-run when a dependency changes while all packages still run in parallel.
- `pnpm check` also runs `build` and `check:bundle`, because the generator's `dist/` is committed.
  Its package `turbo.json` extends the root and overrides `build.inputs` so tracked `dist/` files
  do not count as inputs (arrays replace, they do not merge). See the generator instructions.
- `pnpm check:docs` stays a plain root script, not a turbo task. It checks repository-wide files,
  not packages.

## Adding a package

1. Create it under `apps/<name>/` (deployable) or `packages/<name>/` (shared library or config).
2. Give its `package.json` a scoped `name` and `"private": true`.
3. Name its scripts after the package tasks above so turbo picks them up.
4. Gitignore any new build output directory and add it to the task's `outputs` in `turbo.json`,
   otherwise output files count as inputs and break caching.
5. Run `pnpm install`, then `pnpm build` twice: the second run must report a full cache hit.
