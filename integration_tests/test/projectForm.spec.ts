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
import type { ProjectDto } from "~client/types";
import {
  API_URL,
  mockGetProjects,
  mockOllamaModels,
  mockSaveProject,
} from "utils/mocks";
import { postData } from "utils/postData";

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
  body: ProjectDto;
}> => {
  const [request] = await Promise.all([
    page.waitForRequest(
      (request) =>
        request.url() === `${API_URL}/projects` && request.method() === "PUT",
    ),
    save(),
  ]);
  const body = postData<ProjectDto>(request);

  return {
    imageComparison: body.imageComparison,
    config: JSON.parse(body.imageComparisonConfig) as Record<string, unknown>,
    body,
  };
};

test("opens on the engine the project uses", async ({
  projectSettingsPage,
  page,
}) => {
  await expect(projectSettingsPage.imageComparison).toHaveText(
    ImageComparison.pixelmatch,
  );
  await expect(projectSettingsPage.threshold).toHaveValue("0.1");
  await expect(
    projectSettingsPage.switchLabelled("Allow diff dimensions"),
  ).not.toBeChecked();
  await expect(
    projectSettingsPage.switchLabelled("Ignore anti-aliasing"),
  ).toBeChecked();
  expect(page.url()).toContain(`/settings/${project.id}`);
});

test("offers the four image comparison libraries", async ({
  projectSettingsPage,
}) => {
  await projectSettingsPage.imageComparison.click();

  // Ollama and Gemini live under "vlm", behind a second "VLM Provider" select
  await expect(projectSettingsPage.options).toHaveText([
    ImageComparison.pixelmatch,
    ImageComparison.lookSame,
    ImageComparison.odiff,
    ImageComparison.vlm,
  ]);
});

test("shows the pixelmatch fields", async ({ projectSettingsPage }) => {
  await projectSettingsPage.selectImageComparison(ImageComparison.odiff);
  await projectSettingsPage.selectImageComparison(ImageComparison.pixelmatch);

  await expect(
    projectSettingsPage.switchLabelled("Allow diff dimensions"),
  ).toBeVisible();
  await expect(
    projectSettingsPage.switchLabelled("Ignore anti-aliasing"),
  ).toBeVisible();
  await expect(projectSettingsPage.threshold).toBeVisible();
  await expect(projectSettingsPage.switchLabelled("Strict")).toHaveCount(0);
  await expect(
    projectSettingsPage.switchLabelled("Output diff mask"),
  ).toHaveCount(0);
  await expect(projectSettingsPage.vlmProvider).toHaveCount(0);
});

test("shows the looksSame fields", async ({ projectSettingsPage }) => {
  await projectSettingsPage.selectImageComparison(ImageComparison.lookSame);

  await expect(projectSettingsPage.switchLabelled("Strict")).toBeVisible();
  await expect(projectSettingsPage.tolerance).toBeVisible();
  await expect(
    projectSettingsPage.switchLabelled("Ignore anti-aliasing"),
  ).toBeVisible();
  await expect(projectSettingsPage.antialiasingTolerance).toBeVisible();
  await expect(
    projectSettingsPage.switchLabelled("Ignore caret"),
  ).toBeVisible();
  await expect(
    projectSettingsPage.switchLabelled("Allow diff dimensions"),
  ).toBeVisible();
  await expect(projectSettingsPage.threshold).toHaveCount(0);
  await expect(projectSettingsPage.vlmProvider).toHaveCount(0);
});

test("shows the odiff fields", async ({ projectSettingsPage }) => {
  await projectSettingsPage.selectImageComparison(ImageComparison.odiff);

  await expect(
    projectSettingsPage.switchLabelled("Output diff mask"),
  ).toBeVisible();
  await expect(
    projectSettingsPage.switchLabelled("Fail on layout diff"),
  ).toBeVisible();
  await expect(
    projectSettingsPage.switchLabelled("Ignore anti-aliasing"),
  ).toBeVisible();
  await expect(projectSettingsPage.threshold).toBeVisible();
  await expect(
    projectSettingsPage.switchLabelled("Allow diff dimensions"),
  ).toHaveCount(0);
  await expect(projectSettingsPage.switchLabelled("Strict")).toHaveCount(0);
});

test("shows the vlm fields, on Ollama to begin with", async ({
  projectSettingsPage,
}) => {
  await projectSettingsPage.selectImageComparison(ImageComparison.vlm);

  await expect(projectSettingsPage.vlmProvider).toHaveText("Ollama");
  await expect(projectSettingsPage.prompt).toBeVisible();
  await expect(projectSettingsPage.temperature).toBeVisible();
  await expect(
    projectSettingsPage.switchLabelled("Use Thinking"),
  ).toBeVisible();
  await expect(projectSettingsPage.geminiModel).toHaveCount(0);
  await expect(projectSettingsPage.threshold).toHaveCount(0);
});

test("lists the models Ollama has, once they are fetched", async ({
  projectSettingsPage,
}) => {
  await projectSettingsPage.selectImageComparison(ImageComparison.vlm);
  await projectSettingsPage.ollamaModel.click();

  await expect(projectSettingsPage.options).toHaveText([
    "gemma3:12b",
    "llava:13b",
  ]);
});

test("asks for the Ollama model by hand when it has none", async ({
  projectSettingsPage,
  page,
}) => {
  await mockOllamaModels(page, []);

  await projectSettingsPage.selectImageComparison(ImageComparison.vlm);

  await expect(projectSettingsPage.noOllamaModels).toBeVisible();
  await expect(projectSettingsPage.ollamaModelText).toBeVisible();
});

