import { expect, Page } from "@playwright/test";
import { test } from "fixtures";
import { TEST_PROJECT } from "~client/_test/test.data.helper";
import {
  LOOKSSAME_DEFAULT_CONFIG,
  ODIFF_DEFAULT_CONFIG,
  PIXELMATCH_DEFAULT_CONFIG,
  VLM_DEFAULT_CONFIG,
} from "~client/constants/project";
import { ImageComparison } from "~client/types/imageComparison";
import {
  API_URL,
  mockGetProjects,
  mockOllamaModels,
  mockSaveProject,
} from "utils/mocks";

const project = TEST_PROJECT;

test.beforeEach(async ({ page }) => {
  await mockGetProjects(page, [project]);
  await mockSaveProject(page);
  await mockOllamaModels(page, ["gemma3:12b", "llava:13b"]);
});

const savedProject = async (
  page: Page,
  save: () => Promise<void>,
): Promise<{
  imageComparison: string;
  config: Record<string, unknown>;
  body: Record<string, unknown>;
}> => {
  const [request] = await Promise.all([
    page.waitForRequest(
      (request) =>
        request.url() === `${API_URL}/projects` && request.method() === "PUT",
    ),
    save(),
  ]);
  const body = request.postDataJSON();

  return {
    imageComparison: body.imageComparison,
    config: JSON.parse(body.imageComparisonConfig),
    body,
  };
};

test("opens on the engine the project uses", async ({
  projectListPage,
  page,
}) => {
  await projectListPage.editBtn.click();

  await expect(projectListPage.imageComparison).toHaveText(
    ImageComparison.pixelmatch,
  );
  await expect(projectListPage.threshold).toHaveValue("0.1");
  await expect(
    projectListPage.switchLabelled("Allow diff dimensions"),
  ).not.toBeChecked();
  await expect(
    projectListPage.switchLabelled("Ignore anti-aliasing"),
  ).toBeChecked();
  expect(page.url()).toContain("/projects");
});

test("offers the four image comparison libraries", async ({
  projectListPage,
  page,
}) => {
  await projectListPage.editBtn.click();
  await projectListPage.imageComparison.click();

  // Ollama and Gemini live under "vlm", behind a second "VLM Provider" select
  await expect(page.getByRole("option")).toHaveText([
    ImageComparison.pixelmatch,
    ImageComparison.lookSame,
    ImageComparison.odiff,
    ImageComparison.vlm,
  ]);
});

test("shows the pixelmatch fields", async ({ projectListPage }) => {
  await projectListPage.editBtn.click();
  await projectListPage.selectImageComparison(ImageComparison.odiff);
  await projectListPage.selectImageComparison(ImageComparison.pixelmatch);

  await expect(
    projectListPage.switchLabelled("Allow diff dimensions"),
  ).toBeVisible();
  await expect(
    projectListPage.switchLabelled("Ignore anti-aliasing"),
  ).toBeVisible();
  await expect(projectListPage.threshold).toBeVisible();
  await expect(projectListPage.switchLabelled("Strict")).toHaveCount(0);
  await expect(projectListPage.switchLabelled("Output diff mask")).toHaveCount(
    0,
  );
  await expect(projectListPage.vlmProvider).toHaveCount(0);
});

test("shows the looksSame fields", async ({ projectListPage }) => {
  await projectListPage.editBtn.click();

  await projectListPage.selectImageComparison(ImageComparison.lookSame);

  await expect(projectListPage.switchLabelled("Strict")).toBeVisible();
  await expect(projectListPage.tolerance).toBeVisible();
  // the app spells the labels "anti-alliasing" and "carret"
  await expect(
    projectListPage.switchLabelled("Ignore anti-alliasing"),
  ).toBeVisible();
  await expect(
    projectListPage.dialog.getByLabel("Antialiasing tolerance"),
  ).toBeVisible();
  await expect(projectListPage.switchLabelled("Ignore carret")).toBeVisible();
  await expect(
    projectListPage.switchLabelled("Allow diff dimensions"),
  ).toBeVisible();
  await expect(projectListPage.threshold).toHaveCount(0);
  await expect(projectListPage.vlmProvider).toHaveCount(0);
});

