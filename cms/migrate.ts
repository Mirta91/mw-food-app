// Applies the pending migrations and creates the missing demo content. Safe to re-run.
// Run: pnpm cms:migrate
import { createClient } from "contentful-management";
import { type MigrationFunction, runMigration } from "contentful-migration";
import migration002 from "./migrations/002-create-food-option.ts";
import migration003 from "./migrations/003-create-office.ts";
import migration004 from "./migrations/004-create-restaurant.ts";
import migration005 from "./migrations/005-align-restaurant-and-food-option.ts";
import { seedDemoContent } from "./seed.ts";

// One migration and how to tell that a space already has its result.
type Step = {
  name: string;
  migration: MigrationFunction;
  isApplied: () => Promise<boolean>;
};

const required = ["CONTENTFUL_SPACE_ID", "CONTENTFUL_MANAGEMENT_TOKEN"];
const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length > 0) {
  console.error(`Missing in .env: ${missing.join(", ")}`);
  process.exit(1);
}
const spaceId = process.env.CONTENTFUL_SPACE_ID ?? "";
const environmentId = process.env.CONTENTFUL_ENVIRONMENT || "master";
const accessToken = process.env.CONTENTFUL_MANAGEMENT_TOKEN ?? "";

const client = createClient(
  { accessToken },
  { type: "plain", defaults: { spaceId, environmentId } },
);

const steps: Step[] = [
  {
    name: "002-create-food-option",
    migration: migration002,
    isApplied: () => contentTypeExists("foodOption"),
  },
  {
    name: "003-create-office",
    migration: migration003,
    isApplied: () => contentTypeExists("office"),
  },
  {
    name: "004-create-restaurant",
    migration: migration004,
    isApplied: () => contentTypeExists("restaurant"),
  },
  {
    name: "005-align-restaurant-and-food-option",
    migration: migration005,
    isApplied: () => hasField("restaurant", "emoji"),
  },
];

for (const step of steps) {
  if (await step.isApplied()) {
    console.log(`${step.name}: already applied, skipping.`);
    continue;
  }
  await runMigration({
    migrationFunction: step.migration,
    spaceId,
    environmentId,
    accessToken,
    yes: true,
  });
  console.log(`${step.name}: applied.`);
}

const created = await seedDemoContent(client, await defaultLocale());
console.log(`Created and published ${created} demo entries.`);

async function contentTypeExists(contentTypeId: string): Promise<boolean> {
  return client.contentType
    .get({ contentTypeId })
    .then(() => true)
    .catch(() => false);
}

async function hasField(contentTypeId: string, fieldId: string): Promise<boolean> {
  return client.contentType
    .get({ contentTypeId })
    .then((type) => type.fields.some((field) => field.id === fieldId))
    .catch(() => false);
}

async function defaultLocale(): Promise<string> {
  const locales = await client.locale.getMany({});
  return locales.items.find((item) => item.default)?.code ?? "en-US";
}
