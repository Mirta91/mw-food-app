import { createIfNotExists, defineMigration } from "sanity/migrate";

// Creates the example document that the home page renders. Run: pnpm cms:migrate
export default defineMigration({
  title: "Create the example document",
  async *migrate() {
    yield createIfNotExists({
      _id: "example",
      _type: "example",
      title: "Hello from Sanity",
      body: "This document was created by cms/migrations/001-create-example.",
    });
  },
});
