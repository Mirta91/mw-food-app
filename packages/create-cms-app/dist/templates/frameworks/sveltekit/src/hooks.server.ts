import * as env from "$app/env/private";
import type { ServerInit } from "@sveltejs/kit/hooks";
import { requiredEnv } from "./lib/cms/client";
import { exitOnMissingEnv } from "./lib/cms/env";

// Runs once when the server starts.
export const init: ServerInit = () => {
  exitOnMissingEnv(requiredEnv, env);
};
