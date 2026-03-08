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
import {
  createDefaultUnifiedRenderer,
  normalizeUnifiedResult,
  renderGitHubEmbedAsHast,
  renderUnifiedFallback,
} from "./render";
import type {
  GitHubEmbedUnifiedContent,
  GitHubEmbedUnifiedElement,
  GitHubEmbedUnifiedOptions,
  GitHubEmbedUnifiedRoot,
  GitHubSourceRequest,
  GitHubEmbedUnifiedTextNode,
} from "./types";

export {
  ROOT_CLASS_NAME,
  composeClassName,
  createDefaultUnifiedRenderer,
  createGitHubEmbedResolver,
  createSourceLoader,
  defaultStyles,
  detectReferenceKind,
  escapeAttribute,
  escapeHtml,
  formatDisplayedRange,
  isGitHubSourceUrl,
  normalizeUnifiedResult,
  parseGitHubSourceRequest,
  renderGitHubEmbedAsHast,
};

export type {
  GitHubEmbedCacheOptions,
  GitHubEmbedCoreOptions,
  GitHubEmbedDescriptor,
  GitHubEmbedFallbackContext,
  GitHubEmbedUnifiedContent,
  GitHubEmbedUnifiedElement,
  GitHubEmbedUnifiedFallback,
  GitHubEmbedUnifiedOptions,
  GitHubEmbedUnifiedRenderResult,
  GitHubEmbedUnifiedRenderer,
  GitHubEmbedUnifiedRoot,
  GitHubEmbedUnifiedTextNode,
  GitHubEmbedLine,
  GitHubEmbedResolver,
  GitHubEmbedResult,
  GitHubLineRange,
  GitHubLoadedSource,
  GitHubReferenceKind,
  GitHubSourceLoader,
  GitHubSourceRequest,
} from "./types";

function unifiedEmbedGitHub(
  options: GitHubEmbedUnifiedOptions = {},
): (tree: GitHubEmbedUnifiedRoot) => void {
  const resolve = createGitHubEmbedResolver(options);
  const render = options.render ?? createDefaultUnifiedRenderer(options.className);
  const fallback = options.fallback ?? "link";

  return (tree) => {
    transformChildren(tree);
  };

  function transformChildren(parent: GitHubEmbedUnifiedElement | GitHubEmbedUnifiedRoot): void {
    const nextChildren: GitHubEmbedUnifiedContent[] = [];

    for (const child of parent.children) {
      if (isElement(child) && child.tagName === "p") {
        const request = extractStandaloneUnifiedRequest(child);
        if (request) {
          const result = resolve(request);
          nextChildren.push(
            ...(result.ok
              ? normalizeUnifiedResult(render(result.descriptor))
              : renderUnifiedFallback(fallback, result.context, options.className)),
          );
          continue;
        }
      }

      if (hasChildren(child)) {
        transformChildren(child);
      }

      nextChildren.push(child);
    }

    parent.children = nextChildren;
  }
}

export default unifiedEmbedGitHub;
export { unifiedEmbedGitHub };

function extractStandaloneUnifiedRequest(
  paragraph: GitHubEmbedUnifiedElement,
): GitHubSourceRequest | null {
  const children = paragraph.children.filter(
    (child) => !(isText(child) && child.value.trim().length === 0),
  );

  if (children.length !== 1) {
    return null;
  }

  const onlyChild = children[0];
  if (isText(onlyChild)) {
    return parseGitHubSourceRequest(onlyChild.value.trim());
  }

  if (!isElement(onlyChild) || onlyChild.tagName !== "a") {
    return null;
  }

  const href = getStringProperty(onlyChild.properties?.href);
  if (!href) {
    return null;
  }

  return parseGitHubSourceRequest(href, stringifyUnifiedText(onlyChild).trim() || null);
}

function stringifyUnifiedText(node: GitHubEmbedUnifiedContent): string {
  if (isText(node)) {
    return node.value;
  }

  return node.children.map((child) => stringifyUnifiedText(child)).join("");
}

function hasChildren(
  node: GitHubEmbedUnifiedContent | GitHubEmbedUnifiedRoot,
): node is GitHubEmbedUnifiedElement | GitHubEmbedUnifiedRoot {
  return "children" in node && Array.isArray(node.children);
}

function isElement(node: GitHubEmbedUnifiedContent): node is GitHubEmbedUnifiedElement {
  return node.type === "element";
}

function isText(node: GitHubEmbedUnifiedContent): node is GitHubEmbedUnifiedTextNode {
  return node.type === "text";
}

function getStringProperty(value: unknown): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    const parts = value.filter((part) => typeof part === "string");
    return parts.length > 0 ? parts.join(" ") : null;
  }

  return null;
}
