import {
  ROOT_CLASS_NAME,
  composeClassName,
  escapeAttribute,
  escapeHtml,
  formatDisplayedRange,
} from "@markdown-embed-github/core";

import type {
  GitHubEmbedDescriptor,
  GitHubEmbedFallback,
  GitHubEmbedFallbackContext,
  GitHubEmbedRenderer,
  GitHubSourceRequest,
} from "./types";

export function createDefaultRenderer(className?: string): GitHubEmbedRenderer {
  return (descriptor) => renderGitHubEmbed(descriptor, className);
}

export function renderGitHubEmbed(descriptor: GitHubEmbedDescriptor, className?: string): string {
  const metaItems = [
    descriptor.repository,
    descriptor.fileName,
    formatDisplayedRange(descriptor.lineStart, descriptor.lineEnd),
    descriptor.referenceLabel,
  ].filter((value): value is string => Boolean(value));
  const title = descriptor.label ?? descriptor.fileName;
  const languageClassName = descriptor.language ? `language-${descriptor.language}` : "";
  const lines = descriptor.lines
    .map((line) => {
      return `<span class="${ROOT_CLASS_NAME}__line" data-line="${line.number}"><span class="${ROOT_CLASS_NAME}__line-number" aria-hidden="true">${line.number}</span><span class="${ROOT_CLASS_NAME}__line-content">${escapeHtml(line.content)}</span></span>`;
    })
    .join("");

  return `<div class="${composeClassName(ROOT_CLASS_NAME, className)}" data-reference-kind="${escapeAttribute(descriptor.referenceKind)}"><div class="${ROOT_CLASS_NAME}__header"><div class="${ROOT_CLASS_NAME}__eyebrow">GitHub source</div><a class="${ROOT_CLASS_NAME}__link" href="${escapeAttribute(descriptor.originalUrl)}">${escapeHtml(title)}</a><div class="${ROOT_CLASS_NAME}__meta">${metaItems.map((item) => `<span class="${ROOT_CLASS_NAME}__meta-item">${escapeHtml(item)}</span>`).join("")}</div></div><pre class="${ROOT_CLASS_NAME}__pre"><code class="${composeClassName(`${ROOT_CLASS_NAME}__code`, languageClassName)}">${lines}</code></pre></div>`;
}

export function renderFallback(
  fallback: GitHubEmbedFallback,
  context: GitHubEmbedFallbackContext,
  className?: string,
): string {
  if (typeof fallback === "function") {
    return fallback(context);
  }

  if (fallback === "error") {
    return renderFallbackError(context, className);
  }

  return renderFallbackLink(context.request);
}

export function renderFallbackLink(request: GitHubSourceRequest): string {
  const text = request.label ?? request.originalUrl;
  return `<p><a href="${escapeAttribute(request.originalUrl)}">${escapeHtml(text)}</a></p>`;
}

function renderFallbackError(context: GitHubEmbedFallbackContext, className?: string): string {
  const message =
    context.error instanceof Error ? context.error.message : "Failed to load the GitHub source.";

  return `<div class="${composeClassName(ROOT_CLASS_NAME, ROOT_CLASS_NAME.concat("--error"), className)}"><div class="${ROOT_CLASS_NAME}__header"><div class="${ROOT_CLASS_NAME}__eyebrow">GitHub source</div><a class="${ROOT_CLASS_NAME}__link" href="${escapeAttribute(context.request.originalUrl)}">${escapeHtml(context.request.label ?? context.request.fileName)}</a></div><p class="${ROOT_CLASS_NAME}__error">${escapeHtml(message)}</p></div>`;
}
