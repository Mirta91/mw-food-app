<script lang="ts">
  import type { FoodOption } from "../cms/food-option.ts";

  // value is the selected slug, or null for all food options.
  let { options, value = $bindable(null) }: { options: FoodOption[]; value: string | null } =
    $props();
</script>

<div role="group" aria-label="Food options">
  <button type="button" aria-pressed={value === null} onclick={() => (value = null)}>All</button>
  {#each options as option (option.id)}
    <button
      type="button"
      aria-pressed={value === option.slug}
      onclick={() => (value = option.slug)}>{option.name}</button
    >
  {/each}
</div>

<style>
  div {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  button {
    padding: 8px 18px;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: transparent;
    color: var(--muted);
    font-size: 1.1rem;
    cursor: pointer;
  }

  button:hover {
    color: var(--text);
  }

  button[aria-pressed="true"] {
    border-color: var(--accent);
    background: var(--accent);
    color: var(--on-accent);
  }

  button:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
</style>
