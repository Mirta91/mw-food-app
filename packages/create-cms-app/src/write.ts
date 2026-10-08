import {
  chmod,
  copyFile,
  lstat,
  mkdir,
  mkdtemp,
  readdir,
  rename,
  rm,
  rmdir,
  symlink,
  writeFile,
} from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import type { FileEntry } from "./plan.ts";

export class TargetNotEmptyError extends Error {
  readonly target: string;

  constructor(target: string) {
    super(`${target} already exists and is not empty`);
    this.name = "TargetNotEmptyError";
    this.target = target;
  }
}

function isMissing(error: unknown): boolean {
  return (error as NodeJS.ErrnoException).code === "ENOENT";
}

export async function assertTargetUsable(target: string): Promise<void> {
  let info;
  try {
    info = await lstat(target);
  } catch (error) {
    if (isMissing(error)) return;
    throw error;
  }
  if (!info.isDirectory() || (await readdir(target)).length > 0)
    throw new TargetNotEmptyError(target);
}

// Writes into a sibling temporary directory and renames it into place, so a failure never leaves
// a partial project behind.
export async function writeProject(
  target: string,
  entries: FileEntry[],
  options: { symlink?: (target: string, path: string) => Promise<void> } = {},
): Promise<{ symlinkFallback: boolean }> {
  const link = options.symlink ?? symlink;
  await assertTargetUsable(target);
  const temp = await mkdtemp(join(dirname(target), `.${basename(target)}.tmp-`));
  let symlinkFallback = false;
  try {
    await chmod(temp, 0o777 & ~process.umask());
    for (const entry of entries) {
      if (entry.kind !== "file") continue;
      const file = join(temp, ...entry.path.split("/"));
      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, entry.contents);
      await chmod(file, entry.mode);
    }
    for (const entry of entries) {
      if (entry.kind !== "symlink") continue;
      const file = join(temp, ...entry.path.split("/"));
      await mkdir(dirname(file), { recursive: true });
      try {
        await link(entry.target, file);
      } catch {
        symlinkFallback = true;
        await copyFile(join(dirname(file), entry.target), file);
      }
    }
    await rmdir(target).catch((error: unknown) => {
      if (!isMissing(error)) throw error;
    });
    await rename(temp, target);
  } catch (error) {
    await rm(temp, { recursive: true, force: true });
    throw error;
  }
  return { symlinkFallback };
}
