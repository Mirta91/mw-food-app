# Nuxt

- `srcDir` is `src/`: pages in `src/pages/`, components in `src/components/` (auto-imported).
  Server routes live in `server/` at the project root.
- Load CMS data on the server (server routes or SSR `useAsyncData`), never with secrets in the
  browser. The home page renders `CmsStatus` with the result of `loadCmsState()`.
- `pnpm start` serves `.output/` with `.env` loaded and listens on `PORT`.
- `nuxt.config.ts` runs at build time: environment values it reads (`runtimeConfig`, module
  options) are fixed by `pnpm build`. Rebuild after changing `.env`.
- Code outside Nuxt's directories (`cms/`, `scripts/`, `tests/`) is type-checked through
  `tsconfig.tools.json`.
