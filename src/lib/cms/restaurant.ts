import type { ContentfulClientApi } from "contentful";
import { type Coordinates, mapsSearchUrl, toCoordinates } from "../utils/geo.ts";
import { getClient } from "./client.ts";
import { type FoodOption, toFoodOption } from "./food-option.ts";

export type Restaurant = {
  id: string;
  name: string;
  description: string;
  officeId: string;
  address: string;
  coordinates: Coordinates | null;
  cuisine: string;
  foodOptions: FoodOption[];
  averagePrice: number;
  emoji: string;
  imageUrl: string | null;
  googleMapsUrl: string;
  takeaway: boolean;
};

// A linked entry or asset as the SDK returns it: resolved with `fields`, or a bare link
// when the target is unpublished.
type Linked = { sys?: { id?: string }; fields?: Record<string, unknown> } | undefined;

export async function fetchRestaurants(
  officeId: string,
  client: ContentfulClientApi<undefined> = getClient(),
): Promise<Restaurant[]> {
  const { items } = await client.getEntries({
    content_type: "restaurant",
    "fields.office.sys.id": officeId,
    include: 1,
    order: ["fields.name"],
    limit: 1000,
  });
  return items.map((item) => toRestaurant(item.sys.id, item.fields));
}

function toRestaurant(id: string, fields: Record<string, unknown>): Restaurant {
  const foodOptions = Array.isArray(fields.foodOptions) ? (fields.foodOptions as Linked[]) : [];
  const address = String(fields.address ?? "");
  const coordinates = toCoordinates(fields.coordinates);
  return {
    id,
    name: String(fields.name ?? ""),
    description: String(fields.description ?? ""),
    officeId: (fields.office as Linked)?.sys?.id ?? "",
    address,
    coordinates,
    cuisine: String(fields.cuisine ?? ""),
    foodOptions: foodOptions.flatMap((link) =>
      link?.fields && link.sys?.id ? [toFoodOption(link.sys.id, link.fields)] : [],
    ),
    averagePrice: Number(fields.averagePrice ?? 0),
    emoji: typeof fields.emoji === "string" && fields.emoji !== "" ? fields.emoji : DEFAULT_EMOJI,
    imageUrl: assetUrl(fields.image as Linked),
    googleMapsUrl:
      typeof fields.googleMapsUrl === "string" && fields.googleMapsUrl !== ""
        ? fields.googleMapsUrl
        : mapsSearchUrl(coordinates ?? address),
    takeaway: fields.takeaway === true,
  };
}

function assetUrl(link: Linked): string | null {
  const file = link?.fields?.file as { url?: unknown } | undefined;
  const url = file?.url;
  if (typeof url !== "string") {
    return null;
  }
  return url.startsWith("//") ? `https:${url}` : url;
}

const DEFAULT_EMOJI = "🍽️";
