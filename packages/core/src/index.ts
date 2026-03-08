export {
  buildEmbedDescriptor,
  createGitHubEmbedResolver,
  createSourceLoader,
  parseGitHubSourceRequest,
  resolveGitHubEmbed,
} from "./core";
export { defaultStyles, ROOT_CLASS_NAME } from "./styles";
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
} from "./types";
export {
  composeClassName,
  detectReferenceKind,
  escapeAttribute,
  escapeHtml,
  formatDisplayedRange,
  isGitHubSourceUrl,
} from "./utils";
