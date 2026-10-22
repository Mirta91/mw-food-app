# Contentful

- Content types are schema as code in `cms/content-types/`. Change them only through a new
  migration in `cms/migrations/<nnn>-<name>.ts` and call it from `cms/migrate.ts`. The check
  that the example content type already exists belongs to migration 001.
- `pnpm cms:migrate` needs `CONTENTFUL_SPACE_ID` and `CONTENTFUL_MANAGEMENT_TOKEN` in `.env`.
  It is safe to re-run.
- The app reads content through `src/lib/cms/client.ts` with the delivery token. Keep queries
  there and test them in `tests/unit/cms-client.test.ts` with a mocked SDK.
- `getClient()` in `src/lib/cms/client.ts` creates the SDK client from `process.env` on first use
  and reuses it; routes call `fetchExample(getClient())`. Do not create clients when a module loads
  or in framework config: builds import route modules and must pass without `.env`.
- Every variable the app needs is listed in `requiredEnv` and in `.env.example`.
