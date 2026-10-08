import * as clack from "@clack/prompts";
import { fileURLToPath } from "node:url";
import { run } from "./cli.ts";
import { clackPrompter } from "./prompts.ts";

const templatesDir = fileURLToPath(new URL("./templates/", import.meta.url));

clack.intro("create-cms-app");
try {
  process.exitCode = await run({
    prompter: clackPrompter,
    log: clack.log,
    cwd: process.cwd(),
    templatesDir,
    interactive: Boolean(process.stdin.isTTY && process.stdout.isTTY),
  });
} catch (error) {
  clack.log.error(error instanceof Error ? error.message : String(error));
  if (process.env.DEBUG && error instanceof Error) console.error(error.stack);
  process.exitCode = 1;
}
