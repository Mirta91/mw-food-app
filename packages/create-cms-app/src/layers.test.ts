import { describe, expect, it } from "vitest";
import { deepMerge, outputPath, renderYaml } from "./layers.ts";

describe("deepMerge", () => {
  it("merges objects, later scalars win, arrays are replaced", () => {
    const merged = deepMerge(
      { name: "a", scripts: { lint: "oxlint", test: "vitest" }, files: ["a"] },
      { scripts: { test: "vitest run", dev: "next dev" }, files: ["b"] },
    );
    expect(merged).toEqual({
      name: "a",
      scripts: { lint: "oxlint", test: "vitest run", dev: "next dev" },
      files: ["b"],
    });
  });
});

describe("outputPath", () => {
  it("renames _gitignore at any depth and keeps other names", () => {
    expect(outputPath("_gitignore")).toBe(".gitignore");
    expect(outputPath("cms/_gitignore")).toBe("cms/.gitignore");
    expect(outputPath("src/app/page.tsx")).toBe("src/app/page.tsx");
  });
});

describe("renderYaml", () => {
  it("renders nested maps and quotes keys that need it", () => {
    expect(renderYaml({ allowBuilds: { esbuild: true, "@parcel/watcher": false } })).toBe(
      'allowBuilds:\n  esbuild: true\n  "@parcel/watcher": false\n',
    );
  });

  it("renders an empty map inline", () => {
    expect(renderYaml({ allowBuilds: {} })).toBe("allowBuilds: {}\n");
  });

  it("rejects arrays", () => {
    expect(() => renderYaml({ list: ["a"] })).toThrow(/arrays/);
  });
});
