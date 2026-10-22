// Checks the required CMS variables before `pnpm start` runs the server: the Node adapter's entry
// point has no startup hook.
import { requiredEnv } from "../src/lib/cms/client.ts";
import { exitOnMissingEnv } from "../src/lib/cms/env.ts";

exitOnMissingEnv(requiredEnv, process.env);
