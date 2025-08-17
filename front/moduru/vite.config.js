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
  plugins: [react()],
  server: {
    proxy: {
      // /api로 시작하는 요청을 백엔드로 프록시
      '/api': {
        target: 'http://localhost:8080', // 백엔드 주소
        changeOrigin: true,
        secure: false,
        // /api 접두어를 유지하려면 rewrite 제거
        // 백엔드가 /api를 기대하지 않으면 아래 주석 해제하고 조정
        // rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});

