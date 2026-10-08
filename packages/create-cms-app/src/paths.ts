import { fileURLToPath } from "node:url";

// Templates in the source tree. The bundle uses dist/templates next to cli.mjs instead.
export const sourceTemplatesDir = fileURLToPath(new URL("../templates/", import.meta.url));
