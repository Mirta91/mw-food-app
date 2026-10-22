import { notFound } from "next/navigation";
import { createExampleLoader } from "@/lib/cms/client";

export const dynamic = "force-dynamic";

export default async function Home() {
  const example = await createExampleLoader(process.env)();
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
