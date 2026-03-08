# Examples

Run:

```sh
pnpm run examples
```

The examples are implemented as a Vite `8.0.0-beta.16` workspace app. You can invoke them directly from the repository root:

```sh
pnpm --filter markdown-embed-github-examples run build
pnpm --filter markdown-embed-github-examples run dev
```

Generated files:

- `examples/output/index.html`
- `examples/output/default.html`
- `examples/output/custom.html`

`examples/output` is generated output and is not committed.
