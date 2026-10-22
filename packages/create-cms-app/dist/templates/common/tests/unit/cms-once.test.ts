import { describe, expect, it, vi } from "vitest";
import { once } from "../../src/lib/cms/once";

describe("once", () => {
  it("creates nothing until the first call", () => {
    const create = vi.fn(() => ({}));
    once(create);
    expect(create).not.toHaveBeenCalled();
  });

  it("creates the value once and returns it on every call", () => {
    const create = vi.fn(() => ({}));
    const get = once(create);
    const first = get();
    expect(get()).toBe(first);
    expect(create).toHaveBeenCalledTimes(1);
  });
});
