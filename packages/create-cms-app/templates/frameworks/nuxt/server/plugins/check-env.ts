import { requiredEnv } from "~/lib/cms/client";
import { exitOnMissingEnv } from "~/lib/utils/env";

// Runs once when the server starts. modules/check-env.ts covers `pnpm dev`.
export default defineNitroPlugin(() => {
  exitOnMissingEnv(requiredEnv, process.env);
});
