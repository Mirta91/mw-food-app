import { CmsStatus } from "@/components/cms-status";
import { createExampleLoader, requiredEnv } from "@/lib/cms/client";
import { loadCmsState, missingEnv } from "@/lib/cms/state";

export const dynamic = "force-dynamic";

export default async function Home() {
  const state = await loadCmsState(
    missingEnv(requiredEnv, process.env),
    createExampleLoader(process.env),
  );
  return <CmsStatus state={state} />;
}
