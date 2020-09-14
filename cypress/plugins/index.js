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
  addVisualRegressionTrackerPlugin(on, config);

  console.log(config);
  return config;
};
