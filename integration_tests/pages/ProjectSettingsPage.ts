import { ProjectFormPage } from "./ProjectFormPage";

export class ProjectSettingsPage extends ProjectFormPage {
  saveBtn = this.page.getByRole("button", { name: "Save", exact: true });
}
