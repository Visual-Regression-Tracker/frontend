import { Page } from "@playwright/test";
import {
  HEADER_HELP_MENU_ID,
  HEADER_HELP_MENU_BUTTON_TEST_ID,
} from "~client/components/Header.locators";
import { TAKE_TOUR_BUTTON_TEST_ID } from "~client/components/GuidedTour.locators";
import { TourModal } from "./TourModal";

export class Header {
  helpMenuButton = this.page.getByTestId(HEADER_HELP_MENU_BUTTON_TEST_ID);
  helpMenu = this.page.getByTestId(HEADER_HELP_MENU_ID);
  takeTourButton = this.helpMenu.getByTestId(TAKE_TOUR_BUTTON_TEST_ID);

  constructor(public page: Page) {
    this.page = page;
  }

  async startTour(): Promise<TourModal> {
    await this.helpMenuButton.click();
    await this.takeTourButton.click();

    return new TourModal(this.page);
  }
}
