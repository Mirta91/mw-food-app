<script lang="ts">
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
</script>

<main>
  <h1>{data.example.title}</h1>
  <p>{data.example.body}</p>
</main>
