const {
  addVisualRegressionTrackerPlugin,
} = require("@visual-regression-tracker/agent-cypress/dist/plugin");

module.exports = (on, config) => {
  require("cypress-react-unit-test/plugins/react-scripts")(on, config);

  if (config.env.VRT_API_KEY) {
    config.env.visualRegressionTracker.apiKey = config.env.VRT_API_KEY;
  }
  addVisualRegressionTrackerPlugin(on, config);

  return config;
};
