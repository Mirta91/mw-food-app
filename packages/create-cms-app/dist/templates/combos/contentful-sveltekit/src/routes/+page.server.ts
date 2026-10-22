import * as env from "$app/env/private";
import { error } from "@sveltejs/kit";
import { createExampleLoader } from "../lib/cms/client";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const example = await createExampleLoader(env)();
  if (!example) {
    error(404, "No example content");
  }
  return { example };
};
