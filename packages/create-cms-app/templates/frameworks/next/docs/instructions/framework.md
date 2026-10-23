# Next.js

- App Router under `src/app/`. Shared components in `src/components/`. Import from `src/` with `@/`.
- Read CMS data in server components only; environment variables without `NEXT_PUBLIC_` never
  reach the browser.
- The home page is dynamic (`export const dynamic = "force-dynamic"`) so it reads the environment
  at request time.
- `src/instrumentation.ts` checks the required CMS variables when the server starts, so a missing
  one stops `pnpm dev` and `pnpm start` instead of failing a request. Import Node-only code there
  dynamically inside the `NEXT_RUNTIME === "nodejs"` branch; Next also bundles the file for Edge.
- Pages call `notFound()` when the CMS has no matching content and let CMS errors propagate to
  Next's error page. Do not render errors as page content.
- `pnpm start` listens on `PORT` (default 3000); Playwright sets it.
