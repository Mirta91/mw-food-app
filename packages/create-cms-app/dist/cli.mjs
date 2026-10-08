#!/usr/bin/env node
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

// src/main.ts
if (!process.stdin.isTTY || !process.stdout.isTTY) {
  console.error("create-cms-app needs an interactive terminal.");
  process.exitCode = 1;
} else {
  console.log("create-cms-app");
}
