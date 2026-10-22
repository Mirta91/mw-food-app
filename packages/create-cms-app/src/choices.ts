export type Cms = (typeof CMS_OPTIONS)[number]["value"];
export type Framework = (typeof FRAMEWORK_OPTIONS)[number]["value"];

export type Combo = {
  cms: Cms;
  framework: Framework;
};

export type Choices = Combo & {
  name: string;
};

export const CMS_OPTIONS = [
  { value: "sanity", label: "Sanity" },
  { value: "contentful", label: "Contentful" },
  { value: "storyblok", label: "Storyblok" },
] as const;

export const FRAMEWORK_OPTIONS = [
  { value: "next", label: "Next.js" },
  { value: "nuxt", label: "Nuxt" },
  { value: "astro", label: "Astro" },
  { value: "sveltekit", label: "SvelteKit" },
] as const;

export function comboId(combo: Combo): string {
  return `${combo.cms}-${combo.framework}`;
}

export function allCombos(): Combo[] {
  return CMS_OPTIONS.flatMap((cms) =>
    FRAMEWORK_OPTIONS.map((framework) => ({ cms: cms.value, framework: framework.value })),
  );
}

export function cmsLabel(cms: Cms): string {
  return CMS_OPTIONS.find((option) => option.value === cms)?.label ?? cms;
}

export function frameworkLabel(framework: Framework): string {
  return FRAMEWORK_OPTIONS.find((option) => option.value === framework)?.label ?? framework;
}

export function validateProjectName(name: string | undefined): string | undefined {
  if (!name) {
    return "Enter a project name.";
  }
  if (name.length > 214) {
    return "Use at most 214 characters.";
  }
  if (!PROJECT_NAME.test(name)) {
    return "Use lowercase letters, digits and '-', starting with a letter or digit.";
  }
  return undefined;
}

// The name is both the target directory and the package.json name, so it must be a valid npm
// package name that cannot escape the current directory.
const PROJECT_NAME = /^[a-z0-9][a-z0-9-]*$/;
