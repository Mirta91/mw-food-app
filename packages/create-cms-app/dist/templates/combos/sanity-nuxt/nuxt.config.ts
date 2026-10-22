// No @nuxtjs/sanity: it reads the project ID and dataset when `nuxt build` runs, so a .env created
// after the build would be ignored. server/api/example.get.ts creates a @sanity/client per request
// from process.env instead.
export default defineNuxtConfig({
  srcDir: "src/",
  compatibilityDate: "2026-10-01",
  devtools: { enabled: false },
});
