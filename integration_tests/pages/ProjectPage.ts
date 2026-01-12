import { Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { TestRunList } from "./components/TestRunList";
import { BuildList } from "./components/BuildList";
import { LOCATOR_PROJECT_PAGE_SELECT_PROJECT } from "~client/constants/help";

export class ProjectPage extends BasePage {
  testRunList: TestRunList;
  buildList: BuildList;
  selectProject = this.page.locator(`#${LOCATOR_PROJECT_PAGE_SELECT_PROJECT}`);

  constructor(page: Page) {
    super(page);
    this.testRunList = new TestRunList(page);
    this.buildList = new BuildList(page);
  }
}
