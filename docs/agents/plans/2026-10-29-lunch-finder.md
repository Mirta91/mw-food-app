---
date: 2026-10-29T13:35:23Z
git_commit: fb4352515907748e4f000de337afc3d44ea6a34a
branch: main
topic: "Lunch Finder"
tags: [plan, cms, contentful, sveltekit, lunch-finder]
status: implemented (migration run pending)
---

# Lunch Finder Implementation Plan

## Overview

Turn the scaffolding into the Lunch Finder from `lunch_finder_poc_summary.txt`: employees pick an
office, filter restaurants by food option and maximum price, open a restaurant's details, let
"Surprise Me!" pick one, and open it in Google Maps. Offices, restaurants and food options are
maintained in Contentful. The plan covers all three places where work happens: the Contentful web
app, the local machine, and the code in this repository.

## Current State Analysis

- Since commit `6247deb` the home page lists all restaurants as plain HTML:
  `fetchRestaurants(client)` in `src/lib/cms/restaurant.ts` (`include: 1`, ordered by name)
  maps the office and food options to names, prefixes image URLs with `https:` and drops
  unresolved links; `tests/unit/cms-restaurant.test.ts` covers it. `src/lib/cms/example.ts` and
  its test are gone, but `cms/content-types/example.ts`, migration 001 and the example entry in
  `cms/migrate.ts` remain.
- The team space (read on 2026-10-29) already has `office`, `foodOption` and `restaurant`, made
  by hand, with the field IDs and types of the summary. Missing compared with this plan: the
  `emoji` field, the `linkContentType: ["foodOption"]` validation on `foodOptions` items and
  `unique` on `slug`. There is no `example` content type. Locale: `en-US` only.
- Team space content: office "VALE" (city Valencia); food options Halal, Vegetarian,
  Mediterranean; restaurant Mercadona (VALE, 7 €, Vegetarian + Mediterranean).
- `cms/migrate.ts` is hard-wired to the example: it skips migration 001 when the `example`
  content type exists and then creates one published entry. It cannot run several migrations.
- `cms/migrations/001-create-example.ts` passes only `name`, `type` and `required` to
  `createField`, so links, arrays and validations are not supported yet.
- `getClient()` (`src/lib/cms/client.ts`) and the env checks (`src/hooks.server.ts`,
  `vite.config.ts`) already work and need no change.
- `contentful-migration` supports everything the model needs: `IFieldOptions` has `type`
  (including `Location`, `Link`, `Array`), `linkType`, `items`, `validations`
  (`linkContentType`, `unique`) and `required`.
- `contentful-management`'s plain client has `entry.createWithId`, so demo entries can get fixed
  IDs. That makes links between seed entries and re-runs simple.
- The Delivery SDK resolves linked entries and assets when `include` is set; unpublished links
  stay as `{ sys: { type: "Link" } }` objects and must be dropped by the mapper.

## Desired End State

- `pnpm cms:migrate` creates the `foodOption`, `office` and `restaurant` content types in a new
  space, aligns the hand-made ones in the team space (emoji field, validations), and creates and
  publishes the missing demo content (food options Vegetarian, Vegan, Fish, Meat; offices
  Valencia and Munich; 12 restaurants), reusing entries that already exist. Re-running it changes nothing and never overwrites content edited
  in Contentful.
- `pnpm dev` shows the Lunch Finder as in the mockup, with working office switch, food option
  filter, price slider, inline details, "Surprise Me!" and Google Maps links.
- A price changed and published in Contentful shows on the next page load.
- `pnpm check` passes; the smoke test covers the new page.

## What We're NOT Doing

- Cuisine filter UI (cuisine is shown on each row only).
- Multi-select food options.
- Restaurant detail pages, map view, voting, menus, favorites, ratings.
- Images in the demo seed (uploaded by hand in Contentful, optional).
- Caching or Contentful webhooks; every page load reads from the Delivery API.
- Localisation: the app is English-only, prices in euros.

