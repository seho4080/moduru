import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // server: { 
  //   historyApiFallback: true, // 새로고침 시 404 방지
  // },
  server: {
    host: '0.0.0.0',
    port: 5173,
  },
});
