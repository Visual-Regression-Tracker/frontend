import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      // for packages linked with "npm link" from another base path
      strict: false,
    },
  },
  build: {
    outDir: "build",
    sourcemap: true,
    assetsInlineLimit: 0,
    cssCodeSplit: false,
  },
});
