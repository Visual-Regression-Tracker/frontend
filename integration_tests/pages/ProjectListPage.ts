import { BasePage } from "./BasePage";
import {
  LOCATOR_PROJECT_LIST_PAGE_PROJECT_LIST,
  TEST_ID,
} from "~client/constants/locators";

export class ProjectListPage extends BasePage {
  projects = this.page.locator(`#${LOCATOR_PROJECT_LIST_PAGE_PROJECT_LIST}`);
  // exact: the cards' "Add to favourites" also matches
  addBtn = this.page.getByRole("button", { name: "Add project", exact: true });
  deleteBtn = this.page.getByTestId(TEST_ID.delete);
  settingsBtn = this.page.getByTestId(TEST_ID.settingsIcon);
  loadingStatus = this.page.getByRole("status", { name: "Loading projects" });
  search = this.page.getByRole("searchbox", { name: "Search projects" });

  project(name: string) {
    return this.projects.filter({
      has: this.page.getByRole("heading", { name, exact: true }),
    });
  }

  section(name: string) {
    return this.page.getByRole("region", { name });
  }

  sectionHeadings(name: string) {
    return this.section(name).getByRole("heading", { level: 3 });
  }

  sectionHeading(name: string, heading: string) {
    return this.section(name).getByRole("heading", { name: heading });
  }

  starBtn(name: string) {
    return this.project(name).getByRole("button", { name: /favourites/ });
  }

  openLink(name: string) {
    return this.project(name).getByRole("link", { name, exact: true });
  }
}
