import { fetchRestaurants } from "../lib/cms/restaurant";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
  const restaurants = await fetchRestaurants();
  return { restaurants };
};
