# @markdown-embed-github/core

A shared core package for turning GitHub source URLs into normalized embed descriptors. It provides URL parsing, fetch and cache behavior, line extraction, language inference, and the default stylesheet used by the adapter packages.

This package lives in a pnpm workspace monorepo under `packages/core`.

The adapter packages live alongside it:

- `@markdown-embed-github/markdown-it`
- `@markdown-embed-github/unified`

## Features

- Parses GitHub `blob` URLs and permalinks
- Resolves source text through `?raw=1`
- Caches by source URL with in-memory and optional disk cache layers
- Uses separate TTL behavior for branches, tags, and commit permalinks
- Builds line-aware descriptors that adapters can render however they want
- Ships `defaultStyles` and `styles.css`

## Install

```sh
pnpm add @markdown-embed-github/core
```

## Usage

```ts
import { createGitHubEmbedResolver, parseGitHubSourceRequest } from "@markdown-embed-github/core";

const resolve = createGitHubEmbedResolver();
const request = parseGitHubSourceRequest(
  "https://github.com/vitejs/vite/blob/main/packages/vite/src/node/index.ts#L1-L12",
);

if (request) {
  const result = resolve(request);
  if (result.ok) {
    console.log(result.descriptor.code);
  }
}
```

Use the published stylesheet asset directly:

```ts
import "@markdown-embed-github/core/styles.css";
```

Or inject the string form:

```ts
import { defaultStyles } from "@markdown-embed-github/core";
```

## Exports

- `createGitHubEmbedResolver`
- `createSourceLoader`
- `parseGitHubSourceRequest`
- `resolveGitHubEmbed`
- `buildEmbedDescriptor`
- `defaultStyles`
- `ROOT_CLASS_NAME`
- shared core types
- shared utility helpers such as `escapeHtml` and `formatDisplayedRange`

## Options

```ts
interface GitHubEmbedCoreOptions {
  cache?:
    | boolean
    | {
        dir?: string | false;
        branchTtlMs?: number;
        tagTtlMs?: number;
        commitTtlMs?: number;
      };
  timeoutMs?: number;
  resolveLanguage?: (request: GitHubSourceRequest) => string | null | undefined;
  loadSource?: (request: GitHubSourceRequest) => GitHubLoadedSource;
}
```

## Cache Defaults

- branch references: 5 minutes
- tag references: 24 hours
- commit permalinks: infinite by default

## Notes

- Intended for Node.js environments
- Private repositories need a custom `loadSource` implementation if authentication is required
- For actual Markdown processor integration, use one of the adapter packages listed above
