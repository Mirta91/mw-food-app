# create-cms-app

Scaffolds a single-package TypeScript project for Sanity, Contentful or Storyblok with Next.js,
Nuxt, Astro or SvelteKit.

```sh
npx --yes git+https://github.com/um2115/cms-fe-scaffolding.git
# or
pnpm dlx git+https://github.com/um2115/cms-fe-scaffolding.git
```

Answer the prompts (project name, CMS, framework), confirm the summary, then follow the printed
next steps.

## Manual check with real content

Run once per CMS after changing a CMS layer, with a scratch space or project:

1. Generate a project for the CMS with any framework, `pnpm install`, `cp .env.example .env`.
2. Fill in every variable in `.env`, including the migration-only ones.
3. Sanity: `pnpm exec sanity login`, then `pnpm cms:migrate`. Contentful and Storyblok:
   `pnpm cms:migrate`.
4. `pnpm dev`, open the home page: it shows "Hello from <CMS>" with status 200.
5. Break a token in `.env`, restart: the home page answers with the framework's error page
   (status 500), and the CMS error is in the server output.
6. Restore the token, unpublish or delete the example content: the home page answers with
   status 404.
7. Sanity only: `pnpm cms:dev` opens the Studio with the example document.
