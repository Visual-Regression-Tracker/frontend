import { BasePage } from "./BasePage";

export class ProjectListPage extends BasePage {
  projects = this.page.locator("#projectlist-1");
  // exact: the cards' "Add to favourites" would match a part of the name
  addBtn = this.page.getByRole("button", { name: "Add project", exact: true });
  deleteBtn = this.page.getByTestId("delete");
  editBtn = this.page.getByTestId("EditIcon");
  search = this.page.getByRole("searchbox", { name: "Search projects" });

  // ProjectForm, inside the create or update dialog
  dialog = this.modal.dialog;
  name = this.dialog.locator("#name");
  mainBranch = this.dialog.locator("#branchName");
  buildCount = this.dialog.locator("#buildCount");
  maxBranchLifetime = this.dialog.locator("#maxBranchLifetime");
  autoApprove = this.dialog.getByLabel("Auto approve feature");
  imageComparison = this.dialog.getByRole("combobox", {
    name: "Image comparison library",
  });

  // the rendering-noise filter: part of each library's config section
  noiseFilter = this.dialog.getByLabel("Ignore rendering noise");
  noiseThreshold = this.dialog.locator("#blurAmplitudeThreshold");

  // the engine's own fields, below the library select
  vlmProvider = this.dialog.getByRole("combobox", { name: "VLM Provider" });
  ollamaModel = this.dialog.getByRole("combobox", { name: "Model" });
  ollamaModelText = this.dialog.getByRole("textbox", {
    name: "Model",
    exact: true,
  });
  geminiModel = this.dialog.getByRole("textbox", { name: "Gemini Model" });
  // a password field has no role to find it by
  geminiApiKey = this.dialog.locator("#apiKey");
  prompt = this.dialog.getByRole("textbox", { name: "Prompt" });
  temperature = this.dialog.getByLabel("Temperature");
  threshold = this.dialog.getByLabel("Pixel diff threshold");
  tolerance = this.dialog.getByLabel("Tolerance", { exact: true });

  // the switches an engine shows, by the label they carry
  switchLabelled(label: string) {
    // by label, not role name: a tooltip's title becomes the label's name
    return this.dialog.getByLabel(label, { exact: true });
  }

  // a card is titled with its project's name
  project(name: string) {
    return this.projects.filter({
      has: this.page.getByRole("heading", { name, exact: true }),
    });
  }

  // "Favourites", "Recently opened", "Other projects"
  section(name: string) {
    return this.page.getByRole("region", { name });
  }

  starBtn(name: string) {
    return this.project(name).getByRole("button", { name: /favourites/ });
  }

  buildsLink(name: string) {
    return this.project(name).getByRole("link", { name: "Builds" });
  }

  async selectImageComparison(value: string) {
    await this.imageComparison.click();
    await this.page.getByRole("option", { name: value, exact: true }).click();
  }

  async selectOllamaModel(value: string) {
    await this.ollamaModel.click();
    // from the keyboard: the field's tooltip opens over the list on focus and
    // takes the pointer
    await this.page
      .getByRole("option", { name: value, exact: true })
      .press("Enter");
  }

  async selectVlmProvider(value: string) {
    await this.vlmProvider.click();
    await this.page.getByRole("option", { name: value, exact: true }).click();
  }
}
