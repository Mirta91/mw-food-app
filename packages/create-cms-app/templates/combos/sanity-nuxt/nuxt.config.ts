// No @nuxtjs/sanity: it reads the project ID and dataset when `nuxt build` runs, so a .env created
// after the build would be ignored. src/lib/cms/client.ts creates a @sanity/client from process.env
// on first use instead.
export default defineNuxtConfig({
  srcDir: "src/",
  compatibilityDate: "2026-10-01",
  devtools: { enabled: false },
});
