import { useEffect, type ReactNode } from "react";
import type { UserEvent } from "@testing-library/user-event";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../../_test/render";
import { buttonAroundIcon } from "../../_test/buttonAroundIcon";
import { projectsService, testRunService } from "../../services";
import {
  selectProject,
  useProjectDispatch,
  useProjectState,
  useTestRunState,
} from "../../contexts";
import { Project, TestRun } from "../../types";
import { ImageComparison } from "../../types/imageComparison";
import { IgnoreArea } from "../../types/ignoreArea";
import { TestStatus } from "../../types/testStatus";
import { GO_TO_NEXT_KEY } from "../../constants";
import {
  NOISE_ANALYSIS_CHANGE,
  TEST_PROJECT,
  TEST_USER,
  testRunMock,
} from "../../_test/test.data.helper";
import { withRegions } from "../../_test/noiseRegions";
import TestDetailsModal from "./TestDetailsModal";
import { NO_FAILURES } from "../../_test/bulkResult";

// Konva needs native canvas under Node; a stand-in lets tests draw and delete areas
vi.mock("./DrawArea", () => import("../../_test/FakeDrawArea"));

const SelectProject = () => {
  const dispatch = useProjectDispatch();
  const { projectList, selectedProjectId } = useProjectState();
  useEffect(() => selectProject(dispatch, TEST_PROJECT.id), [dispatch]);
  return projectList.length > 0 && selectedProjectId === TEST_PROJECT.id ? (
    <div data-testid="project-ready" />
  ) : null;
};

const SAVED_AREA: IgnoreArea = {
  id: "saved",
  x: 5,
  y: 6,
  width: 70,
  height: 80,
};
const RUN: TestRun = { ...testRunMock, ignoreAreas: "[]" };

interface Position {
  currentRunIndex: number;
  totalTestRunCount: number;
}

const Modal = ({
  testRun,
  position,
  handlers,
}: {
  testRun: TestRun;
  position: Position;
  handlers: { close: () => void; previous: () => void; next: () => void };
}) => {
  const { touched } = useTestRunState();
  return (
    <TestDetailsModal
      testRun={testRun}
      currentRunIndex={position.currentRunIndex}
      totalTestRunCount={position.totalTestRunCount}
      touched={touched}
      handleClose={handlers.close}
      handlePrevious={handlers.previous}
      handleNext={handlers.next}
      navigateTo={vi.fn()}
    />
  );
};

const renderModal = (
  testRun: TestRun = RUN,
  position: Position = { currentRunIndex: 0, totalTestRunCount: 1 },
  sibling?: ReactNode,
) => {
  const handlers = { close: vi.fn(), previous: vi.fn(), next: vi.fn() };
  const result = renderWithProviders(
    <>
      {sibling}
      <Modal testRun={testRun} position={position} handlers={handlers} />
    </>,
    { user: TEST_USER },
  );
  return {
    ...result,
    handlers,
    showTestRun: (run: TestRun) =>
      result.rerender(
        <>
          {sibling}
          <Modal testRun={run} position={position} handlers={handlers} />
        </>,
      ),
  };
};

const ignoreAreaCount = () => screen.getByTestId("ignoreAreaCount").textContent;
const drawAnArea = () => screen.getByRole("button", { name: "Draw an area" });
const draw = async (user: UserEvent) => {
  const edit = screen.queryByRole("button", { name: "Edit areas" });
  if (edit) {
    await user.click(edit);
  }
  await user.click(drawAnArea());
};
const saveButton = () => buttonAroundIcon("SaveIcon");
const applyToBuildButton = () => buttonAroundIcon("CollectionsIcon");
const deleteTheArea = () =>
  screen.getByRole("button", { name: "Delete the selected area" });
// a tooltip names these two buttons after their hotkey, so they are found by text
const approveButton = () => screen.getByText("Approve", { selector: "button" });
const rejectButton = () => screen.getByText("Reject", { selector: "button" });
const goToNextCheckbox = () =>
  screen.getByRole("checkbox", { name: "Go to the next after Approve/Reject" });
