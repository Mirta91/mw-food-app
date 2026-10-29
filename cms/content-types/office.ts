import type { ContentTypeDefinition } from "./types.ts";

// Applied by cms/migrations/003-create-office.ts.
export const officeContentType = {
  id: "office",
  name: "Office",
  displayField: "name",
  fields: [
    { id: "name", name: "Name", type: "Symbol", required: true },
    { id: "city", name: "City", type: "Symbol", required: true },
    { id: "address", name: "Address", type: "Symbol", required: true },
    { id: "coordinates", name: "Coordinates", type: "Location", required: true },
  ],
} satisfies ContentTypeDefinition;
