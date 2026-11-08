import { useEffect } from "react";
import type { LightboxPreview } from "./VariationLightbox";

export function useVariationHotkeys({
  preview,
  step,
  setPreviewDiff,
  toggleShowDiff,
}: {
  preview: LightboxPreview | null;
  step: (delta: number) => void;
  setPreviewDiff: (showDiff: boolean) => void;
  toggleShowDiff: () => void;
}) {
  useEffect(() => {
    const swallow = new Set([
      "ArrowLeft",
      "ArrowRight",
      "a",
      "A",
      "x",
      "X",
      "d",
      "D",
    ]);
    const onKey = (e: KeyboardEvent) => {
      if (!swallow.has(e.key)) return;
      // the page behind would act on these keys (arrows, a/x) and change the reviewed run
      e.preventDefault();
      e.stopPropagation();
      if (e.key === "d" || e.key === "D") {
        if (preview) setPreviewDiff(!preview.showDiff);
        else toggleShowDiff();
        return;
      }
      if (preview && e.key === "ArrowLeft") step(-1);
      if (preview && e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [preview, step, setPreviewDiff, toggleShowDiff]);
}
