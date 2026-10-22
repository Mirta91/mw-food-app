import { execFileSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { type Exec, initRepository } from "./git.ts";
import { makeTempDir } from "./test-helpers.ts";

function recordingExec(fail?: (args: string[]) => Error | undefined): {
  exec: Exec;
  calls: string[];
} {
  const calls: string[] = [];
  const exec: Exec = async (command, args) => {
    calls.push([command, ...args].join(" "));
    const error = fail?.(args);
    if (error) {
      throw error;
    }
  };
  return { exec, calls };
}

describe("initRepository", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });
  it("initializes, stages everything and commits", async () => {
    const { exec, calls } = recordingExec();
    expect(await initRepository("/project", exec)).toEqual({ status: "committed" });
    expect(calls).toEqual([
      "git --version",
      "git init -b main",
      "git add -A",
      "git commit --no-verify -m chore: initial project",
    ]);
  });

  it("reports git as missing without running anything else", async () => {
    const { exec, calls } = recordingExec(() =>
      Object.assign(new Error("spawn git ENOENT"), { code: "ENOENT" }),
    );
    expect(await initRepository("/project", exec)).toEqual({ status: "git-missing" });
    expect(calls).toEqual(["git --version"]);
  });

  it("reports a failed commit with git's message", async () => {
    const { exec } = recordingExec((args) =>
      args[0] === "commit"
        ? Object.assign(new Error("Command failed"), { stderr: "Author identity unknown\n" })
        : undefined,
    );
    expect(await initRepository("/project", exec)).toEqual({
      status: "commit-failed",
      message: "Author identity unknown",
    });
  });

  it("creates exactly one commit with real git", async () => {
    vi.stubEnv("GIT_AUTHOR_NAME", "Test");
    vi.stubEnv("GIT_AUTHOR_EMAIL", "test@example.invalid");
    vi.stubEnv("GIT_COMMITTER_NAME", "Test");
    vi.stubEnv("GIT_COMMITTER_EMAIL", "test@example.invalid");
    vi.stubEnv("GIT_CONFIG_GLOBAL", "/dev/null");
    vi.stubEnv("GIT_CONFIG_NOSYSTEM", "1");
    const dir = await makeTempDir();
    await writeFile(join(dir, "README.md"), "hi\n");
    expect(await initRepository(dir)).toEqual({ status: "committed" });
    expect(
      execFileSync("git", ["rev-list", "--count", "HEAD"], { cwd: dir, encoding: "utf8" }).trim(),
    ).toBe("1");
  });
});
