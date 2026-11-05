import { PageObject } from "../PageObject";

export class BuildDetails extends PageObject {
  pane = this.page.locator("#build-details");
  menuButton = this.pane.getByRole("button", { name: "Build menu" });
  noiseLine = this.pane.getByTestId("build-noise-line");
  showNoise = this.pane.getByRole("button", { name: "Show them" });
  analyseNoiseItem = this.page.getByRole("menuitem", {
    name: /^Analyse rendering noise/,
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
