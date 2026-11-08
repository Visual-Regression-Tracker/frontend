import {
  type Dispatch,
  type RefObject,
  type SetStateAction,
  useEffect,
  useRef,
} from "react";
import { clampScale } from "../../_helpers/scale.helper";

type Point = { x: number; y: number };

const SCALE_BY = 1.04;
const ZOOM_TIME_CONSTANT_MS = 140;
const ZOOM_SETTLED = 0.001;
const FRAME_MS = 1000 / 60;

export function useWheelZoom({
  containerRef,
  stageScale,
  setStageScale,
  stagePos,
  scrollPos,
  setScrollPos,
  reattachKey,
}: {
  containerRef: RefObject<HTMLDivElement | null>;
  stageScale: number;
  setStageScale: Dispatch<SetStateAction<number>>;
  stagePos: Point;
  scrollPos: Point;
  setScrollPos: Dispatch<SetStateAction<Point>>;
  reattachKey: unknown;
}) {
  const scaleRef = useRef(stageScale);
  const targetScaleRef = useRef(stageScale);
  const frameRef = useRef<number | undefined>(undefined);
  const lastFrameRef = useRef<number | undefined>(undefined);
  const anchorRef = useRef<{
    pointerX: number;
    pointerY: number;
    imageX: number;
    imageY: number;
  }>(undefined);

  useEffect(() => {
    containerRef.current?.scrollTo(scrollPos.x, scrollPos.y);
  }, [containerRef, scrollPos]);

  useEffect(() => {
    scaleRef.current = stageScale;

    // outside changes (buttons, fit-to-screen) set the target, unless animating
    if (!frameRef.current) {
      targetScaleRef.current = stageScale;
    }
  }, [stageScale]);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    const step = (now: number) => {
      const target = targetScaleRef.current;
      const anchor = anchorRef.current;
      const remaining = target - scaleRef.current;

      if (!anchor || Math.abs(remaining) < ZOOM_SETTLED) {
        frameRef.current = undefined;
        lastFrameRef.current = undefined;
        return;
      }

      // eased by elapsed time, so a gesture lasts the same on any refresh rate
      const elapsed = now - (lastFrameRef.current ?? now - FRAME_MS);
      lastFrameRef.current = now;

      const scale =
        scaleRef.current +
        remaining * (1 - Math.exp(-elapsed / ZOOM_TIME_CONSTANT_MS));
      scaleRef.current = scale;

      setStageScale(scale);
      setScrollPos({
        x: anchor.imageX * scale - anchor.pointerX + stagePos.x,
        y: anchor.imageY * scale - anchor.pointerY + stagePos.y,
      });

      frameRef.current = requestAnimationFrame(step);
    };

    // native listener on the container: onWheel is passive, and the canvas shrinks on zoom-out
    const zoom = (event: WheelEvent) => {
      event.preventDefault();

      const bounds = container.getBoundingClientRect();
      const pointerX = event.clientX - bounds.left;
      const pointerY = event.clientY - bounds.top;

      targetScaleRef.current = clampScale(
        event.deltaY < 0
          ? targetScaleRef.current * SCALE_BY
          : targetScaleRef.current / SCALE_BY,
      );
      // resolved once, so the point under the cursor stays put for the whole animation
      anchorRef.current = {
        pointerX,
        pointerY,
        imageX:
          (container.scrollLeft + pointerX - stagePos.x) / scaleRef.current,
        imageY:
          (container.scrollTop + pointerY - stagePos.y) / scaleRef.current,
      };

      if (!frameRef.current) {
        frameRef.current = requestAnimationFrame(step);
      }
    };

    container.addEventListener("wheel", zoom, { passive: false });
    return () => {
      container.removeEventListener("wheel", zoom);

      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = undefined;
      }
    };
  }, [reattachKey, containerRef, setStageScale, setScrollPos, stagePos]);

  return { isZooming: () => Boolean(frameRef.current) };
}
