import { ProjectFormPage } from "./ProjectFormPage";

export class ProjectSettingsPage extends ProjectFormPage {
  heading = this.page.getByRole("heading", { name: "Settings", level: 1 });
  saveBtn = this.page.getByRole("button", { name: "Save", exact: true });
}
