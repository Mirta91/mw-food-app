<script lang="ts">
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
</script>

<main>
  <h1>Restaurants</h1>
  {#if data.restaurants.length === 0}
    <p>No restaurants yet. Add and publish a Restaurant entry in Contentful to see it here.</p>
  {:else}
    <ul>
      {#each data.restaurants as restaurant (restaurant.id)}
        <li>
          {#if restaurant.imageUrl}
            <img src={restaurant.imageUrl} alt={restaurant.name} width="160" />
          {/if}
          <h2>{restaurant.name}</h2>
          <p>
            {restaurant.cuisine} · {restaurant.office} · avg. {restaurant.averagePrice} €
            {#if restaurant.takeaway}· takeaway{/if}
          </p>
          <p>{restaurant.address}</p>
          {#if restaurant.description}
            <p>{restaurant.description}</p>
          {/if}
          {#if restaurant.foodOptions.length > 0}
            <p>{restaurant.foodOptions.join(", ")}</p>
          {/if}
          {#if restaurant.googleMapsUrl}
            <a href={restaurant.googleMapsUrl} target="_blank" rel="noreferrer">Open in Google Maps</a>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</main>
