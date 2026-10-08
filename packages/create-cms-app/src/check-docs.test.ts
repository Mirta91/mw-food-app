import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { checkDocs, headingSlugs } from "../templates/common/scripts/check-docs.ts";
import { makeTempDir, writeTree } from "./test-helpers.ts";

const AGENTS = [
  "# AGENTS.md",
  "",
  "See [the rules](#rules-for-editing-this-file) and [testing rules](docs/instructions/testing.md#rules).",
  "",
  "## Rules for editing this file",
  "",
  "```md",
  "[ignored](docs/instructions/missing.md)",
  "```",
  "",
  "Docs: [site](https://example.com) and `[code](docs/nope.md)`.",
  "",
  "## Instruction files",
  "",
  "- [Testing](docs/instructions/testing.md) — before writing tests",
  "",
].join("\n");

let root: string;

beforeEach(async () => {
  root = await makeTempDir();
  await writeTree(root, {
    "AGENTS.md": AGENTS,
    "docs/instructions/testing.md": "# Testing\n\n## Rules\n\nText.\n",
  });
});

describe("checkDocs", () => {
  it("passes a clean tree", () => {
    expect(checkDocs(root)).toEqual({
      errors: [],
      warnings: [],
      instructionFiles: ["docs/instructions/testing.md"],
    });
  });

  it("fails on a dead relative link", async () => {
    await writeTree(root, {
      "docs/instructions/testing.md": "# Testing\n\n## Rules\n\n[x](../missing.md)\n",
    });
    expect(checkDocs(root).errors).toEqual([
      "docs/instructions/testing.md:5: dead link to docs/missing.md",
    ]);
  });

  it("fails on a dead anchor", async () => {
    await writeTree(root, { "docs/instructions/testing.md": "# Testing\n\n## Other\n" });
    expect(checkDocs(root).errors).toEqual([
      "AGENTS.md:3: dead anchor #rules in docs/instructions/testing.md",
    ]);
  });

  it("fails on an unlinked instruction file", async () => {
    await writeTree(root, { "docs/instructions/orphan.md": "# Orphan\n" });
    expect(checkDocs(root).errors).toEqual([
      "docs/instructions/orphan.md: not reachable from AGENTS.md",
    ]);
  });

  it("fails on a twice-linked instruction file", async () => {
    await writeTree(root, {
      "AGENTS.md": `${AGENTS}- [Testing again](docs/instructions/testing.md) — again\n`,
    });
    expect(checkDocs(root).errors).toEqual([
      "AGENTS.md: docs/instructions/testing.md is linked 2 times, allowed once",
    ]);
  });

  it("requires the trigger form for instruction links", async () => {
    await writeTree(root, { "AGENTS.md": AGENTS.replace(" — before writing tests", "") });
    expect(checkDocs(root).errors).toEqual([
      'AGENTS.md:15: link to docs/instructions/testing.md needs the form "- [Title](docs/instructions/testing.md) — when to read it"',
    ]);
  });

  it("accepts an anchored list entry", async () => {
    await writeTree(root, {
      "AGENTS.md": AGENTS.replace("testing.md) —", "testing.md#rules) —"),
    });
    expect(checkDocs(root).errors).toEqual([]);
  });

  it("fails on a plain and an anchored list entry for the same file", async () => {
    await writeTree(root, {
      "AGENTS.md": `${AGENTS}- [Testing rules](docs/instructions/testing.md#rules) — again\n`,
    });
    expect(checkDocs(root).errors).toEqual([
      "AGENTS.md: docs/instructions/testing.md is linked 2 times, allowed once",
    ]);
  });

  it("allows a plain prose link next to the list entry", async () => {
    await writeTree(root, {
      "AGENTS.md": AGENTS.replace(
        "See [the rules]",
        "See [testing](docs/instructions/testing.md), [the rules]",
      ),
    });
    expect(checkDocs(root).errors).toEqual([]);
  });

  it("warns on links between instruction files and counts them as reachable", async () => {
    await writeTree(root, {
      "docs/instructions/testing.md": "# Testing\n\n## Rules\n\nSee [style](style.md).\n",
      "docs/instructions/style.md": "# Style\n",
    });
    const report = checkDocs(root);
    expect(report.errors).toEqual([]);
    expect(report.warnings).toEqual([
      "docs/instructions/testing.md:5: links to docs/instructions/style.md; prefer linking instruction files only from AGENTS.md",
    ]);
  });

  it("fails when AGENTS.md is missing", async () => {
    const empty = await makeTempDir();
    expect(checkDocs(join(empty)).errors).toEqual(["AGENTS.md: missing"]);
  });
});

describe("headingSlugs", () => {
  it("builds GitHub-style slugs with duplicate suffixes", () => {
    expect([
      ...headingSlugs("# A `code` Title!\n## Same\n## Same\n```\n# not a heading\n```\n"),
    ]).toEqual(["a-code-title", "same", "same-1"]);
  });
});
