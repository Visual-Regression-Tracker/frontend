import React from "react";
import { screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "../../_test/render";
import { testRunService } from "../../services";
import { useTestRunState } from "../../contexts";
import { TestRun } from "../../types";
import { IgnoreArea } from "../../types/ignoreArea";
import { TEST_USER, testRunMock } from "../../_test/test.data.helper";
import type { DrawArea as RealDrawArea } from "./DrawArea";
import TestDetailsModal from "./TestDetailsModal";

// Konva needs the native canvas package under Node, which jsdom has not got.
// The image pane stands in for the canvas with what this dialog gives it and
// takes from it: the areas to show, and a way to draw one and select it, which
// is what a drag on the real canvas does.
vi.mock("./DrawArea", () => ({
  DrawArea: ({
    ignoreAreas,
    setIgnoreAreas,
    setSelectedRectId,
    deleteIgnoreArea,
  }: React.ComponentProps<typeof RealDrawArea>) =>
    // only the image pane edits areas; the baseline pane is left out
    deleteIgnoreArea ? (
      <div>
        <span data-testid="ignoreAreaCount">{ignoreAreas.length}</span>
        <button
          onClick={() => {
            const area: IgnoreArea = {
              id: `drawn-${ignoreAreas.length}`,
              x: 1,
              y: 2,
              width: 30,
              height: 40,
            };
            setIgnoreAreas([...ignoreAreas, area]);
            setSelectedRectId(area.id);
          }}
        >
          Draw an area
        </button>
      </div>
    ) : null,
}));

// the variations dialog in here imports from "react-router", the render
// helper's router comes from "react-router-dom"; under Vitest those load as two
// copies of the library, so hand it the copy the router belongs to
vi.mock("react-router", async () => import("react-router-dom"));

const SAVED_AREA: IgnoreArea = {
  id: "saved",
  x: 5,
  y: 6,
  width: 70,
  height: 80,
};
const RUN: TestRun = { ...testRunMock, ignoreAreas: "[]" };

// touched lives in the context, as it does under the real dialog
const Modal: React.FunctionComponent<{ testRun: TestRun }> = ({ testRun }) => {
  const { touched } = useTestRunState();
  return (
    <TestDetailsModal
      testRun={testRun}
      currentRunIndex={0}
      totalTestRunCount={1}
      touched={touched}
      handleClose={vi.fn()}
      handlePrevious={vi.fn()}
      handleNext={vi.fn()}
    />
  );
};

const renderModal = (testRun: TestRun = RUN) => {
  const result = renderWithProviders(<Modal testRun={testRun} />, {
    user: TEST_USER,
  });
  return {
    ...result,
    showTestRun: (run: TestRun) => result.rerender(<Modal testRun={run} />),
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
      // e.g. a comment saved: the socket hands over a new object for the run
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
});