## Decisions

| Topic           | Decision                                                                                                       |
| --------------- | -------------------------------------------------------------------------------------------------------------- |
| Row picture     | New optional `emoji` field on Restaurant. Show the image if set, else the emoji, else 🍽️.                      |
| Food filter     | Single select: "All" or one food option.                                                                       |
| Price slider    | 5 € to max(30 €, highest price rounded up), step 1, default 20 €. Shows `averagePrice <= value`.               |
| Details         | Clicking a row expands its details inline. One row open at a time.                                             |
| Surprise Me     | Button next to "N places found"; opens a random filtered row (not the open one) and scrolls to it.             |
| Office state    | In the URL: `/?office=<entryId>`. Default: first office by `sys.createdAt` (Valencia). Filters are page state. |
| Demo data       | Seeded by `pnpm cms:migrate`. Food options are reused by slug, offices by city; restaurants get fixed IDs.     |
| Example content | Not in the team space: remove the example code and migration 001; no delete migration needed.                  |
| Food pills      | All food options from Contentful, in creation order (team space adds Halal and Mediterranean).                 |

## UI Mockups

Desktop (matches the screenshot; the row and button below the divider are additions):

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Lunch Finder                                                        🍴    │
│ What's for lunch today?                                                   │
│ ┌───────────────── Valencia ─────────────────┐          Munich           │
│ └────────────────────────────────────────────┘                           │
│ (●All) ( Vegetarian ) ( Vegan ) ( Fish ) ( Meat )                         │
│ Max. lunch price                                                    20 €  │
│ [══════════════════════════════════════○════════════════════]            │
│ ───────────────────────────────────────────────────────────────────────── │
│ 4 places found                                       [ 🎲 Surprise Me! ]  │
│  [🥗]  Green Bowl                                                   11 €  │
│        Healthy · Vegetarian, Vegan                                        │
│  [🥘]  La Tasca                                          (open)     14 €  │
│        Spanish · Meat, Fish                                               │
│        ┌──────────────────────────────────────────────────────────────┐   │
│        │ [image if set]  Tapas and paella with a daily lunch menu.    │   │
│        │ Carrer de la Pau 8, 46002 Valencia · 450 m from the office    │   │
│        │ Takeaway available            [ Open in Google Maps ↗ ]      │   │
│        └──────────────────────────────────────────────────────────────┘   │
│  [🍜]  Noodle Bar                                                   12 €  │
│        Asian · Meat, Vegetarian                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

Empty result: "0 places found", "Surprise Me!" disabled, and the line
"No places match your filters. Try a higher price or another food option."

Mobile (≤ 600 px): same order, 16 px side padding, pills wrap, price stays right-aligned in the
row.

## Platform Checklist

What to do where, in order. Phase numbers refer to the code phases below.

### Contentful web app (once per team, before Phase 1 runs)

- [ ] Create a space, or use the partner's space (<https://app.contentful.com>). Check
      Settings → Locales: the default locale is used for all demo content.
- [ ] Settings → API keys → Add API key "Lunch Finder". Note the Space ID and the Content
      Delivery API access token. Environment: `master`.
- [ ] Profile → CMA tokens → create a personal access token for whoever runs
      `pnpm cms:migrate`. That user needs the Admin or Developer role (content model changes).
- [ ] Settings → Users → invite teammates: Editor role for content editors, Admin or Developer
      for developers.
- [ ] After `pnpm cms:migrate` (Phase 1): Restaurant has an Emoji field; Content has 16 new
      published entries in the team space (Vegan, Fish, Meat, the Munich office, 12 restaurants).
- [ ] Optional: replace the Munich office placeholder address and coordinates with the real
      office (open the Office entry → edit → Publish).
- [ ] Optional: Media → Add asset → upload a photo → Publish; then open a restaurant → Image →
      link the asset → Publish.

