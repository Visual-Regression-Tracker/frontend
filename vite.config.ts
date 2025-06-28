import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      // Allow using "npm link" for packages when developing, that are in different base path
      strict: false,
    },
  },
  optimizeDeps: {
    // Enable using "npm link" for this package when developing
    include: ["@visual-regression-tracker/agent-playwright"],
  },
  build: {
    outDir: "build",
    sourcemap: true,
    assetsInlineLimit: 0, // disable inlining assets

    // When false, all CSS will be extracted into a single CSS file.
    cssCodeSplit: false,
  },
});
