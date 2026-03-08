import { describe, expect, it, vi } from "vitest";

import { createGitHubEmbedResolver, parseGitHubSourceRequest } from "../src/core";

const SOURCE_URL = "https://github.com/acme/repo/blob/main/src/index.ts";

describe("createGitHubEmbedResolver", () => {
  it("builds descriptors through the shared core resolver", () => {
    const loadSource = vi.fn(() => ({
      body: "alpha\nbeta\ngamma",
    }));
    const resolve = createGitHubEmbedResolver({
      cache: {
        dir: false,
      },
      loadSource,
    });
    const request = parseGitHubSourceRequest(`${SOURCE_URL}#L2-L3`);

    expect(request).not.toBeNull();

    const first = resolve(request!);
    const second = resolve(request!);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) {
      throw new Error("Expected resolver to succeed.");
    }

    expect(first.descriptor.lineStart).toBe(2);
    expect(second.descriptor.lines).toHaveLength(2);
    expect(loadSource).toHaveBeenCalledTimes(1);
  });

  it("returns fallback context when the source load fails", () => {
    const resolve = createGitHubEmbedResolver({
      cache: false,
      loadSource: () => {
        throw new Error("boom");
      },
    });
    const request = parseGitHubSourceRequest(SOURCE_URL);

    expect(request).not.toBeNull();

    const result = resolve(request!);
    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error("Expected resolver to fail.");
    }

    expect(result.context.error).toBeInstanceOf(Error);
  });
});