### Local machine (every developer)

- [ ] Node 24+ installed; `pnpm install`; `pnpm exec playwright install` once per machine.
- [ ] `cp .env.example .env` and fill in `CONTENTFUL_SPACE_ID`, `CONTENTFUL_ACCESS_TOKEN`,
      optional `CONTENTFUL_ENVIRONMENT`, and `CONTENTFUL_MANAGEMENT_TOKEN` (only needed to run
      migrations). Share values privately; `.env` is ignored by git.
- [ ] `pnpm cms:migrate` (only one person needs to run it per space; re-running is safe).
- [ ] `pnpm dev`, open the printed URL.
- [ ] `pnpm check` before every commit (the pre-commit hook runs it too).

### Demo script (success criteria)

- [ ] In Contentful, change La Tasca's `averagePrice` from 14 to 21 and Publish.
- [ ] Reload the app: La Tasca disappears at 20 € and appears when the slider is at 21 € or more.

## Architecture and Code Reuse

```
Contentful (Delivery API)
   │  getEntries (office, foodOption, restaurant with include: 1)
   ▼
src/lib/cms/{office,food-option,restaurant}.ts  ── map SDK entries to plain types
   │
   ▼
src/routes/+page.server.ts  ── load(): offices, selected office, food options, restaurants
   │  (server only: the delivery token never reaches the browser)
   ▼
src/routes/+page.svelte  ── page state: food option, max price, open row
   ├── src/lib/components/OfficeSwitcher.svelte    (links ?office=<id>)
   ├── src/lib/components/FoodOptionFilter.svelte
   ├── src/lib/components/PriceSlider.svelte
   └── src/lib/components/RestaurantRow.svelte
        uses src/lib/utils/{restaurants,geo,format}.ts
```

Reused as is: `getClient()`, `requiredEnv`, env checks, `once()`, `scripts/smoke.ts`,
Playwright config. The pattern of `src/lib/cms/restaurant.ts` and its test is copied for each new
query module (client parameter defaulting to `getClient()`, mocked SDK in tests).

Affected files:

- `cms/`
  - `content-types/types.ts` — new: `ContentTypeDefinition` (`id`, `name`, `displayField`,
    `fields: (IFieldOptions & { id: string })[]`)
  - `content-types/food-option.ts`, `office.ts`, `restaurant.ts` — new definitions
  - `content-types/example.ts` — deleted
  - `create-content-type.ts` — new: `createContentTypeMigration(definition): MigrationFunction`
  - `migrations/002-create-food-option.ts`, `003-create-office.ts`, `004-create-restaurant.ts` —
    new, each `export default createContentTypeMigration(...)`
  - `migrations/005-align-restaurant-and-food-option.ts` — new: adds `emoji` and the validations
    to the hand-made types
  - `migrations/001-create-example.ts` — deleted
  - `demo-data.ts` — new: `demoFoodOptions`, `demoOffices`, `demoRestaurants` with fixed IDs
  - `seed.ts` — new: `seedDemoContent(client, locale)`
  - `migrate.ts` — generic migration runner plus seeding
- `src/lib/cms/`
  - `office.ts` — `Office`, `fetchOffices()`
  - `food-option.ts` — `FoodOption`, `fetchFoodOptions()`
  - `restaurant.ts` — existing; `Restaurant` reshaped, `fetchRestaurants(officeId, client)`
- `src/lib/utils/`
  - `geo.ts` — `Coordinates`, `distanceInMeters(a, b)`, `mapsSearchUrl(coordinates)`
  - `format.ts` — `formatPrice(price)`, `formatDistance(meters)`
  - `restaurants.ts` — `filterRestaurants(restaurants, filter)`, `pickRandom(items, exclude?, random?)`
