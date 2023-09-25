import { defineConfig } from "vite";

import react from "@vitejs/plugin-react";


// Saved for later use once other libraries are being updated.
function manualChunks(id: string): string | void {
  if (id.includes('node_modules/@mui')) {
      return 'mui';
  }

  // Here's the odd fix. You cannot return void, it must return a string
  return "index";
}


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
    minify: false, //"esbuild",

    // When false, all CSS will be extracted into a single CSS file.
    cssCodeSplit: false,

    // https://rollupjs.org/configuration-options/
    rollupOptions: {
      //preserveEntrySignatures: "strict",
      output: {
        compact: true,
        manualChunks: manualChunks,
        generatedCode: "es2015",
        //preserveModules: true,
        //dir: "build"
      }
    }
  },
});
