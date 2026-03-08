import MarkdownIt from "markdown-it";
import { describe, expect, it, vi } from "vitest";

import markdownEmbedGitHub from "../src";

const SOURCE_URL = "https://github.com/acme/repo/blob/main/src/index.ts";

describe("markdownEmbedGitHub", () => {
  it("embeds bare GitHub blob links without linkify", () => {
    const md = new MarkdownIt();
    md.use(markdownEmbedGitHub, {
      cache: false,
      loadSource: () => ({
        body: "<script>\nconsole.log('x')\n",
      }),
    });

    const html = md.render(`${SOURCE_URL}#L1-L2`);

    expect(html).toContain("markdown-embed-github");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain('data-line="1"');
    expect(html).not.toContain("<p>");
  });

  it("embeds standalone markdown links and leaves inline links alone", () => {
    const loadSource = vi.fn(() => ({
      body: "alpha\nbeta\ngamma",
    }));
    const md = new MarkdownIt();
    md.use(markdownEmbedGitHub, {
      cache: false,
      loadSource,
    });

    const standalone = md.render(`[Entry point](${SOURCE_URL}#L2-L3)`);
    expect(standalone).toContain(">Entry point<");
    expect(standalone).toContain("beta");
    expect(loadSource).toHaveBeenCalledTimes(1);

    const inline = md.render(`See [Entry point](${SOURCE_URL}#L2-L3) for details.`);
    expect(inline).toContain("<p>See <a href=");
    expect(inline).not.toContain("markdown-embed-github__pre");
    expect(loadSource).toHaveBeenCalledTimes(1);
  });

  it("reuses cached file bodies across multiple line ranges", () => {
    const loadSource = vi.fn(() => ({
      body: "one\ntwo\nthree\nfour",
    }));
    const md = new MarkdownIt();
    md.use(markdownEmbedGitHub, {
      cache: {
        dir: false,
      },
      loadSource,
    });

    md.render(`${SOURCE_URL}#L1-L2\n\n${SOURCE_URL}#L3-L4`);

    expect(loadSource).toHaveBeenCalledTimes(1);
  });

  it("falls back to the original link when loading fails", () => {
    const md = new MarkdownIt();
    md.use(markdownEmbedGitHub, {
      cache: false,
      fallback: "link",
      loadSource: () => {
        throw new Error("boom");
      },
    });

    const html = md.render(`[Source](${SOURCE_URL})`);

    expect(html).toBe(`<p><a href="${SOURCE_URL}">Source</a></p>`);
  });
});
