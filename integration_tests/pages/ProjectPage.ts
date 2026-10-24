import { Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { TestRunList } from "./components/TestRunList";
import { TestRunFilters } from "./components/TestRunFilters";
import { BuildList } from "./components/BuildList";
import { TestDetailsDialog } from "./TestDetailsDialog";
import { LOCATOR_PROJECT_PAGE_SELECT_PROJECT } from "~client/constants/help";

export class ProjectPage extends BasePage {
  testRunList: TestRunList;
  testRunFilters: TestRunFilters;
  buildList: BuildList;
  details: TestDetailsDialog;
  selectProject = this.page.locator(`#${LOCATOR_PROJECT_PAGE_SELECT_PROJECT}`);
  // the switcher's field: typing narrows the projects, Enter opens one
  projectField = this.page.getByRole("combobox", { name: "Project" });
  detailsDialog = this.page.getByRole("dialog");

  constructor(page: Page) {
    super(page);
    this.testRunList = new TestRunList(page);
    this.testRunFilters = new TestRunFilters(page);
    this.buildList = new BuildList(page);
    this.details = new TestDetailsDialog(page);
  }
}
