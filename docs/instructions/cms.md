# Contentful

- Content types are schema as code in `cms/content-types/`, one `ContentTypeDefinition` per
  type. Change them only through a new migration in `cms/migrations/<nnn>-<name>.ts`, and keep
  the definition equal to the result. A migration that creates a type is
  `createContentTypeMigration(definition)`.
- Register each migration as a step in `cms/migrate.ts`. Its `isApplied` check must detect the
  migration's result in the space, so re-runs skip it. The team space has hand-made types, so
  002–004 skip there and 005 adds what they lacked.
- After the migrations, `cms/seed.ts` creates and publishes the missing demo content from
  `cms/demo-data.ts`. It never changes existing entries: food options are matched by slug,
  offices by city, restaurants by fixed entry ID. A deleted demo restaurant comes back on the
  next run.
- `pnpm cms:migrate` needs `CONTENTFUL_SPACE_ID` and `CONTENTFUL_MANAGEMENT_TOKEN` in `.env`.
  It is safe to re-run.
- `getClient()` in `src/lib/cms/client.ts` creates the SDK client with the delivery token from
  `process.env` on first use and reuses it. Do not create clients when a module loads or in framework config: builds import
  route modules and must pass without `.env`.
- Queries live in one module per content type, such as `src/lib/cms/restaurant.ts` with
  `fetchRestaurants()`. Their client parameter defaults to `getClient()`, so routes call
  `fetchRestaurants()`. Test each module in `tests/unit/cms-<content-type>.test.ts` with a mocked SDK.
- Every variable the app needs is listed in `requiredEnv` and in `.env.example`.