- `src/lib/components/` — new: the four components above
- `src/routes/+layout.svelte`, `src/app.css` — new: global tokens and base styles
- `src/routes/+page.server.ts`, `+page.svelte`, `src/app.html` — rewritten / title change
- `tests/unit/` — new tests per module; `cms-restaurant.test.ts` updated
- `tests/e2e/smoke.spec.ts` — updated; `tests/e2e/lunch-finder.spec.ts` — new
- Docs: `AGENTS.md`, `docs/instructions/cms.md`, `docs/instructions/framework.md`, `README.md`,
  `lunch_finder_poc_summary.txt`

## Performance Considerations

- One page load makes three Delivery API calls (offices, food options, restaurants of one
  office), with `Promise.all` for the last two. Restaurant links are resolved in the same
  request through `include: 1`.
- Filtering, random picks and distances run in the browser on at most a few dozen restaurants.
- Images use Contentful's image API (`?w=160&h=160&fit=fill` for tiles, `?w=600` in details).

## Migration Notes

- Migrations 002–004 only create content types; they are skipped when the type exists, as in
  the team space. A new space gets the final definitions from them, so 005 is skipped there.
- 005 runs only while `restaurant` has no `emoji` field. Adding `unique` to `slug` needs unique
  slugs, which the team space has.
- Seeding never changes an existing entry. Food options are matched by slug and offices by city
  so the hand-made Vegetarian and VALE entries are reused; restaurants are matched by fixed entry
  ID. A deleted demo restaurant is re-created on the next run (documented in `cms.md`).
- The example content type is not in the team space; personal spaces that still have it keep it
  harmlessly.

---

## Phase 1: Content model, migrations and demo data

Creates the content types and demo content in Contentful through `pnpm cms:migrate`.

**Tasks**:

- [ ] All new files in `cms/` run in plain Node: relative imports end in `.ts`, type-only
      imports (`IFieldOptions`, `MigrationFunction`, `PlainClientAPI`) use `import type`.
- [ ] `cms/content-types/types.ts`: add `ContentTypeDefinition`. The definition files use
      `satisfies ContentTypeDefinition` instead of `as const` (readonly arrays do not fit
      `IFieldOptions`).
- [ ] `cms/content-types/food-option.ts`: `foodOptionContentType` — id `foodOption`, display field
      `name`; fields `name` (Symbol, required), `slug` (Symbol, required, `validations: [{ unique: true }]`).
- [ ] `cms/content-types/office.ts`: `officeContentType` — id `office`; `name`, `city`, `address`
      (Symbol, required), `coordinates` (Location, required).
- [ ] `cms/content-types/restaurant.ts`: `restaurantContentType` — id `restaurant`; fields:
      `ts
      { id: "name", type: "Symbol", required: true },
      { id: "description", type: "Text" },
      { id: "office", type: "Link", linkType: "Entry", required: true,
        validations: [{ linkContentType: ["office"] }] },
      { id: "address", type: "Symbol", required: true },
      { id: "coordinates", type: "Location", required: true },
      { id: "cuisine", type: "Symbol", required: true },
      { id: "foodOptions", type: "Array", required: true,
        items: { type: "Link", linkType: "Entry", validations: [{ linkContentType: ["foodOption"] }] } },
      { id: "averagePrice", type: "Number", required: true },
      { id: "emoji", type: "Symbol" },
      { id: "image", type: "Link", linkType: "Asset" },
      { id: "googleMapsUrl", type: "Symbol" },
      { id: "takeaway", type: "Boolean" },
      `
      (each with a `name`, e.g. "Average price (€)").
- [ ] `cms/create-content-type.ts`: `createContentTypeMigration(definition)` creates the type and
      each field with `const { id, ...options } = field; type.createField(id, options)`.
- [ ] `cms/migrations/002-create-food-option.ts`, `003-create-office.ts`,
      `004-create-restaurant.ts` (in this order, referenced types first).
- [ ] `cms/migrations/005-align-restaurant-and-food-option.ts`: `editContentType("restaurant")`
      creates `emoji` (taken from `restaurantContentType`) and sets the `foodOptions` items
      validation; `editContentType("foodOption").editField("slug").validations([{ unique: true }])`.
