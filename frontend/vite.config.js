import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  root: "src",
  publicDir: "../public",
  server: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: true,
    hmr: {
      protocol: "ws",
      host: process.env.VITE_HMR_HOST || "localhost",
      port: 3000,
      clientPort: 8000,
    },
    watch: {
      usePolling: process.env.USE_POLLING === "true",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "/public": path.resolve(__dirname, "../public/"),
    },
  },
});
