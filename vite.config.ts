import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 3000,
  },
  preview: {
    host: "127.0.0.1",
    port: 3000,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/@samchon/bbs-api")) {
            return "sdk";
          }

          if (
            id.includes("react-markdown") ||
            id.includes("remark-gfm") ||
            id.includes("dompurify")
          ) {
            return "content";
          }

          if (
            id.includes("@tanstack/react-query") ||
            id.includes("react-hook-form")
          ) {
            return "data-entry";
          }

          if (
            id.includes("react-router-dom") ||
            id.includes("react-dom") ||
            /node_modules[\\/]+react[\\/]/.test(id)
          ) {
            return "react-core";
          }
        },
      },
    },
  },
});
