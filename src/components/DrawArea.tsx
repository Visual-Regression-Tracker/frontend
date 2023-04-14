import React, { FunctionComponent, useEffect } from "react";
import { Stage, Layer, Image } from "react-konva";
import Rectangle, { MIN_RECT_SIDE_PIXEL } from "./Rectangle";
import { IgnoreArea } from "../types/ignoreArea";
import { Grid, makeStyles, CircularProgress } from "@material-ui/core";
import { NoImagePlaceholder } from "./NoImageAvailable";
import ImageDetails from "./ImageDetails";
import Konva from "konva";

const useStyles = makeStyles((theme) => ({
  canvasContainer: {
    overflow: "auto",
    backgroundColor: "white",
    height: "100%",
  },
  imageDetailsContainer: {
    position: "absolute",
    backgroundColor: "white",
    zIndex: 1,
    padding: theme.spacing(1),
  },
  progressContainer: {
    minHeight: "300px",
  },
}));

interface IDrawArea {
  type: "Baseline" | "Image" | "Diff";
  imageName: string;
  branchName: string;
  imageState: [undefined | HTMLImageElement, "loaded" | "loading" | "failed"];
  tempIgnoreAreas: IgnoreArea[];
  ignoreAreas: IgnoreArea[];
  setIgnoreAreas: (ignoreAreas: IgnoreArea[]) => void;
  selectedRectId: string | undefined;
  setSelectedRectId: (id: string) => void;
  deleteIgnoreArea?: (id:string)=>void;
  onStageClick: (event: Konva.KonvaEventObject<MouseEvent>) => void;
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
  stageScrollPosState: [
    { x: number; y: number },
    React.Dispatch<React.SetStateAction<{ x: number; y: number }>>
  ];
  stageScaleState: [number, React.Dispatch<React.SetStateAction<number>>];
  drawModeState: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
}
export const DrawArea: FunctionComponent<IDrawArea> = ({
  type,
  imageName,
  branchName,
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
  const classes = useStyles();
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

  React.useEffect(() => {
    if(stageRef.current){
      const container = stageRef.current.container();
      container.addEventListener('keydown', handleStageKeyDown);
    }
  },[]);

  const isModifierKeyPressed = (e:any) => {
    return e.altKey || e.ctrlKey || e.shiftKey;
  };

  const handleStageKeyDown = (e:any) => {
    if(!deleteIgnoreArea || isModifierKeyPressed(e)){
      return;
    }
    if(selectedRectId && (e.key==='Delete' || e.key==='Backspace')){
      deleteIgnoreArea(selectedRectId);
    }
  };

  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollContainerRef.current?.scrollTo(stageScollPos.x, stageScollPos.y);
  }, [stageScollPos]);

  const handleContentMousedown = (e: any) => {
    if(stageRef.current){
      const container = stageRef.current.container();
      container.tabIndex=1;
      container.focus();
    }
    if (!isDrawMode) return;

    const newArea: IgnoreArea = {
      id: Date.now().toString(),
      x: e.evt.offsetX,
      y: e.evt.offsetY,
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
      const newShapesList = ignoreAreas.map((i) => {
        if (i.id === selectedRectId) {
          // new width and height
          i.width = Math.max(Math.round(e.evt.offsetX - i.x), MIN_RECT_SIDE_PIXEL);
          i.height = Math.max(Math.round(e.evt.offsetY - i.y), MIN_RECT_SIDE_PIXEL);
          return i;
        }
        return i;
      });
      setIgnoreAreas(newShapesList);
    }
  };

  return (
    <React.Fragment>
      {imageStatus === "loading" && (
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
      )}
      {(!imageName || imageStatus === "failed") && <NoImagePlaceholder />}
      {imageName && imageStatus === "loaded" && (
        <div className={classes.canvasContainer}   
          ref={scrollContainerRef}
          onScroll={(event) => {
            setStageScrollPos({
              x: (event.target as HTMLElement).scrollLeft,
              y:(event.target as HTMLElement).scrollTop
            });
          }}          
          >
          <div className={classes.imageDetailsContainer}>
            <ImageDetails
              type={type}
              branchName={branchName}
              imageName={imageName}
              ignoreAreas={tempIgnoreAreas}
            />
          </div>
          <div
            style={{
              height: image && image?.height * stageScale,
              transform: `translate3d(${stagePos.x}px, ${stagePos.y}px, 0px)`,
              marginTop: "75px",
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
            onKeyDown={(e) => handleStageKeyDown(e)}
          >
            <Stage
              ref={stageRef}
              width={image && image.width}
              height={image && image.height}
              onMouseDown={onStageClick}
              onWheel={(e: Konva.KonvaEventObject<WheelEvent>) => {
                e.evt.preventDefault();
                const scaleBy = 1.04;
                const newScale =
                  e.evt.deltaY < 0
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
                      onChange={(newAttrs: Konva.RectConfig) => {
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
                {tempIgnoreAreas.map((rect, i) => {
                  return (
                    <Rectangle
                      key={i}
                      shapeProps={{
                        x: rect.x,
                        y: rect.y,
                        width: rect.width,
                        height: rect.height,
                      }}
                    />
                  );
                })}
              </Layer>
            </Stage>
          </div>
        </div>
      )}
    </React.Fragment>
  );
};
