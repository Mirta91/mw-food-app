import type { IFieldOptions } from "contentful-migration";

// Schema as code for one content type. cms/create-content-type.ts turns it into a migration.
export type ContentTypeDefinition = {
  id: string;
  name: string;
  displayField: string;
  fields: (IFieldOptions & { id: string; name: string })[];
};
