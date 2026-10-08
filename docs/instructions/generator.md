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
