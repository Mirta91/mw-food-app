# SvelteKit

- SvelteKit 3 is configured through `sveltekit({ ... })` in `vite.config.ts`; it does not read
  `svelte.config.*`, and `$lib` is gone. Shared code lives in `src/lib/`; import it with
  relative paths.
- Routes in `src/routes/`. Load CMS data in `+page.server.ts` so secrets stay on the server. Call
  `error(404, ...)` when the CMS has no matching content and let CMS errors propagate to
  SvelteKit's error page. Do not render errors as page content.
- CMS variables are read from `process.env`, as in every framework, not from `$app/env/*`.
  `pnpm start` loads `.env` into it; for `pnpm dev`, the `cms-env` plugin in `vite.config.ts`
  does.
- The required CMS variables are checked when the server starts, so a missing one stops the
  server instead of failing a request: the `init` hook in `src/hooks.server.ts` for `pnpm start`,
  the `cms-env` plugin for `pnpm dev` (`vite dev` runs `init` only on the first request).
- Do not read CMS variables in `vite.config.ts` outside the dev-only `cms-env` plugin: the config
  also runs during `pnpm build`, so a later `.env` change would be ignored.
- `pnpm start` serves `build/` with the Node adapter, `.env` loaded, listening on `PORT`.
