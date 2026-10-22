# Storyblok

- Components are schema as code in `cms/components/`. Change them through a new migration in
  `cms/migrations/<nnn>-<name>.ts` that exports `up(mapi)`, and call it from `cms/migrate.ts`.
- `pnpm cms:migrate` needs `STORYBLOK_SPACE_ID` and `STORYBLOK_PERSONAL_ACCESS_TOKEN` in `.env`.
  It is safe to re-run.
- `getClient()` in `src/lib/cms/client.ts` creates the SDK client from `process.env` on first use
  and reuses it. Do not create clients when a module loads or in framework config: builds import
  route modules and must pass without `.env`.
- Queries live in one module per content type, such as `src/lib/cms/example.ts` with
  `fetchExample()`. Their client parameter defaults to `getClient()`, so routes call
  `fetchExample()`. Test each module in `tests/unit/cms-<content-type>.test.ts` with a mocked SDK.
- Every variable the app needs is listed in `requiredEnv` and in `.env.example`.
