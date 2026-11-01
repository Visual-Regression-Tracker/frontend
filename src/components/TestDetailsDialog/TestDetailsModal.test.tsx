import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../../_test/render";
import { testRunService } from "../../services";
import { useTestRunState } from "../../contexts";
import { TestRun } from "../../types";
import { IgnoreArea } from "../../types/ignoreArea";
import { TestStatus } from "../../types/testStatus";
import { GO_TO_NEXT_KEY } from "../../constants";
import { TEST_USER, testRunMock } from "../../_test/test.data.helper";
import TestDetailsModal from "./TestDetailsModal";
import { NO_FAILURES } from "../../_test/bulkResult";

// Konva needs native canvas under Node; a stand-in lets tests draw and delete areas
vi.mock("./DrawArea", () => import("../../_test/FakeDrawArea"));

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
) => {
  const handlers = { close: vi.fn(), previous: vi.fn(), next: vi.fn() };
  const result = renderWithProviders(
    <Modal testRun={testRun} position={position} handlers={handlers} />,
    { user: TEST_USER },
  );
  return {
    ...result,
    handlers,
    showTestRun: (run: TestRun) =>
      result.rerender(
        <Modal testRun={run} position={position} handlers={handlers} />,
      ),
  };
};

const ignoreAreaCount = () => screen.getByTestId("ignoreAreaCount").textContent;
const drawAnArea = () => screen.getByRole("button", { name: "Draw an area" });
// the toolbar's icon buttons have no name of their own, only their icon
const buttonWithIcon = (iconTestId: string) => {
  const button = screen.getByTestId(iconTestId).closest("button");
  if (!button) {
    throw new Error(`no button around ${iconTestId}`);
  }
  return button;
};
const saveButton = () => buttonWithIcon("SaveIcon");
const applyToBuildButton = () => buttonWithIcon("CollectionsIcon");
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

      await user.click(drawAnArea());
      expect(saveButton()).toBeEnabled();
      await user.click(saveButton());

      expect(updateIgnoreAreas).toHaveBeenCalledWith({
        ids: [RUN.id],
        ignoreAreas: [expect.objectContaining({ id: "drawn-0" })],
      });
      expect(
        await screen.findByText("Ignore areas are updated."),
      ).toBeVisible();
      expect(saveButton()).toBeDisabled();
    });

    it("keeps the areas unsaved when saving fails", async () => {
      vi.spyOn(testRunService, "updateIgnoreAreas").mockRejectedValue(
        "Cannot save",
      );
      const { user } = renderModal();

      await user.click(drawAnArea());
      await user.click(saveButton());

      expect(await screen.findByText("Cannot save")).toBeVisible();
      expect(saveButton()).toBeEnabled();
    });
  });

  describe("drawn areas", () => {
    it("keeps unsaved areas when the same run comes back changed elsewhere", async () => {
      const { user, showTestRun } = renderModal();

      await user.click(drawAnArea());
      expect(ignoreAreaCount()).toBe("1");
      showTestRun({ ...RUN, comment: "a new comment" });

      expect(ignoreAreaCount()).toBe("1");
      expect(saveButton()).toBeEnabled();
    });

    it("shows the saved areas of the run when they change", async () => {
      const { showTestRun } = renderModal();

      showTestRun({ ...RUN, ignoreAreas: JSON.stringify([SAVED_AREA]) });

      expect(ignoreAreaCount()).toBe("1");
    });

    it("shows the areas of another run when it opens", async () => {
      const { user, showTestRun } = renderModal();

      await user.click(drawAnArea());
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
      await user.click(drawAnArea());
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
      expect(saveButton()).toBeDisabled();

      await user.click(drawAnArea());
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

      await user.click(drawAnArea());
      expect(saveButton()).toBeEnabled();
      await user.click(deleteTheArea());

      expect(ignoreAreaCount()).toBe("1");
      expect(saveButton()).toBeDisabled();
    });
  });

  describe("moving between runs", () => {
    const MIDDLE: Position = { currentRunIndex: 1, totalTestRunCount: 3 };

    it("calls for the next run with the next button and the right arrow", async () => {
      const { user, handlers } = renderModal(RUN, MIDDLE);

      await user.click(buttonWithIcon("NavigateNextIcon"));
      await user.keyboard("{ArrowRight}");

      expect(handlers.next).toHaveBeenCalledTimes(2);
      expect(handlers.previous).not.toHaveBeenCalled();
    });

    it("calls for the previous run with the previous button and the left arrow", async () => {
      const { user, handlers } = renderModal(RUN, MIDDLE);

      await user.click(buttonWithIcon("NavigateBeforeIcon"));
      await user.keyboard("{ArrowLeft}");

      expect(handlers.previous).toHaveBeenCalledTimes(2);
      expect(handlers.next).not.toHaveBeenCalled();
    });

    it("hides the next button on the last run and the previous one on the first", () => {
      const last = renderModal(RUN, {
        currentRunIndex: 2,
        totalTestRunCount: 3,
      });
      expect(buttonWithIcon("NavigateNextIcon")).not.toBeVisible();
      last.unmount();

      renderModal(RUN, { currentRunIndex: 0, totalTestRunCount: 3 });
      expect(buttonWithIcon("NavigateBeforeIcon")).not.toBeVisible();
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
});
