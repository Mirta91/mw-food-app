# SvelteKit

- SvelteKit 3 is configured through `sveltekit({ ... })` in `vite.config.ts`; it does not read
  `svelte.config.*`, and `$lib` is gone. Shared code lives in `src/lib/`; import it with
  relative paths.
- Routes in `src/routes/`. Load CMS data in `+page.server.ts` so secrets stay on the server: read
  variables from `$app/env/private` and create the CMS client in the load function, on each
  request. Call `error(404, ...)` when the CMS has no matching content and let CMS errors
  propagate to SvelteKit's error page. Do not render errors as page content.
- Declare every variable the app reads in `src/env.ts` (`defineEnvVars`). Keep CMS variables
  dynamic (not `static`) and optional, so `pnpm build` and `pnpm check-types` run without `.env`.
  `pnpm dev` reads them from `.env`; `pnpm start` from the environment at startup.
- The required CMS variables are checked when the server starts, so a missing one stops the
  server instead of failing a request: the `init` hook in `src/hooks.server.ts` for `pnpm start`,
  the `check-env` plugin in `vite.config.ts` for `pnpm dev` (`vite dev` runs `init` only on the
  first request).
- Do not read CMS variables in `vite.config.ts` (apart from the dev-only `check-env` plugin) or
  mark them `static`: both are fixed during `pnpm build`, so a later `.env` change would be
  ignored.
- `pnpm start` serves `build/` with the Node adapter, `.env` loaded, listening on `PORT`.
