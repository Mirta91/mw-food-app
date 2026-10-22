import { notFound } from "next/navigation";
import { fetchExample } from "@/lib/cms/client";
import { getStoryblokApi } from "@/lib/cms/storyblok";

export const dynamic = "force-dynamic";

export default async function Home() {
  const example = await fetchExample(getStoryblokApi(process.env));
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
