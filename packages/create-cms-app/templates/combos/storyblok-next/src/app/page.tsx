import { CmsStatus } from "@/components/cms-status";
import { fetchExample, requiredEnv } from "@/lib/cms/client";
import { loadCmsState, missingEnv } from "@/lib/cms/state";
import { getStoryblokApi } from "@/lib/cms/storyblok";

export const dynamic = "force-dynamic";

export default async function Home() {
  const state = await loadCmsState(missingEnv(requiredEnv, process.env), () =>
    fetchExample(getStoryblokApi(process.env)),
  );
  return <CmsStatus state={state} />;
}
