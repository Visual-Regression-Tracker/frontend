import { Route, Routes } from "react-router-dom";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../_test/render";
import { TEST_PROJECT, TEST_USER } from "../_test/test.data.helper";
import { dinov2Service, projectsService } from "../services";
import { NoiseAnalysisConfig, Project } from "../types";
import ProjectSettingsPage from "./ProjectSettingsPage";

const ALPHA: Project = { ...TEST_PROJECT, id: "alpha-id", name: "Alpha" };
const BETA: Project = { ...TEST_PROJECT, id: "beta-id", name: "Beta" };

const renderPage = ({
  projects = [ALPHA] as Project[],
  projectId = ALPHA.id,
} = {}) => {
  vi.spyOn(projectsService, "getAll").mockResolvedValue(projects);
  vi.spyOn(projectsService, "getFavorites").mockResolvedValue([]);
  vi.spyOn(dinov2Service, "getStatus").mockResolvedValue({
    configured: true,
    available: true,
  });
  const result = renderWithProviders(
    <Routes>
      <Route path="/settings/:projectId" element={<ProjectSettingsPage />} />
    </Routes>,
    { user: TEST_USER, route: `/settings/${projectId}` },
  );
  return result;
};

describe("ProjectSettingsPage", () => {
  test("loads the project the link names", async () => {
    renderPage({ projects: [ALPHA, BETA], projectId: BETA.id });

    expect(
      await screen.findByRole("textbox", { name: /project name/i }),
    ).toHaveValue("Beta");
    expect(screen.getByRole("heading", { name: "Settings" })).toBeVisible();
  });

  test("says so when the project does not exist", async () => {
    renderPage({ projectId: "missing-id" });

    expect(await screen.findByText("Project not found")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
  });

  test("shows a progress placeholder while the projects load", () => {
    vi.spyOn(projectsService, "getAll").mockReturnValue(new Promise(() => {}));
    vi.spyOn(projectsService, "getFavorites").mockResolvedValue([]);
    renderWithProviders(
      <Routes>
        <Route path="/settings/:projectId" element={<ProjectSettingsPage />} />
      </Routes>,
      { user: TEST_USER, route: `/settings/${ALPHA.id}` },
    );

    expect(
      screen.getByRole("status", { name: "Loading project" }),
    ).toBeVisible();
  });

  test("saves the changed project with its own button and says so", async () => {
    const update = vi
      .spyOn(projectsService, "update")
      .mockResolvedValue({ ...ALPHA, name: "Renamed" });
    const { user } = renderPage();
    const name = await screen.findByRole("textbox", { name: /project name/i });

    await user.clear(name);
    await user.type(name, "Renamed");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
    expect(update).toHaveBeenCalledWith({
      ...ALPHA,
      name: "Renamed",
    });
    expect(await screen.findByText("Renamed updated")).toBeVisible();
  });

  test("does not save a name that is too short", async () => {
    const update = vi.spyOn(projectsService, "update");
    const { user } = renderPage();
    const name = await screen.findByRole("textbox", { name: /project name/i });

    await user.clear(name);
    await user.type(name, "A");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText("Enter at least two characters."),
    ).toBeVisible();
    expect(update).not.toHaveBeenCalled();
  });

  test("shows the API's refusal and keeps the form", async () => {
    vi.spyOn(projectsService, "update").mockRejectedValue(
      "Main branch is taken",
    );
    const { user } = renderPage();
    await screen.findByRole("textbox", { name: /project name/i });

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      (await screen.findByText("Main branch is taken")).closest(
        ".notistack-MuiContent",
      ),
    ).toHaveClass("notistack-MuiContent-error");
    expect(
      screen.getByRole("textbox", { name: /project name/i }),
    ).toBeVisible();
  });

  test("starts from the saved project when it is opened again", async () => {
    const { user, unmount } = renderPage();
    const name = await screen.findByRole("textbox", { name: /project name/i });
    await user.clear(name);
    await user.type(name, "Unsaved");
    unmount();

    renderPage();

    expect(
      await screen.findByRole("textbox", { name: /project name/i }),
    ).toHaveValue("Alpha");
  });

  describe("saving the post-analysis settings", () => {
    const stored = JSON.parse(
      TEST_PROJECT.noiseAnalysisConfig,
    ) as NoiseAnalysisConfig;

    test.each([
      [
        "blur.enabled",
        () => screen.getByLabelText(/^Blurred difference/),
        undefined,
        { ...stored, blur: { ...stored.blur, enabled: false } },
      ],
      [
        "blur.amplitudeThreshold",
        () => screen.getByLabelText(/^Amplitude threshold/),
        "60",
        { ...stored, blur: { ...stored.blur, amplitudeThreshold: 60 } },
      ],
      [
        "blur.solidShareMax",
        () => screen.getByLabelText(/^Solid share, max/),
        "0.02",
        { ...stored, blur: { ...stored.blur, solidShareMax: 0.02 } },
      ],
      [
        "dinov2.enabled",
        () => screen.getByLabelText(/^Asks the DINOv2 service/),
        undefined,
        { ...stored, dinov2: { ...stored.dinov2, enabled: false } },
      ],
      [
        "dinov2.distanceThreshold",
        () => screen.getByLabelText(/^Distance threshold/),
        "0.3",
        { ...stored, dinov2: { ...stored.dinov2, distanceThreshold: 0.3 } },
      ],
    ])("sends only %s changed", async (_key, field, typed, expected) => {
      const update = vi
        .spyOn(projectsService, "update")
        .mockResolvedValue(ALPHA);
      const { user } = renderPage();
      await screen.findByRole("textbox", { name: /project name/i });

      if (typed === undefined) {
        await user.click(field());
      } else {
        await user.type(field(), typed, {
          initialSelectionStart: 0,
          initialSelectionEnd: (field() as HTMLInputElement).value.length,
        });
      }
      await user.click(screen.getByRole("button", { name: "Save" }));

      await waitFor(() => expect(update).toHaveBeenCalledTimes(1));
      expect(update).toHaveBeenCalledWith({
        ...ALPHA,
        noiseAnalysisConfig: JSON.stringify(expected),
      });
    });
  });
});
