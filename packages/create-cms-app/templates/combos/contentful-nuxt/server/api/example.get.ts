import { createExampleLoader } from "~/lib/cms/client";

export default defineEventHandler(async () => {
  const example = await createExampleLoader(process.env)();
  if (!example) {
    throw createError({ statusCode: 404, statusMessage: "No example content" });
  }
  return example;
});
