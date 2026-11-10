import { useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { hotkeyOptions } from "../../_helpers/hotkeys.helper";
import { TestRun } from "../../types";

export type ViewMode = "sideBySide" | "diff" | "fade";

const DEFAULT_OPACITY = 0.5;

const initialMode = (testRun: TestRun): ViewMode =>
  testRun.diffName ? "diff" : "sideBySide";

export const useViewMode = (testRun: TestRun, hotkeyEnabled: boolean) => {
  const [mode, setMode] = useState<ViewMode>(() => initialMode(testRun));
  const [opacity, setOpacity] = useState(DEFAULT_OPACITY);
  const [blendDifference, setBlendDifference] = useState(false);

  // per-run view state; this dialog is not remounted between runs
  const [shownRun, setShownRun] = useState({
    id: testRun.id,
    diffName: testRun.diffName,
  });
  if (shownRun.id !== testRun.id || shownRun.diffName !== testRun.diffName) {
    setShownRun({ id: testRun.id, diffName: testRun.diffName });
    setMode(initialMode(testRun));
    setOpacity(DEFAULT_OPACITY);
    setBlendDifference(false);
  }

  useHotkeys(
    "d",
    () => {
      if (testRun.diffName) {
        setMode((current) => (current === "diff" ? "sideBySide" : "diff"));
      }
    },
    { ...hotkeyOptions, enabled: hotkeyEnabled },
    [testRun.diffName],
  );

  return {
    mode,
    setMode,
    opacity,
    setOpacity,
    blendDifference,
    toggleBlend: () => setBlendDifference((blend) => !blend),
  };
};

export type ViewState = ReturnType<typeof useViewMode>;
