import { createExampleLoader, requiredEnv } from "~/lib/cms/client";
import { loadCmsState, missingEnv } from "~/lib/cms/state";

export default defineEventHandler(() =>
  loadCmsState(missingEnv(requiredEnv, process.env), createExampleLoader(process.env)),
);
