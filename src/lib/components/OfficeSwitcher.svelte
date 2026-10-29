<script lang="ts">
  import type { Office } from "../cms/office.ts";

  let { offices, selectedId }: { offices: Office[]; selectedId: string } = $props();
</script>

<nav aria-label="Office">
  {#each offices as office (office.id)}
    <a
      href="?office={encodeURIComponent(office.id)}"
      aria-current={office.id === selectedId ? "page" : undefined}
      data-sveltekit-noscroll
      data-sveltekit-replacestate>{office.city}</a
    >
  {/each}
</nav>

<style>
  nav {
    display: flex;
    gap: 4px;
  }

  a {
    flex: 1;
    padding: 12px 16px;
    border-radius: 999px;
    text-align: center;
    text-decoration: none;
    color: var(--muted);
    font-size: 1.1rem;
  }

  a:hover {
    color: var(--text);
  }

  a[aria-current="page"] {
    background: var(--surface);
    color: var(--text);
  }

  a:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
</style>
