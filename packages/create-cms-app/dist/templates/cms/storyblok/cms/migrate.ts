// Runs the migrations in cms/migrations against the Storyblok Management API. Safe to re-run.
// Run: pnpm cms:migrate
import { up as createExample } from "./migrations/001-create-example.ts";

const hosts = {
  eu: "https://mapi.storyblok.com",
  us: "https://api-us.storyblok.com",
  ap: "https://api-ap.storyblok.com",
  ca: "https://api-ca.storyblok.com",
  cn: "https://app.storyblokchina.cn",
} as const;

const required = ["STORYBLOK_SPACE_ID", "STORYBLOK_PERSONAL_ACCESS_TOKEN"];
const missing = required.filter((name) => !process.env[name]?.trim());
if (missing.length > 0) {
  console.error(`Missing in .env: ${missing.join(", ")}`);
  process.exit(1);
}
const region = (process.env.STORYBLOK_REGION?.trim() || "eu") as keyof typeof hosts;
const base = `${hosts[region] ?? hosts.eu}/v1/spaces/${process.env.STORYBLOK_SPACE_ID}`;

await createExample(mapi);
console.log("Storyblok migrations applied.");

async function mapi(path: string, init: RequestInit = {}): Promise<unknown> {
  const response = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      Authorization: process.env.STORYBLOK_PERSONAL_ACCESS_TOKEN ?? "",
      "Content-Type": "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`${init.method ?? "GET"} ${path}: ${response.status} ${await response.text()}`);
  }
  return response.json();
}
