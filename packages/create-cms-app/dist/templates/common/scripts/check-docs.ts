// Checks the documentation rules from AGENTS.md (run: `pnpm check:docs`):
// - every relative link in AGENTS.md and docs/**/*.md points to an existing file, and every
//   anchor to an existing heading
// - each instruction file is linked at most once from AGENTS.md as a list entry
//   "- [Title](path) — when to read it" (anchored or not); links to it in prose are only checked
//   for existence
// - every instruction file is reachable from AGENTS.md
// - links between instruction files are allowed but reported as warnings
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, normalize, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

export interface DocsReport {
  errors: string[];
  warnings: string[];
  instructionFiles: string[];
}

interface Link {
  target: string;
  anchor: string | undefined;
  line: string;
  lineNumber: number;
}

const AGENTS = "AGENTS.md";
const INSTRUCTIONS = "docs/instructions";
const LINK = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
const TRIGGER = /^\s*[-*]\s+\[[^\]]+\]\([^)]+\)\s+[—–-]\s+\S/;
const BULLET = /^\s*[-*]\s+\[/;
const FENCE = /^\s*(```|~~~)/;

function toPosix(path: string): string {
  return path.split(sep).join("/");
}

function markdownFiles(root: string): string[] {
  const files = existsSync(join(root, AGENTS)) ? [AGENTS] : [];
  const docs = join(root, "docs");
  if (existsSync(docs)) {
    for (const entry of readdirSync(docs, { recursive: true, withFileTypes: true })) {
      if (entry.isFile() && entry.name.endsWith(".md")) {
        files.push(toPosix(relative(root, join(entry.parentPath, entry.name))));
      }
    }
  }
  return files.sort();
}

function linksIn(root: string, file: string): Link[] {
  const links: Link[] = [];
  let inFence = false;
  readFileSync(join(root, file), "utf8")
    .split("\n")
    .forEach((raw, index) => {
      if (FENCE.test(raw)) {
        inFence = !inFence;
        return;
      }
      if (inFence) return;
      const line = raw.replace(/`[^`]*`/g, "");
      for (const match of line.matchAll(LINK)) {
        const href = match[1] ?? "";
        if (/^[a-z][a-z0-9+.-]*:/i.test(href)) continue; // https:, mailto:, ...
        const [path = "", anchor] = href.split("#", 2);
        const target =
          path === "" ? file : toPosix(normalize(join(dirname(file), decodeURI(path))));
        links.push({ target, anchor, line, lineNumber: index + 1 });
      }
    });
  return links;
}

export function headingSlugs(markdown: string): Set<string> {
  const slugs = new Set<string>();
  const seen = new Map<string, number>();
  let inFence = false;
  for (const line of markdown.split("\n")) {
    if (FENCE.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const heading = /^#{1,6}\s+(.*?)\s*#*\s*$/.exec(line)?.[1];
    if (heading === undefined) continue;
    const base = heading
      .toLowerCase()
      .replace(/<[^>]*>/g, "")
      .replace(/[^\p{L}\p{N}\s_-]/gu, "")
      .replace(/\s/g, "-");
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    slugs.add(count === 0 ? base : `${base}-${count}`);
  }
  return slugs;
}

function isInstruction(path: string): boolean {
  return dirname(path) === INSTRUCTIONS && path.endsWith(".md");
}

export function checkDocs(root: string): DocsReport {
  const errors: string[] = [];
  const warnings: string[] = [];
  const files = markdownFiles(root);
  const slugCache = new Map<string, Set<string>>();
  const slugsOf = (file: string): Set<string> => {
    let slugs = slugCache.get(file);
    if (!slugs) {
      slugs = headingSlugs(readFileSync(join(root, file), "utf8"));
      slugCache.set(file, slugs);
    }
    return slugs;
  };

  for (const file of files) {
    for (const link of linksIn(root, file)) {
      const absolute = join(root, link.target);
      if (!existsSync(absolute)) {
        errors.push(`${file}:${link.lineNumber}: dead link to ${link.target}`);
      } else if (
        link.anchor !== undefined &&
        link.target.endsWith(".md") &&
        statSync(absolute).isFile() &&
        !slugsOf(link.target).has(link.anchor.toLowerCase())
      ) {
        errors.push(`${file}:${link.lineNumber}: dead anchor #${link.anchor} in ${link.target}`);
      }
    }
  }

  const instructionFiles = files.filter(isInstruction);
  if (!files.includes(AGENTS)) {
    errors.push(`${AGENTS}: missing`);
    return { errors, warnings, instructionFiles };
  }

  const counts = new Map<string, number>();
  for (const link of linksIn(root, AGENTS)) {
    // Only bullet lines are instruction-list entries; prose links are checked as plain links.
    if (!isInstruction(link.target) || !BULLET.test(link.line)) continue;
    counts.set(link.target, (counts.get(link.target) ?? 0) + 1);
    if (!TRIGGER.test(link.line)) {
      errors.push(
        `${AGENTS}:${link.lineNumber}: link to ${link.target} needs the form "- [Title](${link.target}) — when to read it"`,
      );
    }
  }
  for (const [target, count] of counts) {
    if (count > 1) errors.push(`${AGENTS}: ${target} is linked ${count} times, allowed once`);
  }

  const reachable = new Set(counts.keys());
  const queue = [...reachable];
  for (let file = queue.shift(); file !== undefined; file = queue.shift()) {
    if (!existsSync(join(root, file))) continue;
    for (const link of linksIn(root, file)) {
      if (!isInstruction(link.target) || link.target === file) continue;
      warnings.push(
        `${file}:${link.lineNumber}: links to ${link.target}; prefer linking instruction files only from ${AGENTS}`,
      );
      if (!reachable.has(link.target)) {
        reachable.add(link.target);
        queue.push(link.target);
      }
    }
  }
  for (const file of instructionFiles) {
    if (!reachable.has(file)) errors.push(`${file}: not reachable from ${AGENTS}`);
  }
  return { errors, warnings, instructionFiles };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const report = checkDocs(join(dirname(fileURLToPath(import.meta.url)), ".."));
  for (const warning of report.warnings) console.warn(`warning: ${warning}`);
  for (const error of report.errors) console.error(`error: ${error}`);
  if (report.errors.length > 0) process.exit(1);
  console.log(`Docs OK (${report.instructionFiles.length} instruction files)`);
}
