<script lang="ts">
  import { tick } from "svelte";
  import FoodOptionFilter from "../lib/components/FoodOptionFilter.svelte";
  import OfficeSwitcher from "../lib/components/OfficeSwitcher.svelte";
  import PriceSlider from "../lib/components/PriceSlider.svelte";
  import RestaurantRow from "../lib/components/RestaurantRow.svelte";
  import { filterRestaurants, pickRandom, priceRange } from "../lib/utils/restaurants";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();

  let foodOption = $state<string | null>(null);
  let maxPrice = $state(20);
  let openId = $state<string | null>(null);

  let range = $derived(priceRange(data.restaurants));
  let filtered = $derived(filterRestaurants(data.restaurants, { foodOption, maxPrice }));
  let found = $derived(`${filtered.length} ${filtered.length === 1 ? "place" : "places"} found`);

  async function surprise() {
    openId = pickRandom(filtered, openId)?.id ?? null;
    await tick();
    document
      .getElementById(`restaurant-${openId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }
</script>

<main>
  <header>
    <div>
      <h1>Lunch Finder</h1>
      <p class="muted">What's for lunch today?</p>
    </div>
    <svg viewBox="0 0 24 24" width="36" height="36" aria-hidden="true">
      <path
        d="M5 2v7a3 3 0 0 0 2 2.83V22h2V11.83A3 3 0 0 0 11 9V2H9v6H8V2H6v6H5V2Zm11 0c-1.66 0-3 2.24-3 5v6h3v9h2V2h-2Z"
        fill="currentColor"
      />
    </svg>
  </header>

  <OfficeSwitcher offices={data.offices} selectedId={data.office.id} />
  <FoodOptionFilter options={data.foodOptions} bind:value={foodOption} />
  <PriceSlider bind:value={maxPrice} min={range.min} max={range.max} />

  <hr />

  <div class="summary">
    <p class="muted" aria-live="polite">{found}</p>
    <button type="button" class="surprise" onclick={surprise} disabled={filtered.length === 0}
      >🎲 Surprise Me!</button
    >
  </div>

  {#if filtered.length === 0}
    <p class="muted">No places match your filters. Try a higher price or another food option.</p>
  {:else}
    <ul>
      {#each filtered as restaurant (restaurant.id)}
        <RestaurantRow
          {restaurant}
          office={data.office}
          open={openId === restaurant.id}
          onToggle={() => (openId = openId === restaurant.id ? null : restaurant.id)}
        />
      {/each}
    </ul>
  {/if}
</main>

<style>
  main {
    display: grid;
    gap: 24px;
    max-width: 1200px;
    margin: 24px auto;
    padding: 20px;
    border: 1px solid var(--border);
    border-radius: var(--radius-card);
    background: var(--card);
  }

  header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  h1 {
    margin: 0 0 8px;
    font-size: 1.8rem;
  }

  header p {
    margin: 0;
  }

  .muted {
    color: var(--muted);
  }

  hr {
    width: 100%;
    margin: 8px 0;
    border: 0;
    border-top: 1px solid var(--border);
  }

  .summary {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  .summary p {
    margin: 0;
    font-size: 1.1rem;
  }

  .surprise {
    padding: 8px 18px;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: transparent;
    cursor: pointer;
  }

  .surprise:hover:not(:disabled) {
    background: var(--surface);
  }

  .surprise:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .surprise:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  ul {
    display: grid;
    gap: 8px;
    margin: 0;
    padding: 0;
  }

  @media (max-width: 600px) {
    main {
      margin: 0;
      padding: 16px;
      border: 0;
      border-radius: 0;
    }
  }
</style>
