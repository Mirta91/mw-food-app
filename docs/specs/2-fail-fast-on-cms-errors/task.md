# 2-fail-fast-on-cms-errors

Make generated projects fail fast on CMS problems: check the required environment variables when
the server starts, and leave missing content and CMS errors to the framework's 404 and error
handling.

## Problem

Generated projects turn every CMS outcome into page content. `loadCmsState()` in
`src/lib/cms/state.ts` never throws; it maps missing environment variables, an empty result and
CMS errors into a `CmsState` union, and `describeCmsState()` turns each state into a title and a
detail that `CmsStatus` renders inside `<main data-cms-state=…>`. As a result:

- A missing environment variable is only noticed when someone opens the page, not when the server
  starts, so a broken deployment looks healthy until it is visited.
- A missing example and a CMS error are answered with status 200 and a message, instead of the
  framework's 404 and error page.
- Every route carries a state machine and a status component that real CMS pages would not use,
  so the template shows teams a pattern they should not copy.

This shape exists only to satisfy spec `1-add-workspace-generator`'s former acceptance criterion
that the demo route names the missing variables, which this spec amends.

## Goal

In every generated project, `pnpm dev` and `pnpm start` exit non-zero with a message naming the
missing variables when required CMS environment variables are missing. With the environment
filled in, the home page renders the first `example` entry as today, answers with the framework's
404 when there is none, and with the framework's error page when the CMS call fails. `pnpm check`
still passes without credentials, and no `CmsState`, `describeCmsState` or `data-cms-state`
remains in the templates.

## Scope

### In scope

- A shared `assertEnv(requiredEnv, env)` in the common template that throws one error naming all
  missing or blank variables, with a Vitest unit test.
- Calling it at server startup in each framework:
  - Next.js: `register()` in `instrumentation.ts`, skipped during `next build`.
  - Nuxt: a Nitro server plugin.
  - SvelteKit: the `init` hook in `hooks.server.ts`.
  - Astro: an integration whose `astro:config:setup` hook throws only when `command` is `"dev"`,
    and a check in the `start` script that runs before `node dist/server/entry.mjs`.
- The home route in all 12 combinations loads the example directly, answers an empty result with
  the framework's 404 mechanism (`notFound()`, `error(404)`, `createError({ statusCode: 404 })`, a
  404 response in Astro) and lets CMS errors propagate to the framework's error handling.
- Deleting `CmsState`, `loadCmsState`, `describeCmsState`, `missingEnv` where it becomes unused,
  the four `CmsStatus` components, `data-cms-state`, and Nuxt's `server/api/cms-state.get.ts` (the
  Nuxt page loads the example through its own server-side mechanism instead).
- The smoke test: `pnpm test:smoke` runs through a wrapper that, when required variables are
  missing, prints their names and exits 0 without starting Playwright. Otherwise Playwright starts
  the app and checks that the home page answers with status 200.
- CMS clients are created once, on first use, through `getClient()` in each CMS layer's
  `src/lib/cms/client.ts` instead of per request, and queries such as `fetchExample()` in
  `src/lib/cms/example.ts` default their client parameter to it; a client at plain module scope
  would throw during builds without `.env`. Every framework uses the same plain SDK per CMS
  (`contentful`, `@sanity/client`, `storyblok-js-client`), typed with the SDK's own client type, and
  reads `process.env` (SvelteKit included). Home routes are identical for all three CMSs and live in
  the framework layer; a combination without files of its own has no combo layer.
- Updating the docs that describe the old behavior: `docs/instructions/generator.md`, the four
  template `framework.md` files, the template `testing.md`, the three CMS `README.md` templates,
  `packages/create-cms-app/README.md`, and the comment in the Astro `astro.config.ts` template.
- Amending spec `1-add-workspace-generator` so its scope, behavior and acceptance criteria
  describe the new missing-environment behavior.
- Rebuilding the committed `dist/` of `create-cms-app`.

### Out of scope (non-goals)

- No slug-based routing; the home page keeps loading the first `example` entry.
- No custom 404 or error pages; the frameworks' defaults are used.
- No change to the content model, the `cms/` migrations or the query `fetchExample()` runs.
- No validation of variable values, such as an unknown `STORYBLOK_REGION`; only presence is
  checked.
- No use of Astro's `astro:env` schema: it validates secrets during `astro build` and at runtime
  only on first import, not at server start.
- No check for deployments that bypass `pnpm start` in Astro; such platforms surface a missing
  variable as a CMS error on the error page.

## Behavior

1. `pnpm dev` or `pnpm start` without the required variables: the startup check throws before the
   server accepts requests, the process exits non-zero, and the message names every missing or
   blank variable and points to `.env.example`.
2. `pnpm build`, `pnpm check-types` and `pnpm lint` without the required variables run as before
   and do not fail because of the check.
3. Home page with the environment filled in and an example entry: renders the entry's title and
   body with status 200.
4. Home page with the environment filled in and no example entry: the framework's 404 response.
5. Home page when the CMS call fails (for example an invalid token): the error propagates to the
   framework's error page with status 500.
6. `pnpm test:smoke` without the required variables: prints that the smoke test is skipped and
   which variables are missing, and exits 0. `pnpm check` therefore passes without credentials.
7. `pnpm test:smoke` with the required variables: Playwright starts the app and expects status
   200 on the home page; a missing example or a CMS error fails it.

## Constraints & assumptions

- CMS clients stay created per request from runtime env, as `docs/instructions/generator.md`
  requires, so `pnpm start` honours `.env`.
- `requiredEnv` exported from each CMS layer's `src/lib/cms/client.ts` stays the single list of
  required variables.
- Template files are validated only inside generated projects through `pnpm test:matrix`, which
  needs network access.
- Next.js calls `register()` during `next build`; the check has to be skipped in that phase.

## Acceptance criteria

- [ ] For each of the 12 combinations, the generated project passes `pnpm install` followed by
      `pnpm check` without any CMS credentials, and the smoke test output names the missing
      variables.
- [ ] For each framework, `pnpm dev` and `pnpm build && pnpm start` without `.env` exit non-zero
      with a message naming every required variable.
- [ ] For each CMS, with valid credentials and the example migration applied, the home page
      renders the example with status 200.
- [ ] With valid credentials and no example entry, the home page answers with status 404.
- [ ] With an invalid token, the home page answers with status 500.
- [ ] The `assertEnv` unit test passes in every generated project.
- [ ] No file under `packages/create-cms-app/templates/` or `dist/` contains `describeCmsState`,
      `loadCmsState`, `CmsState`, `CmsStatus` or `data-cms-state`.
- [ ] Spec `1-add-workspace-generator` no longer requires the demo route to show a missing
      variables message.
- [ ] `pnpm test:matrix` passes for all combinations, and `pnpm check` passes in this repository.
