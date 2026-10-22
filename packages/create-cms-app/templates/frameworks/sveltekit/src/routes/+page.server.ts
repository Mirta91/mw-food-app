import { error } from "@sveltejs/kit";
import { fetchExample } from "../lib/cms/example";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const example = await fetchExample();
  if (!example) {
    error(404, "No example content");
  }
  return { example };
};
