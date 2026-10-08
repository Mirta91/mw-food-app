# Testing

## Unit tests

- Vitest runs `tests/unit/**/*.test.ts` (`vitest.config.ts`).
- Unit tests run without CMS credentials or network. Mock the CMS SDK or client object.

## End-to-end tests

- Playwright runs `tests/e2e/`. It builds and starts the app itself (`playwright.config.ts`).
- Tag a test with `@smoke` in its title to run it in `pnpm check`. Keep smoke tests few and fast.
  Untagged tests run only through `pnpm test:e2e`.
- Smoke tests must pass without CMS credentials. Assert on what the page renders in every state
  (`data-cms-state`), not on CMS content.
