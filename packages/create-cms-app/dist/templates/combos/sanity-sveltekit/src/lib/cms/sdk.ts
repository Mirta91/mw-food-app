// @sanity/sveltekit supports SvelteKit 2 only, so this combo uses @sanity/client directly.
import { createClient } from "@sanity/client";
import * as env from "$app/env/private";
import { apiVersion } from "./client";
import { once } from "./once";

// Created on first use from the runtime environment; see once.ts.
export const getClient = once(() =>
  createClient({
    projectId: env.SANITY_PROJECT_ID,
    dataset: env.SANITY_DATASET,
    apiVersion,
    useCdn: true,
  }),
);
