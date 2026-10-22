# Testing

## Unit tests

- Vitest runs `tests/unit/**/*.test.ts` (`vitest.config.ts`).
- Unit tests run without CMS credentials or network. Mock the CMS SDK or client object.

## End-to-end tests

- Playwright runs `tests/e2e/`. It builds and starts the app itself (`playwright.config.ts`).
- Tag a test with `@smoke` in its title to run it in `pnpm check`. Keep smoke tests few and fast.
  Untagged tests run only through `pnpm test:e2e`.
- Smoke tests run only when the required CMS variables are set. Without them the app refuses to
  start, so `pnpm test:smoke` skips the tests with a message and `pnpm check` still passes.
- Assert on status and page structure, not on CMS content.
