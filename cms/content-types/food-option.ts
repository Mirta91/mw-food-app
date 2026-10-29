import type { ContentTypeDefinition } from "./types.ts";

// Applied by cms/migrations/002-create-food-option.ts.
export const foodOptionContentType = {
  id: "foodOption",
  name: "Food Option",
  displayField: "name",
  fields: [
    { id: "name", name: "Name", type: "Symbol", required: true },
    { id: "slug", name: "Slug", type: "Symbol", required: true, validations: [{ unique: true }] },
  ],
} satisfies ContentTypeDefinition;
