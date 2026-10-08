import { apiVersion } from "./src/lib/cms/client";

export default defineNuxtConfig({
  srcDir: "src/",
  compatibilityDate: "2026-10-01",
  devtools: { enabled: false },
  modules: ["@nuxtjs/sanity"],
  // A placeholder project ID keeps the module working without credentials; the page checks the
  // real variables before it queries.
  sanity: {
    projectId: process.env.SANITY_PROJECT_ID || "not-configured",
    dataset: process.env.SANITY_DATASET || "production",
    apiVersion,
    useCdn: true,
  },
  runtimeConfig: {
    sanityProjectId: process.env.SANITY_PROJECT_ID ?? "",
    sanityDataset: process.env.SANITY_DATASET ?? "",
  },
});
