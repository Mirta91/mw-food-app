import { describe, expect, it } from "vitest";
import { assertEnv, missingEnv } from "../../src/lib/cms/env";

describe("missingEnv", () => {
  it("lists unset and blank variables in order", () => {
    expect(missingEnv(["A", "B", "C"], { A: "x", B: " ", C: undefined })).toEqual(["B", "C"]);
  });
});

describe("assertEnv", () => {
  it("names every missing variable", () => {
    expect(() => assertEnv(["A", "B", "C"], { B: "x", C: " " })).toThrow(
      "Missing environment variables: A, C. Copy .env.example to .env and fill them in.",
    );
  });

  it("passes when every required variable is set, ignoring others", () => {
    expect(() => assertEnv(["A"], { A: "x" })).not.toThrow();
  });
});
