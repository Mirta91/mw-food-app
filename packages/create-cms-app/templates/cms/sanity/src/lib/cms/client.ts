import { createClient } from "@sanity/client";
import { once } from "../utils/once.ts";

export const requiredEnv = ["SANITY_PROJECT_ID", "SANITY_DATASET"] as const;

export const apiVersion = "2026-10-01";

// Created on first use; see src/lib/utils/once.ts.
export const getClient = once(() =>
  createClient({
    projectId: process.env.SANITY_PROJECT_ID,
    dataset: process.env.SANITY_DATASET,
    apiVersion,
    useCdn: true,
  }),
);
