# @markdown-embed-github/*

A pnpm workspace monorepo for the shared core package, separate `markdown-it` and `unified` adapters, and a Vite-based examples app.

## Packages

- `packages/core`: published as `@markdown-embed-github/core`
- `packages/markdown-it`: published as `@markdown-embed-github/markdown-it`
- `packages/unified`: published as `@markdown-embed-github/unified`
- `examples`: the Vite `8.0.0-beta.16` examples app

## Common Commands

```sh
pnpm run build
pnpm run check
pnpm run build:core
pnpm run build:markdown-it
pnpm run build:unified
pnpm run examples
pnpm run examples:dev
```

## Package Docs

- Core docs: `packages/core/README.md`
- markdown-it docs: `packages/markdown-it/README.md`
- unified docs: `packages/unified/README.md`
- Examples docs: `examples/README.md`
