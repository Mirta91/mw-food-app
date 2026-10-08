import { describe, expect, it, vi } from "vitest";
import { describeCmsState, loadCmsState, missingEnv } from "../../src/lib/cms/state";

describe("missingEnv", () => {
  it("lists unset and blank variables in order", () => {
    expect(missingEnv(["A", "B", "C"], { A: "x", B: " ", C: undefined })).toEqual(["B", "C"]);
  });
});

describe("loadCmsState", () => {
  it("does not call the CMS when variables are missing", async () => {
    const load = vi.fn();
    expect(await loadCmsState(["A"], load)).toEqual({ kind: "missing-env", missing: ["A"] });
    expect(load).not.toHaveBeenCalled();
  });

  it("returns the example", async () => {
    const example = { title: "Hello", body: "World" };
    expect(await loadCmsState([], async () => example)).toEqual({ kind: "example", example });
  });

  it("returns empty when there is no entry", async () => {
    expect(await loadCmsState([], async () => null)).toEqual({ kind: "empty" });
  });

  it("returns the error instead of throwing", async () => {
    const state = await loadCmsState([], async () => {
      throw new Error("Unauthorized");
    });
    expect(state).toEqual({ kind: "error", message: "Unauthorized" });
  });
});

describe("describeCmsState", () => {
  it("names the missing variables", () => {
    expect(describeCmsState({ kind: "missing-env", missing: ["A", "B"] })).toEqual({
      title: "CMS not configured",
      detail: "Missing: A, B. Copy .env.example to .env and fill it in.",
    });
  });
});
