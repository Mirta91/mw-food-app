import { fetchExample } from "~/lib/cms/client";
import { getClient } from "~/lib/cms/sdk";
import { cmsRequest } from "../utils/cms-request";

export default defineEventHandler(async () => {
  const example = await cmsRequest(() => fetchExample(getClient()));
  if (!example) {
    throw createError({ statusCode: 404, statusMessage: "No example content" });
  }
  return example;
});
