import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import rollupNodePolyFill from "rollup-plugin-node-polyfills";
import path from "path"; // 🔹 path 모듈 추가


export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      buffer: "buffer",
      process: "process/browser",
      "@": path.resolve(__dirname, "./src"), // @ → src 폴더 alias 추가
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


});
