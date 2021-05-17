const {
  addVisualRegressionTrackerPlugin,
} = require("@visual-regression-tracker/agent-cypress/dist/plugin");
const injectReactScriptsDevServer = require('@cypress/react/plugins/react-scripts')

module.exports = async (on, config) => {
  injectReactScriptsDevServer(on, config)
  addVisualRegressionTrackerPlugin(on, config);
  return config;
};
