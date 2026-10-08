import { execFileSync } from "node:child_process";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type CliContext, nextSteps, run } from "./cli.ts";
import type { Exec } from "./git.ts";
import { makeTempDir, scriptedPrompter, writeTree } from "./test-helpers.ts";

const answers = ["my-app", "sanity", "next", true];
let cwd: string;
let templatesDir: string;
let logs: string[];

function context(overrides: Partial<CliContext> = {}): CliContext {
  const record = (level: string) => (message: string) => logs.push(`${level}: ${message}`);
  return {
    prompter: scriptedPrompter(answers).prompter,
    log: {
      info: record("info"),
      warn: record("warn"),
      error: record("error"),
      success: record("success"),
    },
    cwd,
    templatesDir,
    interactive: true,
    ...overrides,
  };
}

beforeEach(async () => {
  cwd = await makeTempDir();
  templatesDir = await makeTempDir();
  logs = [];
  await writeTree(templatesDir, {
    "common/AGENTS.md": "# __PROJECT_NAME__\n",
    "common/pkg.json": JSON.stringify({ name: "__PROJECT_NAME__" }),
    "frameworks/next/next.config.ts": "export default {};\n",
    "cms/sanity/.env.example": "SANITY_PROJECT_ID=\n",
    "combos/sanity-next/src/app/page.tsx": "export default function Page() {}\n",
  });
  vi.stubEnv("GIT_AUTHOR_NAME", "Test");
  vi.stubEnv("GIT_AUTHOR_EMAIL", "test@example.invalid");
  vi.stubEnv("GIT_COMMITTER_NAME", "Test");
  vi.stubEnv("GIT_COMMITTER_EMAIL", "test@example.invalid");
  vi.stubEnv("GIT_CONFIG_GLOBAL", "/dev/null");
  vi.stubEnv("GIT_CONFIG_NOSYSTEM", "1");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("run", () => {
  it("generates the project with one commit and prints next steps", async () => {
    expect(await run(context())).toBe(0);
    const target = join(cwd, "my-app");
    expect(JSON.parse(await readFile(join(target, "package.json"), "utf8")).name).toBe("my-app");
    expect(
      execFileSync("git", ["rev-list", "--count", "HEAD"], {
        cwd: target,
        encoding: "utf8",
      }).trim(),
    ).toBe("1");
    expect(logs).toContain(`info: ${nextSteps("my-app")}`);
    expect(nextSteps("my-app")).toMatch(
      /cd my-app[\s\S]*pnpm install[\s\S]*pnpm exec playwright install[\s\S]*\.env\.example[\s\S]*pnpm dev/,
    );
  });

  it("writes nothing when cancelled", async () => {
    const { prompter } = scriptedPrompter(["my-app", "sanity", "next", false]);
    expect(await run(context({ prompter }))).toBe(0);
    expect(await readdir(cwd)).toEqual([]);
    expect(logs.join("\n")).toMatch(/Cancelled/);
  });

  it("exits 1 for a non-empty target and leaves it unchanged", async () => {
    await mkdir(join(cwd, "my-app"));
    await writeFile(join(cwd, "my-app", "keep.txt"), "mine");
    expect(await run(context())).toBe(1);
    expect(await readdir(join(cwd, "my-app"))).toEqual(["keep.txt"]);
    expect(logs.join("\n")).toMatch(/error: my-app already exists and is not empty/);
  });

  it("warns and succeeds when git is missing", async () => {
    const exec: Exec = async () => {
      throw Object.assign(new Error("spawn git ENOENT"), { code: "ENOENT" });
    };
    expect(await run(context({ exec }))).toBe(0);
    expect(logs.join("\n")).toMatch(/warn: git not found/);
    expect(await readFile(join(cwd, "my-app", "AGENTS.md"), "utf8")).toBe("# my-app\n");
  });

  it("warns and succeeds when the commit fails", async () => {
    const exec: Exec = async (_command, args) => {
      if (args[0] === "commit")
        throw Object.assign(new Error("failed"), { stderr: "Author identity unknown" });
    };
    expect(await run(context({ exec }))).toBe(0);
    expect(logs.join("\n")).toMatch(
      /warn: Could not create the initial commit: Author identity unknown/,
    );
  });

  it("refuses to run without an interactive terminal", async () => {
    expect(await run(context({ interactive: false }))).toBe(1);
    expect(logs.join("\n")).toMatch(/needs an interactive terminal/);
    expect(await readdir(cwd)).toEqual([]);
  });
});
