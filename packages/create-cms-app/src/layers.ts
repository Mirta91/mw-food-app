import { existsSync } from "node:fs";
import { readFile, readdir, stat } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import type { Combo } from "./choices.ts";

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export type TemplateFile = {
  contents: Buffer;
  mode: number;
};

export const PKG_FRAGMENT = "pkg.json";
export const WORKSPACE_FRAGMENT = "pnpm-workspace.json";

// Layers in application order; a later layer replaces files of an earlier one.
export function layerDirs(templatesDir: string, combo: Combo): string[] {
  const dirs = [
    join(templatesDir, "common"),
    join(templatesDir, "frameworks", combo.framework),
    join(templatesDir, "cms", combo.cms),
    join(templatesDir, "combos", `${combo.cms}-${combo.framework}`),
  ];
  for (const dir of dirs) {
    if (!existsSync(dir)) {
      throw new Error(`Template layer missing: ${relative(templatesDir, dir)}`);
    }
  }
  return dirs;
}

export async function readLayer(dir: string): Promise<Map<string, TemplateFile>> {
  const files = new Map<string, TemplateFile>();
  for (const entry of await readdir(dir, { recursive: true, withFileTypes: true })) {
    if (!entry.isFile()) {
      continue;
    }
    const absolute = join(entry.parentPath, entry.name);
    const [contents, info] = await Promise.all([readFile(absolute), stat(absolute)]);
    files.set(relative(dir, absolute).split(sep).join("/"), { contents, mode: info.mode & 0o777 });
  }
  return files;
}

export function deepMerge(base: JsonObject, overlay: JsonObject): JsonObject {
  const merged: JsonObject = { ...base };
  for (const [key, value] of Object.entries(overlay)) {
    const previous = merged[key];
    merged[key] = isObject(previous) && isObject(value) ? deepMerge(previous, value) : value;
  }
  return merged;
}

// Template files that npm or git would treat specially are stored under another name.
export function outputPath(templatePath: string): string {
  const parts = templatePath.split("/");
  const name = parts.pop();
  return [...parts, name === "_gitignore" ? ".gitignore" : name].join("/");
}

// Minimal YAML for pnpm settings: nested maps of scalars.
export function renderYaml(value: JsonObject, indent = ""): string {
  let out = "";
  for (const [rawKey, item] of Object.entries(value)) {
    const key = /^[A-Za-z0-9_-]+$/.test(rawKey) ? rawKey : JSON.stringify(rawKey);
    if (Array.isArray(item)) {
      throw new Error(`renderYaml does not support arrays (key ${rawKey})`);
    }
    if (isObject(item)) {
      out +=
        Object.keys(item).length === 0
          ? `${indent}${key}: {}\n`
          : `${indent}${key}:\n${renderYaml(item, `${indent}  `)}`;
    } else {
      out += `${indent}${key}: ${typeof item === "string" ? JSON.stringify(item) : String(item)}\n`;
    }
  }
  return out;
}

function isObject(value: JsonValue | undefined): value is JsonObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
