# Storyblok

- Components are schema as code in `cms/components/`. Change them through a new migration in
  `cms/migrations/<nnn>-<name>.ts` that exports `up(mapi)`, and call it from `cms/migrate.ts`.
- `pnpm cms:migrate` needs `STORYBLOK_SPACE_ID` and `STORYBLOK_PERSONAL_ACCESS_TOKEN` in `.env`.
  It is safe to re-run.
- The app reads published stories through `src/lib/cms/client.ts`. Keep queries there and test
  them in `tests/unit/cms-client.test.ts` with a mocked client.
- Every variable the app needs is listed in `requiredEnv` and in `.env.example`.
