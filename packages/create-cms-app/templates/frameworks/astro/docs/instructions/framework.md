# Astro

- Server output with the Node adapter: pages in `src/pages/` render on each request.
- Load CMS data in the page frontmatter: read `process.env` per request and create the CMS client
  there. Return `new Response(null, { status: 404 })` when the CMS has no matching content and
  let CMS errors propagate to Astro's error page. Do not render errors as page content.
- The required CMS variables are checked when the server starts, so a missing one stops the
  server instead of failing a request: the `check-env` integration in `astro.config.ts` for
  `pnpm dev`, `scripts/check-env.ts` in the `start` script for `pnpm start`. A deployment that
  runs the server without `pnpm start` skips the check.
- When a coding agent runs `pnpm dev`, Astro starts the dev server in the background and writes
  its output, including startup errors, to `.astro/dev.log`.
- Do not read CMS variables in `astro.config.ts` (integration options), apart from the dev-only
  `check-env` integration: it runs during `pnpm build`, so a later `.env` change would be ignored.
- `astro.config.ts` loads `.env` into `process.env` for `pnpm dev`. Restart `pnpm dev` after
  changing `.env`.
- `pnpm start` serves `dist/server/entry.mjs` with `.env` loaded and listens on `PORT`.
