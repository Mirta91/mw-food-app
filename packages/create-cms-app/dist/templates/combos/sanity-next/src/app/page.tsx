import { createClient } from "next-sanity";
import { CmsStatus } from "@/components/cms-status";
import { apiVersion, fetchExample, requiredEnv } from "@/lib/cms/client";
import { loadCmsState, missingEnv } from "@/lib/cms/state";

export const dynamic = "force-dynamic";

export default async function Home() {
  const state = await loadCmsState(missingEnv(requiredEnv, process.env), () =>
    fetchExample(
      createClient({
        projectId: process.env.SANITY_PROJECT_ID,
        dataset: process.env.SANITY_DATASET,
        apiVersion,
        useCdn: true,
      }),
    ),
  );
  return <CmsStatus state={state} />;
}
