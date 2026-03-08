import { describe, expect, it } from "vitest";

import { parseGitHubSourceRequest } from "../src";

describe("parseGitHubSourceRequest", () => {
  it("normalizes GitHub source URLs and keeps line ranges", () => {
    const request = parseGitHubSourceRequest(
      "https://github.com/acme/repo/blob/main/src/index.ts?plain=1#L3-L5",
    );

    expect(request).toMatchObject({
      fileName: "index.ts",
      isPermalink: false,
      lineRange: {
        end: 5,
        start: 3,
      },
      originalUrl: "https://github.com/acme/repo/blob/main/src/index.ts#L3-L5",
      repository: "acme/repo",
      requestUrl: "https://github.com/acme/repo/blob/main/src/index.ts?raw=1",
      sourceUrl: "https://github.com/acme/repo/blob/main/src/index.ts",
    });
  });

  it("detects permalink-style commit references", () => {
    const request = parseGitHubSourceRequest(
      "https://github.com/acme/repo/blob/550268467602c001e0b009804e8cf34b0e93e450/src/index.ts",
    );

    expect(request?.isPermalink).toBe(true);
    expect(request?.referenceCandidate).toBe("550268467602c001e0b009804e8cf34b0e93e450");
  });

  it("rejects non-blob GitHub URLs", () => {
    expect(parseGitHubSourceRequest("https://github.com/acme/repo/issues/1")).toBeNull();
  });
});
