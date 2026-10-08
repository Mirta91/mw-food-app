# Astro

- Server output with the Node adapter: pages in `src/pages/` render on each request.
- Load CMS data in the page frontmatter: read `process.env` per request and create the CMS client
  there. The home page renders `CmsStatus` with the result of `loadCmsState()`.
- Do not read CMS variables in `astro.config.ts` (integration options): it runs during
  `pnpm build`, so a later `.env` change would be ignored.
- `astro.config.ts` loads `.env` into `process.env` for `pnpm dev`. Restart `pnpm dev` after
  changing `.env`.
- `pnpm start` serves `dist/server/entry.mjs` with `.env` loaded and listens on `PORT`.
