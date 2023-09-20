import { defineConfig } from "vite";

import react from "@vitejs/plugin-react";


// Saved for later use once other libraries are being updated.
function manualChunks(id: string): string | void {
  if (id.includes('node_modules/react-')) {
      return 'react-libs';
  } else if (id.includes('konva')) {
      return 'konva';
  } else if (id.includes('node_modules/react')) {
      return 'react';
  } else if (id.includes('node_modules/@mui/x-')) {
      return 'mui-x';
  } else if (id.includes('node_modules/@mui')) {
      return 'mui';
  } else if (id.includes('node_modules')) {
      return 'vendor';
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

    // When false, all CSS will be extracted into a single CSS file.
    cssCodeSplit: false,

    // https://rollupjs.org/configuration-options/
    rollupOptions: {
        output: {
            manualChunks: manualChunks
        },
        treeshake: {
          // https://rollupjs.org/configuration-options/#treeshake
          preset: 'smallest',
          moduleSideEffects: true
        }
    }
  },
});
