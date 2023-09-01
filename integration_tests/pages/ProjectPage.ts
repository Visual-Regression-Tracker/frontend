import { Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { TestRunList } from "./components/TestRunList";
import { BuildList } from "./components/BuildList";

export class ProjectPage extends BasePage {
  testRunList: TestRunList;
  buildList: BuildList;

  constructor(page: Page) {
    super(page);
    this.testRunList = new TestRunList(page);
    this.buildList = new BuildList(page);
  }
}
