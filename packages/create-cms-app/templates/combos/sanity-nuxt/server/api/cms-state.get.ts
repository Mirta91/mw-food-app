import { createClient } from "@sanity/client";
import { apiVersion, fetchExample, requiredEnv } from "~/lib/cms/client";
import { loadCmsState, missingEnv } from "~/lib/cms/state";

export default defineEventHandler(() =>
  loadCmsState(missingEnv(requiredEnv, process.env), () =>
    fetchExample(
      createClient({
        projectId: process.env.SANITY_PROJECT_ID,
        dataset: process.env.SANITY_DATASET,
        apiVersion,
        useCdn: true,
      }),
    ),
  ),
);
