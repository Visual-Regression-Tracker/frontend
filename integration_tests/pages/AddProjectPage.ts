import { ProjectFormPage } from "./ProjectFormPage";

export class AddProjectPage extends ProjectFormPage {
  heading = this.page.getByRole("heading", { name: "Add project", level: 1 });
  createBtn = this.page.getByRole("button", { name: "Create", exact: true });
  cancelBtn = this.page.getByRole("button", { name: "Cancel", exact: true });
}
