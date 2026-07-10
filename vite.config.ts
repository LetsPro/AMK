import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    sourcemap: false,
    minify: "esbuild",
    reportCompressedSize: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "query-vendor": ["@tanstack/react-query", "@tanstack/react-table"],
          "ui-vendor": ["framer-motion", "lucide-react"],
          "pdf-vendor": ["jspdf", "jspdf-autotable"],
          "form-vendor": ["react-hook-form", "@hookform/resolvers", "zod"],
          "chart-vendor": ["recharts"],
        },
      },
    },
  },
  esbuild: {
    drop: ["console", "debugger"],
  },
});
