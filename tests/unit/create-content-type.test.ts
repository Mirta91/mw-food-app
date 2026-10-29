import type Migration from "contentful-migration";
import { describe, expect, it, vi } from "vitest";
import { restaurantContentType } from "../../cms/content-types/restaurant";
import { createContentTypeMigration } from "../../cms/create-content-type";

describe("createContentTypeMigration", () => {
  it("creates the content type with every field and its options", () => {
    const createField = vi.fn();
    const createContentType = vi.fn(() => ({ createField }));
    const migration = { createContentType } as unknown as Migration;

    createContentTypeMigration(restaurantContentType)(migration);

    expect(createContentType).toHaveBeenCalledWith("restaurant", {
      name: "Restaurant",
      displayField: "name",
    });
    expect(createField).toHaveBeenCalledTimes(restaurantContentType.fields.length);
    expect(createField).toHaveBeenCalledWith("foodOptions", {
      name: "Food options",
      type: "Array",
      required: true,
      items: {
        type: "Link",
        linkType: "Entry",
        validations: [{ linkContentType: ["foodOption"] }],
      },
    });
    expect(createField).toHaveBeenCalledWith("office", {
      name: "Office",
      type: "Link",
      linkType: "Entry",
      required: true,
      validations: [{ linkContentType: ["office"] }],
    });
  });
});
