import { act, screen, waitFor } from "@testing-library/react";
import type Konva from "konva";
import { renderHookWithProviders } from "../../_test/render";
import { fakeImage } from "../../_test/fakeImage";
import { run } from "../../_helpers/testRun.fixture";
import { invertIgnoreArea } from "../../_helpers/ignoreArea.helper";
import { testRunService } from "../../services";
import { useTestRunState } from "../../contexts";
import { TestRun } from "../../types";
import { IgnoreArea } from "../../types/ignoreArea";
import { useDialogSnackbar } from "./useDialogSnackbar";
import { useIgnoreAreas } from "./useIgnoreAreas";

const area = (id: string): IgnoreArea => ({
  id,
  x: 10,
  y: 20,
  width: 30,
  height: 40,
});
const SAVED = area("saved");
const DRAWN = area("drawn");
const RUN = run({ ignoreAreas: JSON.stringify([SAVED]) });
const IMAGE = fakeImage(200, 100);

const clickOn = (className: string) =>
  ({ target: { className } }) as unknown as Konva.KonvaEventObject<MouseEvent>;

const renderEditor = (testRun: TestRun = RUN, { imageLoaded = true } = {}) => {
  const image = imageLoaded ? IMAGE : undefined;
  const rendered = renderHookWithProviders(
    (current: TestRun) => ({
      editor: useIgnoreAreas(
        current,
        image,
        useDialogSnackbar().enqueueSnackbar,
      ),
      touched: useTestRunState().touched,
    }),
    { initialProps: testRun },
  );
  return {
    ...rendered,
    editor: () => rendered.result.current.editor,
    touched: () => rendered.result.current.touched,
  };
};

const drawAndSelect = (editor: ReturnType<typeof renderEditor>["editor"]) => {
  act(() => {
    editor().changeIgnoreAreas([...editor().ignoreAreas, DRAWN]);
    editor().setSelectedRectId(DRAWN.id);
  });
};

