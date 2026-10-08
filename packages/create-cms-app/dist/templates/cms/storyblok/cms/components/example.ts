// Schema as code for the example component; applied by cms/migrations/001-create-example.ts.
export const exampleComponent = {
  name: "example",
  display_name: "Example",
  is_root: true,
  is_nestable: false,
  schema: {
    title: { type: "text", pos: 0, required: true },
    body: { type: "textarea", pos: 1 },
  },
} as const;
