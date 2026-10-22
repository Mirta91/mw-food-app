import { createClient } from "@sanity/client";
import { apiVersion } from "./client";
import { once } from "./once";

// Created on first use from the runtime environment (see once.ts) instead of through @sanity/astro:
// the integration's options live in astro.config.ts, which runs during `pnpm build`, so a later
// .env change would be ignored by `pnpm start`.
export const getClient = once(() =>
  createClient({
    projectId: process.env.SANITY_PROJECT_ID,
    dataset: process.env.SANITY_DATASET,
    apiVersion,
    useCdn: true,
  }),
);
