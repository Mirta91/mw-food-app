import type { Choices } from "./choices.ts";
import { type Exec, type GitResult, initRepository } from "./git.ts";
import { planProject } from "./plan.ts";
import { writeProject } from "./write.ts";

export interface GenerateResult {
  git: GitResult;
  symlinkFallback: boolean;
}

export async function generate(
  choices: Choices,
  targetDir: string,
  templatesDir: string,
  exec?: Exec,
): Promise<GenerateResult> {
  const entries = await planProject(templatesDir, choices);
  const { symlinkFallback } = await writeProject(targetDir, entries);
  const git = await initRepository(targetDir, exec);
  return { git, symlinkFallback };
}
