# Next.js

- App Router under `src/app/`. Shared components in `src/components/`. Import from `src/` with `@/`.
- Read CMS data in server components only; environment variables without `NEXT_PUBLIC_` never
  reach the browser.
- The home page is dynamic (`export const dynamic = "force-dynamic"`) so it reads the environment
  at request time.
- Every page that loads CMS content renders `CmsStatus` with the result of `loadCmsState()`, so a
  missing or broken CMS configuration shows a message instead of an error page.
- `pnpm start` listens on `PORT` (default 3000); Playwright sets it.
