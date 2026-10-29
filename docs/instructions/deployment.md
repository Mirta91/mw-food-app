# Deployment

The app is deployed to Vercel with the Vercel CLI from a local checkout. Preview and production
deployments are not tied to GitHub; `vercel` deploys the working tree.

- `vite.config.ts` picks `@sveltejs/adapter-vercel` when `VERCEL` is set (Vercel sets it in every
  build) and `@sveltejs/adapter-node` otherwise, so `pnpm start` and the Playwright web server keep
  working. To test the Vercel build locally run `VERCEL=1 pnpm build`; it writes `.vercel/output/`.
- Vercel reads the Node version from `engines` and the pnpm version from the lockfile. The
  lockfile only says "pnpm 9 or 10", so the project has `ENABLE_EXPERIMENTAL_COREPACK=1` set,
  which makes Vercel use the `packageManager` version from `package.json`.
- The CMS variables from `.env.example` (without `CONTENTFUL_MANAGEMENT_TOKEN`) are set as
  Vercel environment variables for the production and preview environments, never in
  `vercel.json`. `src/hooks.server.ts` checks them on a cold start; with a missing one every
  request fails with a function error and the variable name is in the runtime logs.
- `.vercel/` holds the project link and build output and is ignored by git.

## First-time setup on a machine

```sh
pnpm dlx vercel login
pnpm dlx vercel link          # pick the existing project, or create one named mw-food-app
```

## Deploy

```sh
pnpm check                    # the definition of done also applies to deployments
pnpm dlx vercel               # preview deployment with its own URL
pnpm dlx vercel --prod        # production deployment
```

To change an environment variable use `pnpm dlx vercel env add <NAME>` (or the project settings)
and deploy again; running functions do not pick up changes.
