import { defineConfig } from "vitest/config";
import macros from "unplugin-macros/vite";

export default defineConfig({
  plugins: [macros()],
});
