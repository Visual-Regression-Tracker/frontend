const {
  addVisualRegressionTrackerPlugin,
} = require("@visual-regression-tracker/agent-cypress/dist/plugin");
const branch = require("git-branch");

module.exports = async (on, config) => {
  require("cypress-react-unit-test/plugins/react-scripts")(on, config);

  if (config.env.VRT_API_KEY) {
    config.env.visualRegressionTracker.apiKey = config.env.VRT_API_KEY;
  }

  // try to get the current branch name to set it as branch name for VRT plugin
  await branch("./").then((branchName) => {
    // update the config with the retrieved name
    console.log(branchName)
    config.env.visualRegressionTracker.branchName = branchName;
  });

  addVisualRegressionTrackerPlugin(on, config);

  return config;
};
