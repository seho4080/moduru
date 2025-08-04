import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import rollupNodePolyFill from "rollup-plugin-node-polyfills";

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      buffer: "buffer",
      process: "process/browser",
    },
  },

  define: {
    global: "globalThis", // 핵심: global 객체 대체
  },

  optimizeDeps: {
    include: ["buffer", "process"],
  },

  build: {
    rollupOptions: {
      plugins: [
        rollupNodePolyFill(), // polyfill 추가
      ],
    },
  },

  server: {
    host: "0.0.0.0",
    port: 5173,
  },
});
