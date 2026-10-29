import type { ContentfulClientApi } from "contentful";
import { type Coordinates, toCoordinates } from "../utils/geo.ts";
import { getClient } from "./client.ts";

export type Office = {
  id: string;
  name: string;
  city: string;
  address: string;
  coordinates: Coordinates | null;
};

export async function fetchOffices(
  client: ContentfulClientApi<undefined> = getClient(),
): Promise<Office[]> {
  const { items } = await client.getEntries({
    content_type: "office",
    order: ["sys.createdAt"],
    limit: 1000,
  });
  return items.map((item) => ({
    id: item.sys.id,
    name: String(item.fields.name ?? ""),
    city: String(item.fields.city ?? ""),
    address: String(item.fields.address ?? ""),
    coordinates: toCoordinates(item.fields.coordinates),
  }));
}
