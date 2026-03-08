import type MarkdownIt from "markdown-it";

import {
  ROOT_CLASS_NAME,
  composeClassName,
  createGitHubEmbedResolver,
  createSourceLoader,
  defaultStyles,
  detectReferenceKind,
  escapeAttribute,
  escapeHtml,
  formatDisplayedRange,
  isGitHubSourceUrl,
  parseGitHubSourceRequest,
} from "@markdown-embed-github/core";
import { createRule } from "./createRule";
import { createDefaultRenderer, renderGitHubEmbed } from "./render";
import type { GitHubEmbedOptions } from "./types";

export type {
  GitHubEmbedCacheOptions,
  GitHubEmbedCoreOptions,
  GitHubEmbedDescriptor,
  GitHubEmbedFallback,
  GitHubEmbedFallbackContext,
  GitHubEmbedLine,
  GitHubEmbedOptions,
  GitHubEmbedResolver,
  GitHubEmbedResult,
  GitHubLineRange,
  GitHubLoadedSource,
  GitHubReferenceKind,
  GitHubSourceLoader,
  GitHubSourceRequest,
} from "./types";

export {
  composeClassName,
  createDefaultRenderer,
  createGitHubEmbedResolver,
  createSourceLoader,
  defaultStyles,
  detectReferenceKind,
  escapeAttribute,
  escapeHtml,
  formatDisplayedRange,
  isGitHubSourceUrl,
  parseGitHubSourceRequest,
  renderGitHubEmbed,
  ROOT_CLASS_NAME,
};

/**
 * @examples
 *
 * basic usage:
 * ```ts
 * import markdownIt from "markdown-it";
 * import markdownEmbedGitHub from "@markdown-embed-github/markdown-it";
 *
 * const md = markdownIt();
 * md.use(markdownEmbedGitHub);
 * ```
 *
 * with options:
 * ```ts
 * import markdownIt from "markdown-it";
 * import markdownEmbedGitHub from "@markdown-embed-github/markdown-it";
 *
 * const md = markdownIt();
 * md.use(markdownEmbedGitHub, {
 *   className: "docs-github-embed",
 * });
 * ```
 */
function markdownEmbedGitHub(md: MarkdownIt, options: GitHubEmbedOptions = {}): void {
  createRule(
    {
      className: options.className,
      fallback: options.fallback ?? "link",
      resolve: createGitHubEmbedResolver(options),
      render: options.render ?? createDefaultRenderer(options.className),
    },
    md,
  );
}

export default markdownEmbedGitHub;
export { markdownEmbedGitHub };
