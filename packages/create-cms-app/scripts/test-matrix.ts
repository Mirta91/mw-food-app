// Generates CMS × framework combinations into a temporary directory, installs each, and runs its
// `pnpm check` and pre-commit hook. Slow and needs network; not part of `pnpm check`.
// Usage: pnpm test:matrix [--concurrency <n>] [--keep] [<cms>-<framework> ...]
import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { allCombos, type Combo, comboId } from "../src/choices.ts";
import { generate } from "../src/generate.ts";
import type { Exec } from "../src/git.ts";
import { sourceTemplatesDir } from "../src/paths.ts";

interface Outcome {
  id: string;
  failedStep?: string;
  log: string;
}

function parseArgs(argv: string[]): { combos: Combo[]; concurrency: number; keep: boolean } {
  let concurrency = 1;
  let keep = false;
  const ids: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i] ?? "";
    if (arg === "--concurrency") concurrency = Number(argv[++i]);
    else if (arg === "--keep") keep = true;
    else ids.push(arg);
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

// Strip CMS credentials from the developer's shell so every project runs in the "missing" state.
const baseEnv: NodeJS.ProcessEnv = Object.fromEntries(
  Object.entries(process.env).filter(([name]) => !/^(SANITY|CONTENTFUL|STORYBLOK)_/.test(name)),
);
Object.assign(baseEnv, {
  GIT_AUTHOR_NAME: "test-matrix",
  GIT_AUTHOR_EMAIL: "test-matrix@example.invalid",
  GIT_COMMITTER_NAME: "test-matrix",
  GIT_COMMITTER_EMAIL: "test-matrix@example.invalid",
});

function exec(
  command: string,
  args: string[],
  cwd: string,
  env: NodeJS.ProcessEnv,
): Promise<{ code: number; output: string }> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { cwd, env, stdio: ["ignore", "pipe", "pipe"] });
    let output = `$ ${command} ${args.join(" ")}\n`;
    child.stdout.on("data", (chunk: Buffer) => (output += chunk.toString()));
    child.stderr.on("data", (chunk: Buffer) => (output += chunk.toString()));
    child.on("error", (error) => resolve({ code: 1, output: `${output}${String(error)}\n` }));
    child.on("close", (code) => resolve({ code: code ?? 1, output }));
  });
}

async function runCombo(combo: Combo, index: number, work: string): Promise<Outcome> {
  const id = comboId(combo);
  const dir = join(work, id);
  const env = { ...baseEnv, E2E_PORT: String(4173 + index) };
  let log = "";
  const step = async (
    name: string,
    command: string,
    args: string[],
    expect?: (output: string) => boolean,
  ) => {
    const result = await exec(command, args, dir, env);
    log += result.output;
    if (result.code !== 0 || (expect && !expect(result.output))) throw new Error(name);
    return result.output;
  };
  try {
    const gitExec: Exec = async (command, args, { cwd }) => {
      const result = await exec(command, args, cwd, env);
      log += result.output;
      if (result.code !== 0)
        throw Object.assign(new Error(result.output), { stderr: result.output });
    };
    const result = await generate({ name: id, ...combo }, dir, sourceTemplatesDir, gitExec);
    if (result.git.status !== "committed") throw new Error(`generate (git: ${result.git.status})`);
    await step("one initial commit", "git", ["rev-list", "--count", "HEAD"], (out) =>
      out.trim().endsWith("1"),
    );
    await step("pnpm install", "pnpm", ["install"]);
    await step("playwright install", "pnpm", ["exec", "playwright", "install", "chromium"]);
    await step("pnpm check", "pnpm", ["check"]);
    await step(
      "pre-commit hook",
      "git",
      ["commit", "--allow-empty", "-m", "test: pre-commit hook"],
      (out) => out.includes("pre-commit: running pnpm check"),
    );
    return { id, log };
  } catch (error) {
    return { id, failedStep: (error as Error).message, log };
  }
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
if (!keep) await rm(work, { recursive: true, force: true });
console.log(`\nAll ${outcomes.length} passed.`);
