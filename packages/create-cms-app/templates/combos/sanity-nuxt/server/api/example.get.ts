import { createClient } from "@sanity/client";
import { apiVersion, fetchExample } from "~/lib/cms/client";

export default defineEventHandler(async () => {
  const example = await fetchExample(
    createClient({
      projectId: process.env.SANITY_PROJECT_ID,
      dataset: process.env.SANITY_DATASET,
      apiVersion,
      useCdn: true,
    }),
  );
  if (!example) {
    throw createError({ statusCode: 404, statusMessage: "No example content" });
  }
  return example;
});