test("shows the Gemini fields after switching the VLM provider", async ({
  projectSettingsPage,
}) => {
  await projectSettingsPage.selectImageComparison(ImageComparison.vlm);

  await projectSettingsPage.selectVlmProvider("Google Gemini");

  await expect(projectSettingsPage.vlmProvider).toHaveText("Google Gemini");
  await expect(projectSettingsPage.geminiModel).toHaveValue("gemini-1.5-pro");
  await expect(projectSettingsPage.geminiApiKey).toHaveValue("");
  await expect(projectSettingsPage.geminiApiKey).toHaveAttribute(
    "type",
    "password",
  );
  await expect(projectSettingsPage.prompt).toBeVisible();
  await expect(projectSettingsPage.temperature).toBeVisible();
  await expect(
    projectSettingsPage.switchLabelled("Use Thinking"),
  ).toBeVisible();
  await expect(projectSettingsPage.ollamaModel).toHaveCount(0);
});

test("keeps the prompt and temperature across a VLM provider switch", async ({
  projectSettingsPage,
}) => {
  await projectSettingsPage.selectImageComparison(ImageComparison.vlm);
  await projectSettingsPage.temperature.fill("0.7");

  await projectSettingsPage.selectVlmProvider("Google Gemini");

  await expect(projectSettingsPage.temperature).toHaveValue("0.7");
});

test("brings the defaults back when the engine is switched away and back", async ({
  projectSettingsPage,
}) => {
  await projectSettingsPage.threshold.fill("0.5");
  await expect(projectSettingsPage.threshold).toHaveValue("0.5");

  await projectSettingsPage.selectImageComparison(ImageComparison.odiff);
  await projectSettingsPage.selectImageComparison(ImageComparison.pixelmatch);

  await expect(projectSettingsPage.threshold).toHaveValue("0.1");
});

test("keeps the config when the same engine is picked again", async ({
  projectSettingsPage,
}) => {
  await projectSettingsPage.threshold.fill("0.5");

  await projectSettingsPage.selectImageComparison(ImageComparison.pixelmatch);

  await expect(projectSettingsPage.threshold).toHaveValue("0.5");
});

test("saves a changed pixelmatch threshold", async ({
  projectSettingsPage,
  page,
}) => {
  await projectSettingsPage.threshold.fill("0.5");
  await projectSettingsPage.switchLabelled("Allow diff dimensions").check();

  const saved = await savedProject(page, () =>
    projectSettingsPage.saveBtn.click(),
  );

  expect(saved.imageComparison).toBe(ImageComparison.pixelmatch);
  expect(saved.config).toEqual({
    ...JSON.parse(PIXELMATCH_DEFAULT_CONFIG),
    threshold: 0.5,
    allowDiffDimensions: true,
  });
  expect(saved.body.id).toBe(project.id);
  await expect(projectSettingsPage.notification.message).toHaveText(
    `${project.name} updated`,
  );
});

test("saves a changed looksSame config", async ({
  projectSettingsPage,
  page,
}) => {
  await projectSettingsPage.selectImageComparison(ImageComparison.lookSame);
  await projectSettingsPage.switchLabelled("Strict").check();
  await projectSettingsPage.switchLabelled("Ignore caret").uncheck();

  const saved = await savedProject(page, () =>
    projectSettingsPage.saveBtn.click(),
  );

  expect(saved.imageComparison).toBe(ImageComparison.lookSame);
  expect(saved.config).toEqual({
    ...JSON.parse(LOOKSSAME_DEFAULT_CONFIG),
    strict: true,
    ignoreCaret: false,
  });
});

test("saves a changed odiff config", async ({ projectSettingsPage, page }) => {
  await projectSettingsPage.selectImageComparison(ImageComparison.odiff);
  await projectSettingsPage.threshold.fill("0.25");
  await projectSettingsPage.switchLabelled("Output diff mask").uncheck();

  const saved = await savedProject(page, () =>
    projectSettingsPage.saveBtn.click(),
  );

  expect(saved.imageComparison).toBe(ImageComparison.odiff);
  expect(saved.config).toEqual({
    ...JSON.parse(ODIFF_DEFAULT_CONFIG),
    threshold: 0.25,
    outputDiffMask: false,
  });
});

test("saves a chosen Ollama model", async ({ projectSettingsPage, page }) => {
  await projectSettingsPage.selectImageComparison(ImageComparison.vlm);
  await projectSettingsPage.selectOllamaModel("llava:13b");
  // switch first: a focused field keeps its tooltip open over it
  await projectSettingsPage.switchLabelled("Use Thinking").check();
  await projectSettingsPage.temperature.fill("0.4");

  const saved = await savedProject(page, () =>
    projectSettingsPage.saveBtn.click(),
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

test("saves a Gemini model and key", async ({ projectSettingsPage, page }) => {
  await projectSettingsPage.selectImageComparison(ImageComparison.vlm);
  await projectSettingsPage.selectVlmProvider("Google Gemini");
  await projectSettingsPage.geminiModel.fill("gemini-1.5-flash");
  await projectSettingsPage.geminiApiKey.fill("test-key");

  const saved = await savedProject(page, () =>
    projectSettingsPage.saveBtn.click(),
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
  projectSettingsPage,
  page,
}) => {
  const saves: string[] = [];
  page.on("request", (request) => {
    if (request.url() === `${API_URL}/projects` && request.method() === "PUT") {
      saves.push(request.url());
    }
  });
  await projectSettingsPage.selectImageComparison(ImageComparison.vlm);
  await projectSettingsPage.selectVlmProvider("Google Gemini");

  await projectSettingsPage.saveBtn.click();

  // the browser's required-field check stops the form before the validator's message
  await expect.poll(() => projectSettingsPage.geminiApiKeyMissing()).toBe(true);
  expect(saves).toEqual([]);
});
