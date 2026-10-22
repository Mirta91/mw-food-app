import { chmod, mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import type { Prompter } from "./prompts.ts";

export async function makeTempDir(): Promise<string> {
  return mkdtemp(join(tmpdir(), "create-cms-app-"));
}

export async function writeTree(
  root: string,
  files: Record<string, string | { contents: string; mode: number }>,
): Promise<void> {
  for (const [path, value] of Object.entries(files)) {
    const file = join(root, path);
    await mkdir(dirname(file), { recursive: true });
    const { contents, mode } = typeof value === "string" ? { contents: value, mode: 0o644 } : value;
    await writeFile(file, contents);
    await chmod(file, mode);
  }
}

export const CANCEL = Symbol("cancel");

// Answers prompts in order; records each prompt's message (notes as "note:<title>").
export function scriptedPrompter(answers: unknown[]): { prompter: Prompter; asked: string[] } {
  const queue = [...answers];
  const asked: string[] = [];
  const next = async (
    message: string,
    validate?: (value: string | undefined) => string | undefined,
  ) => {
    asked.push(message);
    const answer = queue.shift();
    if (validate && typeof answer === "string" && validate(answer)) {
      throw new Error(`invalid answer ${answer}`);
    }
    return answer as never;
  };
  return {
    asked,
    prompter: {
      text: (options) => next(options.message, options.validate),
      select: (options) => next(options.message),
      confirm: (options) => next(options.message),
      note: (_message, title) => {
        asked.push(`note:${title}`);
      },
    },
  };
}
