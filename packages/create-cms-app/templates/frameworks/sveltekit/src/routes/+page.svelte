<script lang="ts">
  import CmsStatus from "../lib/components/CmsStatus.svelte";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
</script>

<CmsStatus state={data.state} />