const UNRESOLVED_RUN: TestRun = { ...RUN, status: TestStatus.unresolved };

describe("TestDetailsModal", () => {
  describe("saving ignore areas", () => {
    it("saves the drawn areas and has nothing left to save", async () => {
      const updateIgnoreAreas = vi
        .spyOn(testRunService, "updateIgnoreAreas")
        .mockResolvedValue();
      const { user } = renderModal();

      await draw(user);
      expect(saveButton()).toBeEnabled();
      await user.click(saveButton());

      expect(updateIgnoreAreas).toHaveBeenCalledWith({
        ids: [RUN.id],
        ignoreAreas: [expect.objectContaining({ id: "drawn-0" })],
      });
      expect(
        await screen.findByText("Ignore areas are updated."),
      ).toBeVisible();
      expect(screen.getByRole("button", { name: "Edit areas" })).toBeVisible();
      expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
    });

    it("keeps the areas unsaved when saving fails", async () => {
      vi.spyOn(testRunService, "updateIgnoreAreas").mockRejectedValue(
        "Cannot save",
      );
      const { user } = renderModal();

      await draw(user);
      await user.click(saveButton());

      expect(await screen.findByText("Cannot save")).toBeVisible();
      expect(saveButton()).toBeEnabled();
    });
  });

  describe("toasts", () => {
    it("shows one confirmation at a time, a new one replacing the last", async () => {
      vi.spyOn(testRunService, "update").mockResolvedValue(RUN);
      vi.spyOn(testRunService, "updateIgnoreAreas").mockResolvedValue();
      const { user } = renderModal({ ...RUN, comment: "" });

      await user.click(screen.getByRole("button", { name: "Comments" }));
      await user.type(await screen.findByTestId("comment"), "looks fine");
      await user.click(screen.getByRole("button", { name: "Save" }));
      expect(await screen.findByText("Comment updated")).toBeVisible();
      await draw(user);
      await user.click(saveButton());

      expect(
        await screen.findByText("Ignore areas are updated."),
      ).toBeVisible();
      await waitFor(
        () =>
          expect(screen.queryByText("Comment updated")).not.toBeInTheDocument(),
        { timeout: 700 },
      );
    });
  });

  describe("drawn areas", () => {
    it("keeps unsaved areas when the same run comes back changed elsewhere", async () => {
      const { user, showTestRun } = renderModal();

      await draw(user);
      expect(ignoreAreaCount()).toBe("1");
      showTestRun({ ...RUN, comment: "a new comment" });

      expect(ignoreAreaCount()).toBe("1");
      expect(saveButton()).toBeEnabled();
    });

    it("shows the saved areas of the run when they change", () => {
      const { showTestRun } = renderModal();

      showTestRun({ ...RUN, ignoreAreas: JSON.stringify([SAVED_AREA]) });

      expect(ignoreAreaCount()).toBe("1");
    });

    it("shows the areas of another run when it opens", async () => {
      const { user, showTestRun } = renderModal();

      await draw(user);
      showTestRun({
        ...RUN,
        id: "another run",
        ignoreAreas: JSON.stringify([SAVED_AREA, { ...SAVED_AREA, id: "2" }]),
      });

      expect(ignoreAreaCount()).toBe("2");
    });
  });

  describe("applying an area to the whole build", () => {
    const applySelectedArea = async (
      user: ReturnType<typeof renderModal>["user"],
    ) => {
      await draw(user);
      await user.click(applyToBuildButton());
      await user.click(screen.getByRole("button", { name: "Yes" }));
    };

    it("adds the selected area to every run of the build", async () => {
      vi.spyOn(testRunService, "getList").mockResolvedValue([
        RUN,
        { ...RUN, id: "other run" },
      ]);
      const addIgnoreAreas = vi
        .spyOn(testRunService, "addIgnoreAreas")
        .mockResolvedValue();
      const { user } = renderModal();

      await applySelectedArea(user);

      expect(
        await screen.findByText(
          "Ignore areas are updated in all images in this build.",
        ),
      ).toBeVisible();
      expect(testRunService.getList).toHaveBeenCalledWith(RUN.buildId);
      expect(addIgnoreAreas).toHaveBeenCalledWith({
        ids: [RUN.id, "other run"],
        ignoreAreas: [expect.objectContaining({ id: "drawn-0" })],
      });
      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    });

    it("shows the error and stops the progress when adding the area fails", async () => {
      vi.spyOn(testRunService, "getList").mockResolvedValue([RUN]);
      vi.spyOn(testRunService, "addIgnoreAreas").mockRejectedValue(
        "Cannot add",
      );
      const { user } = renderModal();

      await applySelectedArea(user);

      expect(
        await screen.findByText("There was an error : Cannot add"),
      ).toBeVisible();
      await waitFor(() =>
        expect(screen.queryByRole("progressbar")).not.toBeInTheDocument(),
      );
    });
  });

  describe("the unsaved flag", () => {
    it("is set by drawing an area and cleared by deleting it", async () => {
      const { user } = renderModal();

      await draw(user);
      expect(saveButton()).toBeEnabled();
      await user.click(deleteTheArea());

      expect(ignoreAreaCount()).toBe("0");
      expect(saveButton()).toBeDisabled();
    });

    it("is cleared when the area deleted was the only change to the saved ones", async () => {
      const { user } = renderModal({
        ...RUN,
        ignoreAreas: JSON.stringify([SAVED_AREA]),
      });

      await draw(user);
      expect(saveButton()).toBeEnabled();
      await user.click(deleteTheArea());

      expect(ignoreAreaCount()).toBe("1");
      expect(saveButton()).toBeDisabled();
    });
  });

  describe("the view of a run", () => {
    const mode = (name: string) => screen.getByRole("button", { name });
    const fade = () =>
      screen.getByRole("slider", { name: "Fade to the baseline" });
    const blend = () => screen.getByTestId("differenceToggle");

    it("starts over with the diff shown, no fade and no blend when another run opens", async () => {
      const { user, showTestRun } = renderModal(UNRESOLVED_RUN);

      await user.click(mode("Fade"));
      fade().focus();
      await user.keyboard("{ArrowLeft}");
      await user.click(blend());
      expect(mode("Diff")).toHaveAttribute("aria-pressed", "false");
      expect(fade()).toHaveAttribute("aria-valuenow", "0.45");
      expect(blend()).toHaveAttribute("aria-pressed", "true");

      showTestRun({ ...UNRESOLVED_RUN, id: "another run" });

      expect(mode("Diff")).toHaveAttribute("aria-pressed", "true");
      await user.click(mode("Fade"));
      expect(fade()).toHaveAttribute("aria-valuenow", "0.5");
      expect(blend()).toHaveAttribute("aria-pressed", "false");
    });

    it("keeps the view when the same run comes back changed elsewhere", async () => {
      const { user, showTestRun } = renderModal(UNRESOLVED_RUN);

      await user.click(mode("Side by side"));
      showTestRun({ ...UNRESOLVED_RUN, comment: "a new comment" });

      expect(mode("Side by side")).toHaveAttribute("aria-pressed", "true");
    });

    it("toggles between Diff and Side by side with D and returns from Fade to Diff", async () => {
      const { user } = renderModal(UNRESOLVED_RUN);
      expect(mode("Diff")).toHaveAttribute("aria-pressed", "true");

      await user.keyboard("d");
      expect(mode("Side by side")).toHaveAttribute("aria-pressed", "true");

      await user.click(mode("Fade"));
      await user.keyboard("d");
      expect(mode("Diff")).toHaveAttribute("aria-pressed", "true");
    });

    it("offers Diff only when the run has a diff image", () => {
      renderModal({ ...UNRESOLVED_RUN, diffName: null });

      expect(screen.queryByRole("button", { name: "Diff" })).toBeNull();
      expect(mode("Side by side")).toHaveAttribute("aria-pressed", "true");
    });

    it("offers no view modes for a new run", () => {
      renderModal({
        ...UNRESOLVED_RUN,
        status: TestStatus.new,
        diffName: null,
        baselineName: "",
      });

      expect(screen.queryByRole("group", { name: "View mode" })).toBeNull();
    });
  });

  describe("editing areas", () => {
    it("shows the tools only in the edit mode and leaves it with Cancel, dropping the unsaved areas", async () => {
      const { user } = renderModal();
      expect(screen.queryByRole("button", { name: "Save" })).toBeNull();

      await user.click(screen.getByRole("button", { name: "Edit areas" }));
      await user.click(drawAnArea());
      expect(ignoreAreaCount()).toBe("1");
      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(screen.getByRole("button", { name: "Edit areas" })).toBeVisible();
      expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
      expect(ignoreAreaCount()).toBe("0");
    });

    it("shows the count of the areas and hides them on a click", async () => {
      const { user } = renderModal({
        ...RUN,
        ignoreAreas: JSON.stringify([SAVED_AREA]),
      });
      const chip = screen.getByRole("button", { name: "Ignore areas (1)" });
      expect(chip).toHaveAttribute("aria-pressed", "true");

      await user.click(chip);

      expect(chip).toHaveAttribute("aria-pressed", "false");
    });

    it("has no count chip for a run without areas", () => {
      renderModal();

      expect(
        screen.queryByRole("button", { name: /^Ignore areas \(/ }),
      ).toBeNull();
    });

    it("ignores D while editing", async () => {
      const { user } = renderModal(UNRESOLVED_RUN);
      await user.click(screen.getByRole("button", { name: "Edit areas" }));

      await user.keyboard("d");
      await user.click(screen.getByRole("button", { name: "Cancel" }));

      expect(screen.getByRole("button", { name: "Diff" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
    });

    it("shows the areas again on the next run after they were hidden", async () => {
      const withArea = { ...RUN, ignoreAreas: JSON.stringify([SAVED_AREA]) };
      const { user, showTestRun } = renderModal(withArea);
      await user.click(
        screen.getByRole("button", { name: "Ignore areas (1)" }),
      );

      showTestRun({ ...withArea, id: "another run" });

      expect(
        screen.getByRole("button", { name: "Ignore areas (1)" }),
      ).toHaveAttribute("aria-pressed", "true");
    });

    it("offers the undo once a person decided the run, not when it was auto-approved", () => {
      const { showTestRun } = renderModal(UNRESOLVED_RUN);
      expect(screen.queryByRole("button", { name: /^Undo/ })).toBeNull();

      showTestRun({ ...UNRESOLVED_RUN, status: TestStatus.approved });
      expect(
        screen.getByRole("button", { name: "Undo approval" }),
      ).toBeVisible();

      showTestRun({ ...UNRESOLVED_RUN, status: TestStatus.failed });
      expect(
        screen.getByRole("button", { name: "Undo rejection" }),
      ).toBeVisible();

      showTestRun({ ...UNRESOLVED_RUN, status: TestStatus.autoApproved });
      expect(screen.queryByRole("button", { name: /^Undo/ })).toBeNull();
    });

    it("leaves the edit mode when another run opens", async () => {
      const { user, showTestRun } = renderModal();
      await user.click(screen.getByRole("button", { name: "Edit areas" }));

      showTestRun({ ...RUN, id: "another run" });

      expect(screen.getByRole("button", { name: "Edit areas" })).toBeVisible();
    });
  });

  describe("moving between runs", () => {
    const MIDDLE: Position = { currentRunIndex: 1, totalTestRunCount: 3 };

    it("calls for the next run with the next button and the right arrow", async () => {
      const { user, handlers } = renderModal(RUN, MIDDLE);

      await user.click(buttonAroundIcon("NavigateNextIcon"));
      await user.keyboard("{ArrowRight}");

      expect(handlers.next).toHaveBeenCalledTimes(2);
      expect(handlers.previous).not.toHaveBeenCalled();
    });

    it("calls for the previous run with the previous button and the left arrow", async () => {
      const { user, handlers } = renderModal(RUN, MIDDLE);

      await user.click(buttonAroundIcon("NavigateBeforeIcon"));
      await user.keyboard("{ArrowLeft}");

      expect(handlers.previous).toHaveBeenCalledTimes(2);
      expect(handlers.next).not.toHaveBeenCalled();
    });

    it("hides the next button on the last run and the previous one on the first", () => {
      const last = renderModal(RUN, {
        currentRunIndex: 2,
        totalTestRunCount: 3,
      });
      expect(buttonAroundIcon("NavigateNextIcon")).not.toBeVisible();
      last.unmount();

      renderModal(RUN, { currentRunIndex: 0, totalTestRunCount: 3 });
      expect(buttonAroundIcon("NavigateBeforeIcon")).not.toBeVisible();
    });
  });

  describe("go to the next after approve or reject", () => {
    afterEach(() => {
      localStorage.removeItem(GO_TO_NEXT_KEY);
    });

    it("asks for the next run after Approve and after Reject when ticked", async () => {
      localStorage.setItem(GO_TO_NEXT_KEY, "true");
      vi.spyOn(testRunService, "approveBulk").mockResolvedValue(NO_FAILURES);
      vi.spyOn(testRunService, "rejectBulk").mockResolvedValue(NO_FAILURES);
      const { user, handlers } = renderModal(UNRESOLVED_RUN);
      expect(goToNextCheckbox()).toBeChecked();

      await user.click(approveButton());
      await waitFor(() => expect(handlers.next).toHaveBeenCalledTimes(1));
      await user.click(rejectButton());

      await waitFor(() => expect(handlers.next).toHaveBeenCalledTimes(2));
    });

    it("stays on the run after Approve and Reject when not ticked", async () => {
      vi.spyOn(testRunService, "approveBulk").mockResolvedValue(NO_FAILURES);
      vi.spyOn(testRunService, "rejectBulk").mockResolvedValue(NO_FAILURES);
      const { user, handlers } = renderModal(UNRESOLVED_RUN);
      expect(goToNextCheckbox()).not.toBeChecked();

      await user.click(approveButton());
      await screen.findByText("Approved");
      await user.click(rejectButton());
      await screen.findByText("Rejected");

      expect(handlers.next).not.toHaveBeenCalled();
    });

    it("remembers the choice", async () => {
      const { user } = renderModal(UNRESOLVED_RUN);

      await user.click(goToNextCheckbox());

      expect(goToNextCheckbox()).toBeChecked();
      expect(localStorage.getItem(GO_TO_NEXT_KEY)).toBe("true");
    });
  });

  describe("rendering-noise hint", () => {
    const BLUR_REGION = { x: 1, y: 2, width: 3, height: 4, weight: 0.9 };
    const DINOV2_REGION = { x: 10, y: 20, width: 30, height: 40, weight: 0.7 };
    const FULL = withRegions(
      NOISE_ANALYSIS_CHANGE,
      [BLUR_REGION],
      [DINOV2_REGION],
    );
    const analysed = (id = "analysed") => ({
      ...UNRESOLVED_RUN,
      id,
      noiseAnalysis: FULL,
    });
    const renderWithProject = async (
      testRun: TestRun,
      project: Partial<Project> = {},
    ) => {
      vi.spyOn(projectsService, "getAll").mockResolvedValue([
        { ...TEST_PROJECT, ...project },
      ]);
      const rendered = renderModal(testRun, undefined, <SelectProject />);
      await screen.findByTestId("project-ready");
      return rendered;
    };
    const hintAreas = (): unknown =>
      JSON.parse(screen.getByTestId("hintAreas").textContent ?? "null");
    const openNoise = (
      user: Awaited<ReturnType<typeof renderWithProject>>["user"],
    ) => user.click(screen.getByTestId("noise-hint-popover-chip"));
    const toggle = (stage: "blur" | "dinov2") =>
      screen.getByTestId(`hint-areas-${stage}`);

    it("shows the chip, with the panel behind it, for an unresolved run", async () => {
      const { user } = await renderWithProject({ ...UNRESOLVED_RUN });
      expect(screen.getByTestId("noise-hint-popover-chip")).toBeVisible();
      expect(screen.queryByTestId("noise-hint-panel")).not.toBeInTheDocument();

      await openNoise(user);

      expect(screen.getByTestId("noise-hint-panel")).toBeVisible();
    });

    it("keeps the review hotkeys from acting while the popover is open", async () => {
      const approveBulk = vi
        .spyOn(testRunService, "approveBulk")
        .mockResolvedValue(NO_FAILURES);
      const { user } = await renderWithProject(analysed());

      await openNoise(user);
      await user.keyboard("a");

      expect(approveBulk).not.toHaveBeenCalled();
    });

    it("shows no panel and fetches nothing for an approved run", async () => {
      const getDetails = vi.spyOn(testRunService, "getDetails");

      await renderWithProject({
        ...UNRESOLVED_RUN,
        status: TestStatus.approved,
        noiseAnalysis: NOISE_ANALYSIS_CHANGE,
      });

      expect(
        screen.queryByTestId("noise-hint-popover-chip"),
      ).not.toBeInTheDocument();
      expect(getDetails).not.toHaveBeenCalled();
    });

    it.each([
      ["a VLM project", { imageComparison: ImageComparison.vlm }],
      [
        "a project with the blur stage off",
        {
          noiseAnalysisConfig: JSON.stringify({ blur: { enabled: false } }),
        },
      ],
    ])("shows no panel, buttons or details fetch in %s", async (_, project) => {
      const getDetails = vi.spyOn(testRunService, "getDetails");

      await renderWithProject(
        {
          ...UNRESOLVED_RUN,
          id: "analysed",
          noiseAnalysis: NOISE_ANALYSIS_CHANGE,
        },
        project,
      );

      expect(
        screen.queryByTestId("noise-hint-popover-chip"),
      ).not.toBeInTheDocument();
      expect(hintAreas()).toEqual([]);
      expect(getDetails).not.toHaveBeenCalled();
    });

    it("draws the regions of the toggled stage and removes them when toggled off", async () => {
      const { user } = await renderWithProject(analysed());
      expect(hintAreas()).toEqual([]);

      await openNoise(user);
      await user.click(toggle("blur"));
      expect(hintAreas()).toEqual([BLUR_REGION]);

      await user.click(toggle("dinov2"));
      expect(hintAreas()).toEqual([DINOV2_REGION]);

      await user.click(toggle("dinov2"));
      expect(hintAreas()).toEqual([]);
    });

    it("loads the regions of a result that arrived without them", async () => {
      const pending: { deliver?: (run: TestRun) => void } = {};
      vi.spyOn(testRunService, "getDetails").mockReturnValue(
        new Promise((resolve) => {
          pending.deliver = resolve;
        }),
      );
      const { user } = await renderWithProject({
        ...UNRESOLVED_RUN,
        id: "analysed",
        noiseAnalysis: NOISE_ANALYSIS_CHANGE,
      });
      await openNoise(user);
      expect(toggle("blur")).toBeDisabled();

      pending.deliver?.(analysed());
      await waitFor(() => expect(toggle("blur")).toBeEnabled());
      await user.click(toggle("blur"));

      expect(hintAreas()).toEqual([BLUR_REGION]);
      expect(testRunService.getDetails).toHaveBeenCalledExactlyOnceWith(
        "analysed",
      );
    });

    it("clears the regions when another run is shown", async () => {
      const { user, showTestRun } = await renderWithProject(analysed("first"));
      await openNoise(user);
      await user.click(toggle("blur"));
      await user.keyboard("{Escape}");

      showTestRun(analysed("second"));

      expect(hintAreas()).toEqual([]);
      await openNoise(user);
      expect(toggle("blur")).toHaveAttribute("aria-pressed", "false");
    });

    it("leaves Approve and the go-to-next choice working with the regions shown", async () => {
      vi.spyOn(testRunService, "approveBulk").mockResolvedValue(NO_FAILURES);
      const { user } = await renderWithProject(analysed());
      await openNoise(user);
      await user.click(toggle("blur"));
      await user.keyboard("{Escape}");

      await user.click(approveButton());

      await screen.findByText("Approved");
      expect(testRunService.approveBulk).toHaveBeenCalledWith(
        ["analysed"],
        false,
      );
    });
  });
});