- [ ] Remove the example: delete `cms/content-types/example.ts`,
      `cms/migrations/001-create-example.ts` and the example entry creation in `cms/migrate.ts`.
- [ ] `cms/demo-data.ts`: fixed-ID data. Food options `food-vegetarian`, `food-vegan`,
      `food-fish`, `food-meat` (names/slugs as in the summary). Offices:

      | ID                | name            | city     | address                          | lat/lon            |
      | ----------------- | --------------- | -------- | -------------------------------- | ------------------ |
      | `office-valencia` | Valencia Office | Valencia | Plaça de l'Ajuntament, 46002     | 39.4740 / -0.3721  |
      | `office-munich`   | Munich Office   | Munich   | Marienplatz 1, 80331 München     | 48.1374 / 11.5755  |

      Restaurants (made up, coordinates within ~1 km of the office, `takeaway` mixed,
      one-sentence description, no `googleMapsUrl` so the fallback is used):

      | Office   | Name              | Emoji | Cuisine        | Food options             | €  |
      | -------- | ----------------- | ----- | -------------- | ------------------------ | -- |
      | Valencia | Green Bowl        | 🥗    | Healthy        | Vegetarian, Vegan        | 11 |
      | Valencia | La Tasca          | 🥘    | Spanish        | Meat, Fish               | 14 |
      | Valencia | Sushi Corner      | 🍣    | Japanese       | Fish, Vegetarian         | 17 |
      | Valencia | Noodle Bar        | 🍜    | Asian          | Meat, Vegetarian         | 12 |
      | Valencia | Asador del Puerto | 🍖    | Grill          | Meat, Fish               | 23 |
      | Valencia | Mar Azul          | 🦐    | Seafood        | Fish                     | 26 |
      | Munich   | Brotzeit Stube    | 🥨    | Bavarian       | Meat, Vegetarian         | 15 |
      | Munich   | Veggie Garten     | 🥦    | Vegetarian     | Vegetarian, Vegan        | 12 |
      | Munich   | Pasta Piccola     | 🍝    | Italian        | Vegetarian, Meat         | 13 |
      | Munich   | Fischhaus         | 🐟    | Seafood        | Fish                     | 19 |
      | Munich   | Curry Haus        | 🍛    | Indian         | Vegetarian, Vegan, Meat  | 14 |
      | Munich   | Steak & Co        | 🥩    | Steakhouse     | Meat                     | 27 |

      Restaurants reference offices by city and food options by slug. The demo restaurants of
      Valencia at the default 20 € are exactly the four of the screenshot.

- [ ] `cms/seed.ts`: `seedDemoContent(client, locale)` — reads existing entries with
      `entry.getMany`; food options matched by slug, offices by city, restaurants by ID. Missing
      ones are created in that order with `entry.createWithId`
      with fields wrapped in `{ [locale]: value }` (links as
      `{ sys: { type: "Link", linkType: "Entry", id } }`, location as `{ lat, lon }`) and
      `entry.publish`. Logs how many entries it created.
- [ ] `cms/migrate.ts`: replace the single-migration logic with an ordered list
      `ts
      type Step = {
        name: string;
        migration: MigrationFunction;
        isApplied: () => Promise<boolean>;
      };
      `
      (002–004 use `isApplied = contentTypeExists(id)`, 005 `hasField("restaurant", "emoji")`),
      run each pending step with `runMigration`, then call `seedDemoContent`
      with the default locale (moved into a `defaultLocale()` helper).
- [ ] `docs/instructions/cms.md`: replace the migration 001 sentence with the runner rules (add a
      step per migration; `isApplied` must make re-runs no-ops), document `createContentTypeMigration`,
      and seeding (matching rules; deleted demo restaurants come back on the next run); remove
      the example sentences.
