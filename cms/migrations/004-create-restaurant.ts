import { restaurantContentType } from "../content-types/restaurant.ts";
import { createContentTypeMigration } from "../create-content-type.ts";

export default createContentTypeMigration(restaurantContentType);
