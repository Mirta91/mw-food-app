// Schema as code for the example content type; applied by cms/migrations/001-create-example.ts.
export const exampleContentType = {
  id: "example",
  name: "Example",
  displayField: "title",
  fields: [
    { id: "title", name: "Title", type: "Symbol", required: true },
    { id: "body", name: "Body", type: "Text", required: false },
  ],
} as const;
