import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Polyfill for Node.js 'global' object in browser environment
    // Required for react-joyride and other libraries that expect Node.js globals
    // This replaces all instances of 'global' with 'globalThis' at build time
    global: "globalThis",
  },
  server: {
    fs: {
      // Allow using "npm link" for packages when developing, that are in different base path
      strict: false,
    },
  },
  optimizeDeps: {
    // Dependencies to pre-bundle
  },
  build: {
    outDir: "build",
    sourcemap: true,
    assetsInlineLimit: 0, // disable inlining assets

    // When false, all CSS will be extracted into a single CSS file.
    cssCodeSplit: false,
  },
});
