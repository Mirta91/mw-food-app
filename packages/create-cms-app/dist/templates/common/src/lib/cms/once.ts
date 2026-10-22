// Defers creating a value to its first use and reuses it afterwards. CMS clients live at module
// scope through it: `next build` and SvelteKit's build import route modules, and the CMS SDKs
// throw when created without credentials, which a build must not need.
export function once<T>(create: () => T): () => T {
  let created = false;
  let value: T;
  return () => {
    if (!created) {
      value = create();
      created = true;
    }
    return value;
  };
}
