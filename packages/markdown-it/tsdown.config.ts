import { defineConfig } from "tsdown/config";
import type { UserConfigExport } from "tsdown/config";

const config: UserConfigExport = defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
});

export default config;