- [ ] `docs/instructions/code-style.md`: extend the `.ts`-extension import rule from `scripts/` to
      `cms/`.
- [ ] `AGENTS.md` layout: `cms/` also holds the demo data and seeding; add
      `docs/agents/plans/` — implementation plans.

**Automated Verification**:

- [ ] `tests/unit/create-content-type.test.ts` (Unit): a fake `migration` object records that every
      field of `restaurantContentType` is created with its options (links, items, validations).
- [ ] `tests/unit/demo-data.test.ts` (Unit): entry IDs are unique; every restaurant's office and
      food option references exist; every slug is unique; Valencia has exactly 4 demo restaurants
      at ≤ 20 €.
- [ ] `tests/unit/seed.test.ts` (Unit): with a mocked plain client, missing entries are created with
      locale-wrapped fields and published; food options with an existing slug and offices with an
      existing city are reused (their IDs end up in the restaurant links); existing restaurants are
      skipped.
- [ ] `pnpm check` passes.

**Manual Verification**:

- [ ] Run `pnpm cms:migrate` twice against the team space.
  1. First run: 002–004 skipped, 005 applied, 16 entries created.
  2. Second run: every step skipped and 0 entries created.
  3. In Contentful, Restaurant has the Emoji field; the 16 new entries are Published and the
     demo Valencia restaurants link to VALE.

---

## Phase 2: Data access and helpers

Dependencies: **Phase 1** (content type IDs and field names)

Query modules that turn Delivery API entries into plain types, and pure helpers for the UI.

**Tasks**:

- [ ] `src/lib/utils/geo.ts`: `type Coordinates = { lat: number; lon: number }`;
      `distanceInMeters(a, b)` (haversine); `mapsSearchUrl(c)` →
      `https://www.google.com/maps/search/?api=1&query=<lat>,<lon>`.
- [ ] `src/lib/utils/format.ts`: `formatPrice(11)` → `"11 €"`, `formatPrice(12.5)` → `"12.50 €"`;
      `formatDistance(350)` → `"350 m"`, `formatDistance(1240)` → `"1.2 km"`.
- [ ] `src/lib/cms/office.ts`: `type Office = { id; name; city; address; coordinates }`;
      `fetchOffices(client = getClient())` with `content_type: "office", order: ["sys.createdAt"]`.
- [ ] `src/lib/cms/food-option.ts`: `type FoodOption = { id; name; slug }`;
      `fetchFoodOptions(client = getClient())`, ordered by `sys.createdAt`.
- [ ] `src/lib/cms/restaurant.ts` (exists; change it): `office: string` becomes `officeId`,
      `foodOptions: string[]` becomes `FoodOption[]`, `googleMapsUrl` is never `null`, and
      `coordinates` and `emoji` are added. Target shape:
      `ts
      export type Restaurant = {
        id: string; name: string; description: string; officeId: string; address: string;
        coordinates: Coordinates; cuisine: string; foodOptions: FoodOption[]; averagePrice: number;
        emoji: string; imageUrl: string | null; googleMapsUrl: string; takeaway: boolean;
      };
      export async function fetchRestaurants(officeId: string, client = getClient()): Promise<Restaurant[]>
      `
      Query: add `"fields.office.sys.id": officeId` and `limit: 1000` to the existing
      `include: 1`, `order: ["fields.name"]`. Keep the existing `Linked` handling (unresolved food
      option links dropped, `assetUrl` returns `null` for unresolved images); `googleMapsUrl` = field or
      `mapsSearchUrl(coordinates)`; `takeaway` defaults to `false`; `emoji` defaults to `"🍽️"`.
      Reuse the `FoodOption` mapper from `food-option.ts`.
