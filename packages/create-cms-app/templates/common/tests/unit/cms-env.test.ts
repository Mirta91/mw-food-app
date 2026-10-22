import { afterEach, describe, expect, it, vi } from "vitest";
import { assertEnv, exitOnMissingEnv, missingEnv } from "../../src/lib/cms/env";

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

describe("exitOnMissingEnv", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("prints the message and exits with 1 when a variable is missing", () => {
    const exit = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    exitOnMissingEnv(["A"], {});
    expect(error).toHaveBeenCalledWith(
      "Missing environment variables: A. Copy .env.example to .env and fill them in.",
    );
    expect(exit).toHaveBeenCalledWith(1);
  });

  it("does nothing when every variable is set", () => {
    const exit = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);
    exitOnMissingEnv(["A"], { A: "x" });
    expect(exit).not.toHaveBeenCalled();
  });
});
