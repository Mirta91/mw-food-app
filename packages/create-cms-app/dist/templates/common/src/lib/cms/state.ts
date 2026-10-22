export type Example = {
  title: string;
  body: string;
};

export type CmsState =
  | { kind: "example"; example: Example }
  | { kind: "empty" }
  | { kind: "missing-env"; missing: string[] }
  | { kind: "error"; message: string };

export function missingEnv(
  required: readonly string[],
  env: Record<string, string | undefined>,
): string[] {
  return required.filter((name) => !env[name]?.trim());
}

// Never throws: routes render every outcome, including a misconfigured or unreachable CMS.
export async function loadCmsState(
  missing: string[],
  load: () => Promise<Example | null>,
): Promise<CmsState> {
  if (missing.length > 0) {
    return { kind: "missing-env", missing };
  }
  try {
    const example = await load();
    return example ? { kind: "example", example } : { kind: "empty" };
  } catch (error) {
    return { kind: "error", message: errorMessage(error) };
  }
}

export function describeCmsState(state: CmsState): { title: string; detail: string } {
  switch (state.kind) {
    case "example":
      return { title: state.example.title, detail: state.example.body };
    case "empty":
      return {
        title: "No example content yet",
        detail: "Run pnpm cms:migrate to create the example content.",
      };
    case "missing-env":
      return {
        title: "CMS not configured",
        detail: `Missing: ${state.missing.join(", ")}. Copy .env.example to .env and fill it in.`,
      };
    case "error":
      return { title: "Could not load content from the CMS", detail: state.message };
  }
}

// Some SDKs (storyblok-js-client) reject with plain objects that carry a message.
function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "object" && error !== null && "message" in error) {
    return String(error.message);
  }
  return String(error);
}
