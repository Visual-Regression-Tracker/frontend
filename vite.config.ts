import {defineConfig} from "vite";

import react from "@vitejs/plugin-react";

/*
Saved for later use once other libraries are being updated.
function manualChunks(id : string) {
    if (id.includes('node_modules/react')) {
        return 'react';
    } else if (id.includes('node_modules/@material-ui')) {
        return 'material';
    } else if (id.includes('node_modules')) {
        return 'vendor';
    }
}
*/

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    build: {
        outDir: 'build',
        sourcemap: true,

        // https://rollupjs.org/configuration-options/
        /*
        rollupOptions: {
            output: {
                manualChunks: manualChunks
            }
        }
        */
    }
});
