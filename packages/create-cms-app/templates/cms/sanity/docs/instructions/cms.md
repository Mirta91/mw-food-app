# Sanity

- Content types are schema as code in `cms/schema-types/`. Register each type in
  `cms/schema-types/index.ts`.
- The Studio runs from `cms/` with `pnpm cms:dev`. It reads `SANITY_PROJECT_ID` and
  `SANITY_DATASET` from `.env` (`cms/sanity.cli.ts`).
- The Sanity CLI needs `cms/package.json` and requires it to declare `styled-components`. The
  packages themselves install from the root `package.json`; keep the `styled-components` version
  in both files equal.
- Migrations live in `cms/migrations/<nnn>-<name>/index.ts`. `pnpm cms:migrate` runs the example
  migration; run others with `cd cms && pnpm exec sanity migration run <name> --no-dry-run`.
  Authenticate once with `pnpm exec sanity login`.
- `getClient()` in `src/lib/cms/client.ts` creates the SDK client from `process.env` on first use
  and reuses it. Do not create clients when a module loads or in framework config: builds import
  route modules and must pass without `.env`.
- Queries live in one module per content type, such as `src/lib/cms/example.ts` with
  `fetchExample()`. Their client parameter defaults to `getClient()`, so routes call
  `fetchExample()`. Test each module in `tests/unit/cms-<content-type>.test.ts` with a mocked SDK.
- Every variable the app needs is listed in `requiredEnv` and in `.env.example`.
