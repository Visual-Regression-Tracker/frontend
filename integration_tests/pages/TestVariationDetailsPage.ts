import { BasePage } from "./BasePage";

export class TestVariationDetailsPage extends BasePage {
  testRunBtns = this.page.getByRole("button", { name: "Test run" });
  versionBtns = this.page.getByRole("button", { name: /^Show version/ });
  images = this.page.locator(".MuiCard-root img");
}
