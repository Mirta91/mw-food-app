// No @storyblok/nuxt: it reads the access token and region when `nuxt build` runs, so a .env
// created after the build would be ignored. src/lib/cms/client.ts creates a storyblok-js-client (the
// client @storyblok/nuxt uses) from process.env on first use instead.
export default defineNuxtConfig({
  srcDir: "src/",
  compatibilityDate: "2026-10-01",
  devtools: { enabled: false },
});
