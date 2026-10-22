import { error } from "@sveltejs/kit";
import { fetchExample } from "../lib/cms/client";
import { getClient } from "../lib/cms/sdk";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const example = await fetchExample(getClient());
  if (!example) {
    error(404, "No example content");
  }
  return { example };
};
