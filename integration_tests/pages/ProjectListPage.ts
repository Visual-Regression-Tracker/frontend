import { Locator } from "@playwright/test";
import { ProjectFormPage } from "./ProjectFormPage";

export class ProjectListPage extends ProjectFormPage {
  projects = this.page.locator("#projectlist-1");
  // exact: the cards' "Add to favourites" also matches
  addBtn = this.page.getByRole("button", { name: "Add project", exact: true });
  deleteBtn = this.page.getByTestId("delete");
  editBtn = this.page.getByTestId("EditIcon");
  search = this.page.getByRole("searchbox", { name: "Search projects" });
  dialog = this.modal.dialog;

  protected get root(): Locator {
    return this.modal.dialog;
  }

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

  buildsLink(name: string) {
    return this.project(name).getByRole("link", { name: "Builds" });
  }
}
