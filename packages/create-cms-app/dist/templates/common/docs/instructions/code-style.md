# Code style

## Types

- Declare TypeScript object types with `type`, not `interface`. oxlint enforces this through
  `typescript/consistent-type-definitions`.

## Control flow

- Always wrap the bodies of `if`, `else`, `for`, `while` and `do` in braces, even for a single
  statement. oxlint enforces this through `curly`.

## File structure

Readers go through a file from top to bottom, so the most important parts come first. They should
see what a module exports without scrolling past its internals. Order the top level of every
TypeScript and JavaScript file, including the script block of components, like this:

1. Imports
2. Exported types
3. Internal types
4. Exported constants, classes and functions
5. Internal constants, classes and functions

Within a group, put the more important declaration first: a module's main function before the
helpers it builds on.

Code that runs while the module loads keeps the order it needs:

- A declaration that load-time code uses must come before it. Prefer a function declaration,
  which is hoisted, over moving an internal helper up.
- In scripts, the top-level code that does the work comes right after the types. Helper functions
  follow below it.
- In test files, setup and `describe` blocks come right after the types. Helper functions follow
  below them.
- Statements a config file must run before its export, such as loading `.env`, stay above it,
  and a closing `export default` of a value declared above is fine.

## Imports

- Scripts in `scripts/` run in Node without a bundler. In them, and in every module they import
  (such as `src/lib/cms/client.ts`), write relative imports with the `.ts` extension.
