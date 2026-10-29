import { error } from "@sveltejs/kit";
import { fetchFoodOptions } from "../lib/cms/food-option";
import { fetchOffices } from "../lib/cms/office";
import { fetchRestaurants } from "../lib/cms/restaurant";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url }) => {
  const offices = await fetchOffices();
  if (offices.length === 0) {
    error(404, "No offices");
  }
  const requested = url.searchParams.get("office");
  const office = requested === null ? offices[0] : offices.find(({ id }) => id === requested);
  if (!office) {
    error(404, "Unknown office");
  }
  const [foodOptions, restaurants] = await Promise.all([
    fetchFoodOptions(),
    fetchRestaurants(office.id),
  ]);
  return { offices, office, foodOptions, restaurants };
};