describe("useIgnoreAreas", () => {
  describe("the areas of the run", () => {
    it("starts with the saved areas and those applied at upload", () => {
      const { editor } = renderEditor(
        run({
          ignoreAreas: JSON.stringify([SAVED]),
          tempIgnoreAreas: JSON.stringify([area("upload")]),
        }),
      );

      expect(editor().ignoreAreas).toEqual([SAVED]);
      expect(editor().tempIgnoreAreas).toEqual([area("upload")]);
    });

    it("keeps unsaved areas while the run's saved areas stay the same", () => {
      const { editor, rerender } = renderEditor();
      drawAndSelect(editor);

      rerender({ ...RUN, comment: "changed elsewhere" });

      expect(editor().ignoreAreas).toEqual([SAVED, DRAWN]);
    });

    it("shows the saved areas again when they change", () => {
      const { editor, rerender } = renderEditor();
      drawAndSelect(editor);

      rerender({ ...RUN, ignoreAreas: "[]" });

      expect(editor().ignoreAreas).toEqual([]);
    });
  });

  describe("the unsaved flag", () => {
    it("is set by a change and cleared when the areas are back to the saved ones", () => {
      const { editor, touched } = renderEditor();

      drawAndSelect(editor);
      expect(touched()).toBe(true);
      act(() => editor().deleteSelected());

      expect(editor().ignoreAreas).toEqual([SAVED]);
      expect(touched()).toBe(false);
    });

    it("is set by clearing the saved areas", () => {
      const { editor, touched } = renderEditor();

      act(() => editor().clear());

      expect(editor().ignoreAreas).toEqual([]);
      expect(touched()).toBe(true);
    });
  });

  describe("selection", () => {
    it("deletes the selected area and selects nothing", () => {
      const { editor } = renderEditor();
      drawAndSelect(editor);

      act(() => editor().deleteSelected());

      expect(editor().ignoreAreas).toEqual([SAVED]);
      expect(editor().selectedRectId).toBeUndefined();
    });

    it("deletes nothing when no area is selected", () => {
      const { editor, touched } = renderEditor();

      act(() => editor().deleteSelected());

      expect(editor().ignoreAreas).toEqual([SAVED]);
      expect(touched()).toBe(false);
    });

    it("drops the selection on a click beside the areas, not on one", () => {
      const { editor } = renderEditor();
      drawAndSelect(editor);

      act(() => editor().removeSelection(clickOn("Rect")));
      expect(editor().selectedRectId).toBe(DRAWN.id);
      act(() => editor().removeSelection(clickOn("Image")));

      expect(editor().selectedRectId).toBeUndefined();
    });

    describe("the view of the areas", () => {
      const drawing = () => {
        const rendered = renderEditor();
        drawAndSelect(rendered.editor);
        act(() => rendered.editor().setIsDrawMode(true));
        return rendered;
      };

      it("goes back to no selection and no drawing when another run opens", () => {
        const { editor, rerender } = drawing();

        rerender({ ...RUN, id: "another-run" });

        expect(editor().isDrawMode).toBe(false);
        expect(editor().selectedRectId).toBeUndefined();
      });

      it("goes back to no selection and no drawing when the run's diff changes", () => {
        const { editor, rerender } = drawing();

        rerender({ ...RUN, diffName: "new-diff.png" });

        expect(editor().isDrawMode).toBe(false);
        expect(editor().selectedRectId).toBeUndefined();
        expect(editor().ignoreAreas).toEqual([SAVED, DRAWN]);
      });

      it("stays as it is when the run changes in any other way", () => {
        const { editor, rerender } = drawing();

        rerender({ ...RUN, comment: "changed elsewhere" });

        expect(editor().isDrawMode).toBe(true);
        expect(editor().selectedRectId).toBe(DRAWN.id);
      });
    });
  });

  describe("saving", () => {
    it("stores the ignore areas and clears the unsaved flag", async () => {
      const updateIgnoreAreas = vi
        .spyOn(testRunService, "updateIgnoreAreas")
        .mockResolvedValue();
      const { editor, touched } = renderEditor();
      drawAndSelect(editor);

      act(() => editor().save());

      expect(updateIgnoreAreas).toHaveBeenCalledWith({
        ids: [RUN.id],
        ignoreAreas: [SAVED, DRAWN],
      });
      expect(
        await screen.findByText("Ignore areas are updated."),
      ).toBeVisible();
      expect(touched()).toBe(false);
    });

    it("keeps the areas unsaved when storing fails", async () => {
      vi.spyOn(testRunService, "updateIgnoreAreas").mockRejectedValue(
        "Cannot save",
      );
      const { editor, touched } = renderEditor();
      drawAndSelect(editor);

      act(() => editor().save());

      expect(await screen.findByText("Cannot save")).toBeVisible();
      expect(touched()).toBe(true);
    });

    it("stores everything around the last area as ignored in compare mode", async () => {
      const updateIgnoreAreas = vi
        .spyOn(testRunService, "updateIgnoreAreas")
        .mockResolvedValue();
      const { editor } = renderEditor();
      drawAndSelect(editor);
      act(() => editor().setAreaKind("Compare Area"));

      act(() => editor().save());

      // the inverted areas get new random ids
      const inverted = invertIgnoreArea(IMAGE.width, IMAGE.height, DRAWN).map(
        ({ x, y, width, height }) =>
          expect.objectContaining({ x, y, width, height }) as IgnoreArea,
      );
      expect(updateIgnoreAreas).toHaveBeenCalledWith({
        ids: [RUN.id],
        ignoreAreas: inverted,
      });
      expect(editor().ignoreAreas).toEqual(inverted);
      expect(
        await screen.findByText(
          "Selected area has been inverted to ignore areas and saved.",
        ),
      ).toBeVisible();
    });

    it("stores nothing in compare mode before the image has loaded", () => {
      const updateIgnoreAreas = vi.spyOn(testRunService, "updateIgnoreAreas");
      const { editor } = renderEditor(RUN, { imageLoaded: false });
      act(() => editor().setAreaKind("Compare Area"));

      act(() => editor().save());

      expect(updateIgnoreAreas).not.toHaveBeenCalled();
      expect(editor().ignoreAreas).toEqual([SAVED]);
    });
  });

  describe("applying the selected area to the build", () => {
    it("adds it to every run of the build and drops the selection", async () => {
      vi.spyOn(testRunService, "getList").mockResolvedValue([
        RUN,
        run({ id: "other" }),
      ]);
      const addIgnoreAreas = vi
        .spyOn(testRunService, "addIgnoreAreas")
        .mockResolvedValue();
      const { editor } = renderEditor();
      drawAndSelect(editor);

      act(() => editor().applyToBuild());

      expect(editor().processing).toBe(true);
      expect(
        await screen.findByText(
          "Ignore areas are updated in all images in this build.",
        ),
      ).toBeVisible();
      expect(testRunService.getList).toHaveBeenCalledWith(RUN.buildId);
      expect(addIgnoreAreas).toHaveBeenCalledWith({
        ids: [RUN.id, "other"],
        ignoreAreas: [DRAWN],
      });
      expect(editor().processing).toBe(false);
      expect(editor().selectedRectId).toBeUndefined();
    });

    it("shows the error and stops processing when the runs cannot be loaded", async () => {
      vi.spyOn(testRunService, "getList").mockRejectedValue("Offline");
      const addIgnoreAreas = vi.spyOn(testRunService, "addIgnoreAreas");
      const { editor } = renderEditor();
      drawAndSelect(editor);

      act(() => editor().applyToBuild());

      expect(
        await screen.findByText("There was an error : Offline"),
      ).toBeVisible();
      await waitFor(() => expect(editor().processing).toBe(false));
      expect(addIgnoreAreas).not.toHaveBeenCalled();
      expect(editor().selectedRectId).toBe(DRAWN.id);
    });

    it("refuses when no area is selected", async () => {
      const getList = vi.spyOn(testRunService, "getList");
      const { editor } = renderEditor();

      act(() => editor().applyToBuild());

      expect(
        await screen.findByText(
          "There was an error determining which ignore area to apply.",
        ),
      ).toBeVisible();
      expect(getList).not.toHaveBeenCalled();
      expect(editor().processing).toBe(false);
    });
  });
});
