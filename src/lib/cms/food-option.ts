import type { ContentfulClientApi } from "contentful";
import { getClient } from "./client.ts";

export type FoodOption = {
  id: string;
  name: string;
  slug: string;
};

export async function fetchFoodOptions(
  client: ContentfulClientApi<undefined> = getClient(),
): Promise<FoodOption[]> {
  const { items } = await client.getEntries({
    content_type: "foodOption",
    order: ["sys.createdAt"],
    limit: 1000,
  });
  return items.map((item) => toFoodOption(item.sys.id, item.fields));
}

export function toFoodOption(id: string, fields: Record<string, unknown>): FoodOption {
  return { id, name: String(fields.name ?? ""), slug: String(fields.slug ?? "") };
}
