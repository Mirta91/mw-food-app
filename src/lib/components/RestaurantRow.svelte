<script lang="ts">
  import type { Office } from "../cms/office.ts";
  import type { Restaurant } from "../cms/restaurant.ts";
  import { formatDistance, formatPrice } from "../utils/format.ts";
  import { distanceInMeters } from "../utils/geo.ts";

  let {
    restaurant,
    office,
    open,
    onToggle,
  }: { restaurant: Restaurant; office: Office; open: boolean; onToggle: () => void } = $props();

  let distance = $derived(
    office.coordinates && restaurant.coordinates
      ? formatDistance(distanceInMeters(office.coordinates, restaurant.coordinates))
      : null,
  );
  let panelId = $derived(`restaurant-${restaurant.id}-details`);
</script>

<li id="restaurant-{restaurant.id}">
  <button type="button" aria-expanded={open} aria-controls={panelId} onclick={onToggle}>
    <span class="tile" aria-hidden="true">
      {#if restaurant.imageUrl}
        <img src="{restaurant.imageUrl}?w=160&h=160&fit=fill" alt="" />
      {:else}
        {restaurant.emoji}
      {/if}
    </span>
    <span class="text">
      <span class="name">{restaurant.name}</span>
      <span class="meta"
        >{[restaurant.cuisine, restaurant.foodOptions.map((option) => option.name).join(", ")]
          .filter(Boolean)
          .join(" · ")}</span
      >
    </span>
    <span class="price">{formatPrice(restaurant.averagePrice)}</span>
  </button>
  {#if open}
    <div class="details" id={panelId}>
      {#if restaurant.imageUrl}
        <img class="photo" src="{restaurant.imageUrl}?w=600" alt={restaurant.name} />
      {/if}
      {#if restaurant.description}
        <p>{restaurant.description}</p>
      {/if}
      <p class="muted">
        {restaurant.address}{#if distance}&nbsp;· {distance} from the office{/if}
      </p>
      <div class="footer">
        <span class="muted">{restaurant.takeaway ? "Takeaway available" : "Eat in only"}</span>
        <a href={restaurant.googleMapsUrl} target="_blank" rel="noopener noreferrer"
          >Open in Google Maps ↗</a
        >
      </div>
    </div>
  {/if}
</li>

<style>
  li {
    list-style: none;
  }

  button {
    display: flex;
    align-items: center;
    gap: 20px;
    width: 100%;
    padding: 16px 18px;
    border: 0;
    border-radius: var(--radius-tile);
    background: transparent;
    text-align: left;
    cursor: pointer;
  }

  button:hover,
  button[aria-expanded="true"] {
    background: var(--surface);
  }

  button:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }

  .tile {
    display: grid;
    flex: none;
    place-items: center;
    width: 84px;
    height: 84px;
    overflow: hidden;
    border-radius: var(--radius-tile);
    background: var(--surface);
    font-size: 2rem;
  }

  button[aria-expanded="true"] .tile {
    background: var(--card);
  }

  .tile img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .text {
    display: grid;
    flex: 1;
    gap: 6px;
    min-width: 0;
  }

  .name {
    font-size: 1.4rem;
    font-weight: 600;
  }

  .meta,
  .muted {
    color: var(--muted);
  }

  .price {
    flex: none;
    font-size: 1.4rem;
    font-weight: 600;
  }

  .details {
    display: grid;
    gap: 12px;
    margin: 8px 18px 16px 122px;
  }

  .details p {
    margin: 0;
  }

  .photo {
    width: 100%;
    max-width: 480px;
    border-radius: var(--radius-tile);
  }

  .footer {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    justify-content: space-between;
    align-items: center;
  }

  a {
    padding: 8px 16px;
    border-radius: 999px;
    background: var(--accent);
    color: var(--on-accent);
    text-decoration: none;
  }

  @media (max-width: 600px) {
    button {
      gap: 12px;
      padding: 12px;
    }

    .tile {
      width: 56px;
      height: 56px;
      font-size: 1.5rem;
    }

    .name,
    .price {
      font-size: 1.1rem;
    }

    .details {
      margin: 8px 12px 16px;
    }
  }
</style>
