// Bundles the CLI with all dependencies into dist/cli.mjs and copies the templates next to it.
// dist/ is committed: npx and pnpm dlx run it straight from the git URL without a build step.
import { build } from "esbuild";
import { chmod, cp, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";

const root = import.meta.dirname;
const dist = join(root, "dist");

await rm(dist, { recursive: true, force: true });
await build({
  entryPoints: [join(root, "src/main.ts")],
  outfile: join(dist, "cli.mjs"),
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node24",
  legalComments: "none",
  // Bundled CommonJS dependencies call require() for Node built-ins.
  banner: {
    js: "#!/usr/bin/env node\nimport { createRequire } from 'node:module';\nconst require = createRequire(import.meta.url);",
  },
});
await chmod(join(dist, "cli.mjs"), 0o755);
await mkdir(join(root, "templates"), { recursive: true });
await cp(join(root, "templates"), join(dist, "templates"), { recursive: true });
