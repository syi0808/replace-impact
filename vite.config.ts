import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";

const pagesBase = "/replace-impact/";

export default defineConfig(({ mode }) => ({
  base: mode === "pages" ? pagesBase : "/",
  plugins: [vue()],
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname,
    },
  },
  preview: {
    headers: {
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin",
    },
  },
  server: {
    headers: {
      "Cross-Origin-Embedder-Policy": "require-corp",
      "Cross-Origin-Opener-Policy": "same-origin",
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
}));
