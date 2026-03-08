import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { defaultStyles } from "../src";

describe("defaultStyles", () => {
  it("is loaded from the published stylesheet asset", () => {
    const stylesheet = readFileSync(new URL("../assets/styles.css", import.meta.url), "utf8");

    expect(defaultStyles).toBe(stylesheet);
  });
});
