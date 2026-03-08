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

export type GitHubEmbedRenderer = (descriptor: GitHubEmbedDescriptor) => string;

export type GitHubEmbedFallback =
  | "error"
  | "link"
  | ((context: GitHubEmbedFallbackContext) => string);

export interface GitHubEmbedOptions extends GitHubEmbedCoreOptions {
  render?: GitHubEmbedRenderer;
  fallback?: GitHubEmbedFallback;
  className?: string;
}

export interface ResolvedGitHubEmbedHtmlOptions {
  className?: string;
  fallback: GitHubEmbedFallback;
  render: GitHubEmbedRenderer;
  resolve: GitHubEmbedResolver;
}
