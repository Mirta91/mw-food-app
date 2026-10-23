// Runs once when the server starts. `next build` calls it as well, and the build must pass
// without .env. Next also compiles this file for the Edge runtime, which has no `process.exit`,
// so the check is imported only in the Node.js runtime.
export async function register(): Promise<void> {
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.NEXT_PHASE !== "phase-production-build"
  ) {
    const { requiredEnv } = await import("@/lib/cms/client");
    const { exitOnMissingEnv } = await import("@/lib/utils/env");
    exitOnMissingEnv(requiredEnv, process.env);
  }
}
