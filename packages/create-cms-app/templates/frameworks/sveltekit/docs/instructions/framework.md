# SvelteKit

- SvelteKit 3 is configured through `sveltekit({ ... })` in `vite.config.ts`; it does not read
  `svelte.config.*`, and `$lib` is gone. Shared code lives in `src/lib/`; import it with
  relative paths.
- Routes in `src/routes/`. Load CMS data in `+page.server.ts` so secrets stay on the server: read
  variables from `$app/env/private` and create the CMS client in the load function, on each
  request. The home page renders `CmsStatus` with the `state` returned by its load function.
- Declare every variable the app reads in `src/env.ts` (`defineEnvVars`). Keep CMS variables
  dynamic (not `static`) and optional, so the page reports missing ones instead of the server
  failing to start. `pnpm dev` reads them from `.env`; `pnpm start` from the environment at
  startup.
- Do not read CMS variables in `vite.config.ts` or mark them `static`: both are fixed during
  `pnpm build`, so a later `.env` change would be ignored.
- `pnpm start` serves `build/` with the Node adapter, `.env` loaded, listening on `PORT`.
