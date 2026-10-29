import { beforeEach, describe, expect, it, vi } from "vitest";

const fetchOffices = vi.fn();
const fetchFoodOptions = vi.fn();
const fetchRestaurants = vi.fn();
vi.mock("../../src/lib/cms/office", () => ({ fetchOffices }));
vi.mock("../../src/lib/cms/food-option", () => ({ fetchFoodOptions }));
vi.mock("../../src/lib/cms/restaurant", () => ({ fetchRestaurants }));

const { load } = await import("../../src/routes/+page.server");
const valencia = { id: "VALE", city: "Valencia" };
const munich = { id: "MUC", city: "Munich" };

beforeEach(() => {
  fetchOffices.mockReset().mockResolvedValue([valencia, munich]);
  fetchFoodOptions.mockReset().mockResolvedValue([]);
  fetchRestaurants.mockReset().mockResolvedValue([]);
});

describe("home page load", () => {
  it("selects the first office by default", async () => {
    const data = await run("/");
    expect(data).toMatchObject({ office: valencia, offices: [valencia, munich] });
    expect(fetchRestaurants).toHaveBeenCalledWith("VALE");
  });

  it("selects the office from the URL", async () => {
    const data = await run("/?office=MUC");
    expect(data).toMatchObject({ office: munich });
    expect(fetchRestaurants).toHaveBeenCalledWith("MUC");
  });

  it("answers 404 for an unknown office", async () => {
    await expect(run("/?office=nope")).rejects.toMatchObject({ status: 404 });
  });

  it("answers 404 without offices", async () => {
    fetchOffices.mockResolvedValue([]);
    await expect(run("/")).rejects.toMatchObject({ status: 404 });
  });
});

function run(path: string) {
  return (load as (event: { url: URL }) => Promise<unknown>)({
    url: new URL(path, "http://localhost"),
  });
}
