export type RestaurantFilter = {
  // Slug of the food option, or null for all.
  foodOption: string | null;
  maxPrice: number;
};

type Filterable = { averagePrice: number; foodOptions: { slug: string }[] };

export function filterRestaurants<T extends Filterable>(
  restaurants: T[],
  filter: RestaurantFilter,
): T[] {
  return restaurants.filter(
    (restaurant) =>
      restaurant.averagePrice <= filter.maxPrice &&
      (filter.foodOption === null ||
        restaurant.foodOptions.some((option) => option.slug === filter.foodOption)),
  );
}

// A random item, avoiding the one with excludeId while there is another; null for no items.
export function pickRandom<T extends { id: string }>(
  items: T[],
  excludeId: string | null = null,
  random: () => number = Math.random,
): T | null {
  const candidates = items.length > 1 ? items.filter((item) => item.id !== excludeId) : items;
  return candidates[Math.floor(random() * candidates.length)] ?? null;
}

// Slider bounds: 5 € up to 30 €, or higher so the most expensive restaurant can be shown.
export function priceRange(restaurants: { averagePrice: number }[]): { min: number; max: number } {
  const highest = Math.max(0, ...restaurants.map((restaurant) => restaurant.averagePrice));
  return { min: MIN_PRICE, max: Math.max(DEFAULT_MAX_PRICE, Math.ceil(highest)) };
}

const MIN_PRICE = 5;
const DEFAULT_MAX_PRICE = 30;
