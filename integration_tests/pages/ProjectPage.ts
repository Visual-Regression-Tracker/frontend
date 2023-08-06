import { BasePage } from "./BasePage";

export class ProjectPage extends BasePage {
  buildList = this.page.locator("#build-list");
  testRunList = this.page.locator("#test-run-list");

  getBuildLocator(number: number) {
    return this.buildList.getByText(`#${number}`);
  }

  getTestRunLocator(name: string) {
    return this.testRunList.getByText(name);
  }
}
