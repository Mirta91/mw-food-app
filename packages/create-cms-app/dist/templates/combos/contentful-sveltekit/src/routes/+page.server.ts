import * as env from "$app/env/private";
import { createExampleLoader, requiredEnv } from "../lib/cms/client";
import { loadCmsState, missingEnv } from "../lib/cms/state";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => ({
  state: await loadCmsState(missingEnv(requiredEnv, env), createExampleLoader(env)),
});
