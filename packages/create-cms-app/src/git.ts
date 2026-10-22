import { execFile } from "node:child_process";
import { promisify } from "node:util";

export type Exec = (command: string, args: string[], options: { cwd: string }) => Promise<void>;

export type GitResult =
  | { status: "committed" }
  | { status: "git-missing" }
  | { status: "commit-failed"; message: string };

export const execFileExec: Exec = async (command, args, { cwd }) => {
  await execFileAsync(command, args, { cwd });
};

export async function initRepository(dir: string, exec: Exec = execFileExec): Promise<GitResult> {
  try {
    await exec("git", ["--version"], { cwd: dir });
  } catch {
    return { status: "git-missing" };
  }
  try {
    await exec("git", ["init", "-b", "main"], { cwd: dir });
    await exec("git", ["add", "-A"], { cwd: dir });
    // Hooks are not active before `pnpm install`; --no-verify also skips global hooks.
    await exec("git", ["commit", "--no-verify", "-m", "chore: initial project"], { cwd: dir });
    return { status: "committed" };
  } catch (error) {
    return { status: "commit-failed", message: messageOf(error) };
  }
}

const execFileAsync = promisify(execFile);

function messageOf(error: unknown): string {
  const stderr = (error as { stderr?: unknown }).stderr;
  if (typeof stderr === "string" && stderr.trim()) {
    return stderr.trim();
  }
  return error instanceof Error ? error.message : String(error);
}
