import { notFound } from "next/navigation";
import { fetchExample, getClient } from "@/lib/cms/client";

export const dynamic = "force-dynamic";

export default async function Home() {
  const example = await fetchExample(getClient());
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
