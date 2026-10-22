import { createClient } from "next-sanity";
import { apiVersion } from "./client";
import { once } from "./once";

// Created on first use from the runtime environment; see once.ts.
export const getClient = once(() =>
  createClient({
    projectId: process.env.SANITY_PROJECT_ID,
    dataset: process.env.SANITY_DATASET,
    apiVersion,
    useCdn: true,
  }),
);
