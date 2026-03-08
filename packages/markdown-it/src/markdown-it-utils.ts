import type MarkdownIt from "markdown-it";

export function extractStandaloneMarkdownItLink(
  children: MarkdownItToken[] | null,
  md: MarkdownIt,
  env: unknown,
): { href: string; label: string | null } | null {
  if (!children || children.length < 3 || children[0]?.type !== "link_open") {
    return null;
  }

  let depth = 0;
  let closingIndex = -1;

  for (let index = 0; index < children.length; index += 1) {
    const child = children[index];

    if (child.type === "link_open") {
      depth += 1;
      continue;
    }

    if (child.type === "link_close") {
      depth -= 1;
      if (depth === 0) {
        closingIndex = index;
        break;
      }
    }
  }

  if (closingIndex !== children.length - 1) {
    return null;
  }

  const href = children[0].attrGet("href");
  if (!href) {
    return null;
  }

  const label = md.renderer
    .renderInlineAsText(
      children.slice(1, -1) as Parameters<typeof md.renderer.renderInlineAsText>[0],
      md.options,
      env,
    )
    .trim();

  return {
    href,
    label: label.length > 0 ? label : null,
  };
}

interface MarkdownItToken {
  attrGet(name: string): string | null;
  type: string;
}
