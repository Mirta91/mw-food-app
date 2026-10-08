import { defineCliConfig } from "sanity/cli";

// The Sanity CLI runs from cms/ and reads only SANITY_STUDIO_* variables into the Studio, so
// load the project's .env and map the app's variable names.
try {
  process.loadEnvFile("../.env");
} catch {
  // No .env yet.
}
process.env.SANITY_STUDIO_PROJECT_ID ??= process.env.SANITY_PROJECT_ID;
process.env.SANITY_STUDIO_DATASET ??= process.env.SANITY_DATASET;

export default defineCliConfig({
  api: { projectId: process.env.SANITY_PROJECT_ID, dataset: process.env.SANITY_DATASET },
});
