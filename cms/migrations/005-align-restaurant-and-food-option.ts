import type { MigrationFunction } from "contentful-migration";
import { foodOptionContentType } from "../content-types/food-option.ts";
import { restaurantContentType } from "../content-types/restaurant.ts";

// The team space has restaurant and foodOption types made by hand, so 002 and 004 skip them.
// This adds what those types lack compared with their definitions.
const migration: MigrationFunction = (migration) => {
  const restaurant = migration.editContentType(restaurantContentType.id);
  const { id, ...emoji } = field(restaurantContentType, "emoji");
  restaurant.createField(id, emoji);
  const foodOptions = field(restaurantContentType, "foodOptions");
  if (foodOptions.items) {
    restaurant.editField(foodOptions.id).items(foodOptions.items);
  }
  const slug = field(foodOptionContentType, "slug");
  migration
    .editContentType(foodOptionContentType.id)
    .editField(slug.id)
    .validations(slug.validations ?? []);
};

export default migration;

function field<T extends { fields: { id: string }[] }>(
  definition: T,
  id: string,
): T["fields"][number] {
  const found = definition.fields.find((candidate) => candidate.id === id);
  if (!found) {
    throw new Error(`Field ${id} is missing from the definition`);
  }
  return found;
}
