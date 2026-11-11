export const LOCATOR_LOGIN_FORM = "loginform-1";
export const LOCATOR_BUILD_DETAILS = "build-details";
export const LOCATOR_TEST_VARIATION_FILTERS = "variation-filters";
export const LOCATOR_PROJECT_LIST_PAGE_PROJECT_LIST = "projectlist-1";
export const LOCATOR_PROJECT_PAGE_SELECT_PROJECT = "select-project";
export const LOCATOR_PROJECT_PAGE_BUILD_LIST = "build-list";
export const LOCATOR_PROJECT_PAGE_TEST_RUN_LIST = "test-run-list";

export const TEST_ID = {
  drawArea: "drawArea",
  overlayOpacity: "overlayOpacity",
  imageSize: "image-size",
  submit: "submit",
  password: "password",
  email: "email",
  stepPosition: "step-position",
  oidcLoginBtn: "oidcLoginBtn",
  noiseHintChip: "noise-hint-chip",
  firstName: "firstName",
  lastName: "lastName",
  apiKey: "apiKey",
  zoomLevel: "zoom-level",
  vlmAnalysis: "vlm-analysis",
  testRunNameFilter: "testRunNameFilter",
  testRunGrid: "testRunGrid",
  testRunCard: "testRunCard",
  submitButton: "submitButton",
  role: "role",
  noiseHintPopoverChip: "noise-hint-popover-chip",
  noiseHintPanel: "noise-hint-panel",
  newCiBuildId: "newCiBuildId",
  loginBtn: "loginBtn",
  gridViewToggle: "gridViewToggle",
  tableViewToggle: "tableViewToggle",
  gridSelectionCount: "gridSelectionCount",
  gridSelectAll: "gridSelectAll",
  dismissNotification: "dismissNotification",
  delete: "delete",
  comment: "comment",
  colorModeToggle: "colorModeToggle",
  cardTags: "cardTags",
  cardTag: "cardTag",
  cardName: "cardName",
  buildSelectAll: "buildSelectAll",
  buildSearch: "buildSearch",
  buildListScroll: "buildListScroll",
  buildListError: "buildListError",
  buildListEmpty: "buildListEmpty",
  buildNoiseLine: "build-noise-line",
  analyseNoiseRunButton: "analyse-noise-run-button",
  closeIcon: "CloseIcon",
  addIcon: "AddIcon",
  deleteIcon: "DeleteIcon",
  layersClearIcon: "LayersClearIcon",
  collectionsIcon: "CollectionsIcon",
  saveIcon: "SaveIcon",
  settingsIcon: "SettingsIcon",
  warningRoundedIcon: "WarningRoundedIcon",
} as const;

export const ELEMENT_ID = {
  postAnalysisVlm: "postAnalysisVlm",
  dinov2Status: "dinov2Status",
  configFile: "configFile",
  envVariables: "envVariables",
  name: "name",
  geminiApiKey: "apiKey",
  branchName: "branchName",
  buildCount: "buildCount",
  maxBranchLifetime: "maxBranchLifetime",
} as const;

export const filterChipId = (id: string) => `filter-chip-${id}`;
export const gridSortTestId = (field: string) => `gridSort-${field}`;
