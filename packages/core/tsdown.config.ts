import { defineConfig } from "tsdown/config";
import type { UserConfigExport } from "tsdown/config";
import macros from "unplugin-macros/rolldown";

const config: UserConfigExport = defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  copy: ["assets"],
  plugins: [macros()],
});

export default config;
