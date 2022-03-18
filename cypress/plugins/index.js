/// <reference types="cypress" />
// ***********************************************************
// This example plugins/index.js can be used to load plugins
//
// You can change the location of this file or turn off loading
// the plugins file with the 'pluginsFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/plugins-guide
// ***********************************************************

// This function is called when a project is opened or re-opened (e.g. due to
// the project's config changing)

const { startDevServer } = require("@cypress/webpack-dev-server");
const findReactScriptsWebpackConfig = require("@cypress/react/plugins/react-scripts/findReactScriptsWebpackConfig");
const {
  addVisualRegressionTrackerPlugin,
} = require("@visual-regression-tracker/agent-cypress/dist/plugin");

/**
 * @type {Cypress.PluginConfig}
 */
module.exports = (on, config) => {
  const webpackConfig = findReactScriptsWebpackConfig(config);

  // webpackConfig.resolve.fallback = {
  //   fs: false,
  // };

  // react component tests
  on("dev-server:start", async (options) => {
    return startDevServer({
      options,
      webpackConfig,
    });
  });
  config.env.reactDevtools = true;

  // visual testing
  addVisualRegressionTrackerPlugin(on, config);
  on("before:browser:launch", (browser, launchOptions) => {
    if (browser.name === "chrome" && browser.isHeadless) {
      launchOptions.args.push(
        `--window-size=${config.viewportWidth},${config.viewportHeight}`
      );
      return launchOptions;
    }
  });

  // IMPORTANT to return the config object
  // with the any changed environment variables
  return config;
};
