import { chmod, mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

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
