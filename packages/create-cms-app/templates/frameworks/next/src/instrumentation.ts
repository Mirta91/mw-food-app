import { requiredEnv } from "@/lib/cms/client";
import { exitOnMissingEnv } from "@/lib/cms/env";

// Runs once when the server starts. `next build` calls it as well, and the build must pass
// without .env.
export function register(): void {
  if (process.env.NEXT_PHASE !== "phase-production-build") {
    exitOnMissingEnv(requiredEnv, process.env);
  }
}
