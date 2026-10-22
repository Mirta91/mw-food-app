import { createClient } from "next-sanity";
import { notFound } from "next/navigation";
import { apiVersion, fetchExample } from "@/lib/cms/client";

export const dynamic = "force-dynamic";

export default async function Home() {
  const example = await fetchExample(
    createClient({
      projectId: process.env.SANITY_PROJECT_ID,
      dataset: process.env.SANITY_DATASET,
      apiVersion,
      useCdn: true,
    }),
  );
  if (!example) {
    notFound();
  }
  return (
    <main>
      <h1>{example.title}</h1>
      <p>{example.body}</p>
    </main>
  );
}
