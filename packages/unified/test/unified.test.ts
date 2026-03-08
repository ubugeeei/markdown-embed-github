import rehypeStringify from "rehype-stringify";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { describe, expect, it, vi } from "vitest";

import unifiedEmbedGitHub from "../src";

const SOURCE_URL = "https://github.com/acme/repo/blob/main/src/index.ts";

describe("unifiedEmbedGitHub", () => {
  it("embeds standalone GitHub links in a unified pipeline", () => {
    const processor = unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(unifiedEmbedGitHub, {
        cache: false,
        loadSource: () => ({
          body: "alpha\nbeta\ngamma",
        }),
      })
      .use(rehypeStringify);

    const html = String(processor.processSync(`[Entry point](${SOURCE_URL}#L2-L3)`));

    expect(html).toContain("markdown-embed-github");
    expect(html).toContain("beta");
    expect(html).not.toContain("<p><a");
  });

  it("replaces bare URL paragraphs and keeps inline links untouched", () => {
    const loadSource = vi.fn(() => ({
      body: "one\ntwo\nthree",
    }));
    const processor = unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(unifiedEmbedGitHub, {
        cache: {
          dir: false,
        },
        loadSource,
      })
      .use(rehypeStringify);

    const html = String(
      processor.processSync(`${SOURCE_URL}#L1-L2\n\nInline [link](${SOURCE_URL}#L2-L3) stays put.`),
    );

    expect(html).toContain("markdown-embed-github");
    expect(html).toContain("<p>Inline <a href=");
    expect(loadSource).toHaveBeenCalledTimes(1);
  });

  it("supports a custom unified renderer", () => {
    const processor = unified()
      .use(remarkParse)
      .use(remarkRehype)
      .use(unifiedEmbedGitHub, {
        cache: false,
        loadSource: () => ({
          body: "alpha\nbeta\ngamma",
        }),
        render: (descriptor) => ({
          type: "element",
          tagName: "figure",
          properties: {
            className: ["custom-embed"],
          },
          children: [
            {
              type: "element",
              tagName: "figcaption",
              properties: {},
              children: [
                {
                  type: "text",
                  value: `${descriptor.fileName}:${descriptor.lineStart}`,
                },
              ],
            },
          ],
        }),
      })
      .use(rehypeStringify);

    const html = String(processor.processSync(`${SOURCE_URL}#L2-L3`));

    expect(html).toContain('<figure class="custom-embed">');
    expect(html).toContain("<figcaption>index.ts:2</figcaption>");
  });
});
