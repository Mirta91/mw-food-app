// Called from each framework's startup hook. Frameworks log an error thrown there and keep serving,
// so a missing variable ends the process explicitly.
export function exitOnMissingEnv(
  required: readonly string[],
  env: Record<string, string | undefined>,
): void {
  try {
    assertEnv(required, env);
  } catch (error) {
    console.error((error as Error).message);
    process.exit(1);
  }
}

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
