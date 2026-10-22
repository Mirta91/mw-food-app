import { createClient, type SanityClient } from "@sanity/client";
import type { Example } from "./example.ts";
import { once } from "../utils/once.ts";

export const requiredEnv = ["SANITY_PROJECT_ID", "SANITY_DATASET"] as const;

export const apiVersion = "2026-10-01";

export const exampleQuery = `*[_type == "example"] | order(_createdAt asc)[0]{title, body}`;

// Created on first use; see src/lib/utils/once.ts.
export const getClient = once(() =>
  createClient({
    projectId: process.env.SANITY_PROJECT_ID,
    dataset: process.env.SANITY_DATASET,
    apiVersion,
    useCdn: true,
  }),
);

export async function fetchExample(client: SanityClient): Promise<Example | null> {
  const document = await client.fetch<{ title?: string; body?: string } | null>(exampleQuery);
  return document ? { title: document.title ?? "", body: document.body ?? "" } : null;
}
