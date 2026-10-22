import type { ContentfulClientApi } from "contentful";
import { getClient } from "./client.ts";

export type Example = {
  title: string;
  body: string;
};

export async function fetchExample(
  client: ContentfulClientApi<undefined> = getClient(),
): Promise<Example | null> {
  const { items } = await client.getEntries({
    content_type: "example",
    limit: 1,
    order: ["sys.createdAt"],
  });
  const fields = items[0]?.fields;
  return fields ? { title: String(fields.title ?? ""), body: String(fields.body ?? "") } : null;
}
