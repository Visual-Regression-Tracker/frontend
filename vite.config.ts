import {defineConfig} from "vite";

import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    build: {
        outDir: 'build',

        // https://rollupjs.org/configuration-options/
        rollupOptions: {
            output: {
                manualChunks: manualChunks
            }
        }
    }
});
function manualChunks(id) {
    if (id.includes('node_modules/react')) {
        return 'react';
    } else if (id.includes('node_modules')) {
        return 'vendor';
    }
}
