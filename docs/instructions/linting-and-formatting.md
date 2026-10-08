# Linting and formatting

oxlint lints and oxfmt formats the whole repository from the root. Configuration lives in
`.oxlintrc.json` and `.oxfmtrc.json`.

## Rules

- When a format check fails, run `pnpm format:fix`. Do not format by hand.
- When a lint check fails, try `pnpm lint:fix` first, then fix the rest by hand. Do not disable a
  rule inline without a comment saying why.
- Rule or option changes go into the root config files. Add a nested config in a package only when
  that package needs different rules, and say why in this file.
- oxfmt also formats Markdown and JSON, including `AGENTS.md` and instruction files.
- `.agents/` is excluded from formatting because its skills are installed from another source.
  Keep generated or installed files in `ignorePatterns` of `.oxfmtrc.json`.

## Type-aware linting

Type-aware rules are not enabled. If they are, compiled internal packages must be built before
linting; see the type-aware linting section of the Oxc guide in the bundled turbo docs.
