import {
  ROOT_CLASS_NAME,
  composeClassName,
  formatDisplayedRange,
} from "@markdown-embed-github/core";

import type {
  GitHubEmbedDescriptor,
  GitHubEmbedFallbackContext,
  GitHubEmbedUnifiedContent,
  GitHubEmbedUnifiedFallback,
  GitHubEmbedUnifiedRenderer,
  GitHubSourceRequest,
} from "./types";

export function createDefaultUnifiedRenderer(className?: string): GitHubEmbedUnifiedRenderer {
  return (descriptor) => renderGitHubEmbedAsHast(descriptor, className);
}

export function renderGitHubEmbedAsHast(
  descriptor: GitHubEmbedDescriptor,
  className?: string,
): GitHubEmbedUnifiedContent {
  const metaItems = [
    descriptor.repository,
    descriptor.fileName,
    formatDisplayedRange(descriptor.lineStart, descriptor.lineEnd),
    descriptor.referenceLabel,
  ].filter((value): value is string => Boolean(value));
  const title = descriptor.label ?? descriptor.fileName;
  const languageClassName = descriptor.language ? `language-${descriptor.language}` : "";

  return element(
    "div",
    {
      className: composeClassName(ROOT_CLASS_NAME, className).split(" ").filter(Boolean),
      dataReferenceKind: descriptor.referenceKind,
    },
    [
      element("div", { className: [`${ROOT_CLASS_NAME}__header`] }, [
        element("div", { className: [`${ROOT_CLASS_NAME}__eyebrow`] }, [text("GitHub source")]),
        element(
          "a",
          {
            className: [`${ROOT_CLASS_NAME}__link`],
            href: descriptor.originalUrl,
          },
          [text(title)],
        ),
        element(
          "div",
          { className: [`${ROOT_CLASS_NAME}__meta`] },
          metaItems.map((item) =>
            element("span", { className: [`${ROOT_CLASS_NAME}__meta-item`] }, [text(item)]),
          ),
        ),
      ]),
      element("pre", { className: [`${ROOT_CLASS_NAME}__pre`] }, [
        element(
          "code",
          {
            className: composeClassName(`${ROOT_CLASS_NAME}__code`, languageClassName)
              .split(" ")
              .filter(Boolean),
          },
          descriptor.lines.map((line) =>
            element(
              "span",
              {
                className: [`${ROOT_CLASS_NAME}__line`],
                dataLine: line.number,
              },
              [
                element(
                  "span",
                  {
                    className: [`${ROOT_CLASS_NAME}__line-number`],
                    ariaHidden: true,
                  },
                  [text(`${line.number}`)],
                ),
                element("span", { className: [`${ROOT_CLASS_NAME}__line-content`] }, [
                  text(line.content),
                ]),
              ],
            ),
          ),
        ),
      ]),
    ],
  );
}

export function renderUnifiedFallback(
  fallback: GitHubEmbedUnifiedFallback,
  context: GitHubEmbedFallbackContext,
  className?: string,
): readonly GitHubEmbedUnifiedContent[] {
  if (typeof fallback === "function") {
    return normalizeUnifiedResult(fallback(context));
  }

  if (fallback === "error") {
    return [renderUnifiedFallbackError(context, className)];
  }

  return [renderUnifiedFallbackLink(context.request)];
}

function renderUnifiedFallbackLink(request: GitHubSourceRequest): GitHubEmbedUnifiedContent {
  return element("p", {}, [
    element("a", { href: request.originalUrl }, [text(request.label ?? request.originalUrl)]),
  ]);
}

function renderUnifiedFallbackError(
  context: GitHubEmbedFallbackContext,
  className?: string,
): GitHubEmbedUnifiedContent {
  const message =
    context.error instanceof Error ? context.error.message : "Failed to load the GitHub source.";

  return element(
    "div",
    {
      className: composeClassName(ROOT_CLASS_NAME, `${ROOT_CLASS_NAME}--error`, className)
        .split(" ")
        .filter(Boolean),
    },
    [
      element("div", { className: [`${ROOT_CLASS_NAME}__header`] }, [
        element("div", { className: [`${ROOT_CLASS_NAME}__eyebrow`] }, [text("GitHub source")]),
        element(
          "a",
          {
            className: [`${ROOT_CLASS_NAME}__link`],
            href: context.request.originalUrl,
          },
          [text(context.request.label ?? context.request.fileName)],
        ),
      ]),
      element("p", { className: [`${ROOT_CLASS_NAME}__error`] }, [text(message)]),
    ],
  );
}

export function normalizeUnifiedResult(
  result: readonly GitHubEmbedUnifiedContent[] | GitHubEmbedUnifiedContent,
): readonly GitHubEmbedUnifiedContent[] {
  if (isUnifiedContentArray(result)) {
    return result;
  }
  return [result];
}

function element(
  tagName: string,
  properties: Record<string, unknown>,
  children: readonly GitHubEmbedUnifiedContent[],
): GitHubEmbedUnifiedContent {
  return {
    type: "element",
    tagName,
    properties,
    children: [...children],
  };
}

function text(value: string): GitHubEmbedUnifiedContent {
  return {
    type: "text",
    value,
  };
}

function isUnifiedContentArray(
  value: readonly GitHubEmbedUnifiedContent[] | GitHubEmbedUnifiedContent,
): value is readonly GitHubEmbedUnifiedContent[] {
  return Array.isArray(value);
}
