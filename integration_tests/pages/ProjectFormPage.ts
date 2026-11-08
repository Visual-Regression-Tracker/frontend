import { Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class ProjectFormPage extends BasePage {
  // a getter: the field initialisers below run before a subclass's own fields exist
  protected get root(): Locator {
    return this.page.locator("body");
  }

  name = this.root.locator("#name");
  mainBranch = this.root.locator("#branchName");
  buildCount = this.root.locator("#buildCount");
  maxBranchLifetime = this.root.locator("#maxBranchLifetime");
  autoApprove = this.root.getByLabel("Auto approve", { exact: true });
  imageComparison = this.root.getByRole("combobox", {
    name: "Image comparison library",
  });

  blurSwitch = this.root.getByLabel("Stage 1 · Blur");
  dinov2Switch = this.root.getByLabel("Stage 2 · DINOv2 second look");
  amplitudeThreshold = this.root.getByLabel("Amplitude threshold");
  solidShareMax = this.root.getByLabel("Solid share, max");
  distanceThreshold = this.root.getByLabel("Distance threshold");
  needsStageOne = this.root.getByText("Needs stage 1");
  vlmNote = this.root.locator("#postAnalysisVlm");
  dinov2Status = this.root.locator("#dinov2Status");

  vlmProvider = this.root.getByRole("combobox", { name: "VLM Provider" });
  ollamaModel = this.root.getByRole("combobox", { name: "Model" });
  ollamaModelText = this.root.getByRole("textbox", {
    name: /^Model/,
  });
  geminiModel = this.root.getByRole("textbox", { name: "Gemini Model" });
  // a password field has no role to find it by
  geminiApiKey = this.root.locator("#apiKey");
  prompt = this.root.getByRole("textbox", { name: "Prompt" });
  temperature = this.root.getByLabel("Temperature");
  threshold = this.root.getByLabel("Pixel diff threshold");
  tolerance = this.root.getByLabel("Tolerance", { exact: true });
  antialiasingTolerance = this.root.getByLabel("Antialiasing tolerance");
  variationAxis = this.root.getByRole("combobox", { name: "Variation axis" });
  noOllamaModels = this.root.getByText(
    "No models available. Enter model name manually.",
  );

  geminiApiKeyMissing(): Promise<boolean> {
    return this.geminiApiKey.evaluate(
      (input: HTMLInputElement) => input.validity.valueMissing,
    );
  }

  switchLabelled(label: string) {
    return this.root.getByLabel(label, { exact: true });
  }

  async selectImageComparison(value: string) {
    await this.imageComparison.click();
    await this.page.getByRole("option", { name: value, exact: true }).click();
  }

  async selectOllamaModel(value: string) {
    await this.ollamaModel.click();
    await this.page
      .getByRole("option", { name: value, exact: true })
      .press("Enter");
  }

  async selectVlmProvider(value: string) {
    await this.vlmProvider.click();
    await this.page.getByRole("option", { name: value, exact: true }).click();
  }
}
