import { Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { TestRunList } from "./components/TestRunList";
import { TestRunFilters } from "./components/TestRunFilters";
import { BuildList } from "./components/BuildList";
import { TestDetailsDialog } from "./TestDetailsDialog";

export class ProjectPage extends BasePage {
  testRunList: TestRunList;
  testRunFilters: TestRunFilters;
  buildList: BuildList;
  details: TestDetailsDialog;
  noiseBanner = this.page.getByTestId("noise-banner");
  noiseCaption = this.page.getByText(/unresolved look like rendering noise/);
  detailsDialog = this.modal.dialog;

  constructor(page: Page) {
    super(page);
    this.testRunList = new TestRunList(page);
    this.testRunFilters = new TestRunFilters(page);
    this.buildList = new BuildList(page);
    this.details = new TestDetailsDialog(page);
  }
}
