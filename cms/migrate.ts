// Creates the example content type and one published example entry. Safe to re-run.
// Run: pnpm cms:migrate
import { createClient } from "contentful-management";
import { runMigration } from "contentful-migration";
import { exampleContentType } from "./content-types/example.ts";
import migration from "./migrations/001-create-example.ts";

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

const exists = await client.contentType
  .get({ contentTypeId: exampleContentType.id })
  .then(() => true)
  .catch(() => false);
if (exists) {
  console.log(`Content type ${exampleContentType.id} exists, skipping migration.`);
} else {
  await runMigration({
    migrationFunction: migration,
    spaceId,
    environmentId,
    accessToken,
    yes: true,
  });
}

const entries = await client.entry.getMany({
  query: { content_type: exampleContentType.id, limit: 1 },
});
if (entries.items.length === 0) {
  const locales = await client.locale.getMany({});
  const locale = locales.items.find((item) => item.default)?.code ?? "en-US";
  const entry = await client.entry.create(
    { contentTypeId: exampleContentType.id },
    {
      fields: {
        title: { [locale]: "Hello from Contentful" },
        body: { [locale]: "This entry was created by cms/migrate.ts." },
      },
    },
  );
  await client.entry.publish({ entryId: entry.sys.id }, entry);
  console.log("Created and published the example entry.");
}
