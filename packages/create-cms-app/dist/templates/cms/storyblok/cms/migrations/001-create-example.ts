import { exampleComponent } from "../components/example.ts";

type Mapi = (path: string, init?: RequestInit) => Promise<unknown>;

// Creates the example component and one published example story, unless they exist.
export async function up(mapi: Mapi): Promise<void> {
  const { components } = (await mapi("/components")) as { components: Array<{ name: string }> };
  if (!components.some((component) => component.name === exampleComponent.name)) {
    await mapi("/components", {
      method: "POST",
      body: JSON.stringify({ component: exampleComponent }),
    });
  }
  const { stories } = (await mapi("/stories?content_type=example&per_page=1")) as {
    stories: unknown[];
  };
  if (stories.length === 0) {
    await mapi("/stories", {
      method: "POST",
      body: JSON.stringify({
        story: {
          name: "Example",
          slug: "example",
          content: {
            component: "example",
            title: "Hello from Storyblok",
            body: "This story was created by cms/migrations/001-create-example.ts.",
          },
        },
        publish: 1,
      }),
    });
  }
}
