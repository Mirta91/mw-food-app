// Called when the server starts, so a misconfigured deployment fails before it serves requests.
export function assertEnv(
  required: readonly string[],
  env: Record<string, string | undefined>,
): void {
  const missing = missingEnv(required, env);
  if (missing.length > 0) {
    throw new Error(
      `Missing environment variables: ${missing.join(", ")}. Copy .env.example to .env and fill them in.`,
    );
  }
}

export function missingEnv(
  required: readonly string[],
  env: Record<string, string | undefined>,
): string[] {
  return required.filter((name) => !env[name]?.trim());
}
