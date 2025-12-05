import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": new URL("./src", import.meta.url).pathname
    }
  },
  server: {
    host: "127.0.0.1",
    proxy: {
      "/monitors": {
        target: "http://localhost:3000",
        changeOrigin: true
      },
      "/notifications": {
        target: "http://localhost:3000",
        changeOrigin: true
      },
      "/groups": {
        target: "http://localhost:3000",
        changeOrigin: true
      },
      "/ack": {
        target: "http://localhost:3000",
        changeOrigin: true
      }
    }
  },
  preview: {
    host: "127.0.0.1"
  }
});
