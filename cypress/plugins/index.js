const {
  addVisualRegressionTrackerPlugin,
} = require("@visual-regression-tracker/agent-cypress/dist/plugin");

module.exports = async (on, config) => {
  require("cypress-react-unit-test/plugins/react-scripts")(on, config);

  if (config.env.VRT_API_KEY) {
    config.env.visualRegressionTracker.apiKey = config.env.VRT_API_KEY;
  }
  if (config.env.VRT_BRANCH_NAME) {
    config.env.visualRegressionTracker.branchName = config.env.VRT_BRANCH_NAME;
  }
  if (config.env.VRT_CI_BUILD_ID) {
    config.env.visualRegressionTracker.ciBuildId = config.env.VRT_CI_BUILD_ID;
  }
  console.log(config.env.VRT_CI_BUILD_ID);
  addVisualRegressionTrackerPlugin(on, config);
  return config;
};
