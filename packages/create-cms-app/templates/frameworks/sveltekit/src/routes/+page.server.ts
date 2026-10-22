import { error } from "@sveltejs/kit";
import { fetchExample, getClient } from "../lib/cms/client";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const example = await fetchExample(getClient());
  if (!example) {
    error(404, "No example content");
  }
  return { example };
};
