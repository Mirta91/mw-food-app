import { createExampleLoader } from "~/lib/cms/client";
import { cmsRequest } from "../utils/cms-request";

export default defineEventHandler(async () => {
  const example = await cmsRequest(createExampleLoader(process.env));
  if (!example) {
    throw createError({ statusCode: 404, statusMessage: "No example content" });
  }
  return example;
});
