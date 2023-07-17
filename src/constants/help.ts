import { type Step } from "react-joyride";

export const LOCATOR_LOGIN_FORM = "loginform-1";
export const LOCATOR_BUILD_DETAILS = "build-details";
export const LOCATOR_RESET_FILTER = "reset-filter";
export const LOCATOR_TEST_VARIATION_SELECT_BRANCH = "select-branch";
export const LOCATOR_PROJECT_LIST_PAGE_PROJECT_LIST = "projectlist-1";
export const LOCATOR_PROJECT_PAGE_SELECT_PROJECT = "select-project";
export const LOCATOR_PROJECT_PAGE_BUILD_LIST = "build-list";
export const LOCATOR_PROJECT_PAGE_BUILD_DETAILS = "build-details";
export const LOCATOR_PROJECT_PAGE_TEST_RUN_LIST = "test-run-list";
export const LOCATOR_TEST_VARIATION_LIST_PAGE_SELECT_PROJECT = "select-project";
export const LOCATOR_TEST_VARIATION_LIST_PAGE_SELECT_BRANCH = "select-branch";
export const LOCATOR_TEST_VARIATION_LIST_PAGE_SELECT_RESET_FILTER =
  "reset-filter";

export const LOGIN_PAGE_STEPS: Step[] = [
  {
    target: `#${LOCATOR_LOGIN_FORM}`,
    content:
      "Default admin account: visual-regression-tracker@example.com / 123456. Make sure to change default password.",
  },
  {
    target: `#${LOCATOR_LOGIN_FORM}`,
    content: "Create new account without restrictions.",
  },
];

export const PROJECT_LIST_PAGE_STEPS: Step[] = [
  {
    target: `#${LOCATOR_PROJECT_LIST_PAGE_PROJECT_LIST}`,
    content:
      "Default project is created after first start, feel free to edit/add/delete projects.",
    title: "Project List",
  },
];

export const PROJECT_PAGE_STEPS: Step[] = [
  {
    target: "#" + LOCATOR_PROJECT_PAGE_SELECT_PROJECT,
    content: "Select the project for which you want to view details.",
  },
  {
    target: "#" + LOCATOR_PROJECT_PAGE_BUILD_LIST,
    content: "List of Builds",
  },
  {
    target: "#" + LOCATOR_PROJECT_PAGE_BUILD_LIST,
    content:
      "If you see 'No Builds', please run your image comparison from any client.",
  },
  {
    target: "#" + LOCATOR_PROJECT_PAGE_BUILD_DETAILS,
    content: "Breif details for selected build.",
  },
  {
    target: "#" + LOCATOR_PROJECT_PAGE_TEST_RUN_LIST,
    content: "TestRuns for selected build.",
  },
];

export const TEST_VARIATION_LIST_PAGE = [
  {
    target: "#" + LOCATOR_TEST_VARIATION_LIST_PAGE_SELECT_PROJECT,
    title:
      "Shows all the historical record of baselines by Name + Branch + OS + Browser + Viewport + Device",
    content: "Select the project you want to act on.",
  },
  {
    target: "#" + LOCATOR_TEST_VARIATION_SELECT_BRANCH,
    title: "Merge from one branch to another",
    content:
      "Select the branch from/to which you want to merge the variations.",
  },
  {
    target: "#" + LOCATOR_TEST_VARIATION_LIST_PAGE_SELECT_RESET_FILTER,
    content: "Only filtered items are displayed/merged to the target branch.",
  },
];
