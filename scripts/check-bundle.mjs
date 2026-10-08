// Fails when the committed generator bundle differs from the fresh build in the working tree.
// Runs after `turbo run build` in `pnpm check`, so the pre-commit hook rejects a stale bundle.
import { execFileSync } from "node:child_process";

const dist = "packages/create-cms-app/dist";
const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
const changed = [
  git("diff", "--name-only", "--", dist),
  git("ls-files", "--others", "--exclude-standard", "--", dist),
].filter(Boolean);

if (changed.length > 0) {
  console.error(`error: ${dist} is out of date or not staged:\n${changed.join("\n")}`);
  console.error(`Run \`pnpm build\` and \`git add ${dist}\`.`);
  process.exit(1);
}
console.log("Generator bundle OK");
