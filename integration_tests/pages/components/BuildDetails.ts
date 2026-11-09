import { PageObject } from "../PageObject";
import { LOCATOR_BUILD_DETAILS, TEST_ID } from "~client/constants/locators";

export class BuildDetails extends PageObject {
  pane = this.page.locator(`#${LOCATOR_BUILD_DETAILS}`);
  menuButton = this.pane.getByRole("button", { name: "Build menu" });
  noiseLine = this.pane.getByTestId(TEST_ID.buildNoiseLine);
  analyseNoiseItem = this.page.getByRole("menuitem", {
    name: /^Analyse noise/,
  });

  statusCounter(name: string) {
    return this.pane.getByRole("button", {
      name: new RegExp(String.raw`^${name} \d+$`),
    });
  }

  async openMenu() {
    await this.menuButton.click();
  }
}
