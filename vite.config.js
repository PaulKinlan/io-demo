import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  // config options
  base: "./",
  build: {
    outDir: "dist",
    assetDir: "assets",
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        carousel: resolve(__dirname, "carousel.html"),
      },
    },
  },
});
