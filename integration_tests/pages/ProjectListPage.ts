import { BasePage } from "./BasePage";

export class ProjectListPage extends BasePage {
  projects = this.page.locator("#projectlist-1");
  // exact: the cards' "Add to favourites" also matches
  addBtn = this.page.getByRole("button", { name: "Add project", exact: true });
  deleteBtn = this.page.getByTestId("delete");
  settingsBtn = this.page.getByTestId("SettingsIcon");
  search = this.page.getByRole("searchbox", { name: "Search projects" });

  project(name: string) {
    return this.projects.filter({
      has: this.page.getByRole("heading", { name, exact: true }),
    });
  }

  section(name: string) {
    return this.page.getByRole("region", { name });
  }

  starBtn(name: string) {
    return this.project(name).getByRole("button", { name: /favourites/ });
  }

  openLink(name: string) {
    return this.project(name).getByRole("link", { name, exact: true });
  }
}
