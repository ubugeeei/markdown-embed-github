import type {
  GitHubEmbedCacheOptions,
  GitHubEmbedCoreOptions,
  GitHubEmbedDescriptor,
  GitHubEmbedFallbackContext,
  GitHubEmbedFailureResult,
  GitHubEmbedLine,
  GitHubEmbedResolver,
  GitHubEmbedResult,
  GitHubEmbedSuccessResult,
  GitHubLineRange,
  GitHubLoadedSource,
  GitHubReferenceKind,
  GitHubSourceLoader,
  GitHubSourceRequest,
} from "@markdown-embed-github/core";

export type {
  GitHubEmbedCacheOptions,
  GitHubEmbedCoreOptions,
  GitHubEmbedDescriptor,
  GitHubEmbedFallbackContext,
  GitHubEmbedFailureResult,
  GitHubEmbedLine,
  GitHubEmbedResolver,
  GitHubEmbedResult,
  GitHubEmbedSuccessResult,
  GitHubLineRange,
  GitHubLoadedSource,
  GitHubReferenceKind,
  GitHubSourceLoader,
  GitHubSourceRequest,
};

export interface GitHubEmbedUnifiedTextNode {
  type: "text";
  value: string;
}

export interface GitHubEmbedUnifiedElement {
  type: "element";
  tagName: string;
  properties?: Record<string, unknown>;
  children: GitHubEmbedUnifiedContent[];
}

export interface GitHubEmbedUnifiedRoot {
  type: "root";
  children: GitHubEmbedUnifiedContent[];
}

export type GitHubEmbedUnifiedContent = GitHubEmbedUnifiedElement | GitHubEmbedUnifiedTextNode;

export type GitHubEmbedUnifiedRenderResult =
  | GitHubEmbedUnifiedContent
  | readonly GitHubEmbedUnifiedContent[];

export type GitHubEmbedUnifiedRenderer = (
  descriptor: GitHubEmbedDescriptor,
) => GitHubEmbedUnifiedRenderResult;

export type GitHubEmbedUnifiedFallback =
  | "error"
  | "link"
  | ((context: GitHubEmbedFallbackContext) => GitHubEmbedUnifiedRenderResult);

export interface GitHubEmbedUnifiedOptions extends GitHubEmbedCoreOptions {
  render?: GitHubEmbedUnifiedRenderer;
  fallback?: GitHubEmbedUnifiedFallback;
  className?: string;
}
