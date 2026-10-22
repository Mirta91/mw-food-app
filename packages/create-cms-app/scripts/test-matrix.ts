// Generates CMS × framework combinations into a temporary directory, installs each, and runs its
// `pnpm check`, `pnpm build` and pre-commit hook, and checks that `pnpm start` and `pnpm dev` refuse
// to run without CMS variables. Slow and needs network; not part of `pnpm check`.
// Usage: pnpm test:matrix [--concurrency <n>] [--keep] [<cms>-<framework> ...]
import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { allCombos, type Combo, comboId } from "../src/choices.ts";
import { generate } from "../src/generate.ts";
import type { Exec } from "../src/git.ts";
import { sourceTemplatesDir } from "../src/paths.ts";

type ExecResult = {
  code: number;
  output: string;
  timedOut: boolean;
};

type StepOptions = {
  expect?: (output: string) => boolean;
  // The step passes when the command exits non-zero on its own (not through the timeout).
  expectFailure?: boolean;
  timeoutMs?: number;
};

type Outcome = {
  id: string;
  failedStep?: string;
  log: string;
};

// Strip CMS credentials from the developer's shell so every project runs in the "missing" state,
// and coding-agent markers so tools behave as in a terminal (Astro backgrounds `astro dev` for
// agents and writes its output to a log file instead).
const baseEnv: NodeJS.ProcessEnv = Object.fromEntries(
  Object.entries(process.env).filter(
    ([name]) =>
      !/^(SANITY|CONTENTFUL|STORYBLOK)_/.test(name) &&
      !/^(AI_AGENT|CLAUDECODE|CLAUDE_CODE_.*|CLAUDE_PID)$/.test(name),
  ),
);
Object.assign(baseEnv, {
  GIT_AUTHOR_NAME: "test-matrix",
  GIT_AUTHOR_EMAIL: "test-matrix@example.invalid",
  GIT_COMMITTER_NAME: "test-matrix",
  GIT_COMMITTER_EMAIL: "test-matrix@example.invalid",
});

const { combos, concurrency, keep } = parseArgs(process.argv.slice(2));
const work = await mkdtemp(join(tmpdir(), "create-cms-app-matrix-"));
console.log(`Matrix: ${combos.length} combination(s) in ${work}`);

const outcomes = await pool(combos, concurrency, async (combo, index) => {
  const outcome = await runCombo(combo, index, work);
  await writeFile(join(work, `${outcome.id}.log`), outcome.log);
  console.log(
    outcome.failedStep ? `FAIL ${outcome.id} (${outcome.failedStep})` : `ok   ${outcome.id}`,
  );
  return outcome;
});

const failed = outcomes.filter((outcome) => outcome.failedStep);
if (failed.length > 0) {
  console.error(
    `\n${failed.length} failed. Logs: ${failed.map((o) => join(work, `${o.id}.log`)).join(" ")}`,
  );
  process.exit(1);
}
if (!keep) {
  await rm(work, { recursive: true, force: true });
}
console.log(`\nAll ${outcomes.length} passed.`);

function parseArgs(argv: string[]): { combos: Combo[]; concurrency: number; keep: boolean } {
  let concurrency = 1;
  let keep = false;
  const ids: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i] ?? "";
    if (arg === "--concurrency") {
      concurrency = Number(argv[++i]);
    } else if (arg === "--keep") {
      keep = true;
    } else {
      ids.push(arg);
    }
  }
  const known = allCombos();
  const unknown = ids.filter((id) => !known.some((combo) => comboId(combo) === id));
  if (unknown.length > 0 || !(concurrency >= 1)) {
    console.error(`Unknown combination or bad --concurrency: ${unknown.join(", ")}`);
    console.error(`Known: ${known.map(comboId).join(", ")}`);
    process.exit(2);
  }
  const combos = ids.length === 0 ? known : known.filter((combo) => ids.includes(comboId(combo)));
  return { combos, concurrency, keep };
}

