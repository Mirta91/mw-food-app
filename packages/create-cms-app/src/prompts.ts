import * as clack from "@clack/prompts";
import {
  type Choices,
  CMS_OPTIONS,
  cmsLabel,
  FRAMEWORK_OPTIONS,
  frameworkLabel,
  validateProjectName,
} from "./choices.ts";

export interface Prompter {
  text(options: {
    message: string;
    placeholder?: string;
    validate: (value: string | undefined) => string | undefined;
  }): Promise<string | symbol>;
  select<T extends string>(options: {
    message: string;
    options: ReadonlyArray<{ value: T; label: string }>;
  }): Promise<T | symbol>;
  confirm(options: { message: string }): Promise<boolean | symbol>;
  note(message: string, title: string): void;
}

export const clackPrompter: Prompter = {
  text: (options) => clack.text(options),
  // clack's conditional Option<T> type does not resolve for a generic T, so spell out the plain shape.
  select: <T extends string>(options: {
    message: string;
    options: ReadonlyArray<{ value: T; label: string }>;
  }) =>
    clack.select<string>({ message: options.message, options: [...options.options] }) as Promise<
      T | symbol
    >,
  confirm: (options) => clack.confirm(options),
  note: (message, title) => clack.note(message, title),
};

// Returns undefined when the user cancels a prompt or declines the summary.
export async function askChoices(prompter: Prompter): Promise<Choices | undefined> {
  const name = await prompter.text({
    message: "Project name",
    placeholder: "my-cms-app",
    validate: validateProjectName,
  });
  if (typeof name === "symbol") return undefined;
  const cms = await prompter.select({ message: "CMS", options: CMS_OPTIONS });
  if (typeof cms === "symbol") return undefined;
  const framework = await prompter.select({ message: "Web framework", options: FRAMEWORK_OPTIONS });
  if (typeof framework === "symbol") return undefined;
  prompter.note(
    [
      `Project:   ${name}`,
      `CMS:       ${cmsLabel(cms)}`,
      `Framework: ${frameworkLabel(framework)}`,
      `Directory: ./${name}`,
    ].join("\n"),
    "Summary",
  );
  const confirmed = await prompter.confirm({ message: "Create the project?" });
  if (confirmed !== true) return undefined;
  return { name, cms, framework };
}
