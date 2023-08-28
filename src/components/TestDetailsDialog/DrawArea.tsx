/* eslint-disable jsx-a11y/no-static-element-interactions */
import React, { FunctionComponent, useCallback } from "react";
import { styled } from "@mui/material/styles";
import { Stage, Layer, Image } from "react-konva";
import Rectangle, { MIN_RECT_SIDE_PIXEL } from "../Rectangle";
import { IgnoreArea } from "../../types/ignoreArea";
import { Grid, CircularProgress, type Theme } from "@mui/material";
import { NoImagePlaceholder } from "./NoImageAvailable";
import Konva from "konva";
const PREFIX = "DrawArea";

const classes = {
  canvasContainer: `${PREFIX}-canvasContainer`,
  imageDetailsContainer: `${PREFIX}-imageDetailsContainer`,
  progressContainer: `${PREFIX}-progressContainer`,
};

// TODO jss-to-styled codemod: The Fragment root was replaced by div. Change the tag if needed.
const Root = styled("div")(({ theme: Theme }) => ({
  [`& .${classes.canvasContainer}`]: {
    overflow: "auto",
    backgroundColor: "white",
  },

  [`& .${classes.imageDetailsContainer}`]: {
    position: "absolute",
    backgroundColor: "white",
    zIndex: 1,
    padding: theme.spacing(1),
    height: "48px",
  },

  [`& .${classes.progressContainer}`]: {
    minHeight: "300px",
  },
}));

export type ImageStateLoad = "loaded" | "loading" | "failed";

type StageOffsetPosition = {
  x: number;
  y: number;
};

type StageStateArray = [
  StageOffsetPosition,
  React.Dispatch<React.SetStateAction<StageOffsetPosition>>,
];

interface IDrawArea {
  imageName: string | undefined;
  imageState: [undefined | HTMLImageElement, ImageStateLoad];
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
  stageScaleState: [number, React.Dispatch<React.SetStateAction<number>>];
  drawModeState: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
}

export const DrawArea: FunctionComponent<IDrawArea> = ({
  imageName,
  imageState,
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
}) => {
  const [stageInitPos, setStageInitPos] = stageInitPosState;
  const [stageOffset, setStageOffset] = stageOffsetState;
  const [stagePos, setStagePos] = stagePosState;
  const [stageScollPos, setStageScrollPos] = stageScrollPosState;
  const [stageScale, setStageScale] = stageScaleState;
  const [isDrag, setIsDrag] = React.useState(false);

  const [isDrawMode, setIsDrawMode] = drawModeState;
  const [isDrawing, setIsDrawing] = React.useState(isDrawMode);
  const [image, imageStatus] = imageState;
  const stageRef = React.useRef<Konva.Stage>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  const isDeleteKey = (event: KeyboardEvent) => {
    return event.key === "Delete" || event.key === "Backspace";
  };

  const handleStageKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!deleteIgnoreArea || isModifierKeyPressed(event)) {
        return;
      }

      if (selectedRectId && isDeleteKey(event)) {
        deleteIgnoreArea(selectedRectId);
      }
    },
    [deleteIgnoreArea, selectedRectId],
  );

  React.useEffect(() => {
    if (stageRef.current) {
      const container = stageRef.current.container();
      container.addEventListener("keydown", handleStageKeyDown);
    }
  }, [handleStageKeyDown]);

  const isModifierKeyPressed = (event: KeyboardEvent) => {
    return event.altKey || event.ctrlKey || event.shiftKey;
  };

  React.useEffect(() => {
    scrollContainerRef.current?.scrollTo(stageScollPos.x, stageScollPos.y);
  }, [stageScollPos]);

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

    const newArea: IgnoreArea = {
      id: Date.now().toString(),
      x: event.evt.offsetX,
      y: event.evt.offsetY,
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
      // update the current rectangle's width and height based on the mouse position + stage scale
      const newShapesList = ignoreAreas.map((i) => {
        if (i.id === selectedRectId) {
          // new width and height
          i.width = Math.max(
            Math.round(event.evt.offsetX - i.x),
            MIN_RECT_SIDE_PIXEL,
          );
          i.height = Math.max(
            Math.round(event.evt.offsetY - i.y),
            MIN_RECT_SIDE_PIXEL,
          );
          return i;
        }

        return i;
      });

      setIgnoreAreas(newShapesList);
    }
  };

  const imageLoaded = () => {
    return (
      <div
        className={classes.canvasContainer}
        ref={scrollContainerRef}
        onScroll={(event: React.SyntheticEvent<HTMLElement>) => {
          setStageScrollPos({
            x: (event.target as HTMLElement).scrollLeft,
            y: (event.target as HTMLElement).scrollTop,
          });
        }}
      >
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
            width={image?.width}
            height={image?.height}
            onMouseDown={onStageClick}
            onWheel={(event: Konva.KonvaEventObject<WheelEvent>) => {
              event.evt.preventDefault();
              const scaleBy = 1.04;
              const newScale =
                event.evt.deltaY < 0
                  ? stageScale * scaleBy
                  : stageScale / scaleBy;

              setStageScale(newScale);
            }}
            style={{
              transform: `scale(${stageScale})`,
              transformOrigin: "top left",
            }}
            onContentMousedown={handleContentMousedown}
            onContentMouseup={handleContentMouseup}
            onContentMouseMove={handleContentMouseMove}
          >
            <Layer>
              <Image
                image={image}
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

                    rects[i].x = Math.round(newAttrs.x || 0);
                    rects[i].y = Math.round(newAttrs.y || 0);
                    rects[i].width = Math.round(
                      newAttrs.width || MIN_RECT_SIDE_PIXEL,
                    );
                    rects[i].height = Math.round(
                      newAttrs.height || MIN_RECT_SIDE_PIXEL,
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
                  }}
                />
              ))}
            </Layer>
          </Stage>
        </div>
      </div>
    );
  };

  const imageLoading = () => {
    return (
      <Grid
        container
        direction="column"
        alignItems="center"
        justifyContent="center"
        className={classes.progressContainer}
      >
        <Grid item>
          <CircularProgress />
        </Grid>
      </Grid>
    );
  };

  const imageFailed = () => {
    // TODO: Use SVG with separate text for failing to load and why...
    return <NoImagePlaceholder />;
  };

  const imageCanvas = () => (
    <React.Fragment>
      {(!imageName || imageStatus === "failed") && imageFailed()}
      {imageStatus === "loading" && imageLoading()}
      {imageStatus === "loaded" && imageLoaded()}
    </React.Fragment>
  );

  // TODO: Separate SVG with reason...
  return <Root>{imageName ? imageCanvas() : <NoImagePlaceholder />}</Root>;
};
