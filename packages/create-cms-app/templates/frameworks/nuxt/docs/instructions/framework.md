# Nuxt

- `srcDir` is `src/`: pages in `src/pages/`, components in `src/components/` (auto-imported).
  Server routes live in `server/` at the project root.
- Load CMS data in server routes that read `process.env` per request and create the CMS client
  there. The home page fetches `server/api/cms-state.get.ts` (the result of `loadCmsState()`) and
  renders it with `CmsStatus`.
- Do not read CMS variables in `nuxt.config.ts` (`runtimeConfig`, module options): it runs during
  `pnpm build`, so a later `.env` change would be ignored.
- `pnpm start` serves `.output/` with `.env` loaded and listens on `PORT`.
- Code outside Nuxt's directories (`cms/`, `scripts/`, `tests/`) is type-checked through
  `tsconfig.tools.json`.
