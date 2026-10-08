import { join, relative } from "node:path";
import { type Choices, cmsLabel, frameworkLabel } from "./choices.ts";
import {
  deepMerge,
  type JsonObject,
  layerDirs,
  outputPath,
  PKG_FRAGMENT,
  readLayer,
  renderYaml,
  type TemplateFile,
  WORKSPACE_FRAGMENT,
} from "./layers.ts";

export type FileEntry =
  | { kind: "file"; path: string; contents: Buffer; mode: number }
  | { kind: "symlink"; path: string; target: string };

function replaceTokens(contents: Buffer, tokens: Record<string, string>): Buffer {
  if (contents.includes(0)) return contents; // binary file
  let text = contents.toString("utf8");
  for (const [token, value] of Object.entries(tokens)) text = text.replaceAll(token, value);
  return Buffer.from(text, "utf8");
}

function parseFragment(file: TemplateFile, path: string): JsonObject {
  try {
    return JSON.parse(file.contents.toString("utf8")) as JsonObject;
  } catch (error) {
    throw new Error(`Invalid JSON in template ${path}: ${(error as Error).message}`);
  }
}

export async function planProject(templatesDir: string, choices: Choices): Promise<FileEntry[]> {
  const tokens = {
    __PROJECT_NAME__: choices.name,
    __CMS__: cmsLabel(choices.cms),
    __FRAMEWORK__: frameworkLabel(choices.framework),
  };
  const files = new Map<string, TemplateFile>();
  let pkg: JsonObject = {};
  let workspace: JsonObject = {};

  for (const dir of layerDirs(templatesDir, choices)) {
    for (const [path, file] of await readLayer(dir)) {
      const source = relative(templatesDir, join(dir, path));
      if (path === PKG_FRAGMENT) pkg = deepMerge(pkg, parseFragment(file, source));
      else if (path === WORKSPACE_FRAGMENT)
        workspace = deepMerge(workspace, parseFragment(file, source));
      else files.set(outputPath(path), file);
    }
  }

  const entries: FileEntry[] = [...files].map(([path, file]) => ({
    kind: "file",
    path,
    contents: replaceTokens(file.contents, tokens),
    mode: file.mode,
  }));
  if (Object.keys(pkg).length > 0) {
    const json = Buffer.from(`${JSON.stringify(pkg, null, 2)}\n`);
    entries.push({
      kind: "file",
      path: "package.json",
      contents: replaceTokens(json, tokens),
      mode: 0o644,
    });
  }
  if (Object.keys(workspace).length > 0) {
    entries.push({
      kind: "file",
      path: "pnpm-workspace.yaml",
      contents: Buffer.from(renderYaml(workspace)),
      mode: 0o644,
    });
  }
  if (files.has("AGENTS.md"))
    entries.push({ kind: "symlink", path: "CLAUDE.md", target: "AGENTS.md" });

  return entries.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}
