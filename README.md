# cms-fe-scaffolding

Home of **create-cms-app**, a generator for agent-ready CMS projects used at hackathons. It
scaffolds a single-package TypeScript project for Sanity, Contentful or Storyblok with Next.js,
Nuxt, Astro or SvelteKit, including `AGENTS.md`, instruction files and checks for coding agents.

## Create a project

Requires Node.js 24 or later.

```sh
npx --yes git+https://github.com/um2115/cms-fe-scaffolding.git
# or
pnpm dlx git+https://github.com/um2115/cms-fe-scaffolding.git
```

Run it in the directory that should contain the new project folder. To run a specific branch,
tag or commit, append it to the URL, for example `...cms-fe-scaffolding.git#main`.

Answer the prompts (project name, CMS, framework), confirm the summary, then follow the printed
next steps. The generated project has its own `README.md` with setup steps for the chosen CMS.

More in the [generator README](packages/create-cms-app/README.md).

## Getting started

To work on the generator, you need [mise](https://mise.jdx.dev) and git.

```sh
git clone https://github.com/um2115/cms-fe-scaffolding.git
cd cms-fe-scaffolding
mise install       # pnpm and lychee
pnpm install       # dependencies
pnpm setup:hooks   # activate the pre-commit hook, once per clone
pnpm check         # lint, format, types, tests, build and docs checks
```

`pnpm check` also runs as the pre-commit hook. The generator bundle in
`packages/create-cms-app/dist/` is committed, because users run the generator straight from the
git URL.

[AGENTS.md](AGENTS.md) holds the full command list, the repository layout, the conventions and
the definition of done. It is written for coding agents and applies to people as well.
