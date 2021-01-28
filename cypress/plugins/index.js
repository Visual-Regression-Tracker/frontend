const {
  addVisualRegressionTrackerPlugin,
} = require("@visual-regression-tracker/agent-cypress/dist/plugin");

module.exports = async (on, config) => {
  require("cypress-react-unit-test/plugins/react-scripts")(on, config);
  addVisualRegressionTrackerPlugin(on, config);
  return config;
};
