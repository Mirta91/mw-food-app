import { storyblokRegion } from "./src/lib/cms/client";

export default defineNuxtConfig({
  srcDir: "src/",
  compatibilityDate: "2026-10-01",
  devtools: { enabled: false },
  modules: ["@storyblok/nuxt"],
  // @storyblok/nuxt exposes the access token to the browser. That is acceptable: Storyblok
  // access tokens for published content are public by design. Never put a preview or personal
  // access token here.
  storyblok: {
    accessToken: process.env.STORYBLOK_ACCESS_TOKEN ?? "",
    apiOptions: { region: storyblokRegion(process.env) },
  },
  runtimeConfig: {
    storyblokAccessToken: process.env.STORYBLOK_ACCESS_TOKEN ?? "",
  },
});
