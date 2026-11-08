import {
  type ComponentProps,
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { calculateScale } from "../../_helpers/scale.helper";
import type { DrawArea, ImageStateLoad } from "./DrawArea";

const defaultStagePos = {
  x: 0,
  y: 0,
};

type LoadedImage = [HTMLImageElement | undefined, ImageStateLoad];
type StageProps = Pick<
  ComponentProps<typeof DrawArea>,
  | "stageScaleState"
  | "stagePosState"
  | "stageScrollPosState"
  | "stageInitPosState"
  | "stageOffsetState"
>;

const fitImageToStage = (image: HTMLImageElement, container: HTMLElement) =>
  calculateScale(
    image.width + 20,
    image.height + 20,
    container.offsetWidth,
    container.offsetHeight - 48,
  );

export const useStageView = (
  [currentImage, currentImageStatus]: LoadedImage,
  [baselineImage, baselineImageStatus]: LoadedImage,
) => {
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState(defaultStagePos);
  const [stageScrollPos, setStageScrollPos] = useState(defaultStagePos);
  const [stageInitPos, setStageInitPos] = useState(defaultStagePos);
  const [stageOffset, setStageOffset] = useState(defaultStagePos);
  const leftItemRef = useRef<HTMLDivElement>(null);
  const rightItemRef = useRef<HTMLDivElement>(null);

  // one scale for both panes, set by the largest image; capped at 1 so small ones stay put
  const fitScale = (): number | undefined => {
    const scales: number[] = [];

    if (currentImage && leftItemRef.current) {
      scales.push(fitImageToStage(currentImage, leftItemRef.current));
    }

    if (baselineImage && rightItemRef.current) {
      scales.push(fitImageToStage(baselineImage, rightItemRef.current));
    }

    return scales.length > 0 ? Math.min(1, ...scales) : undefined;
  };

  const followsPanes = useRef(true);
  const zoomByUser: Dispatch<SetStateAction<number>> = useCallback((scale) => {
    followsPanes.current = false;
    setStageScale(scale);
  }, []);

  const resetPosition = () => {
    setStagePos(defaultStagePos);
    setStageOffset(defaultStagePos);
  };

  const fitImagesToStage = () => {
    followsPanes.current = true;
    const scale = fitScale();
    if (scale !== undefined) {
      setStageScale(scale);
    }
    resetPosition();
  };

  const setOriginalSize = () => {
    followsPanes.current = false;
    setStageScale(1);
    resetPosition();
  };

  // the next run keeps the reviewer's zoom and place when its images are the same size
  const fittedSizes = useRef<string>(undefined);
  useEffect(() => {
    if (currentImageStatus === "loading" || baselineImageStatus === "loading") {
      return;
    }
    const sizes = [currentImage, baselineImage]
      .map((image) => (image ? `${image.width}x${image.height}` : "-"))
      .join("|");
    if (sizes === fittedSizes.current) {
      return;
    }
    fittedSizes.current = sizes;
    fitImagesToStage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baselineImage, currentImage, currentImageStatus, baselineImageStatus]);

  const refit = useRef(fitImagesToStage);
  useLayoutEffect(() => {
    refit.current = fitImagesToStage;
  });

  useEffect(() => {
    const panes = [leftItemRef.current, rightItemRef.current].filter(
      (pane): pane is HTMLDivElement => pane !== null,
    );
    if (panes.length === 0 || typeof ResizeObserver === "undefined") {
      return;
    }
    const sizeOf = () =>
      panes.map((pane) => `${pane.offsetWidth}x${pane.offsetHeight}`).join("|");
    let lastSize = sizeOf();
    const observer = new ResizeObserver(() => {
      const size = sizeOf();
      if (size === lastSize) {
        return;
      }
      lastSize = size;
      if (followsPanes.current) {
        refit.current();
      }
    });
    panes.forEach((pane) => observer.observe(pane));
    return () => observer.disconnect();
  }, [baselineImage, currentImage]);

  const stageProps: StageProps = {
    stageScaleState: [stageScale, zoomByUser],
    stagePosState: [stagePos, setStagePos],
    stageScrollPosState: [stageScrollPos, setStageScrollPos],
    stageInitPosState: [stageInitPos, setStageInitPos],
    stageOffsetState: [stageOffset, setStageOffset],
  };

  return {
    leftItemRef,
    rightItemRef,
    fitImagesToStage,
    setOriginalSize,
    stageProps,
  };
};
