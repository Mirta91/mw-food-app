import { createClient } from "contentful";
import { once } from "../utils/once.ts";

export const requiredEnv = ["CONTENTFUL_SPACE_ID", "CONTENTFUL_ACCESS_TOKEN"] as const;

// Created on first use; see src/lib/utils/once.ts.
export const getClient = once(() =>
  createClient({
    space: process.env.CONTENTFUL_SPACE_ID ?? "",
    accessToken: process.env.CONTENTFUL_ACCESS_TOKEN ?? "",
    environment: process.env.CONTENTFUL_ENVIRONMENT || "master",
  }),
);
