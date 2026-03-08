import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vite";

import { buildExampleAssets } from "./site.js";

function examplesPlugin() {
  let resolvedConfig;

  return {
    name: "markdown-embed-github-examples",
    closeBundle() {
      if (!resolvedConfig || resolvedConfig.command !== "build") {
        return;
      }

      const outputDirectory = resolve(resolvedConfig.root, resolvedConfig.build.outDir);
      const assets = buildExampleAssets();

      rmSync(outputDirectory, {
        force: true,
        recursive: true,
      });
      mkdirSync(outputDirectory, {
        recursive: true,
      });

      for (const asset of assets) {
        const filePath = resolve(outputDirectory, asset.fileName);
        mkdirSync(dirname(filePath), {
          recursive: true,
        });
        writeFileSync(filePath, asset.source, "utf8");
      }

      for (const asset of assets) {
        if (asset.contentType.startsWith("text/html")) {
          resolvedConfig.logger.info(resolve(outputDirectory, asset.fileName));
        }
      }
    },
    configResolved(config) {
      resolvedConfig = config;
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const asset = resolveAssetForRequest(request.url);
        if (!asset) {
          next();
          return;
        }

        response.statusCode = 200;
        response.setHeader("Content-Type", asset.contentType);
        response.end(asset.source);
      });
    },
  };
}

function resolveAssetForRequest(requestUrl) {
  const pathname = new URL(requestUrl ?? "/", "http://localhost").pathname;
  const resolvedPath = pathname === "/" ? "index.html" : pathname.replace(/^\/+/u, "");

  return buildExampleAssets().find((asset) => asset.fileName === resolvedPath) ?? null;
}

export default defineConfig({
  appType: "custom",
  build: {
    emptyOutDir: false,
    outDir: "output",
    rollupOptions: {
      input: fileURLToPath(new URL("./noop.js", import.meta.url)),
    },
    write: false,
  },
  plugins: [examplesPlugin()],
});
