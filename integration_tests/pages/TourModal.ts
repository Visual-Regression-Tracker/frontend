import { PageObject } from "./PageObject";

export class TourModal extends PageObject {
  joyrideOverlay = this.page.locator(".react-joyride__tooltip");
  skipButton = this.joyrideOverlay.getByRole("button", { name: /skip/i });
  nextButton = this.joyrideOverlay.getByRole("button", { name: /next/i });
  lastButton = this.joyrideOverlay.getByRole("button", { name: /last/i });
  backButton = this.joyrideOverlay.getByRole("button", { name: /back/i });
  closeButton = this.joyrideOverlay.getByRole("button", { name: /close/i });

  async skipTour() {
    await this.skipButton.click();
  }

  async clickNext() {
    await this.nextButton.click();
  }

  async clickLast() {
    await this.lastButton.click();
  }

  async clickBack() {
    await this.backButton.click();
  }

  async clickClose() {
    await this.closeButton.click();
  }
}
