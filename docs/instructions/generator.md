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
