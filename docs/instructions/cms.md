# Contentful

- Content types are schema as code in `cms/content-types/`. Change them only through a new
  migration in `cms/migrations/<nnn>-<name>.ts` and call it from `cms/migrate.ts`. The check
  that the example content type already exists belongs to migration 001.
- `pnpm cms:migrate` needs `CONTENTFUL_SPACE_ID` and `CONTENTFUL_MANAGEMENT_TOKEN` in `.env`.
  It is safe to re-run.
- `getClient()` in `src/lib/cms/client.ts` creates the SDK client with the delivery token from
  `process.env` on first use and reuses it. Do not create clients when a module loads or in framework config: builds import
  route modules and must pass without `.env`.
- Queries live in one module per content type, such as `src/lib/cms/example.ts` with
  `fetchExample()`. Their client parameter defaults to `getClient()`, so routes call
  `fetchExample()`. Test each module in `tests/unit/cms-<content-type>.test.ts` with a mocked SDK.
- Every variable the app needs is listed in `requiredEnv` and in `.env.example`.
