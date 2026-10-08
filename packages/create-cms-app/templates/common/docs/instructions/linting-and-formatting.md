# Linting and formatting

oxlint lints and oxfmt formats the whole project. Configuration lives in `.oxlintrc.json` and
`.oxfmtrc.json`.

- When a format check fails, run `pnpm format:fix`. Do not format by hand.
- When a lint check fails, try `pnpm lint:fix` first, then fix the rest by hand. Do not disable a
  rule inline without a comment saying why.
- Keep generated and build output in `ignorePatterns` of both config files.
