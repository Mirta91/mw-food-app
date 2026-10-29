import type { PlainClientAPI } from "contentful-management";
import { demoFoodOptions, demoOffices, demoRestaurants } from "./demo-data.ts";

// Creates and publishes the demo entries a space lacks and returns how many it created. Food
// options are matched by slug and offices by city, so entries made by hand are reused; restaurants
// are matched by their fixed entry ID. Existing entries are never changed.
export async function seedDemoContent(client: PlainClientAPI, locale: string): Promise<number> {
  let created = 0;

  const foodOptionIds = await idsByField(client, "foodOption", "slug", locale);
  for (const { id, name, slug } of demoFoodOptions) {
    if (!foodOptionIds.has(slug)) {
      await createEntry(client, "foodOption", id, { name, slug }, locale);
      foodOptionIds.set(slug, id);
      created++;
    }
  }

  const officeIds = await idsByField(client, "office", "city", locale);
  for (const { id, ...fields } of demoOffices) {
    if (!officeIds.has(fields.city)) {
      await createEntry(client, "office", id, fields, locale);
      officeIds.set(fields.city, id);
      created++;
    }
  }

  const restaurants = await client.entry.getMany({
    query: { content_type: "restaurant", limit: 1000 },
  });
  const restaurantIds = new Set(restaurants.items.map((item) => item.sys.id));
  for (const { id, office, foodOptions, ...fields } of demoRestaurants) {
    if (restaurantIds.has(id)) {
      continue;
    }
    const links = {
      office: link(required(officeIds, office)),
      foodOptions: foodOptions.map((slug) => link(required(foodOptionIds, slug))),
    };
    await createEntry(client, "restaurant", id, { ...fields, ...links }, locale);
    created++;
  }

  return created;
}

// Maps the value of one field (such as a slug) to the ID of the entry that has it.
async function idsByField(
  client: PlainClientAPI,
  contentType: string,
  field: string,
  locale: string,
): Promise<Map<string, string>> {
  const { items } = await client.entry.getMany({
    query: { content_type: contentType, limit: 1000 },
  });
  const ids = new Map<string, string>();
  for (const item of items) {
    const value: unknown = item.fields[field]?.[locale];
    if (typeof value === "string") {
      ids.set(value, item.sys.id);
    }
  }
  return ids;
}

async function createEntry(
  client: PlainClientAPI,
  contentTypeId: string,
  entryId: string,
  fields: Record<string, unknown>,
  locale: string,
): Promise<void> {
  const localized = Object.fromEntries(
    Object.entries(fields).map(([name, value]) => [name, { [locale]: value }]),
  );
  const entry = await client.entry.createWithId({ entryId, contentTypeId }, { fields: localized });
  await client.entry.publish({ entryId }, entry);
}

function link(id: string) {
  return { sys: { type: "Link", linkType: "Entry", id } };
}

function required(ids: Map<string, string>, key: string): string {
  const id = ids.get(key);
  if (!id) {
    throw new Error(`No entry for ${key}`);
  }
  return id;
}
