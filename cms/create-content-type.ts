import type { MigrationFunction } from "contentful-migration";
import type { ContentTypeDefinition } from "./content-types/types.ts";

// A migration that creates the content type with all fields of its definition.
export function createContentTypeMigration(definition: ContentTypeDefinition): MigrationFunction {
  return (migration) => {
    const type = migration.createContentType(definition.id, {
      name: definition.name,
      displayField: definition.displayField,
    });
    for (const { id, ...options } of definition.fields) {
      type.createField(id, options);
    }
  };
}
