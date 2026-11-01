import {
  useCallback,
  type Dispatch,
  type KeyboardEvent as ReactKeyboardEvent,
  Fragment,
  type SetStateAction,
  type SyntheticEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { Stage, Layer, Image } from "react-konva";
import Rectangle, { MIN_RECT_SIDE_PIXEL } from "../Rectangle";
import { IgnoreArea } from "../../types/ignoreArea";
import { Box, GridLegacy as Grid, CircularProgress } from "@mui/material";
import { NoImagePlaceholder } from "./NoImageAvailable";
import Konva from "konva";
import { clampScale } from "../../_helpers/scale.helper";
import { clampToImage } from "../../_helpers/ignoreArea.helper";
import { imageSurface } from "../../theme/tokens";

export type ImageStateLoad = "loaded" | "loading" | "failed";

const SCALE_BY = 1.04;
// how long the zoom keeps coasting; higher glides longer, lower is snappier
const ZOOM_TIME_CONSTANT_MS = 140;
const ZOOM_SETTLED = 0.001;
const FRAME_MS = 1000 / 60;

type StageOffsetPosition = {
  x: number;
  y: number;
};

type StageStateArray = [
  StageOffsetPosition,
  Dispatch<SetStateAction<StageOffsetPosition>>,
];

interface IDrawArea {
  imageName: string | null | undefined;
  imageState: [undefined | HTMLImageElement, ImageStateLoad];
  underlayImage?: HTMLImageElement;
  overlayOpacity?: number;
  blendDifference?: boolean;
  tempIgnoreAreas: IgnoreArea[];
  ignoreAreas: IgnoreArea[];
  setIgnoreAreas: (ignoreAreas: IgnoreArea[]) => void;
  selectedRectId: string | undefined;
  setSelectedRectId: (id: string) => void;
  deleteIgnoreArea?: (id: string) => void;
  onStageClick: (event: Konva.KonvaEventObject<MouseEvent>) => void;
  stageOffsetState: StageStateArray;
  stageInitPosState: StageStateArray;
  stagePosState: StageStateArray;
  stageScrollPosState: StageStateArray;
  stageScaleState: [number, Dispatch<SetStateAction<number>>];
  drawModeState: [boolean, Dispatch<SetStateAction<boolean>>];
}

export const DrawArea = ({
  imageName,
  imageState,
  underlayImage,
  overlayOpacity,
  blendDifference,
  ignoreAreas,
  tempIgnoreAreas,
  setIgnoreAreas,
  selectedRectId,
  setSelectedRectId,
  deleteIgnoreArea,
  onStageClick,
  stageScaleState,
  stageOffsetState,
  stageInitPosState,
  stagePosState,
  stageScrollPosState,
  drawModeState,
}: IDrawArea) => {
  const [stageInitPos, setStageInitPos] = stageInitPosState;
  const [stageOffset, setStageOffset] = stageOffsetState;
  const [stagePos, setStagePos] = stagePosState;
  const [stageScollPos, setStageScrollPos] = stageScrollPosState;
  const [stageScale, setStageScale] = stageScaleState;
  const [isDrag, setIsDrag] = useState(false);

  const [isDrawMode, setIsDrawMode] = drawModeState;
  const [isDrawing, setIsDrawing] = useState(isDrawMode);
  const [image, imageStatus] = imageState;
  const stageWidth = Math.max(image?.width ?? 0, underlayImage?.width ?? 0);
  const stageHeight = Math.max(image?.height ?? 0, underlayImage?.height ?? 0);
  const stageRef = useRef<Konva.Stage>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
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

  const isDeleteKey = (event: KeyboardEvent | ReactKeyboardEvent) => {
    return event.key === "Delete" || event.key === "Backspace";
  };

  const handleStageKeyDown = useCallback(
    (event: KeyboardEvent | ReactKeyboardEvent) => {
      if (!deleteIgnoreArea || isModifierKeyPressed(event)) {
        return;
      }

      if (selectedRectId && isDeleteKey(event)) {
        deleteIgnoreArea(selectedRectId);
      }
    },
    [deleteIgnoreArea, selectedRectId],
  );

  const isModifierKeyPressed = (event: KeyboardEvent | ReactKeyboardEvent) => {
    return event.altKey || event.ctrlKey || event.shiftKey;
  };

  useEffect(() => {
    scrollContainerRef.current?.scrollTo(stageScollPos.x, stageScollPos.y);
  }, [stageScollPos]);

  useEffect(() => {
    scaleRef.current = stageScale;

    // outside changes (buttons, fit-to-screen) set the target, unless animating
    if (!frameRef.current) {
      targetScaleRef.current = stageScale;
    }
  }, [stageScale]);

  useEffect(() => {
    const container = scrollContainerRef.current;

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
      setStageScrollPos({
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
  }, [image, setStageScale, setStageScrollPos, stagePos]);

  const handleContentMousedown = (
    event: Konva.KonvaEventObject<MouseEvent>,
  ) => {
    if (stageRef.current) {
      const container = stageRef.current.container();
      container.tabIndex = 1;
    }

    if (!isDrawMode) {
      return;
    }

    // starts inside the border: the smallest area at the edge would cross it
    const newArea: IgnoreArea = {
      id: Date.now().toString(),
      x: Math.min(event.evt.offsetX, stageWidth - MIN_RECT_SIDE_PIXEL),
      y: Math.min(event.evt.offsetY, stageHeight - MIN_RECT_SIDE_PIXEL),
      width: MIN_RECT_SIDE_PIXEL,
      height: MIN_RECT_SIDE_PIXEL,
    };

    setIgnoreAreas([...ignoreAreas, newArea]);
    setSelectedRectId(newArea.id);
    setIsDrawing(true);
  };

  const handleContentMouseup = () => {
    if (isDrawing) {
      setIsDrawing(!isDrawing);
      setIsDrawMode(false);
    }
  };

  const handleContentMouseMove = (
    event: Konva.KonvaEventObject<MouseEvent>,
  ) => {
    if (!isDrawMode) return;

    if (isDrawing) {
      const newShapesList = ignoreAreas.map((i) => {
        if (i.id === selectedRectId) {
          return clampToImage(
            {
              ...i,
              width: Math.max(
                Math.round(event.evt.offsetX - i.x),
                MIN_RECT_SIDE_PIXEL,
              ),
              height: Math.max(
                Math.round(event.evt.offsetY - i.y),
                MIN_RECT_SIDE_PIXEL,
              ),
            },
            stageWidth,
            stageHeight,
          );
        }

        return i;
      });

      setIgnoreAreas(newShapesList);
    }
  };

  const imageLoaded = () => {
    return (
      <Box
        sx={{ overflow: "auto", backgroundColor: imageSurface.canvas }}
        data-testid="drawArea"
        ref={scrollContainerRef}
        onScroll={(event: SyntheticEvent<HTMLElement>) => {
          // mid-zoom the animation sets the scroll; echoing it back renders the pane twice
          if (frameRef.current) {
            return;
          }

          setStageScrollPos({
            x: (event.target as HTMLElement).scrollLeft,
            y: (event.target as HTMLElement).scrollTop,
          });
        }}
      >
        {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
        <div
          style={{
            height: image && image.height * stageScale,
            width: image && image.width * stageScale,
            transform: `translate3d(${stagePos.x}px, ${stagePos.y}px, 0px)`,
          }}
          onMouseMove={(event) => {
            if (!isDrawMode && isDrag && !selectedRectId) {
              event.preventDefault();
              setStagePos({
                x: event.clientX - stageInitPos.x,
                y: event.clientY - stageInitPos.y,
              });
              setStageOffset(stagePos);
            }
          }}
          onMouseUp={() => {
            setIsDrag(false);
            setStageInitPos(stagePos);
          }}
          onMouseLeave={() => {
            setIsDrag(false);
            setStageInitPos(stagePos);
          }}
          onMouseDown={(event) => {
            setIsDrag(true);
            setStageInitPos({
              x: event.clientX - stageOffset.x,
              y: event.clientY - stageOffset.y,
            });
          }}
          onKeyDown={(event) => handleStageKeyDown(event)}
        >
          <Stage
            ref={stageRef}
            width={stageWidth}
            height={stageHeight}
            onMouseDown={(event) => {
              onStageClick(event);
              handleContentMousedown(event);
            }}
            onMouseUp={handleContentMouseup}
            onMouseMove={handleContentMouseMove}
            style={{
              transform: `scale(${stageScale})`,
              transformOrigin: "top left",
            }}
          >
            <Layer>
              {underlayImage && <Image image={underlayImage} />}
              <Image
                image={image}
                // named so the overlay's own state is reachable from a test
                name={underlayImage ? "overlaid" : undefined}
                // the blend ignores the fade: a faded difference would wash out what matches
                opacity={
                  underlayImage && (blendDifference ? 1 : overlayOpacity)
                }
                globalCompositeOperation={
                  blendDifference ? "difference" : undefined
                }
                onMouseOver={() => {
                  document.body.style.cursor = isDrawMode
                    ? "crosshair"
                    : "grab";
                }}
                onMouseDown={() => {
                  document.body.style.cursor = "grabbing";
                }}
                onMouseUp={() => {
                  document.body.style.cursor = "grab";
                }}
                onMouseLeave={() => {
                  document.body.style.cursor = "default";
                }}
              />
              {ignoreAreas.map((rect, i) => (
                <Rectangle
                  key={rect.id}
                  shapeProps={{
                    x: rect.x,
                    y: rect.y,
                    width: rect.width,
                    height: rect.height,
                  }}
                  isSelected={rect.id === selectedRectId}
                  onSelect={() => setSelectedRectId(rect.id)}
                  onChange={(newAttrs: Konva.RectConfig) => {
                    const rects = ignoreAreas.slice();

                    rects[i] = clampToImage(
                      {
                        ...rects[i],
                        x: Math.round(newAttrs.x || 0),
                        y: Math.round(newAttrs.y || 0),
                        width: Math.round(
                          newAttrs.width || MIN_RECT_SIDE_PIXEL,
                        ),
                        height: Math.round(
                          newAttrs.height || MIN_RECT_SIDE_PIXEL,
                        ),
                      },
                      stageWidth,
                      stageHeight,
                    );

                    setIgnoreAreas(rects);
                  }}
                />
              ))}
              {tempIgnoreAreas.map((rect, i) => (
                <Rectangle
                  key={i}
                  shapeProps={{
                    x: rect.x,
                    y: rect.y,
                    width: rect.width,
                    height: rect.height,
                    // shown only: over the areas being edited, so they must not take the pointer
                    listening: false,
                  }}
                />
              ))}
            </Layer>
          </Stage>
        </div>
      </Box>
    );
  };

  const imageLoading = () => {
    return (
      <Grid
        container
        direction="column"
        alignItems="center"
        justifyContent="center"
        sx={{ minHeight: "300px" }}
      >
        <Grid item>
          <CircularProgress />
        </Grid>
      </Grid>
    );
  };

  const imageFailed = () => {
    return <NoImagePlaceholder />;
  };

  const imageCanvas = () => (
    <Fragment>
      {(!imageName || imageStatus === "failed") && imageFailed()}
      {imageStatus === "loading" && imageLoading()}
      {imageStatus === "loaded" && imageLoaded()}
    </Fragment>
  );

  return <>{imageName ? imageCanvas() : <NoImagePlaceholder />}</>;
};
