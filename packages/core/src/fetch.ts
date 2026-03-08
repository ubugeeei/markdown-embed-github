import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve as resolvePath } from "node:path";

import type {
  GitHubEmbedCacheOptions,
  GitHubEmbedCoreOptions,
  GitHubLoadedSource,
  GitHubSourceLoader,
  GitHubSourceRequest,
} from "./types";
import { detectReferenceKind } from "./utils";

interface CacheRecord extends GitHubLoadedSource {
  fetchedAt: number;
  version: 1;
}

interface ResolvedCacheOptions {
  branchTtlMs: number;
  commitTtlMs: number;
  dir: string | false;
  tagTtlMs: number;
}

const DEFAULT_BRANCH_CACHE_TTL_MS = 5 * 60 * 1000;
const DEFAULT_COMMIT_CACHE_TTL_MS = Number.POSITIVE_INFINITY;
const DEFAULT_CACHE_DIRECTORY = ".cache/markdown-embed-github";
const DEFAULT_FETCH_TIMEOUT_MS = 10_000;
const DEFAULT_TAG_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const DEFAULT_MAX_BUFFER_BYTES = 32 * 1024 * 1024;
const EFFECTIVE_URL_MARKER = "\n__MARKDOWN_IT_EMBED_GITHUB_EFFECTIVE_URL__\n";

let isCurlAvailable: boolean | undefined;

export function createSourceLoader(
  options: Pick<GitHubEmbedCoreOptions, "cache" | "loadSource" | "timeoutMs"> = {},
): GitHubSourceLoader {
  const cache = resolveCacheOptions(options.cache);
  const timeoutMs = Math.max(1, options.timeoutMs ?? DEFAULT_FETCH_TIMEOUT_MS);
  const memoryCache = cache ? new Map<string, CacheRecord>() : null;
  const upstream =
    options.loadSource ?? ((request) => fetchRemoteSource(request.requestUrl, timeoutMs));

  return (request) => {
    const cacheKey = request.sourceUrl;
    const cacheDirectory = cache && cache.dir ? cache.dir : null;

    if (cache && memoryCache) {
      const cached = memoryCache.get(cacheKey);
      if (cached && isFresh(cached, request, cache)) {
        return cached;
      }
    }

    if (cache && cacheDirectory) {
      const cached = readCacheRecord(cacheDirectory, cacheKey);
      if (cached && isFresh(cached, request, cache)) {
        memoryCache?.set(cacheKey, cached);
        return cached;
      }
    }

    const loaded = upstream(request);
    const record: CacheRecord = {
      body: loaded.body,
      effectiveUrl: loaded.effectiveUrl ?? null,
      fetchedAt: Date.now(),
      version: 1,
    };

    if (memoryCache) {
      memoryCache.set(cacheKey, record);
    }

    if (cache && cacheDirectory) {
      writeCacheRecord(cacheDirectory, cacheKey, record);
    }

    return record;
  };
}

function fetchRemoteSource(requestUrl: string, timeoutMs: number): GitHubLoadedSource {
  if (canUseCurl()) {
    try {
      return fetchWithCurl(requestUrl, timeoutMs);
    } catch (error) {
      if (!isMissingCommandError(error)) {
        throw wrapFetchError(requestUrl, error);
      }

      isCurlAvailable = false;
    }
  }

  try {
    return fetchWithNode(requestUrl, timeoutMs);
  } catch (error) {
    throw wrapFetchError(requestUrl, error);
  }
}

function resolveCacheOptions(
  cache: boolean | GitHubEmbedCacheOptions | undefined,
): ResolvedCacheOptions | false {
  if (cache === false) {
    return false;
  }

  const config = cache === true || cache === undefined ? {} : cache;
  const dir = config.dir === false ? false : resolvePath(config.dir ?? DEFAULT_CACHE_DIRECTORY);

  return {
    branchTtlMs: normalizeTtl(config.branchTtlMs, DEFAULT_BRANCH_CACHE_TTL_MS),
    commitTtlMs: normalizeTtl(config.commitTtlMs, DEFAULT_COMMIT_CACHE_TTL_MS),
    dir,
    tagTtlMs: normalizeTtl(config.tagTtlMs, DEFAULT_TAG_CACHE_TTL_MS),
  };
}

function isFresh(
  record: CacheRecord,
  request: GitHubSourceRequest,
  cache: ResolvedCacheOptions,
): boolean {
  const ttlMs = resolveCacheTtlMs(request, record.effectiveUrl ?? null, cache);
  return ttlMs === Number.POSITIVE_INFINITY || Date.now() - record.fetchedAt <= ttlMs;
}

function resolveCacheTtlMs(
  request: GitHubSourceRequest,
  effectiveUrl: string | null,
  cache: ResolvedCacheOptions,
): number {
  const referenceKind = detectReferenceKind(request, effectiveUrl);
  if (referenceKind === "commit") {
    return cache.commitTtlMs;
  }

  if (referenceKind === "tag") {
    return cache.tagTtlMs;
  }

  return cache.branchTtlMs;
}

