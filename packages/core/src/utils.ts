import type {
  GitHubEmbedDescriptor,
  GitHubEmbedLine,
  GitHubLineRange,
  GitHubLoadedSource,
  GitHubReferenceKind,
  GitHubSourceRequest,
} from "./types";

const COMMIT_PATTERN = /^[0-9a-f]{7,40}$/iu;
const LINE_RANGE_PATTERN = /^#L(\d+)(?:-L(\d+))?$/u;
const GITHUB_HOSTNAME = "github.com";

export function parseGitHubSourceRequest(
  rawUrl: string,
  label: string | null = null,
): GitHubSourceRequest | null {
  let url: URL;

  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return null;
  }

  if (url.hostname !== GITHUB_HOSTNAME) {
    return null;
  }

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments.length < 5 || segments[2] !== "blob") {
    return null;
  }

  const owner = segments[0];
  const repo = segments[1];
  const tailSegments = segments.slice(3);
  if (tailSegments.length < 2) {
    return null;
  }

  const fileName = safeDecodeURIComponent(tailSegments.at(-1) ?? "");
  if (fileName.length === 0) {
    return null;
  }

  const normalizedUrl = new URL(`https://${GITHUB_HOSTNAME}${url.pathname}`);
  const lineRange = parseLineRange(url.hash);
  const originalUrl = lineRange
    ? `${normalizedUrl.toString()}${formatLineRange(lineRange)}`
    : normalizedUrl.toString();
  const normalizedLabel = normalizeLabel(label, rawUrl, originalUrl);
  const referenceCandidate = safeDecodeURIComponent(tailSegments[0] ?? "");

  return {
    originalUrl,
    sourceUrl: normalizedUrl.toString(),
    requestUrl: `${normalizedUrl.toString()}?raw=1`,
    owner,
    repo,
    repository: `${owner}/${repo}`,
    fileName,
    label: normalizedLabel,
    lineRange,
    referenceCandidate: referenceCandidate || null,
    isPermalink: COMMIT_PATTERN.test(referenceCandidate),
  };
}

export function isGitHubSourceUrl(url: string): boolean {
  return parseGitHubSourceRequest(url) !== null;
}

export function buildEmbedDescriptor(
  request: GitHubSourceRequest,
  loaded: GitHubLoadedSource,
  resolveLanguage?: (request: GitHubSourceRequest) => string | null | undefined,
): GitHubEmbedDescriptor {
  const body = stripBom(loaded.body);
  if (body.includes("\0")) {
    throw new Error("Binary GitHub blobs are not supported.");
  }

  const allLines = splitLines(body);
  const selectedRange = resolveDisplayRange(request.lineRange, allLines.length);
  const lines = allLines
    .slice(selectedRange.start - 1, selectedRange.end)
    .map<GitHubEmbedLine>((content, index) => ({
      number: selectedRange.start + index,
      content,
    }));
  const code = lines.map((line) => line.content).join("\n");
  const language = normalizeLanguage(resolveLanguage?.(request) ?? inferLanguage(request.fileName));
  const effectiveUrl = loaded.effectiveUrl ?? null;
  const referenceKind = detectReferenceKind(request, effectiveUrl);

  return {
    ...request,
    code,
    language,
    lineStart: selectedRange.start,
    lineEnd: selectedRange.end,
    totalLines: allLines.length,
    lines,
    effectiveUrl,
    referenceKind,
    referenceLabel:
      referenceKind === "commit" ? shortenReference(request.referenceCandidate) : null,
  };
}

export function detectReferenceKind(
  request: GitHubSourceRequest,
  effectiveUrl: string | null,
): GitHubReferenceKind {
  if (request.isPermalink) {
    return "commit";
  }

  if (!effectiveUrl) {
    return "unknown";
  }

  let url: URL;
  try {
    url = new URL(effectiveUrl);
  } catch {
    return "unknown";
  }

  const segments = url.pathname.split("/").filter(Boolean);
  if (segments[0] !== request.owner || segments[1] !== request.repo) {
    return "unknown";
  }

  if (segments[2] === "refs" && segments[3] === "heads") {
    return "branch";
  }

  if (segments[2] === "refs" && segments[3] === "tags") {
    return "tag";
  }

  if (COMMIT_PATTERN.test(segments[2] ?? "")) {
    return "commit";
  }

  return "unknown";
}

export function escapeHtml(input: string): string {
  return input.replace(/&/gu, "&amp;").replace(/</gu, "&lt;").replace(/>/gu, "&gt;");
}

export function escapeAttribute(input: string): string {
  return escapeHtml(input).replace(/"/gu, "&quot;").replace(/'/gu, "&#39;");
}

export function composeClassName(...classNames: Array<false | null | string | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}

export function formatDisplayedRange(start: number, end: number): string {
  return start === end ? `L${start}` : `L${start}-L${end}`;
}

function parseLineRange(hash: string): GitHubLineRange | null {
  const match = LINE_RANGE_PATTERN.exec(hash);
  if (!match) {
    return null;
  }

  const start = Number.parseInt(match[1] ?? "", 10);
  const end = Number.parseInt(match[2] ?? `${start}`, 10);
  if (!Number.isFinite(start) || !Number.isFinite(end)) {
    return null;
  }

  return {
    start: Math.max(1, start),
    end: Math.max(start, end),
  };
}

function formatLineRange(lineRange: GitHubLineRange): string {
  return lineRange.start === lineRange.end
    ? `#L${lineRange.start}`
    : `#L${lineRange.start}-L${lineRange.end}`;
}

function resolveDisplayRange(
  lineRange: GitHubLineRange | null,
  totalLines: number,
): GitHubLineRange {
  const maxLine = Math.max(1, totalLines);
  if (!lineRange) {
    return {
      start: 1,
      end: maxLine,
    };
  }

  const start = clamp(lineRange.start, 1, maxLine);
  const end = clamp(Math.max(start, lineRange.end), start, maxLine);

  return {
    start,
    end,
  };
}

function splitLines(value: string): string[] {
  const lines = value.split(/\r?\n/u);
  if (value.length > 0 && lines.at(-1) === "") {
    lines.pop();
  }
  return lines.length > 0 ? lines : [""];
}

function inferLanguage(fileName: string): string {
  const normalizedFileName = fileName.toLowerCase();
  const specialCases: Record<string, string> = {
    dockerfile: "dockerfile",
    makefile: "makefile",
  };
  const extensionAliases: Record<string, string> = {
    bash: "bash",
    cjs: "javascript",
    css: "css",
    html: "html",
    js: "javascript",
    json: "json",
    jsx: "jsx",
    md: "markdown",
    mjs: "javascript",
    mts: "typescript",
    sh: "bash",
    ts: "typescript",
    tsx: "tsx",
    vue: "vue",
    yaml: "yaml",
    yml: "yaml",
  };

  if (specialCases[normalizedFileName]) {
    return specialCases[normalizedFileName];
  }

  const extension = normalizedFileName.split(".").pop();
  if (!extension) {
    return "text";
  }

  return extensionAliases[extension] ?? extension;
}

function normalizeLanguage(value: string): string {
  return value.trim().toLowerCase() || "text";
}

function normalizeLabel(
  label: string | null,
  rawUrl: string,
  normalizedUrl: string,
): string | null {
  const value = label?.trim();
  if (!value || value === rawUrl || value === normalizedUrl) {
    return null;
  }
  return value;
}

function safeDecodeURIComponent(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function stripBom(value: string): string {
  return value.charCodeAt(0) === 0xfeff ? value.slice(1) : value;
}

function shortenReference(reference: string | null): string | null {
  return reference ? reference.slice(0, 7) : null;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
