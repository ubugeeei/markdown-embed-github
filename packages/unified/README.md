# @markdown-embed-github/unified

A `unified` adapter for [`@markdown-embed-github/core`](../core/README.md). Use it after `remark-rehype`, so it can replace standalone GitHub source-link paragraphs in the HAST tree.

## Install

```sh
pnpm add @markdown-embed-github/unified
```

You also need the usual `unified` pipeline packages such as `remark-parse`, `remark-rehype`, and `rehype-stringify`.

## Usage

```ts
import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";

import unifiedEmbedGitHub, { defaultStyles } from "@markdown-embed-github/unified";

const html = String(
  unified().use(remarkParse).use(remarkRehype).use(unifiedEmbedGitHub).use(rehypeStringify)
    .processSync(`
https://github.com/vitejs/vite/blob/main/packages/vite/src/node/index.ts#L1-L12
`),
);

console.log(defaultStyles);
console.log(html);
```

## Behavior

- Replaces standalone GitHub source-link paragraphs
- Leaves inline links untouched
- Uses the shared resolver and cache from `@markdown-embed-github/core`
- Returns lightweight HAST nodes by default

## Options

```ts
interface GitHubEmbedUnifiedOptions extends GitHubEmbedCoreOptions {
  render?: (
    descriptor: GitHubEmbedDescriptor,
  ) => GitHubEmbedUnifiedContent | readonly GitHubEmbedUnifiedContent[];
  fallback?:
    | "link"
    | "error"
    | ((
        context: GitHubEmbedFallbackContext,
      ) => GitHubEmbedUnifiedContent | readonly GitHubEmbedUnifiedContent[]);
  className?: string;
}
```

## Custom Renderer

```ts
processor.use(unifiedEmbedGitHub, {
  render: (descriptor) => ({
    type: "element",
    tagName: "figure",
    properties: { className: ["custom-embed"] },
    children: [
      {
        type: "element",
        tagName: "figcaption",
        properties: {},
        children: [{ type: "text", value: `${descriptor.fileName}:${descriptor.lineStart}` }],
      },
    ],
  }),
});
```