test("shows the odiff fields", async ({ projectListPage }) => {
  await projectListPage.editBtn.click();

  await projectListPage.selectImageComparison(ImageComparison.odiff);

  await expect(
    projectListPage.switchLabelled("Output diff mask"),
  ).toBeVisible();
  await expect(
    projectListPage.switchLabelled("Fail on layout diff"),
  ).toBeVisible();
  // spelled "anti-alliasing" here too
  await expect(
    projectListPage.switchLabelled("Ignore anti-alliasing"),
  ).toBeVisible();
  await expect(projectListPage.threshold).toBeVisible();
  await expect(
    projectListPage.switchLabelled("Allow diff dimensions"),
  ).toHaveCount(0);
  await expect(projectListPage.switchLabelled("Strict")).toHaveCount(0);
});

test("shows the vlm fields, on Ollama to begin with", async ({
  projectListPage,
}) => {
  await projectListPage.editBtn.click();

  await projectListPage.selectImageComparison(ImageComparison.vlm);

  await expect(projectListPage.vlmProvider).toHaveText("Ollama");
  await expect(projectListPage.prompt).toBeVisible();
  await expect(projectListPage.temperature).toBeVisible();
  await expect(projectListPage.switchLabelled("Use Thinking")).toBeVisible();
  await expect(projectListPage.geminiModel).toHaveCount(0);
  await expect(projectListPage.threshold).toHaveCount(0);
});

test("lists the models Ollama has, once they are fetched", async ({
  projectListPage,
  page,
}) => {
  await projectListPage.editBtn.click();

  await projectListPage.selectImageComparison(ImageComparison.vlm);
  await projectListPage.ollamaModel.click();

  await expect(page.getByRole("option")).toHaveText([
    "gemma3:12b",
    "llava:13b",
  ]);
});

test("asks for the Ollama model by hand when it has none", async ({
  projectListPage,
  page,
}) => {
  await mockOllamaModels(page, []);
  await projectListPage.editBtn.click();

  await projectListPage.selectImageComparison(ImageComparison.vlm);

  await expect(
    projectListPage.dialog.getByText(
      "No models available. Enter model name manually.",
    ),
  ).toBeVisible();
  await expect(projectListPage.ollamaModelText).toBeVisible();
});

test("shows the Gemini fields after switching the VLM provider", async ({
  projectListPage,
}) => {
  await projectListPage.editBtn.click();
  await projectListPage.selectImageComparison(ImageComparison.vlm);

  await projectListPage.selectVlmProvider("Google Gemini");

  await expect(projectListPage.vlmProvider).toHaveText("Google Gemini");
  await expect(projectListPage.geminiModel).toHaveValue("gemini-1.5-pro");
  await expect(projectListPage.geminiApiKey).toHaveValue("");
  await expect(projectListPage.geminiApiKey).toHaveAttribute(
    "type",
    "password",
  );
  await expect(projectListPage.prompt).toBeVisible();
  await expect(projectListPage.temperature).toBeVisible();
  await expect(projectListPage.switchLabelled("Use Thinking")).toBeVisible();
  await expect(projectListPage.ollamaModel).toHaveCount(0);
});

test("keeps the prompt and temperature across a VLM provider switch", async ({
  projectListPage,
}) => {
  await projectListPage.editBtn.click();
  await projectListPage.selectImageComparison(ImageComparison.vlm);
  await projectListPage.temperature.fill("0.7");

  await projectListPage.selectVlmProvider("Google Gemini");

  await expect(projectListPage.temperature).toHaveValue("0.7");
});

test("brings the defaults back when the engine is switched away and back", async ({
  projectListPage,
}) => {
  await projectListPage.editBtn.click();
  await projectListPage.threshold.fill("0.5");
  await expect(projectListPage.threshold).toHaveValue("0.5");

  await projectListPage.selectImageComparison(ImageComparison.odiff);
  await projectListPage.selectImageComparison(ImageComparison.pixelmatch);

  await expect(projectListPage.threshold).toHaveValue("0.1");
});

test("keeps the config when the same engine is picked again", async ({
  projectListPage,
}) => {
  await projectListPage.editBtn.click();
  await projectListPage.threshold.fill("0.5");

  await projectListPage.selectImageComparison(ImageComparison.pixelmatch);

  await expect(projectListPage.threshold).toHaveValue("0.5");
});

