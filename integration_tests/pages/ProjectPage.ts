import { Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { TestRunList } from "./components/TestRunList";
import { TestRunFilters } from "./components/TestRunFilters";
import { BuildList } from "./components/BuildList";
import { LOCATOR_PROJECT_PAGE_SELECT_PROJECT } from "~client/constants/help";

export class ProjectPage extends BasePage {
  testRunList: TestRunList;
  testRunFilters: TestRunFilters;
  buildList: BuildList;
  selectProject = this.page.locator(`#${LOCATOR_PROJECT_PAGE_SELECT_PROJECT}`);
  // the URL changes before the dialog has rendered the run (navigations are
  // transitions), so a hotkey pressed in between would be lost
  detailsDialog = this.page.getByRole("dialog");

  constructor(page: Page) {
    super(page);
    this.testRunList = new TestRunList(page);
    this.testRunFilters = new TestRunFilters(page);
    this.buildList = new BuildList(page);
  }
}
