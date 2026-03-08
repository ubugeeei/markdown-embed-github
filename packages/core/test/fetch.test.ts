import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { createSourceLoader, parseGitHubSourceRequest } from "../src";

const SOURCE_URL = "https://github.com/acme/repo/blob/main/src/index.ts";

describe("createSourceLoader", () => {
  const temporaryDirectories: string[] = [];

  afterEach(() => {
    vi.restoreAllMocks();

    for (const directory of temporaryDirectories.splice(0)) {
      rmSync(directory, { force: true, recursive: true });
    }
  });

  it("hydrates the disk cache across loader instances", () => {
    const cacheDirectory = mkdtempSync(join(tmpdir(), "meg-"));
    temporaryDirectories.push(cacheDirectory);

    const upstream = vi.fn(() => ({
      body: "alpha\nbeta\ngamma",
    }));
    const request = parseGitHubSourceRequest(SOURCE_URL);

    expect(request).not.toBeNull();

    const loaderA = createSourceLoader({
      cache: {
        dir: cacheDirectory,
      },
      loadSource: upstream,
    });

    const first = loaderA(request!);
    expect(first.body).toBe("alpha\nbeta\ngamma");
    expect(upstream).toHaveBeenCalledTimes(1);

    const loaderB = createSourceLoader({
      cache: {
        dir: cacheDirectory,
      },
      loadSource: upstream,
    });

    const second = loaderB({
      ...request!,
      lineRange: {
        end: 3,
        start: 2,
      },
    });

    expect(second.body).toBe("alpha\nbeta\ngamma");
    expect(upstream).toHaveBeenCalledTimes(1);
  });
});
