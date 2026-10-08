// Enforces the AGENTS.md link rules that a plain link checker cannot:
// - each instruction file is linked at most once from AGENTS.md
// - each link to an instruction file in AGENTS.md says when to read it ("- [Title](path) — trigger")
// - every instruction file is reachable from AGENTS.md (no orphans)
// - links between instruction files are allowed but reported as a warning
// Dead links and anchors are checked by lychee (`pnpm check:links`).
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, normalize } from "node:path";

const root = join(dirname(new URL(import.meta.url).pathname), "..");
const agentsFile = "AGENTS.md";
const instructionsDir = join("docs", "instructions");
const linkPattern = /\[[^\]]*\]\(([^)\s#]+)(?:#[^)]*)?\)/g;
const triggerPattern = /^\s*[-*]\s+\[[^\]]+\]\([^)]+\)\s+[—–-]\s+\S/;

const errors = [];
const warnings = [];

function instructionLinks(file) {
  const lines = readFileSync(join(root, file), "utf8").split("\n");
  const links = [];
  let inFence = false;
  lines.forEach((rawLine, index) => {
    if (/^\s*(```|~~~)/.test(rawLine)) inFence = !inFence;
    if (inFence) return;
    const line = rawLine.replace(/`[^`]*`/g, "");
    for (const [, target] of line.matchAll(linkPattern)) {
      if (/^[a-z]+:/i.test(target)) continue;
      const resolved = normalize(join(dirname(file), target));
      if (dirname(resolved) === instructionsDir && resolved.endsWith(".md")) {
        links.push({ target: resolved, line, lineNumber: index + 1 });
      }
    }
  });
  return links;
}

const instructionFiles = existsSync(join(root, instructionsDir))
  ? readdirSync(join(root, instructionsDir))
      .filter((name) => name.endsWith(".md"))
      .map((name) => join(instructionsDir, name))
  : [];

const counts = new Map();
for (const link of instructionLinks(agentsFile)) {
  counts.set(link.target, (counts.get(link.target) ?? 0) + 1);
  if (!triggerPattern.test(link.line)) {
    errors.push(
      `${agentsFile}:${link.lineNumber}: link to ${link.target} needs the form "- [Title](${link.target}) — when to read it"`,
    );
  }
}
for (const [target, count] of counts) {
  if (count > 1) errors.push(`${agentsFile}: ${target} is linked ${count} times, allowed once`);
}

const reachable = new Set(counts.keys());
const queue = [...reachable];
while (queue.length > 0) {
  const file = queue.shift();
  if (!existsSync(join(root, file))) continue;
  for (const link of instructionLinks(file)) {
    if (link.target === file) continue;
    warnings.push(
      `${file}:${link.lineNumber}: links to ${link.target}; prefer linking instruction files only from ${agentsFile}`,
    );
    if (!reachable.has(link.target)) {
      reachable.add(link.target);
      queue.push(link.target);
    }
  }
}
for (const file of instructionFiles) {
  if (!reachable.has(file)) errors.push(`${file}: not reachable from ${agentsFile}`);
}

for (const warning of warnings) console.warn(`warning: ${warning}`);
for (const error of errors) console.error(`error: ${error}`);
if (errors.length > 0) process.exit(1);
console.log(`Instruction links OK (${instructionFiles.length} instruction files)`);
