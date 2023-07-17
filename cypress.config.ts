import {defineConfig} from "cypress";
import viteConfig from "./vite.config";
import {addVisualRegressionTrackerPlugin} from '@visual-regression-tracker/agent-cypress/dist/plugin';

export function setupNodeEvents(on : Cypress.PluginEvents, config : Cypress.PluginConfigOptions) { // react component tests

    addVisualRegressionTrackerPlugin(on, config);

    on("before:browser:launch", (browser, launchOptions) => {
        if (browser.name === "chrome" && browser.isHeadless) {
            launchOptions.args.push(`--window-size=${
                config.viewportWidth
            },${
                config.viewportHeight
            }`);
            return launchOptions;
        }
    });

    return config;
}

export default defineConfig({
    fixturesFolder: false,
    screenshotOnRunFailure: false,
    retries: 0,
    viewportWidth: 1280,
    viewportHeight: 800,
    video: false,

    component: {
        setupNodeEvents,
        specPattern: "**/*.spec.*",
        devServer: {
            framework: "react",
            bundler: "vite",
            viteConfig
        }
    }
});
