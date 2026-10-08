<script setup lang="ts">
import type { CmsState } from "~/lib/cms/state";

const { data: state } = await useFetch<CmsState>("/api/cms-state");
</script>

<template>
  <CmsStatus v-if="state" :state="state" />
</template>
