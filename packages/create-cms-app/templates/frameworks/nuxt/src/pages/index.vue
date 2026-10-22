<script setup lang="ts">
import type { Example } from "~/lib/cms/example";

const { data: example, error } = await useFetch<Example>("/api/example");
if (error.value) {
  throw createError({ ...error.value, fatal: true });
}
</script>

<template>
  <main v-if="example">
    <h1>{{ example.title }}</h1>
    <p>{{ example.body }}</p>
  </main>
</template>
