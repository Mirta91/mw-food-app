import type { ContentfulClientApi } from "contentful";
import { getClient } from "./client.ts";

export type Restaurant = {
  id: string;
  name: string;
  description: string;
  office: string;
  address: string;
  cuisine: string;
  foodOptions: string[];
  averagePrice: number;
  imageUrl: string | null;
  googleMapsUrl: string | null;
  takeaway: boolean;
};

// A linked entry or asset as the SDK returns it: resolved with `fields`, or a bare link
// when the target is unpublished.
type Linked = { fields?: Record<string, unknown> } | undefined;

export async function fetchRestaurants(
  client: ContentfulClientApi<undefined> = getClient(),
): Promise<Restaurant[]> {
  const { items } = await client.getEntries({
    content_type: "restaurant",
    include: 1,
    order: ["fields.name"],
  });
  return items.map((item) => toRestaurant(item.sys.id, item.fields));
}

function toRestaurant(id: string, fields: Record<string, unknown>): Restaurant {
  const foodOptions = Array.isArray(fields.foodOptions) ? (fields.foodOptions as Linked[]) : [];
  return {
    id,
    name: String(fields.name ?? ""),
    description: String(fields.description ?? ""),
    office: linkedName(fields.office as Linked),
    address: String(fields.address ?? ""),
    cuisine: String(fields.cuisine ?? ""),
    foodOptions: foodOptions.map(linkedName).filter((name) => name !== ""),
    averagePrice: Number(fields.averagePrice ?? 0),
    imageUrl: assetUrl(fields.image as Linked),
    googleMapsUrl: typeof fields.googleMapsUrl === "string" ? fields.googleMapsUrl : null,
    takeaway: fields.takeaway === true,
  };
}

function linkedName(link: Linked): string {
  const name = link?.fields?.name;
  return typeof name === "string" ? name : "";
}

function assetUrl(link: Linked): string | null {
  const file = link?.fields?.file as { url?: unknown } | undefined;
  const url = file?.url;
  if (typeof url !== "string") {
    return null;
  }
  return url.startsWith("//") ? `https:${url}` : url;
}
