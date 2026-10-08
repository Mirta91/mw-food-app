# Contentful

- Content types are schema as code in `cms/content-types/`. Change them only through a new
  migration in `cms/migrations/<nnn>-<name>.ts`, applied in order by `cms/migrate.ts`.
- `pnpm cms:migrate` needs `CONTENTFUL_SPACE_ID` and `CONTENTFUL_MANAGEMENT_TOKEN` in `.env`.
  It is safe to re-run.
- The app reads content through `src/lib/cms/client.ts` with the delivery token. Keep queries
  there and test them in `tests/unit/cms-client.test.ts` with a mocked SDK.
- Every variable the app needs is listed in `requiredEnv` and in `.env.example`.
