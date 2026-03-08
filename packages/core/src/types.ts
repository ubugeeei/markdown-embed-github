export interface GitHubLineRange {
  start: number;
  end: number;
}

export type GitHubReferenceKind = "branch" | "commit" | "tag" | "unknown";

export interface GitHubSourceRequest {
  originalUrl: string;
  sourceUrl: string;
  requestUrl: string;
  owner: string;
  repo: string;
  repository: string;
  fileName: string;
  label: string | null;
  lineRange: GitHubLineRange | null;
  referenceCandidate: string | null;
  isPermalink: boolean;
}

export interface GitHubLoadedSource {
  body: string;
  effectiveUrl?: string | null;
}

export interface GitHubEmbedLine {
  number: number;
  content: string;
}

export interface GitHubEmbedDescriptor extends GitHubSourceRequest {
  code: string;
  language: string;
  lineStart: number;
  lineEnd: number;
  totalLines: number;
  lines: readonly GitHubEmbedLine[];
  effectiveUrl: string | null;
  referenceKind: GitHubReferenceKind;
  referenceLabel: string | null;
}

export interface GitHubEmbedFallbackContext {
  error: unknown;
  request: GitHubSourceRequest;
}

export interface GitHubEmbedCacheOptions {
  dir?: string | false;
  branchTtlMs?: number;
  tagTtlMs?: number;
  commitTtlMs?: number;
}

export type GitHubSourceLoader = (request: GitHubSourceRequest) => GitHubLoadedSource;

export interface GitHubEmbedCoreOptions {
  cache?: boolean | GitHubEmbedCacheOptions;
  timeoutMs?: number;
  resolveLanguage?: (request: GitHubSourceRequest) => string | null | undefined;
  loadSource?: GitHubSourceLoader;
}

export interface GitHubEmbedSuccessResult {
  ok: true;
  descriptor: GitHubEmbedDescriptor;
}

export interface GitHubEmbedFailureResult {
  ok: false;
  context: GitHubEmbedFallbackContext;
}

export type GitHubEmbedResult = GitHubEmbedFailureResult | GitHubEmbedSuccessResult;

export type GitHubEmbedResolver = (request: GitHubSourceRequest) => GitHubEmbedResult;
