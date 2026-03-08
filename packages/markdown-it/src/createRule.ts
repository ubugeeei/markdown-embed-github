import type MarkdownIt from "markdown-it";
import { parseGitHubSourceRequest } from "@markdown-embed-github/core";

import type { GitHubSourceRequest, ResolvedGitHubEmbedHtmlOptions } from "./types";
import { extractStandaloneMarkdownItLink } from "./markdown-it-utils";
import { renderFallback } from "./render";

export function createRule(options: ResolvedGitHubEmbedHtmlOptions, md: MarkdownIt): void {
  md.block.ruler.before(
    "paragraph",
    "github_embed_link_block",
    (state, startLine, endLine, silent) => {
      void endLine;
      const line = state.getLines(startLine, startLine + 1, state.blkIndent, false).trim();

      const request = parseGitHubSourceRequest(line);
      if (!request) {
        return false;
      }

      if (silent) {
        return true;
      }

      const token = state.push("github_embed", "", 0);
      token.block = true;
      token.map = [startLine, startLine + 1];
      token.meta = request;

      state.line = startLine + 1;

      return true;
    },
  );

  md.core.ruler.after("inline", "github_embed_link_paragraph", (state) => {
    const { tokens } = state;

    for (let index = 0; index < tokens.length - 2; index += 1) {
      const open = tokens[index];
      const inline = tokens[index + 1];
      const close = tokens[index + 2];

      if (
        open?.type !== "paragraph_open" ||
        inline?.type !== "inline" ||
        close?.type !== "paragraph_close"
      ) {
        continue;
      }

      const standaloneLink = extractStandaloneMarkdownItLink(inline.children, state.md, state.env);
      if (!standaloneLink) {
        continue;
      }

      const request = parseGitHubSourceRequest(standaloneLink.href, standaloneLink.label);
      if (!request) {
        continue;
      }

      tokens.splice(
        index,
        3,
        createEmbedToken(state, open.map, request) as unknown as (typeof tokens)[number],
      );
    }
  });

  md.renderer.rules.github_embed = (tokens, index) => {
    const request = tokens[index]?.meta as GitHubSourceRequest | undefined;
    if (!request) {
      return "";
    }

    try {
      const result = options.resolve(request);
      return result.ok
        ? options.render(result.descriptor)
        : renderFallback(options.fallback, result.context, options.className);
    } catch (error) {
      return renderFallback(options.fallback, { error, request }, options.className);
    }
  };
}

function createEmbedToken(
  state: { Token: new (type: string, tag: string, nesting: -1 | 0 | 1) => TokenLike },
  map: [number, number] | null,
  request: GitHubSourceRequest,
): TokenLike {
  const token = new state.Token("github_embed", "", 0);
  token.block = true;
  token.map = map;
  token.meta = request;
  return token;
}

interface TokenLike {
  block: boolean;
  map: [number, number] | null;
  meta: unknown;
}
