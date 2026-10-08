<script setup lang="ts">
import { computed } from "vue";
import { type CmsState, describeCmsState } from "~/lib/cms/state";

const props = defineProps<{ state: CmsState }>();
const text = computed(() => describeCmsState(props.state));
</script>

<template>
  <main :data-cms-state="props.state.kind">
    <h1>{{ text.title }}</h1>
    <p>{{ text.detail }}</p>
  </main>
</template>
