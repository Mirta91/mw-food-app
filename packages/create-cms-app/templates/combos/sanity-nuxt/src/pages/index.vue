<script setup lang="ts">
import { fetchExample, requiredEnv } from "~/lib/cms/client";
import { loadCmsState, missingEnv } from "~/lib/cms/state";

const config = useRuntimeConfig();
const sanity = useSanity();
const { data: state } = await useAsyncData("cms-state", () =>
  loadCmsState(
    missingEnv(requiredEnv, {
      SANITY_PROJECT_ID: config.sanityProjectId,
      SANITY_DATASET: config.sanityDataset,
    }),
    () => fetchExample(sanity.client),
  ),
);
</script>

<template>
  <CmsStatus v-if="state" :state="state" />
</template>
