// Demo content created by cms/seed.ts. Restaurants refer to offices by city and to food options by
// slug, so entries that already exist in a space are reused.

export type DemoFoodOption = { id: string; name: string; slug: string };

export type DemoOffice = {
  id: string;
  name: string;
  city: string;
  address: string;
  coordinates: { lat: number; lon: number };
};

export type DemoRestaurant = {
  id: string;
  name: string;
  description: string;
  office: string;
  address: string;
  coordinates: { lat: number; lon: number };
  cuisine: string;
  foodOptions: string[];
  averagePrice: number;
  emoji: string;
  takeaway: boolean;
};

export const demoFoodOptions: DemoFoodOption[] = [
  { id: "food-vegetarian", name: "Vegetarian", slug: "vegetarian" },
  { id: "food-vegan", name: "Vegan", slug: "vegan" },
  { id: "food-fish", name: "Fish", slug: "fish" },
  { id: "food-meat", name: "Meat", slug: "meat" },
];

export const demoOffices: DemoOffice[] = [
  {
    id: "office-valencia",
    name: "Valencia Office",
    city: "Valencia",
    address: "Plaça de l'Ajuntament, 46002 València",
    coordinates: { lat: 39.474, lon: -0.3721 },
  },
  {
    id: "office-munich",
    name: "Munich Office",
    city: "Munich",
    address: "Marienplatz 1, 80331 München",
    coordinates: { lat: 48.1374, lon: 11.5755 },
  },
];

export const demoRestaurants: DemoRestaurant[] = [
  {
    id: "restaurant-green-bowl",
    name: "Green Bowl",
    description: "Fresh salad bowls and smoothies, built to order.",
    office: "Valencia",
    address: "Carrer de Sant Vicent Màrtir 45, 46002 València",
    coordinates: { lat: 39.4717, lon: -0.3768 },
    cuisine: "Healthy",
    foodOptions: ["vegetarian", "vegan"],
    averagePrice: 11,
    emoji: "🥗",
    takeaway: true,
  },
  {
    id: "restaurant-la-tasca",
    name: "La Tasca",
    description: "Tapas and paella with a daily lunch menu.",
    office: "Valencia",
    address: "Carrer de la Pau 8, 46002 València",
    coordinates: { lat: 39.4743, lon: -0.3734 },
    cuisine: "Spanish",
    foodOptions: ["meat", "fish"],
    averagePrice: 14,
    emoji: "🥘",
    takeaway: false,
  },
  {
    id: "restaurant-sushi-corner",
    name: "Sushi Corner",
    description: "Nigiri, maki and poke bowls at the counter.",
    office: "Valencia",
    address: "Carrer de Colón 22, 46004 València",
    coordinates: { lat: 39.4695, lon: -0.3704 },
    cuisine: "Japanese",
    foodOptions: ["fish", "vegetarian"],
    averagePrice: 17,
    emoji: "🍣",
    takeaway: true,
  },
  {
    id: "restaurant-noodle-bar",
    name: "Noodle Bar",
    description: "Ramen and wok noodles, quick and filling.",
    office: "Valencia",
    address: "Carrer de les Barques 10, 46002 València",
    coordinates: { lat: 39.4722, lon: -0.3725 },
    cuisine: "Asian",
    foodOptions: ["meat", "vegetarian"],
    averagePrice: 12,
    emoji: "🍜",
    takeaway: true,
  },
  {
    id: "restaurant-asador-del-puerto",
    name: "Asador del Puerto",
    description: "Charcoal grill for meat and fish of the day.",
    office: "Valencia",
    address: "Carrer del Mar 30, 46003 València",
    coordinates: { lat: 39.4752, lon: -0.3741 },
    cuisine: "Grill",
    foodOptions: ["meat", "fish"],
    averagePrice: 23,
    emoji: "🍖",
    takeaway: false,
  },
  {
    id: "restaurant-mar-azul",
    name: "Mar Azul",
    description: "Seafood restaurant with a weekday rice menu.",
    office: "Valencia",
    address: "Carrer del Pintor Sorolla 12, 46002 València",
    coordinates: { lat: 39.4707, lon: -0.3712 },
    cuisine: "Seafood",
    foodOptions: ["fish"],
    averagePrice: 26,
    emoji: "🦐",
    takeaway: false,
  },
  {
    id: "restaurant-brotzeit-stube",
    name: "Brotzeit Stube",
    description: "Bavarian classics, pretzels and a daily special.",
    office: "Munich",
    address: "Tal 12, 80331 München",
    coordinates: { lat: 48.1363, lon: 11.5797 },
    cuisine: "Bavarian",
    foodOptions: ["meat", "vegetarian"],
    averagePrice: 15,
    emoji: "🥨",
    takeaway: true,
  },
  {
    id: "restaurant-veggie-garten",
    name: "Veggie Garten",
    description: "Plant-based bowls, curries and cakes.",
    office: "Munich",
    address: "Sendlinger Straße 20, 80331 München",
    coordinates: { lat: 48.1352, lon: 11.5698 },
    cuisine: "Vegetarian",
    foodOptions: ["vegetarian", "vegan"],
    averagePrice: 12,
    emoji: "🥦",
    takeaway: true,
  },
  {
    id: "restaurant-pasta-piccola",
    name: "Pasta Piccola",
    description: "Fresh pasta made in house every morning.",
    office: "Munich",
    address: "Weinstraße 6, 80333 München",
    coordinates: { lat: 48.1385, lon: 11.5748 },
    cuisine: "Italian",
    foodOptions: ["vegetarian", "meat"],
    averagePrice: 13,
    emoji: "🍝",
    takeaway: true,
  },
  {
    id: "restaurant-fischhaus",
    name: "Fischhaus",
    description: "Fish sandwiches and grilled fish from the market.",
    office: "Munich",
    address: "Viktualienmarkt 3, 80331 München",
    coordinates: { lat: 48.1351, lon: 11.5762 },
    cuisine: "Seafood",
    foodOptions: ["fish"],
    averagePrice: 19,
    emoji: "🐟",
    takeaway: true,
  },
  {
    id: "restaurant-curry-haus",
    name: "Curry Haus",
    description: "North Indian curries with rice and naan.",
    office: "Munich",
    address: "Rosenstraße 4, 80331 München",
    coordinates: { lat: 48.1367, lon: 11.5741 },
    cuisine: "Indian",
    foodOptions: ["vegetarian", "vegan", "meat"],
    averagePrice: 14,
    emoji: "🍛",
    takeaway: true,
  },
  {
    id: "restaurant-steak-and-co",
    name: "Steak & Co",
    description: "Dry-aged steaks and burgers.",
    office: "Munich",
    address: "Maximilianstraße 10, 80539 München",
    coordinates: { lat: 48.1393, lon: 11.5813 },
    cuisine: "Steakhouse",
    foodOptions: ["meat"],
    averagePrice: 27,
    emoji: "🥩",
    takeaway: false,
  },
];
