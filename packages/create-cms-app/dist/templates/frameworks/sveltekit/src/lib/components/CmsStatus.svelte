<script lang="ts">
  import { type CmsState, describeCmsState } from "../cms/state";

  let { state }: { state: CmsState } = $props();
  const text = $derived(describeCmsState(state));
</script>

<main data-cms-state={state.kind}>
  <h1>{text.title}</h1>
  <p>{text.detail}</p>
</main>