test("saves a changed pixelmatch threshold", async ({
  projectListPage,
  page,
}) => {
  await projectListPage.editBtn.click();
  await projectListPage.threshold.fill("0.5");
  await projectListPage.switchLabelled("Allow diff dimensions").check();

  const saved = await savedProject(page, () =>
    projectListPage.modal.confirmBtn.click(),
  );

  expect(saved.imageComparison).toBe(ImageComparison.pixelmatch);
  expect(saved.config).toEqual({
    ...JSON.parse(PIXELMATCH_DEFAULT_CONFIG),
    threshold: 0.5,
    allowDiffDimensions: true,
  });
  expect(saved.body.id).toBe(project.id);
  await expect(projectListPage.modal.dialog).toBeHidden();
});

test("saves a changed looksSame config", async ({ projectListPage, page }) => {
  await projectListPage.editBtn.click();
  await projectListPage.selectImageComparison(ImageComparison.lookSame);
  await projectListPage.switchLabelled("Strict").check();
  await projectListPage.switchLabelled("Ignore carret").uncheck();

  const saved = await savedProject(page, () =>
    projectListPage.modal.confirmBtn.click(),
  );

  expect(saved.imageComparison).toBe(ImageComparison.lookSame);
  expect(saved.config).toEqual({
    ...JSON.parse(LOOKSSAME_DEFAULT_CONFIG),
    strict: true,
    ignoreCaret: false,
  });
});

test("saves a changed odiff config", async ({ projectListPage, page }) => {
  await projectListPage.editBtn.click();
  await projectListPage.selectImageComparison(ImageComparison.odiff);
  await projectListPage.threshold.fill("0.25");
  await projectListPage.switchLabelled("Output diff mask").uncheck();

  const saved = await savedProject(page, () =>
    projectListPage.modal.confirmBtn.click(),
  );

  expect(saved.imageComparison).toBe(ImageComparison.odiff);
  expect(saved.config).toEqual({
    ...JSON.parse(ODIFF_DEFAULT_CONFIG),
    threshold: 0.25,
    outputDiffMask: false,
  });
});

test("saves a chosen Ollama model", async ({ projectListPage, page }) => {
  await projectListPage.editBtn.click();
  await projectListPage.selectImageComparison(ImageComparison.vlm);
  await projectListPage.selectOllamaModel("llava:13b");
  // switch first: a focused field keeps its tooltip open over it
  await projectListPage.switchLabelled("Use Thinking").check();
  await projectListPage.temperature.fill("0.4");

  const saved = await savedProject(page, () =>
    projectListPage.modal.confirmBtn.click(),
  );

  expect(saved.imageComparison).toBe(ImageComparison.vlm);
  expect(saved.config).toEqual({
    ...JSON.parse(VLM_DEFAULT_CONFIG),
    provider: "ollama",
    model: "llava:13b",
    temperature: 0.4,
    useThinking: true,
  });
});

test("saves a Gemini model and key", async ({ projectListPage, page }) => {
  await projectListPage.editBtn.click();
  await projectListPage.selectImageComparison(ImageComparison.vlm);
  await projectListPage.selectVlmProvider("Google Gemini");
  await projectListPage.geminiModel.fill("gemini-1.5-flash");
  await projectListPage.geminiApiKey.fill("test-key");

  const saved = await savedProject(page, () =>
    projectListPage.modal.confirmBtn.click(),
  );

  expect(saved.imageComparison).toBe(ImageComparison.vlm);
  expect(saved.config).toMatchObject({
    provider: "gemini",
    model: "gemini-1.5-flash",
    apiKey: "test-key",
    temperature: 0.1,
    useThinking: false,
  });
});

test("does not save a Gemini project without its key", async ({
  projectListPage,
  page,
}) => {
  const saves: string[] = [];
  page.on("request", (request) => {
    if (request.url() === `${API_URL}/projects` && request.method() === "PUT") {
      saves.push(request.url());
    }
  });
  await projectListPage.editBtn.click();
  await projectListPage.selectImageComparison(ImageComparison.vlm);
  await projectListPage.selectVlmProvider("Google Gemini");

  await projectListPage.modal.confirmBtn.click();

  // the browser's required-field check stops the form before the validator's message
  await expect
    .poll(() =>
      projectListPage.geminiApiKey.evaluate(
        (input: HTMLInputElement) => input.validity.valueMissing,
      ),
    )
    .toBe(true);
  await expect(projectListPage.modal.dialog).toBeVisible();
  expect(saves).toEqual([]);
});
