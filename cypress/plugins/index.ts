import {startDevServer} from "@cypress/webpack-dev-server";
import {addVisualRegressionTrackerPlugin} from "@visual-regression-tracker/agent-cypress/dist/plugin";

/**
 * @type {Cypress.PluginConfig}
 */
export default function (on, config) { // react component tests
    on("dev-server:start", async (options) => {
        return startDevServer({options});
    });
    config.env.reactDevtools = true;

    // visual testing
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

    // IMPORTANT to return the config object
    // with the any changed environment variables
    return config;
};