// With a timeout the command runs in its own process group, so the whole tree (pnpm, the
// framework CLI, its server) is killed when the timeout expires.
function exec(
  command: string,
  args: string[],
  cwd: string,
  env: NodeJS.ProcessEnv,
  timeoutMs?: number,
): Promise<ExecResult> {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: ["ignore", "pipe", "pipe"],
      detached: timeoutMs !== undefined,
    });
    let output = `$ ${command} ${args.join(" ")}\n`;
    let timedOut = false;
    const timer =
      timeoutMs === undefined
        ? undefined
        : setTimeout(() => {
            timedOut = true;
            output += `timed out after ${timeoutMs} ms\n`;
            process.kill(-(child.pid ?? 0), "SIGKILL");
          }, timeoutMs);
    child.stdout.on("data", (chunk: Buffer) => (output += chunk.toString()));
    child.stderr.on("data", (chunk: Buffer) => (output += chunk.toString()));
    child.on("error", (error) => {
      clearTimeout(timer);
      resolve({ code: 1, output: `${output}${String(error)}\n`, timedOut });
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code: code ?? 1, output, timedOut });
    });
  });
}

async function runCombo(combo: Combo, index: number, work: string): Promise<Outcome> {
  const id = comboId(combo);
  const dir = join(work, id);
  // PORT keeps a server that wrongly starts from colliding with other combinations or local apps.
  const port = String(4173 + index);
  const env = { ...baseEnv, E2E_PORT: port, PORT: port };
  let log = "";
  const step = async (
    name: string,
    command: string,
    args: string[],
    { expect, expectFailure = false, timeoutMs }: StepOptions = {},
  ) => {
    const result = await exec(command, args, dir, env, timeoutMs);
    log += result.output;
    const exitedAsExpected = expectFailure
      ? result.code !== 0 && !result.timedOut
      : result.code === 0;
    if (!exitedAsExpected || (expect && !expect(result.output))) {
      throw new Error(name);
    }
    return result.output;
  };
  try {
    const gitExec: Exec = async (command, args, { cwd }) => {
      const result = await exec(command, args, cwd, env);
      log += result.output;
      if (result.code !== 0) {
        throw Object.assign(new Error(result.output), { stderr: result.output });
      }
    };
    const result = await generate({ name: id, ...combo }, dir, sourceTemplatesDir, gitExec);
    if (result.git.status !== "committed") {
      throw new Error(`generate (git: ${result.git.status})`);
    }
    await step("one initial commit", "git", ["rev-list", "--count", "HEAD"], {
      expect: (out) => out.trim().split("\n").at(-1) === "1",
    });
    await step("pnpm install", "pnpm", ["install"]);
    await step("playwright install", "pnpm", ["exec", "playwright", "install", "chromium"]);
    await step("pnpm check", "pnpm", ["check"]);
    await step("pnpm build", "pnpm", ["build"]);
    const names = await requiredEnv(dir);
    const namesMissing = (out: string) =>
      out.includes("Missing environment variables:") && names.every((name) => out.includes(name));
    for (const script of ["start", "dev"]) {
      await step(`pnpm ${script} refuses without env`, "pnpm", [script], {
        expect: namesMissing,
        expectFailure: true,
        timeoutMs: 120_000,
      });
    }
    await step(
      "pre-commit hook",
      "git",
      ["commit", "--allow-empty", "-m", "test: pre-commit hook"],
      { expect: (out) => out.includes("pre-commit: running pnpm check") },
    );
    return { id, log };
  } catch (error) {
    return { id, failedStep: (error as Error).message, log };
  }
}

// Same parsing as src/matrix.test.ts: the names in `requiredEnv = [...]` of the CMS client.
async function requiredEnv(dir: string): Promise<string[]> {
  const client = await readFile(join(dir, "src/lib/cms/client.ts"), "utf8");
  const list = /requiredEnv = \[([^\]]*)\]/.exec(client)?.[1] ?? "";
  const names = list.match(/[A-Z_]+/g) ?? [];
  if (names.length === 0) {
    throw new Error("requiredEnv not found");
  }
  return names;
}

async function pool<T, R>(
  items: T[],
  size: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  let next = 0;
  const lanes = Array.from({ length: Math.min(size, items.length) }, async () => {
    for (let index = next++; index < items.length; index = next++) {
      results[index] = await worker(items[index] as T, index);
    }
  });
  await Promise.all(lanes);
  return results;
}