function readCacheRecord(cacheDirectory: string, cacheKey: string): CacheRecord | null {
  try {
    const filePath = resolveCacheFilePath(cacheDirectory, cacheKey);
    const content = readFileSync(filePath, "utf8");
    const parsed = JSON.parse(content) as Partial<CacheRecord>;
    if (
      parsed.version !== 1 ||
      typeof parsed.body !== "string" ||
      typeof parsed.fetchedAt !== "number"
    ) {
      return null;
    }

    return {
      body: parsed.body,
      effectiveUrl: typeof parsed.effectiveUrl === "string" ? parsed.effectiveUrl : null,
      fetchedAt: parsed.fetchedAt,
      version: 1,
    };
  } catch {
    return null;
  }
}

function writeCacheRecord(cacheDirectory: string, cacheKey: string, record: CacheRecord): void {
  mkdirSync(cacheDirectory, { recursive: true });
  writeFileSync(resolveCacheFilePath(cacheDirectory, cacheKey), JSON.stringify(record), "utf8");
}

function resolveCacheFilePath(cacheDirectory: string, cacheKey: string): string {
  const hash = createHash("sha1").update(cacheKey).digest("hex");
  return resolvePath(cacheDirectory, `${hash}.json`);
}

function fetchWithCurl(requestUrl: string, timeoutMs: number): GitHubLoadedSource {
  const timeoutSeconds = Math.max(1, Math.ceil(timeoutMs / 1000));
  const output = execFileSync(
    "curl",
    [
      "--location",
      "--fail",
      "--silent",
      "--show-error",
      "--compressed",
      "--max-time",
      `${timeoutSeconds}`,
      "--write-out",
      EFFECTIVE_URL_MARKER + "%{url_effective}",
      requestUrl,
    ],
    {
      encoding: "utf8",
      maxBuffer: DEFAULT_MAX_BUFFER_BYTES,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  return parseFetchOutput(output);
}

function fetchWithNode(requestUrl: string, timeoutMs: number): GitHubLoadedSource {
  const output = execFileSync(process.execPath, ["--input-type=module", "-e", NODE_FETCH_SCRIPT], {
    encoding: "utf8",
    env: {
      ...process.env,
      MEG_EFFECTIVE_URL_MARKER: EFFECTIVE_URL_MARKER,
      MEG_REQUEST_URL: requestUrl,
      MEG_TIMEOUT_MS: `${timeoutMs}`,
    },
    maxBuffer: DEFAULT_MAX_BUFFER_BYTES,
    stdio: ["ignore", "pipe", "pipe"],
  });

  return parseFetchOutput(output);
}

function parseFetchOutput(output: string): GitHubLoadedSource {
  const markerIndex = output.lastIndexOf(EFFECTIVE_URL_MARKER);
  if (markerIndex < 0) {
    throw new Error("Failed to resolve the GitHub raw response URL.");
  }

  return {
    body: output.slice(0, markerIndex),
    effectiveUrl: output.slice(markerIndex + EFFECTIVE_URL_MARKER.length).trim() || null,
  };
}

function canUseCurl(): boolean {
  if (isCurlAvailable !== undefined) {
    return isCurlAvailable;
  }

  try {
    execFileSync("curl", ["--version"], {
      stdio: ["ignore", "ignore", "ignore"],
    });
    isCurlAvailable = true;
  } catch {
    isCurlAvailable = false;
  }

  return isCurlAvailable;
}

function isMissingCommandError(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}

function wrapFetchError(requestUrl: string, error: unknown): Error {
  if (error instanceof Error) {
    return new Error(`Failed to fetch GitHub source for ${requestUrl}: ${error.message}`);
  }

  return new Error(`Failed to fetch GitHub source for ${requestUrl}.`);
}

function normalizeTtl(value: number | undefined, fallback: number): number {
  if (value === undefined) {
    return fallback;
  }

  if (!Number.isFinite(value)) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.max(0, value);
}

const NODE_FETCH_SCRIPT = `
const requestUrl = process.env.MEG_REQUEST_URL;
const timeoutMs = Number.parseInt(process.env.MEG_TIMEOUT_MS ?? "10000", 10);
const marker = process.env.MEG_EFFECTIVE_URL_MARKER ?? "";

if (!requestUrl) {
  throw new Error("Missing MEG_REQUEST_URL");
}

const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), timeoutMs);

try {
  const response = await fetch(requestUrl, {
    headers: {
      "user-agent": "markdown-embed-github",
    },
    redirect: "follow",
    signal: controller.signal,
  });

  if (!response.ok) {
    throw new Error(\`GitHub returned \${response.status} \${response.statusText}\`);
  }

  const body = await response.text();
  process.stdout.write(body);
  process.stdout.write(marker);
  process.stdout.write(response.url);
}
finally {
  clearTimeout(timer);
}
`;
