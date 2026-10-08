# Sanity

- Content types are schema as code in `cms/schema-types/`. Register each type in
  `cms/schema-types/index.ts`.
- The Studio runs from `cms/` with `pnpm cms:dev`. It reads `SANITY_PROJECT_ID` and
  `SANITY_DATASET` from `.env` (`cms/sanity.cli.ts`).
- Migrations live in `cms/migrations/<nnn>-<name>/index.ts`. `pnpm cms:migrate` runs the example
  migration; run others with `cd cms && pnpm exec sanity migration run <name> --no-dry-run`.
  Authenticate once with `pnpm exec sanity login`.
- The app reads content through `src/lib/cms/client.ts`. Keep queries there and test them in
  `tests/unit/cms-client.test.ts` with a mocked client.
- Every variable the app needs is listed in `requiredEnv` and in `.env.example`.
