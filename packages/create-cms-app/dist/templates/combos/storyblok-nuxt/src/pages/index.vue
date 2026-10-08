<script setup lang="ts">
import { fetchExample, requiredEnv, type StoryblokApi } from "~/lib/cms/client";
import { loadCmsState, missingEnv } from "~/lib/cms/state";

const config = useRuntimeConfig();
const api = useStoryblokApi() as StoryblokApi;
const { data: state } = await useAsyncData("cms-state", () =>
  loadCmsState(
    missingEnv(requiredEnv, { STORYBLOK_ACCESS_TOKEN: config.storyblokAccessToken }),
    () => fetchExample(api),
  ),
);
</script>

<template>
  <CmsStatus v-if="state" :state="state" />
</template>
