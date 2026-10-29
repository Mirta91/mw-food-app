import type { MigrationFunction } from "contentful-migration";
import { exampleContentType } from "../content-types/example.ts";

const migration: MigrationFunction = (migration) => {
  const type = migration.createContentType(exampleContentType.id, {
    name: exampleContentType.name,
    displayField: exampleContentType.displayField,
  });
  for (const field of exampleContentType.fields) {
    type.createField(field.id, { name: field.name, type: field.type, required: field.required });
  }
};

export default migration;
