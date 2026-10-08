import { lstat, mkdir, readFile, readdir, readlink, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import type { FileEntry } from "./plan.ts";
import { makeTempDir } from "./test-helpers.ts";
import { assertTargetUsable, TargetNotEmptyError, writeProject } from "./write.ts";

const entries: FileEntry[] = [
  { kind: "file", path: "AGENTS.md", contents: Buffer.from("# agents\n"), mode: 0o644 },
  { kind: "symlink", path: "CLAUDE.md", target: "AGENTS.md" },
  { kind: "file", path: ".githooks/pre-commit", contents: Buffer.from("#!/bin/sh\n"), mode: 0o755 },
];

let parent: string;
let target: string;

beforeEach(async () => {
  parent = await makeTempDir();
  target = join(parent, "my-app");
});

async function leftovers(): Promise<string[]> {
  return (await readdir(parent)).filter((name) => name.includes(".tmp-"));
}

describe("writeProject", () => {
  it("writes files, modes and the symlink", async () => {
    const result = await writeProject(target, entries);
    expect(result.symlinkFallback).toBe(false);
    expect(await readFile(join(target, "AGENTS.md"), "utf8")).toBe("# agents\n");
    expect(await readlink(join(target, "CLAUDE.md"))).toBe("AGENTS.md");
    expect((await stat(join(target, ".githooks/pre-commit"))).mode & 0o111).toBeTruthy();
    expect(await leftovers()).toEqual([]);
  });

  it("accepts an existing empty directory", async () => {
    await mkdir(target);
    await writeProject(target, entries);
    expect(await readFile(join(target, "AGENTS.md"), "utf8")).toBe("# agents\n");
  });

  it("refuses a non-empty directory and leaves it unchanged", async () => {
    await mkdir(target);
    await writeFile(join(target, "keep.txt"), "mine");
    await expect(writeProject(target, entries)).rejects.toBeInstanceOf(TargetNotEmptyError);
    expect(await readdir(target)).toEqual(["keep.txt"]);
    expect(await leftovers()).toEqual([]);
  });

  it("refuses a target that is a file and leaves it unchanged", async () => {
    await writeFile(target, "a file");
    await expect(assertTargetUsable(target)).rejects.toBeInstanceOf(TargetNotEmptyError);
    await expect(writeProject(target, entries)).rejects.toBeInstanceOf(TargetNotEmptyError);
    expect(await readFile(target, "utf8")).toBe("a file");
  });

  it("removes partial output when a write fails", async () => {
    const broken: FileEntry[] = [
      { kind: "file", path: "a", contents: Buffer.from("file"), mode: 0o644 },
      { kind: "file", path: "a/b", contents: Buffer.from("needs a to be a dir"), mode: 0o644 },
    ];
    await expect(writeProject(target, broken)).rejects.toThrow();
    await expect(lstat(target)).rejects.toThrow();
    expect(await leftovers()).toEqual([]);
  });

  it("copies the link target when symlinks are not permitted", async () => {
    const result = await writeProject(target, entries, {
      symlink: async () => {
        throw Object.assign(new Error("not permitted"), { code: "EPERM" });
      },
    });
    expect(result.symlinkFallback).toBe(true);
    expect(await readFile(join(target, "CLAUDE.md"), "utf8")).toBe("# agents\n");
  });

  it("creates target directory with normal mode (respecting umask)", async () => {
    await writeProject(target, entries);
    const mode = (await stat(target)).mode & 0o777;
    expect(mode).toBe(0o777 & ~process.umask());
  });
});
