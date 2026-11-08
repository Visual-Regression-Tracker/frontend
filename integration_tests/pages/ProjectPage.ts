import { Page } from "@playwright/test";
import { BasePage } from "./BasePage";
import { TestRunList } from "./components/TestRunList";
import { TestRunFilters } from "./components/TestRunFilters";
import { BuildList } from "./components/BuildList";
import { BuildDetails } from "./components/BuildDetails";
import { TestDetailsDialog } from "./TestDetailsDialog";
import { TEST_ID } from "~client/constants/locators";

export class ProjectPage extends BasePage {
  testRunList: TestRunList;
  testRunFilters: TestRunFilters;
  buildList: BuildList;
  buildDetails: BuildDetails;
  details: TestDetailsDialog;
  noiseBanner = this.page.getByTestId(TEST_ID.noiseBanner);
  noiseCaption = this.page.getByText(/unresolved look like rendering noise/);
  detailsDialog = this.modal.dialog;

  detailsText(text: string) {
    return this.detailsDialog.getByText(text, { exact: true });
  }

  constructor(page: Page) {
    super(page);
    this.testRunList = new TestRunList(page);
    this.testRunFilters = new TestRunFilters(page);
    this.buildList = new BuildList(page);
    this.buildDetails = new BuildDetails(page);
    this.details = new TestDetailsDialog(page);
  }
}
