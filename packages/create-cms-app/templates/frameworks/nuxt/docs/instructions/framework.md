# Nuxt

- `srcDir` is `src/`: pages in `src/pages/`, components in `src/components/` (auto-imported).
  Server routes live in `server/` at the project root.
- Load CMS data in server routes that read `process.env` per request and create the CMS client
  there. The home page fetches `server/api/example.get.ts`.
- The required CMS variables are checked when the server starts, so a missing one stops the
  server instead of failing a request: `server/plugins/check-env.ts` for `pnpm start`,
  `modules/check-env.ts` for `pnpm dev` (the dev server survives an exiting Nitro worker).
- Server routes throw `createError({ statusCode: 404 })` when the CMS has no matching content and
  let CMS errors propagate; pages rethrow a fetch error as fatal so Nuxt renders its error page.
  Do not render errors as page content.
- Do not read CMS variables in `nuxt.config.ts` (`runtimeConfig`, module options): it runs during
  `pnpm build`, so a later `.env` change would be ignored.
- `pnpm start` serves `.output/` with `.env` loaded and listens on `PORT`.
- Code outside Nuxt's directories (`cms/`, `scripts/`, `tests/`) is type-checked through
  `tsconfig.tools.json`.
