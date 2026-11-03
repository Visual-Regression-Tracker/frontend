import { useMemo, useState } from "react";
import Konva from "konva";
import type { SnackbarMessage } from "notistack";
import { TestRun } from "../../types";
import { IgnoreArea, UpdateIgnoreAreaDto } from "../../types/ignoreArea";
import { testRunService } from "../../services";
import { useTestRunDispatch } from "../../contexts";
import { AREA_KINDS } from "../../constants";
import {
  invertIgnoreArea,
  parseIgnoreAreas,
} from "../../_helpers/ignoreArea.helper";
import type { DialogEnqueue } from "./useDialogSnackbar";

export const useIgnoreAreas = (
  testRun: TestRun,
  currentImage: HTMLImageElement | undefined,
  enqueueSnackbar: DialogEnqueue,
) => {
  const testRunDispatch = useTestRunDispatch();
  const [ignoreAreas, setIgnoreAreas] = useState(() =>
    parseIgnoreAreas(testRun.ignoreAreas),
  );
  const [selectedRectId, setSelectedRectId] = useState<string>();
  const [isDrawMode, setIsDrawMode] = useState(false);
  const [areaKind, setAreaKind] = useState(AREA_KINDS[0]);
  const [processing, setProcessing] = useState(false);

  // by fields, not the run object: an update to the run would wipe the unsaved areas drawn here
  const { id, diffName, ignoreAreas: storedAreas } = testRun;
  const [shownRun, setShownRun] = useState({ id, diffName, storedAreas });
  const runChanged = shownRun.id !== id;
  const imagesChanged = runChanged || shownRun.diffName !== diffName;
  const areasChanged = runChanged || shownRun.storedAreas !== storedAreas;
  if (imagesChanged || areasChanged) {
    if (imagesChanged) {
      setIsDrawMode(false);
      setSelectedRectId(undefined);
    }
    if (areasChanged) {
      setIgnoreAreas(parseIgnoreAreas(storedAreas));
    }
    setShownRun({ id, diffName, storedAreas });
  }

  const tempIgnoreAreas = useMemo(
    () => parseIgnoreAreas(testRun.tempIgnoreAreas),
    [testRun.tempIgnoreAreas],
  );

  const changeIgnoreAreas = (areas: IgnoreArea[]) => {
    setIgnoreAreas(areas);
    testRunDispatch({
      type: "touched",
      payload: testRun.ignoreAreas !== JSON.stringify(areas),
    });
  };

  const removeSelection = (event: Konva.KonvaEventObject<MouseEvent>) => {
    const isRectClicked = event.target.className === "Rect";

    if (!isRectClicked) {
      setSelectedRectId(undefined);
    }
  };

  const deleteIgnoreArea = (id: string) => {
    changeIgnoreAreas(ignoreAreas.filter((area) => area.id !== id));
    setSelectedRectId(undefined);
  };

  const store = (areas: IgnoreArea[], successMessage: string) => {
    testRunService
      .updateIgnoreAreas({
        ids: [testRun.id],
        ignoreAreas: areas,
      })
      .then(() => {
        enqueueSnackbar(successMessage, {
          variant: "success",
        });
        // only once stored: a failed save must leave the areas unsaved
        testRunDispatch({
          type: "touched",
          payload: false,
        });
      })
      .catch((err: SnackbarMessage) =>
        enqueueSnackbar(err, {
          variant: "error",
        }),
      );
  };

  const save = () => {
    if (areaKind.includes("Ignore")) {
      store(ignoreAreas, "Ignore areas are updated.");
    } else if (currentImage) {
      const invertedIgnoreAreas = invertIgnoreArea(
        currentImage.width,
        currentImage.height,
        ignoreAreas[ignoreAreas.length - 1],
      );

      changeIgnoreAreas(invertedIgnoreAreas);
      store(
        invertedIgnoreAreas,
        "Selected area has been inverted to ignore areas and saved.",
      );
    }
  };

  const applyToBuild = () => {
    const newIgnoreArea = ignoreAreas.find(
      (area) => selectedRectId === area.id,
    );

    if (newIgnoreArea) {
      setProcessing(true);
      testRunService
        .getList(testRun.buildId)
        .then((testRuns: TestRun[]) => {
          const allIds = testRuns.map((item) => item.id);
          const data: UpdateIgnoreAreaDto = {
            ids: allIds,
            ignoreAreas: [newIgnoreArea],
          };

          return testRunService.addIgnoreAreas(data);
        })
        .then(() => {
          setProcessing(false);
          setSelectedRectId(undefined);
          enqueueSnackbar(
            "Ignore areas are updated in all images in this build.",
            {
              variant: "success",
            },
          );
        })
        .catch((error) => {
          enqueueSnackbar(`There was an error : ${error}`, {
            variant: "error",
          });
          setProcessing(false);
        });
    } else {
      enqueueSnackbar(
        "There was an error determining which ignore area to apply.",
        {
          variant: "error",
        },
      );
    }
  };

  return {
    ignoreAreas,
    tempIgnoreAreas,
    changeIgnoreAreas,
    selectedRectId,
    setSelectedRectId,
    removeSelection,
    deleteIgnoreArea,
    deleteSelected: () => {
      if (selectedRectId) {
        deleteIgnoreArea(selectedRectId);
      }
    },
    clear: () => changeIgnoreAreas([]),
    isDrawMode,
    setIsDrawMode,
    areaKind,
    setAreaKind,
    save,
    applyToBuild,
    processing,
  };
};
