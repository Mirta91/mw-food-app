# Generator

The generator lives in `packages/create-cms-app`. Users run it from the git URL of this
repository; there is no publish step.

## Distribution

- npx and pnpm dlx install the repository root as a package. The root `package.json` therefore
  carries the generator's `bin` and `files`. Keep both pointing at `packages/create-cms-app/dist`.
- `packages/create-cms-app/dist/` is committed. After changing `src/` or `templates/`, run
  `pnpm build` and stage `dist/`; `pnpm check` fails while the bundle is stale or unstaged.
- The bundle has no runtime dependencies. Add libraries the CLI imports as devDependencies; esbuild
  inlines them.
- Do not add a `prepare` script to the root `package.json`. npm would install all dev
  dependencies and run it on every `npx` call. Git hooks are activated in `postinstall`.
- After changing anything above, commit and run `pnpm verify:git-install`.

## Templates

- Layers apply in the order `templates/common`, `frameworks/<framework>`, `cms/<cms>`,
  `combos/<cms>-<framework>`. A later layer replaces a whole file of an earlier one; there is no
  partial patching. Put a file in the lowest layer it is the same for.
- `pkg.json` and `pnpm-workspace.json` at a layer root are fragments: objects are deep-merged,
  scalars and arrays of later layers replace earlier ones. They become `package.json` and
  `pnpm-workspace.yaml`.
- Store `.gitignore` as `_gitignore`.
- Text files may use the tokens `__PROJECT_NAME__`, `__CMS__` and `__FRAMEWORK__` (display
  labels). No other templating.
- Pin template dependencies to exact versions. Bump them by hand and run `pnpm test:matrix`.
- Templates are excluded from this repository's lint, format and type checks; `pnpm test:matrix`
  validates them inside generated projects.
- The generator writes `package.json` in oxfmt's order: top-level keys by `PKG_KEY_ORDER` in
  `src/plan.ts`, dependency maps sorted by name. When a template adds another top-level key, add
  it to `PKG_KEY_ORDER` at oxfmt's position.
- Templates create CMS clients per request from runtime env. Do not use build-time framework
  integration options for CMS credentials, so `pnpm start` honours `.env`. Framework-specific
  details live in each `framework.md`.
- Generated projects exclude `pnpm-workspace.yaml` from oxfmt, because `pnpm install` rewrites it.
- Every generated project has a `README.md` for people: requirements, getting started, where to
  find each `.env` value, commands, and pointers to `AGENTS.md` and `docs/instructions/`. It lives
  in the CMS layer because the setup steps are CMS-specific; keep it in step with `.env.example`
  and the `cms:*` scripts (`src/matrix.test.ts` checks both). Template files are not formatted by
  this repository, so run oxfmt on a generated copy after editing and keep the tokens intact.

## Matrix test

- `pnpm test:matrix` is not part of `pnpm check`: it installs every combination from the network
  and takes minutes. Run it for the affected combinations after changing templates, and for all
  combinations before bumping template dependencies.
- Fix templates, never a generated copy. `--keep` leaves the generated projects for inspection.
- The matrix runs without CMS variables. Besides `pnpm check`, it requires `pnpm build` to pass
  and `pnpm dev` and `pnpm start` to exit with the missing-variables message.
- Every route renders `data-cms-state` through `loadCmsState()` and `describeCmsState()` from
  `src/lib/cms/state.ts`; the smoke test depends on it.
- `src/matrix.test.ts` runs in `pnpm check` without network: it plans all combinations and checks
  required and forbidden files, `package.json` and docs. Update its snapshots with
  `pnpm --filter @cms-hackathon-setup/create-cms-app test -u` only after reviewing the diff.
- After changing a CMS layer, run the manual check in the generator README for that CMS.
