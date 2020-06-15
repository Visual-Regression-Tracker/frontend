import React, { FunctionComponent } from "react";
import { Stage, Layer, Image } from "react-konva";
import { RectConfig } from "konva/types/shapes/Rect";
import Rectangle, { MIN_RECT_SIDE_PIXEL } from "./Rectangle";
import { KonvaEventObject } from "konva/types/Node";
import { IgnoreArea } from "../types/ignoreArea";
import { Grid, makeStyles } from "@material-ui/core";
import useImage from "use-image";
import { staticService } from "../services";
import { NoImagePlaceholder } from "./NoImageAvailable";
import ImageDetails from "./ImageDetails";

const useStyles = makeStyles((theme) => ({
  imageContainer: {
    overflow: "hidden",
  },
  canvasBackground: {
    width: "100%",
    backgroundColor: "#f5f5f5",
  },
  canvasContainer: {
    overflow: "hidden",
    backgroundColor: "white",
    padding: theme.spacing(1),
    margin: theme.spacing(0.5),
  },
}));

interface IDrawArea {
  type: "Baseline" | "Image" | "Diff";
  imageName: string;
  ignoreAreas: IgnoreArea[];
  setIgnoreAreas: (ignoreAreas: IgnoreArea[]) => void;
  selectedRectId: string | undefined;
  setSelectedRectId: (id: string) => void;
  onStageClick: (event: KonvaEventObject<MouseEvent>) => void;
  stageOffsetState: [
    { x: number; y: number },
    React.Dispatch<React.SetStateAction<{ x: number; y: number }>>
  ];
  stageInitPosState: [
    { x: number; y: number },
    React.Dispatch<React.SetStateAction<{ x: number; y: number }>>
  ];
  stagePosState: [
    { x: number; y: number },
    React.Dispatch<React.SetStateAction<{ x: number; y: number }>>
  ];
  stageScaleState: [number, React.Dispatch<React.SetStateAction<number>>];
  drawModeState: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
}
export const DrawArea: FunctionComponent<IDrawArea> = ({
  type,
  imageName,
  ignoreAreas,
  setIgnoreAreas,
  selectedRectId,
  setSelectedRectId,
  onStageClick,
  stageScaleState,
  stageOffsetState,
  stageInitPosState,
  stagePosState,
  drawModeState,
}) => {
  const classes = useStyles();
  const [stageInitPos, setStageInitPos] = stageInitPosState;
  const [stageOffset, setStageOffset] = stageOffsetState;
  const [stagePos, setStagePos] = stagePosState;
  const [stageScale] = stageScaleState;
  const [isDrag, setIsDrag] = React.useState(false);

  const [isDrawMode, setIsDrawMode] = drawModeState;
  const [isDrawing, setIsDrawing] = React.useState(isDrawMode);
  const [image] = useImage(staticService.getImage(imageName));

  const handleContentMousedown = (e: any) => {
    if (!isDrawMode) return;

    const newArea: IgnoreArea = {
      id: Date.now().toString(),
      x: Math.round((e.evt.layerX - stageOffset.x) / stageScale),
      y: Math.round((e.evt.layerY - stageOffset.y) / stageScale),
      width: MIN_RECT_SIDE_PIXEL,
      height: MIN_RECT_SIDE_PIXEL,
    };
    setIgnoreAreas([...ignoreAreas, newArea]);
    setSelectedRectId(newArea.id);
    setIsDrawing(true);
  };

  const handleContentMouseup = (e: any) => {
    if (isDrawing) {
      setIsDrawing(!isDrawing);
      setIsDrawMode(false);
    }
  };

  const handleContentMouseMove = (e: any) => {
    if (!isDrawMode) return;

    if (isDrawing) {
      // update the current rectangle's width and height based on the mouse position + stage scale
      const mouseX = (e.evt.layerX - stageOffset.x) / stageScale;
      const mouseY = (e.evt.layerY - stageOffset.y) / stageScale;

      const newShapesList = ignoreAreas.map((i) => {
        if (i.id === selectedRectId) {
          // new width and height
          i.width = Math.max(Math.round(mouseX - i.x), MIN_RECT_SIDE_PIXEL);
          i.height = Math.max(Math.round(mouseY - i.y), MIN_RECT_SIDE_PIXEL);
          return i;
        }
        return i;
      });
      setIgnoreAreas(newShapesList);
    }
  };

  return (
    <React.Fragment>
      <Grid container direction="column">
        <Grid item>
          <ImageDetails type={type} imageName={imageName} />
        </Grid>
        {imageName ? (
          <Grid item className={classes.canvasBackground}>
            <div
              className={classes.canvasContainer}
              style={{
                height: image && image?.height * stageScale,
              }}
            >
              <div
                style={{
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
                onMouseUp={(event) => {
                  setIsDrag(false);
                  setStageInitPos(stagePos);
                }}
                onMouseLeave={(event) => {
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
              >
                <Stage
                  width={image && image.width}
                  height={image && image.height}
                  onMouseDown={onStageClick}
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
                      onMouseOver={(event) => {
                        document.body.style.cursor = isDrawMode
                          ? "crosshair"
                          : "grab";
                      }}
                      onMouseDown={(event) => {
                        document.body.style.cursor = "grabbing";
                      }}
                      onMouseUp={(event) => {
                        document.body.style.cursor = "grab";
                      }}
                      onMouseLeave={(event) => {
                        document.body.style.cursor = "default";
                      }}
                    />
                    {ignoreAreas.map((rect, i) => {
                      return (
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
                          onChange={(newAttrs: RectConfig) => {
                            const rects = ignoreAreas.slice();

                            rects[i].x = Math.round(newAttrs.x || 0);
                            rects[i].y = Math.round(newAttrs.y || 0);
                            rects[i].width = Math.round(
                              newAttrs.width || MIN_RECT_SIDE_PIXEL
                            );
                            rects[i].height = Math.round(
                              newAttrs.height || MIN_RECT_SIDE_PIXEL
                            );

                            setIgnoreAreas(rects);
                          }}
                        />
                      );
                    })}
                  </Layer>
                </Stage>
              </div>
            </div>
          </Grid>
        ) : (
          <NoImagePlaceholder />
        )}
      </Grid>
    </React.Fragment>
  );
};