- [ ] `src/lib/utils/restaurants.ts`:
      `filterRestaurants(restaurants, { foodOption: string | null; maxPrice: number })` (slug match,
      `averagePrice <= maxPrice`, order kept); `pickRandom(items, excludeId?, random = Math.random)` (items have an `id`)
      returns `null` for an empty list and avoids the item with `excludeId` when there is another.
      `priceRange(restaurants)` → `{ min: 5, max: Math.max(30, Math.ceil(highest price)) }`.

**Automated Verification**:

- [ ] `tests/unit/geo.test.ts` (Unit): Valencia ↔ Munich ≈ 1,350 km (±1 %); same point → 0; maps URL.
- [ ] `tests/unit/format.test.ts` (Unit): the price and distance examples above.
- [ ] `tests/unit/cms-office.test.ts`, `cms-food-option.test.ts` (Unit): mapping, query, default client.
- [ ] `tests/unit/cms-restaurant.test.ts` (Unit, update the existing tests): full mapping; query includes the office filter and
      `include: 1`; unresolved food option links dropped; image URL prefixed; unresolved image →
      `null`; Maps fallback; defaults.
- [ ] `tests/unit/restaurants.test.ts` (Unit): "All" keeps everything ≤ price; slug filter;
      price boundary is inclusive; `pickRandom` empty → `null`, avoids `excludeId`, single item →
      that item; `priceRange` with and without prices above 30 €.
- [ ] `pnpm check` passes.

---

## Phase 3: Lunch Finder page

Dependencies: **Phase 2**

Builds the UI from the mockup and wires it to the server load.

**Tasks**:

- [ ] `src/app.css`: CSS tokens and base styles (system font stack, `--bg #fafafa`,
      `--surface #f2f2f2`, `--border #e5e5e5`, `--text #111`, `--muted #6b6b6b`, radius 24 px card,
      999 px pills); `src/routes/+layout.svelte` imports it and renders the card container
      (max-width 1200 px, centred, 16 px gutter on mobile).
- [ ] `src/app.html`: `<title>Lunch Finder</title>`.
- [ ] `src/routes/+page.server.ts`: load offices; `error(404, "No offices")` if none; selected
      office = `url.searchParams.get("office")` or the first; `error(404, "Unknown office")` if not
      found; `Promise.all([fetchFoodOptions(), fetchRestaurants(office.id)])`; return
      `{ offices, office, foodOptions, restaurants }`.
- [ ] `src/lib/components/OfficeSwitcher.svelte`: `<nav aria-label="Office">` with one link
      per office (`href="?office={id}"`, `aria-current="page"` on the active one), styled as the
      segmented control; label is `office.city`.
- [ ] `src/lib/components/FoodOptionFilter.svelte`: group `role="group" aria-label="Food options"`
      of buttons with `aria-pressed`; "All" plus one per food option;
      `let { options, value = $bindable() } = $props()` (slug or `null`).
- [ ] `src/lib/components/PriceSlider.svelte`: `<label>` "Max. lunch price" with
      `let { value = $bindable(), min, max } = $props()`, `<input type="range" step="1" bind:value>`,
      value shown as `formatPrice`; large pale
      track and white thumb as in the screenshot.
- [ ] `src/lib/components/RestaurantRow.svelte`: header is a `<button aria-expanded>` with tile
      (image or emoji), name, "cuisine · food option names", price. Expanded panel: image
      (`?w=600`), description, address, distance via `distanceInMeters(office, restaurant)` + `formatDistance` ("450 m from the office"), takeaway line, "Open in Google Maps ↗" link
      (`target="_blank" rel="noopener"`). `id="restaurant-{id}"` for scrolling.
