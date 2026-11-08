import {
  type Dispatch,
  type KeyboardEvent as ReactKeyboardEvent,
  type SetStateAction,
  type SyntheticEvent,
  useRef,
  useState,
} from "react";
import { Stage, Layer, Image } from "react-konva";
import { IgnoreAreaShapes } from "./IgnoreAreaShapes";
import { useIgnoreAreaDrawing } from "./useIgnoreAreaDrawing";
import { IgnoreArea } from "../../types/ignoreArea";
import type { NoiseRegion } from "../../types";
import { Box, CircularProgress, Stack } from "@mui/material";
import { NoImagePlaceholder } from "./NoImageAvailable";
import Konva from "konva";
import { useWheelZoom } from "./useWheelZoom";
import { imageSurface } from "../../theme/tokens";
import { TEST_ID } from "../../constants/locators";

export type ImageStateLoad = "loaded" | "loading" | "failed";

const isDeleteKey = (event: ReactKeyboardEvent) =>
  event.key === "Delete" || event.key === "Backspace";

const isModifierKeyPressed = (event: ReactKeyboardEvent) =>
  event.altKey || event.ctrlKey || event.shiftKey;

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
  hintAreas?: NoiseRegion[];
  ignoreAreas: IgnoreArea[];
  readOnly?: boolean;
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
  readOnly = false,
  tempIgnoreAreas,
  hintAreas = [],
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
  const [image, imageStatus] = imageState;
  const stageWidth = Math.max(image?.width ?? 0, underlayImage?.width ?? 0);
  const stageHeight = Math.max(image?.height ?? 0, underlayImage?.height ?? 0);
  const stageRef = useRef<Konva.Stage>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const handleStageKeyDown = (event: ReactKeyboardEvent) => {
    if (!deleteIgnoreArea || isModifierKeyPressed(event)) {
      return;
    }

    if (selectedRectId && isDeleteKey(event)) {
      deleteIgnoreArea(selectedRectId);
    }
  };

  const { isZooming } = useWheelZoom({
    containerRef: scrollContainerRef,
    stageScale,
    setStageScale,
    stagePos,
    scrollPos: stageScollPos,
    setScrollPos: setStageScrollPos,
    reattachKey: image,
  });

  const {
    handleContentMousedown,
    handleContentMouseup,
    handleContentMouseMove,
  } = useIgnoreAreaDrawing({
    stageRef,
    isDrawMode,
    setIsDrawMode,
    ignoreAreas,
    setIgnoreAreas,
    selectedRectId,
    setSelectedRectId,
    stageWidth,
    stageHeight,
  });

  const imageLoaded = () => {
    return (
      <Box
        sx={{ overflow: "auto", backgroundColor: imageSurface.canvas }}
        data-testid={TEST_ID.drawArea}
        ref={scrollContainerRef}
        onScroll={(event: SyntheticEvent<HTMLElement>) => {
          // mid-zoom the animation sets the scroll; echoing it back renders the pane twice
          if (isZooming()) {
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
          onKeyDown={handleStageKeyDown}
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
              <IgnoreAreaShapes
                ignoreAreas={ignoreAreas}
                tempIgnoreAreas={tempIgnoreAreas}
                hintAreas={hintAreas}
                readOnly={readOnly}
                selectedRectId={selectedRectId}
                setSelectedRectId={setSelectedRectId}
                setIgnoreAreas={setIgnoreAreas}
                stageWidth={stageWidth}
                stageHeight={stageHeight}
              />
            </Layer>
          </Stage>
        </div>
      </Box>
    );
  };

  const imageLoading = () => {
    return (
      <Stack
        sx={{
          alignItems: "center",
          justifyContent: "center",
          minHeight: "300px",
        }}
      >
        <CircularProgress />
      </Stack>
    );
  };

  if (!imageName || imageStatus === "failed") {
    return <NoImagePlaceholder />;
  }
  return imageStatus === "loading" ? imageLoading() : imageLoaded();
};
