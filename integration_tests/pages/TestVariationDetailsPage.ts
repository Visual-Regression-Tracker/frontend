import { BasePage } from "./BasePage";

export class TestVariationDetailsPage extends BasePage {
  testRunBtns = this.page.getByRole("button", { name: "Test Run" });
}
