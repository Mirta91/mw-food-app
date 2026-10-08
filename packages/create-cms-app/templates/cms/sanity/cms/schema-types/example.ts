import { defineField, defineType } from "sanity";

export const example = defineType({
  name: "example",
  title: "Example",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Title",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({ name: "body", title: "Body", type: "text" }),
  ],
});
