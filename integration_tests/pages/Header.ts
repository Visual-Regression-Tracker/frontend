import { PageObject } from "./PageObject";
import {
  HEADER_AVATAR_BUTTON_TEST_ID,
  HEADER_AVATAR_MENU_ID,
  HEADER_LOGOUT_BUTTON_TEST_ID,
} from "~client/components/Header.locators";
import { LOCATOR_PROJECT_PAGE_SELECT_PROJECT } from "~client/constants/locators";

export class Header extends PageObject {
  avatarButton = this.page.getByTestId(HEADER_AVATAR_BUTTON_TEST_ID);
  avatarMenu = this.page.locator(`#${HEADER_AVATAR_MENU_ID}`);
  breadcrumb = this.page.getByRole("navigation", { name: "Breadcrumb" });
  projectCrumb = this.page.locator(`#${LOCATOR_PROJECT_PAGE_SELECT_PROJECT}`);
  projectSearch = this.page.getByRole("searchbox", { name: "Find project" });
  tabs = this.page.getByRole("navigation", { name: "Project", exact: true });
  logoutBtn = this.avatarMenu.getByTestId(HEADER_LOGOUT_BUTTON_TEST_ID);

  async openAvatarMenu() {
    await this.avatarButton.click();
  }

  async logout() {
    await this.openAvatarMenu();
    await this.logoutBtn.click();
  }

  tab(name: string) {
    return this.tabs.getByRole("tab", { name, exact: true });
  }

  projectMenuItem(name: string) {
    return this.page.getByRole("menuitem", { name, exact: true });
  }

  async switchProject(query: string, name = query) {
    await this.projectCrumb.click();
    await this.projectSearch.fill(query);
    await this.projectMenuItem(name).click();
  }

  avatarMenuItem(name: string) {
    return this.avatarMenu.getByRole("menuitem", { name });
  }
}
