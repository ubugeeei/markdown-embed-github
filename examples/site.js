import { readFileSync } from "node:fs";

import MarkdownIt from "markdown-it";

import markdownEmbedGitHub, { defaultStyles } from "@markdown-embed-github/markdown-it";

const MARKDOWN_IT_BRANCH_URL =
  "https://github.com/markdown-it/markdown-it/blob/master/lib/index.mjs#L1-L24";
const MARKDOWN_IT_PERMALINK_URL =
  "https://github.com/markdown-it/markdown-it/blob/b4a9b659ef5734223731cfaa3ad5eacc6fc22918/lib/token.mjs#L1-L28";
const VITE_PERMALINK_URL =
  "https://github.com/vitejs/vite/blob/6803be6f0b0b02ffe992cb1097f6706f69fea90c/packages/vite/src/node/index.ts#L1-L18";
const SITE_STYLES_FILE_NAME = "assets/example-site.css";
const EMBED_STYLES_FILE_NAME = "assets/github-embed.css";

export function buildExampleAssets() {
  const defaultMarkdown = new MarkdownIt({
    linkify: true,
  });
  defaultMarkdown.use(markdownEmbedGitHub);

  const customMarkdown = new MarkdownIt();
  customMarkdown.use(markdownEmbedGitHub, {
    className: "example-card",
    render: (descriptor) => {
      const lines = descriptor.lines
        .map((line) => {
          return `<li class="example-card__line"><span class="example-card__line-number">${line.number}</span><code class="example-card__line-content">${escapeHtml(line.content)}</code></li>`;
        })
        .join("");

      return `<section class="example-card"><header class="example-card__header"><p class="example-card__eyebrow">Custom renderer</p><div class="example-card__title-row"><h2 class="example-card__title">${escapeHtml(descriptor.fileName)}</h2><a class="example-card__link" href="${escapeHtml(descriptor.originalUrl)}">Open on GitHub</a></div><p class="example-card__meta">${escapeHtml(descriptor.repository)} · ${escapeHtml(descriptor.referenceKind)} · ${escapeHtml(descriptor.language)} · ${escapeHtml(`L${descriptor.lineStart}-L${descriptor.lineEnd}`)}</p></header><ol class="example-card__lines">${lines}</ol></section>`;
    },
  });

  const defaultBody = defaultMarkdown.render(`
https://github.com/markdown-it/markdown-it/blob/master/lib/index.mjs#L1-L24

[Token class permalink](${MARKDOWN_IT_PERMALINK_URL})

Inline links still stay links: [markdown-it source](${MARKDOWN_IT_BRANCH_URL})
`);

  const customBody = customMarkdown.render(`
[Vite entry permalink](${VITE_PERMALINK_URL})
`);

  const pages = [
    {
      body: defaultBody,
      description:
        "Embeds both bare URLs and Markdown links, while leaving inline links untouched.",
      fileName: "default.html",
      stylesheets: [`./${SITE_STYLES_FILE_NAME}`, `./${EMBED_STYLES_FILE_NAME}`],
      title: "Default Renderer Example",
    },
    {
      body: customBody,
      description: "Replaces the output with a fully custom layout via the render option.",
      fileName: "custom.html",
      stylesheets: [`./${SITE_STYLES_FILE_NAME}`],
      title: "Custom Renderer Example",
    },
  ];

  return [
    {
      contentType: "text/css; charset=utf-8",
      fileName: SITE_STYLES_FILE_NAME,
      source: readFileSync(new URL("./site.css", import.meta.url), "utf8"),
    },
    {
      contentType: "text/css; charset=utf-8",
      fileName: EMBED_STYLES_FILE_NAME,
      source: defaultStyles,
    },
    {
      contentType: "text/html; charset=utf-8",
      fileName: "index.html",
      source: renderIndex(pages),
    },
    ...pages.map((page) => {
      return {
        contentType: "text/html; charset=utf-8",
        fileName: page.fileName,
        source: renderDocument(page),
      };
    }),
  ];
}

function renderDocument(page) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(page.title)}</title>
    ${renderStylesheetLinks(page.stylesheets)}
  </head>
  <body class="example-page">
    <main class="example-shell">
      <a class="example-back-link" href="./index.html">Back to examples</a>
      <header class="example-hero">
        <p class="example-kicker">markdown-embed-github</p>
        <h1>${escapeHtml(page.title)}</h1>
        <p>${escapeHtml(page.description)}</p>
      </header>
      <section class="example-preview">
        ${page.body}
      </section>
    </main>
  </body>
</html>`;
}

function renderIndex(pages) {
  const cards = pages
    .map((page) => {
      return `<article class="example-index-card"><p class="example-index-card__eyebrow">Example</p><h2><a href="./${page.fileName}">${escapeHtml(page.title)}</a></h2><p>${escapeHtml(page.description)}</p></article>`;
    })
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Examples</title>
    ${renderStylesheetLinks([`./${SITE_STYLES_FILE_NAME}`])}
  </head>
  <body class="example-page">
    <main class="example-shell">
      <header class="example-hero">
        <p class="example-kicker">markdown-embed-github</p>
        <h1>Examples</h1>
        <p>Examples that fetch public GitHub sources and generate embedded HTML.</p>
      </header>
      <section class="example-index-grid">
        ${cards}
      </section>
    </main>
  </body>
</html>`;
}

function renderStylesheetLinks(stylesheets) {
  return stylesheets
    .map((href) => `<link rel="stylesheet" href="${escapeAttribute(href)}">`)
    .join("\n    ");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function escapeHtml(value) {
  return value
    .replace(/&/gu, "&amp;")
    .replace(/</gu, "&lt;")
    .replace(/>/gu, "&gt;")
    .replace(/"/gu, "&quot;")
    .replace(/'/gu, "&#39;");
}
