import { readFileSync } from "node:fs";

export function loadDefaultStyles(): string {
  return readFileSync(new URL("../assets/styles.css", import.meta.url), "utf8");
}
