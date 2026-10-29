import type { ContentTypeDefinition } from "./types.ts";

// Applied by cms/migrations/004-create-restaurant.ts; 005 aligns spaces where the type was made by
// hand.
export const restaurantContentType = {
  id: "restaurant",
  name: "Restaurant",
  displayField: "name",
  fields: [
    { id: "name", name: "Name", type: "Symbol", required: true },
    { id: "description", name: "Description", type: "Text", required: false },
    {
      id: "office",
      name: "Office",
      type: "Link",
      linkType: "Entry",
      required: true,
      validations: [{ linkContentType: ["office"] }],
    },
    { id: "address", name: "Address", type: "Symbol", required: true },
    { id: "coordinates", name: "Coordinates", type: "Location", required: true },
    { id: "cuisine", name: "Cuisine", type: "Symbol", required: true },
    {
      id: "foodOptions",
      name: "Food options",
      type: "Array",
      required: true,
      items: {
        type: "Link",
        linkType: "Entry",
        validations: [{ linkContentType: ["foodOption"] }],
      },
    },
    { id: "averagePrice", name: "Average price (€)", type: "Number", required: true },
    { id: "image", name: "Image", type: "Link", linkType: "Asset", required: false },
    { id: "googleMapsUrl", name: "Google Maps URL", type: "Symbol", required: false },
    { id: "takeaway", name: "Takeaway", type: "Boolean", required: false },
    { id: "emoji", name: "Emoji", type: "Symbol", required: false },
  ],
} satisfies ContentTypeDefinition;
