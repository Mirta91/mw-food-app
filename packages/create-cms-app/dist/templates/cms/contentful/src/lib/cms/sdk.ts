import { createContentfulClient } from "./client";
import { once } from "./once";

// Created on first use from the runtime environment; see once.ts.
export const getClient = once(() => createContentfulClient(process.env));
