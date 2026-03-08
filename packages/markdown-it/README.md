# @markdown-embed-github/markdown-it

A `markdown-it` adapter for [`@markdown-embed-github/core`](../core/README.md). It embeds GitHub `blob` links and permalinks only when the entire paragraph is a standalone source link.

## Install

```sh
pnpm add @markdown-embed-github/markdown-it markdown-it
```

## Usage

```ts
import MarkdownIt from "markdown-it";
import markdownEmbedGitHub, { defaultStyles } from "@markdown-embed-github/markdown-it";

const md = new MarkdownIt({
  linkify: true,
});

md.use(markdownEmbedGitHub);

const html = `<style>${defaultStyles}</style>${md.render(`
https://github.com/vitejs/vite/blob/main/packages/vite/src/node/index.ts#L1-L12

[Entry point](https://github.com/vitejs/vite/blob/main/packages/vite/src/node/index.ts#L1-L12)
`)}`;
```

## Behavior

- Standalone bare URLs are embedded
- Standalone Markdown links are embedded
- Inline links inside normal text stay as links
- The default renderer is intentionally lightweight and does not perform syntax highlighting

## Options

```ts
interface GitHubEmbedOptions extends GitHubEmbedCoreOptions {
  render?: (descriptor: GitHubEmbedDescriptor) => string;
  fallback?: "link" | "error" | ((context: GitHubEmbedFallbackContext) => string);
  className?: string;
}
```

## Custom Renderer

```ts
import MarkdownIt from "markdown-it";
import markdownEmbedGitHub from "@markdown-embed-github/markdown-it";

const md = new MarkdownIt();

md.use(markdownEmbedGitHub, {
  className: "docs-gh-embed",
  render: (descriptor) => {
    const escapeHtml = (value: string) =>
      value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    return `
      <figure class="docs-gh-embed">
        <figcaption>${descriptor.repository} / ${descriptor.fileName}</figcaption>
        <pre><code>${escapeHtml(descriptor.code)}</code></pre>
      </figure>
    `;
  },
});
```

`descriptor.code` is raw source text. Escape it before injecting it into custom HTML.
