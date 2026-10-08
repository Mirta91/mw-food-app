# Testing

Tests run with Vitest, one suite per package, orchestrated and cached by turbo.

## Adding tests to a package

1. Add Vitest to the package, not the root, using the shared version from the workspace catalog:
   `"devDependencies": { "vitest": "catalog:" }`. Change the version only in the `catalog` of
   `pnpm-workspace.yaml`.
2. Add the scripts:

   ```json
   {
     "scripts": {
       "test": "vitest run",
       "test:watch": "vitest --watch"
     }
   }
   ```

3. Place test files next to the code they test, named `<name>.test.<ext>`.

## Decisions

- No root Vitest projects configuration. Per-package suites let turbo cache and skip unchanged
  packages. The trade-off is that coverage is not merged across packages.
- `test` is cached; `test:watch` is persistent and never cached.
