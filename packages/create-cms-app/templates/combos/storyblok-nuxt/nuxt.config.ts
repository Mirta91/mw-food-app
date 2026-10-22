// No @storyblok/nuxt: it reads the access token and region when `nuxt build` runs, so a .env
// created after the build would be ignored. server/api/example.get.ts creates a
// storyblok-js-client (the client @storyblok/nuxt uses) per request from process.env instead.
export default defineNuxtConfig({
  srcDir: "src/",
  compatibilityDate: "2026-10-01",
  devtools: { enabled: false },
});
