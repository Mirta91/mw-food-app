import { resolve } from "node:path";
import { generate } from "./generate.ts";
import type { Exec } from "./git.ts";
import { askChoices, type Prompter } from "./prompts.ts";
import { assertTargetUsable, TargetNotEmptyError } from "./write.ts";

export interface Logger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  success(message: string): void;
}

export interface CliContext {
  prompter: Prompter;
  log: Logger;
  cwd: string;
  templatesDir: string;
  interactive: boolean;
  exec?: Exec;
}

export function nextSteps(name: string): string {
  return [
    "Next steps:",
    `  cd ${name}`,
    "  pnpm install",
    "  pnpm exec playwright install",
    "  cp .env.example .env   # then fill in the values",
    "  pnpm dev",
  ].join("\n");
}

export async function run(context: CliContext): Promise<number> {
  const { log } = context;
  if (!context.interactive) {
    log.error("create-cms-app needs an interactive terminal. Run it directly in a terminal.");
    return 1;
  }
  const choices = await askChoices(context.prompter);
  if (!choices) {
    log.info("Cancelled. Nothing was written.");
    return 0;
  }
  const target = resolve(context.cwd, choices.name);
  try {
    await assertTargetUsable(target);
  } catch (error) {
    if (!(error instanceof TargetNotEmptyError)) throw error;
    log.error(`${choices.name} already exists and is not empty. Choose another name or remove it.`);
    return 1;
  }

  const result = await generate(choices, target, context.templatesDir, context.exec);
  if (result.symlinkFallback) {
    log.warn(
      "Could not create CLAUDE.md as a symlink, so it is a copy of AGENTS.md. Replace it with a symlink when you can.",
    );
  }
  if (result.git.status === "git-missing") {
    log.warn("git not found: skipped git init and the initial commit.");
  } else if (result.git.status === "commit-failed") {
    log.warn(
      `Could not create the initial commit: ${result.git.message}\nThe repository is initialized and all files are staged; commit them yourself.`,
    );
  }
  log.success(`Created ${choices.name}`);
  log.info(nextSteps(choices.name));
  return 0;
}