- [ ] `src/routes/+page.svelte`: header (h1 "Lunch Finder", subtitle, inline fork-and-knife SVG
      with `aria-hidden`), the three controls, divider, `"{n} place(s) found"` with
      `aria-live="polite"`, "🎲 Surprise Me!" (disabled when empty), the list, the empty state.
      State: `foodOption = $state(null)`, `maxPrice = $state(20)`, `openId = $state(null)`;
      `range = $derived(priceRange(data.restaurants))` passed to `PriceSlider` as `min`/`max`;
      `filtered = $derived(filterRestaurants(data.restaurants, { foodOption, maxPrice }))` — read
      `data.restaurants` inside `$derived`, never a destructured copy, so `?office=` navigation
      updates the list; a row is open only while it is in `filtered`.
      Surprise: `openId = pickRandom(filtered, openId)?.id ?? null`, then after `tick()` scroll the row
      into view.
- [ ] `tests/e2e/smoke.spec.ts`: "home page renders the Lunch Finder @smoke" — status 200; `h1`
      "Lunch Finder"; office nav, food option group, price slider and the "places found" text
      (`/\d+ places? found/`) are visible.
- [ ] `tests/unit/page-load.test.ts` (Unit): with the fetch modules mocked, `load` picks the first
      office by default, the `?office=` one when given, and throws 404 for no offices and for an
      unknown office id.
- [ ] `tests/e2e/lunch-finder.spec.ts` (untagged, content-independent; office switching is skipped
      with fewer than 2 offices, Surprise Me with no results): setting the slider to its
      minimum shows only prices ≤ 5 €; clicking a food option sets `aria-pressed` and the count
      never grows; clicking a row toggles `aria-expanded` and shows a Google Maps link;
      "Surprise Me!" opens exactly one row when there are results; switching office changes the
      URL and the active office.
- [ ] Docs: `README.md` (what the page shows, `pnpm cms:migrate` creates the Lunch Finder content
      types and demo data, and names this plan's path for the platform steps — plain text, not a
      link, so no anchor can break; commit `docs/agents/` with it); `AGENTS.md` project line and
      layout (`src/lib/components/`); `docs/instructions/framework.md` (components live in
      `src/lib/components/`; page-only UI state, the office in the URL); README Quick start step 5 and Troubleshooting mention the Lunch Finder
      content instead of the example; `lunch_finder_poc_summary.txt` (add the `emoji` field and the decisions
      above).

**Automated Verification**:

- [ ] `home page renders the Lunch Finder @smoke` (E2E) passes with `.env` set.
- [ ] `tests/e2e/lunch-finder.spec.ts` (E2E) passes via `pnpm test:e2e`.
- [ ] `pnpm check` passes; no file references the example anymore (`grep -rn "fetchExample\|exampleContentType" src cms tests` is empty).

**Manual Verification**:

- [ ] The page matches the screenshot.
  1. `pnpm dev`, open the URL: Valencia is active, "All" selected, 20 €, "5 places found" with
     Green Bowl, La Tasca, Mercadona, Noodle Bar, Sushi Corner (sorted by name).
  2. Resize to 375 px: no horizontal scroll, pills wrap.
- [ ] Filters and office switch work.
  1. Click "Vegan": only Green Bowl. Click "All", move the slider to 30 €: 7 places.
  2. Click "Munich": URL has `?office=office-munich`, Munich restaurants show; filters keep their values.
- [ ] Details, Surprise Me and Maps work.
  1. Click La Tasca: description, address, distance, takeaway and the Maps link appear.
  2. Click "Surprise Me!" several times: a different filtered row opens each time and scrolls into view.
  3. "Open in Google Maps" opens a new tab at the restaurant's location.
- [ ] Content updates without a deploy: run the demo script from the Platform Checklist.

---

## References

- `lunch_finder_poc_summary.txt` — product summary and data model
- Screenshot provided in the planning conversation (2026-10-29)
- Pattern to copy: `src/lib/cms/restaurant.ts`, `tests/unit/cms-restaurant.test.ts` (commit `6247deb`)
- Migration runner today: `cms/migrate.ts`
- `node_modules/contentful-migration/index.d.ts` — `IFieldOptions`, validations
- `node_modules/contentful-management/dist/types/plain/plain-client-types.d.ts` — `entry.createWithId`
